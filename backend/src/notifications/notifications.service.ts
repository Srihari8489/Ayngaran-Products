import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailDeliveryService } from '../auth/email-delivery.service';
import { OrderCreatedPayload } from './dto/order-notification.payload';
import { generateOrderNotificationEmailHtml } from './order-notification-email.template';
import {
  OrderStatusEmailParams,
  isCustomerEmailEligibleStatus,
  getCustomerOrderStatusSubject,
  CUSTOMER_NOTIFIABLE_STATUSES,
} from './order-status-email.template';

function maskPhone(phone?: string): string {
  if (!phone) return 'N/A';
  const clean = phone.trim();
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly emailDeliveryService: EmailDeliveryService,
  ) {}

  /**
   * Dispatches real-time WebSocket and out-of-band email notifications for a newly committed order.
   * NOTE: This method is resilient and NEVER throws errors back to caller.
   */
  async notifyOrderCreated(orderId: number): Promise<void> {
    try {
      this.logger.log(`[ORDER_NOTIFICATION_START] Preparing notification for Order ID: ${orderId}`);

      // 1. Fetch committed order data authoritatively from MySQL
      const order = await this.prisma.client.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, productCode: true } },
              variant: { select: { id: true, sku: true } },
            },
          },
          user: { select: { id: true, name: true, email: true, phone: true } },
          payments: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!order) {
        this.logger.warn(`[ORDER_NOTIFICATION_ABORT] Order with ID ${orderId} not found in database.`);
        return;
      }

      // 2. Parse shipping address for customer name/contact fallback
      let shippingAddress: any = null;
      try {
        shippingAddress = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null;
      } catch {
        shippingAddress = null;
      }

      const customerName =
        order.user?.name && order.user.name !== 'Customer'
          ? order.user.name
          : shippingAddress?.recipientName || 'Customer';
      const customerEmail = order.user?.email || 'N/A';
      const rawCustomerPhone = order.user?.phone || shippingAddress?.phone || '';

      // 3. Map items snapshot safely
      const mappedItems = order.items.map((item) => {
        let snap: any = null;
        if (item.productSnapshotJson) {
          try {
            snap = JSON.parse(item.productSnapshotJson);
          } catch {
            snap = null;
          }
        }

        const name = snap?.name || item.product?.name || `Product #${item.productId}`;
        const variantLabel = snap?.variantLabel || item.variant?.sku || undefined;

        return {
          id: item.id,
          productId: item.productId,
          name,
          variantLabel,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        };
      });

      const totalQuantity = mappedItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const latestPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null;
      const paymentMethod =
        latestPayment?.gatewayCode ||
        (order.paymentStatus === 'PENDING_COD' ? 'COD' : 'ONLINE');

      // 4. Construct controlled WebSocket payload (Zero secrets, zero credentials)
      const payload: OrderCreatedPayload = {
        event: 'order.created',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: {
            id: order.userId,
            name: customerName,
            phone: maskPhone(rawCustomerPhone),
            email: customerEmail,
          },
          itemCount: mappedItems.length,
          quantity: totalQuantity,
          subtotal: Number(order.subtotal),
          discountAmount: Number(order.discountAmount || 0),
          taxAmount: Number(order.taxAmount),
          shippingFee: Number(order.shippingFee),
          totalAmount: Number(order.totalAmount),
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          paymentMethod,
          createdAt: order.createdAt.toISOString(),
          items: mappedItems,
        },
      };

      // 5. CHANNEL 1: Broadcast Real-Time WebSocket Event
      let socketEmitted = false;
      try {
        socketEmitted = this.gateway.broadcastOrderCreated(payload);

        // Record in NotificationLog
        await this.prisma.client.notificationLog.create({
          data: {
            type: 'ORDER_CREATED',
            channel: 'WEBSOCKET',
            recipient: 'admin:orders',
            subject: 'order.created',
            reference: order.orderNumber,
            content: JSON.stringify(payload.data),
            status: socketEmitted ? 'EMITTED' : 'FAILED',
            sentAt: socketEmitted ? new Date() : null,
          },
        });
      } catch (wsErr: any) {
        this.logger.error(`[ORDER_NOTIFICATION_SOCKET_ERROR] WebSocket dispatch failed: ${wsErr.message}`);
      }

      // 6. CHANNEL 2: Send Email Notifications to Configured Admin Recipients
      const rawRecipientEmails =
        process.env.ADMIN_ORDER_NOTIFICATION_EMAILS || 'admin@example.com';
      const recipients = rawRecipientEmails
        .split(',')
        .map((e) => e.trim())
        .filter((e) => Boolean(e) && e.includes('@'));

      const formattedDate = order.createdAt.toLocaleString('en-IN', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      });

      const emailSubject = `New Order Received — ${order.orderNumber}`;

      for (const recipient of recipients) {
        try {
          const emailParams = {
            to: recipient,
            subject: emailSubject,
            orderNumber: order.orderNumber,
            orderDate: formattedDate,
            customer: {
              name: customerName,
              email: customerEmail,
              phone: maskPhone(rawCustomerPhone),
            },
            items: mappedItems,
            subtotal: Number(order.subtotal),
            discount: Number(order.discountAmount || 0),
            tax: Number(order.taxAmount),
            shipping: Number(order.shippingFee),
            total: Number(order.totalAmount),
            paymentStatus: order.paymentStatus,
            paymentMethod,
            orderStatus: order.orderStatus,
          };

          const htmlContent = generateOrderNotificationEmailHtml({
            ...emailParams,
            adminOrderUrl: process.env.ADMIN_PORTAL_URL || 'http://localhost:3001/orders',
          });

          await this.emailDeliveryService.sendOrderNotification({
            ...emailParams,
            html: htmlContent,
          });

          this.logger.log(
            `[ORDER_NOTIFICATION_EMAIL_SENT] Email dispatched to ${recipient} for Order #${order.orderNumber}`,
          );

          // Append to NotificationLog
          await this.prisma.client.notificationLog.create({
            data: {
              type: 'ORDER_CREATED',
              channel: 'EMAIL',
              recipient,
              subject: emailSubject,
              reference: order.orderNumber,
              content: `New order notification sent to ${recipient} for #${order.orderNumber}`,
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } catch (emailErr: any) {
          this.logger.error(
            `[ORDER_NOTIFICATION_EMAIL_FAILED] Failed to send email to ${recipient} for #${order.orderNumber}: ${emailErr.message}`,
          );

          await this.prisma.client.notificationLog.create({
            data: {
              type: 'ORDER_CREATED',
              channel: 'EMAIL',
              recipient,
              subject: emailSubject,
              reference: order.orderNumber,
              content: `Email delivery failed for #${order.orderNumber}`,
              status: 'FAILED',
              errorMessage: emailErr.message || 'Unknown email delivery error',
            },
          });
        }
      }

      // 7. CHANNEL 3: Send Order Confirmation Email to the Customer
      if (customerEmail && customerEmail.includes('@')) {
        try {
          const customerPortalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3000';
          const customerSubject = `Order Confirmed: #${order.orderNumber} - Ayngaran Foods`;
          const customerEmailParams: OrderStatusEmailParams = {
            to: customerEmail,
            customerName,
            orderNumber: order.orderNumber,
            oldStatus: 'ORDER_PLACED',
            newStatus: 'CONFIRMED',
            orderTotal: Number(order.totalAmount),
            orderDate: formattedDate,
            customerOrderUrl: `${customerPortalUrl}/account/orders`,
            notes: null,
            from: process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>',
            items: mappedItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              variantLabel: item.variantLabel,
            })),
          };

          await this.emailDeliveryService.sendOrderStatusNotification(customerEmailParams);

          this.logger.log(
            `[CUSTOMER_ORDER_PLACED_EMAIL_SENT] Order confirmation email sent to customer ${customerEmail} for #${order.orderNumber}`,
          );

          await this.prisma.client.notificationLog.create({
            data: {
              type: 'ORDER_CREATED',
              channel: 'EMAIL',
              recipient: customerEmail,
              subject: customerSubject,
              reference: order.orderNumber,
              content: `Customer order confirmation sent to ${customerEmail} for #${order.orderNumber}`,
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } catch (custEmailErr: any) {
          this.logger.error(
            `[CUSTOMER_ORDER_PLACED_EMAIL_FAILED] Failed to send order confirmation to customer ${customerEmail} for #${order.orderNumber}: ${custEmailErr.message}`,
          );

          await this.prisma.client.notificationLog.create({
            data: {
              type: 'ORDER_CREATED',
              channel: 'EMAIL',
              recipient: customerEmail,
              subject: `Order Confirmed: #${order.orderNumber} - Ayngaran Foods`,
              reference: order.orderNumber,
              content: `Customer order confirmation email failed`,
              status: 'FAILED',
              errorMessage: custEmailErr.message || 'Unknown email delivery error',
            },
          });
        }
      }

      this.logger.log(`[ORDER_NOTIFICATION_COMPLETE] Order #${order.orderNumber} notifications processed successfully.`);
    } catch (criticalErr: any) {
      // NEVER allow notification errors to escape or affect order creation
      this.logger.error(
        `[ORDER_NOTIFICATION_CRITICAL_FAILURE] Unhandled error in notifyOrderCreated: ${criticalErr.message}`,
        criticalErr.stack,
      );
    }
  }

  /**
   * Dispatches real-time WebSocket and customer email notifications when an order status changes.
   * NON-BLOCKING: Neither socket nor email failure will throw an error or affect order status updates.
   */
  async notifyOrderStatusUpdated(
    orderId: number,
    oldStatus: string,
    newStatus: string,
    notes?: string | null,
    overrideCourierName?: string | null,
    overrideTrackingNumber?: string | null,
  ): Promise<void> {
    try {
      if (oldStatus === newStatus) {
        this.logger.log(
          `[ORDER_STATUS_NOTIFICATION_SKIP] Status did not change (${oldStatus} -> ${newStatus}) for Order ${orderId}`,
        );
        return;
      }

      this.logger.log(
        `[ORDER_STATUS_NOTIFICATION_START] Preparing status update notification for Order ID: ${orderId} (${oldStatus} -> ${newStatus})`,
      );

      const order = await this.prisma.client.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          deliveryAssignments: {
            include: { deliveryPartner: true },
            orderBy: { id: 'desc' },
            take: 1,
          },
        },
      });

      if (!order) {
        this.logger.warn(`[ORDER_STATUS_NOTIFICATION_ABORT] Order with ID ${orderId} not found in database.`);
        return;
      }

      // Resolve courier partner name and tracking number
      const latestAssignment = order.deliveryAssignments?.[0];
      const courierName =
        overrideCourierName !== undefined && overrideCourierName !== null
          ? overrideCourierName
          : order.courierName ||
            latestAssignment?.courierName ||
            latestAssignment?.deliveryPartner?.name ||
            null;

      const trackingNumber =
        overrideTrackingNumber !== undefined && overrideTrackingNumber !== null
          ? overrideTrackingNumber
          : order.trackingNumber ||
            latestAssignment?.trackingNumber ||
            null;

      // Resolve tracking URL if template exists or common courier pattern matches
      let trackingUrl: string | null = null;
      if (latestAssignment?.deliveryPartner?.trackingUrlTemplate && trackingNumber) {
        trackingUrl = latestAssignment.deliveryPartner.trackingUrlTemplate
          .replace('{trackingNumber}', encodeURIComponent(trackingNumber))
          .replace('{tracking_number}', encodeURIComponent(trackingNumber));
      } else if (trackingNumber) {
        const cLower = (courierName || '').toLowerCase();
        if (cLower.includes('dtdc')) {
          trackingUrl = `https://www.dtdc.in/tracking/shipment-tracking.asp?awb=${encodeURIComponent(trackingNumber)}`;
        } else if (cLower.includes('delhivery')) {
          trackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(trackingNumber)}`;
        } else if (cLower.includes('professional')) {
          trackingUrl = `https://www.tpcindia.com/`;
        } else if (cLower.includes('bluedart')) {
          trackingUrl = `https://www.bluedart.com/tracking`;
        } else if (cLower.includes('speed post') || cLower.includes('india post')) {
          trackingUrl = `https://www.indiapost.gov.in/_layouts/15/dpt.ptc.ui/ptsms.aspx`;
        }
      }

      const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus,
        notes: notes || null,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        updatedAt: new Date().toISOString(),
      };

      // 1. Emit Real-Time WebSocket Event to Customer Room & Admin Room
      try {
        const emitted = this.gateway.emitOrderStatusUpdated(order.userId, payload);

        await this.prisma.raw.notificationLog.create({
          data: {
            type: 'ORDER_STATUS_UPDATED',
            channel: 'WEBSOCKET',
            recipient: `customer:${order.userId}`,
            subject: 'order.status.updated',
            reference: order.orderNumber,
            content: JSON.stringify(payload),
            status: emitted ? 'EMITTED' : 'FAILED',
            sentAt: emitted ? new Date() : null,
          },
        });
      } catch (wsErr: any) {
        this.logger.error(`[ORDER_STATUS_SOCKET_ERROR] WebSocket dispatch failed: ${wsErr.message}`);
      }

      // 2. Filter: Only send customer emails for allowed statuses (CONFIRMED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
      if (!isCustomerEmailEligibleStatus(newStatus)) {
        this.logger.log(
          `[ORDER_STATUS_EMAIL_SKIP] Status "${newStatus}" does not send customer email. Allowed customer email statuses: ${CUSTOMER_NOTIFIABLE_STATUSES.join(', ')}`,
        );
        this.logger.log(
          `[ORDER_STATUS_NOTIFICATION_COMPLETE] Order #${order.orderNumber} status notifications processed successfully.`,
        );
        return;
      }

      // 3. Send Customer Email Notification
      let shippingAddress: any = null;
      try {
        shippingAddress = order.shippingAddressJson ? JSON.parse(order.shippingAddressJson) : null;
      } catch {
        shippingAddress = null;
      }

      const customerEmail = order.user?.email || shippingAddress?.email;
      const customerName =
        order.user?.name && order.user.name !== 'Customer'
          ? order.user.name
          : shippingAddress?.recipientName || 'Customer';

      if (customerEmail && customerEmail.includes('@')) {
        const customerPortalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3000';
        const formattedDate = order.createdAt.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const emailSubject = getCustomerOrderStatusSubject(order.orderNumber, newStatus);

        const emailParams: OrderStatusEmailParams = {
          to: customerEmail,
          customerName,
          orderNumber: order.orderNumber,
          oldStatus,
          newStatus,
          orderTotal: Number(order.totalAmount),
          orderDate: formattedDate,
          customerOrderUrl: `${customerPortalUrl}/account/orders`,
          notes,
          courierName,
          trackingNumber,
          trackingUrl,
          from: process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>',
          items: (order.items || []).map((item: any) => ({
            name: item.productName || 'Ayngaran Product',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
        };

        try {
          await this.emailDeliveryService.sendOrderStatusNotification(emailParams);

          this.logger.log(
            `[ORDER_STATUS_EMAIL_SENT] Status update email sent to ${customerEmail} for #${order.orderNumber} (${newStatus})`,
          );

          await this.prisma.raw.notificationLog.create({
            data: {
              type: 'ORDER_STATUS_UPDATED',
              channel: 'EMAIL',
              recipient: customerEmail,
              subject: emailSubject,
              reference: order.orderNumber,
              content: `Status update email sent: ${oldStatus} -> ${newStatus}`,
              status: 'SENT',
              sentAt: new Date(),
            },
          });
        } catch (emailErr: any) {
          this.logger.error(
            `[ORDER_STATUS_EMAIL_FAILED] Failed to send email to ${customerEmail} for #${order.orderNumber}: ${emailErr.message}`,
          );

          await this.prisma.raw.notificationLog.create({
            data: {
              type: 'ORDER_STATUS_UPDATED',
              channel: 'EMAIL',
              recipient: customerEmail,
              subject: emailSubject,
              reference: order.orderNumber,
              content: `Status update email failed`,
              status: 'FAILED',
              errorMessage: emailErr.message || 'Unknown email delivery error',
            },
          });
        }
      } else {
        this.logger.log(
          `[ORDER_STATUS_EMAIL_SKIP] No registered email address found for customer (Order #${order.orderNumber}).`,
        );
      }

      this.logger.log(
        `[ORDER_STATUS_NOTIFICATION_COMPLETE] Order #${order.orderNumber} status notifications processed successfully.`,
      );
    } catch (criticalErr: any) {
      this.logger.error(
        `[ORDER_STATUS_CRITICAL_FAILURE] Unhandled error in notifyOrderStatusUpdated: ${criticalErr.message}`,
        criticalErr.stack,
      );
    }
  }
}
