import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { computeGstBreakdown } from '../common/utils/gst.util';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  private computeShippingMetadata(order: any, mappedItems: any[], shippingAddress: any) {
    const baseWeight = 1000;
    let totalWeightGrams = Number(order.totalWeightGrams || 0);

    if (totalWeightGrams <= 0) {
      let calcWeight = 0;
      for (const it of (mappedItems || [])) {
        const snap = it.snapshot || {};
        const label = `${snap.sku || ''} ${snap.variantLabel || ''} ${snap.name || ''}`;
        let itemUnitWeight = 500;
        const kgMatch = label.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
        const gMatch = label.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram)/i);
        if (kgMatch) {
          itemUnitWeight = Math.round(parseFloat(kgMatch[1]) * 1000);
        } else if (gMatch) {
          itemUnitWeight = Math.round(parseFloat(gMatch[1]));
        } else if (snap.weight) {
          const w = Number(snap.weight);
          itemUnitWeight = w < 10 ? Math.round(w * 1000) : Math.round(w);
        }

        const qty = Math.max(1, Number(it.quantity) || 1);
        calcWeight += itemUnitWeight * qty;
      }

      totalWeightGrams = calcWeight;
    }

    // Billable slabs: Math.max(1, Math.ceil(totalWeightGrams / 1000))
    const billableUnits = Math.max(1, Math.ceil(totalWeightGrams / baseWeight));
    const billableWeightGrams = billableUnits * baseWeight;

    const stateStr = (shippingAddress?.state || '').toLowerCase();
    const isTN = order.shippingZone === 'TAMIL_NADU' || stateStr.includes('tamil') || stateStr === 'tn' || stateStr.includes('nadu');
    const shippingZone = isTN ? 'TAMIL_NADU' : 'OUTSIDE_TAMIL_NADU';
    const defaultRate = isTN ? 60 : 120;
    const shippingRate = order.shippingRate ? Number(order.shippingRate) : defaultRate;
    const estimatedDelivery = order.estimatedDelivery || (isTN ? 'Within 2 days' : '3-5 days');

    return {
      totalWeightGrams,
      billableWeightGrams,
      billableUnits,
      shippingZone,
      shippingRate,
      estimatedDelivery,
    };
  }

  // -------------------------------------------------------------
  // CUSTOMER ORDER WORKFLOWS
  // -------------------------------------------------------------

  async getUserOrders(userId: number) {
    const orders = await this.prisma.client.order.findMany({
      where: { userId },
      include: {
        items: true,
        deliveryAssignments: {
          include: { deliveryPartner: { select: { name: true, partnerCode: true, trackingUrlTemplate: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => {
      let shippingAddress: any = null;
      try {
        shippingAddress = JSON.parse(o.shippingAddressJson);
      } catch {
        shippingAddress = null;
      }

      let billingAddress: any = null;
      if (o.billingAddressJson) {
        try {
          billingAddress = JSON.parse(o.billingAddressJson);
        } catch {
          billingAddress = null;
        }
      }

      const mappedItems = o.items.map((i) => {
        let snap: any = null;
        try {
          snap = JSON.parse(i.productSnapshotJson);
        } catch {
          snap = null;
        }
        const totalPrice = Number(i.totalPrice);
        const gstRate = Number(i.gstRate || 0);
        const gstAmount = Number(i.gstAmount || 0);
        const taxableValue = snap?.taxableValue ?? Math.round((totalPrice / (1 + (gstRate || 5) / 100)) * 100) / 100;
        const itemGst = computeGstBreakdown(taxableValue, gstAmount, shippingAddress?.state);

        return {
          id: i.id,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice,
          taxableValue,
          gstRate,
          gstAmount,
          supplyType: snap?.supplyType || itemGst.supplyType,
          cgstAmount: snap?.cgstAmount !== undefined ? Number(snap.cgstAmount) : itemGst.cgstAmount,
          sgstAmount: snap?.sgstAmount !== undefined ? Number(snap.sgstAmount) : itemGst.sgstAmount,
          igstAmount: snap?.igstAmount !== undefined ? Number(snap.igstAmount) : itemGst.igstAmount,
          snapshot: snap,
        };
      });

      const totalTaxable = Math.round(mappedItems.reduce((acc, it) => acc + it.taxableValue, 0) * 100) / 100;
      const totalTax = Number(o.taxAmount || 0);
      const orderGst = computeGstBreakdown(totalTaxable, totalTax, shippingAddress?.state);
      const shipMeta = this.computeShippingMetadata(o, mappedItems, shippingAddress);

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shippingFee),
        taxableAmount: shippingAddress?.taxableAmount !== undefined ? Number(shippingAddress.taxableAmount) : orderGst.taxableAmount,
        taxAmount: totalTax,
        discountAmount: Number(o.discountAmount || 0),
        totalAmount: Number(o.totalAmount),
        supplyType: shippingAddress?.supplyType || orderGst.supplyType,
        sellerStateCode: '33',
        customerStateCode: shippingAddress?.stateCode || orderGst.customerStateCode,
        cgstAmount: shippingAddress?.cgstAmount !== undefined ? Number(shippingAddress.cgstAmount) : orderGst.cgstAmount,
        sgstAmount: shippingAddress?.sgstAmount !== undefined ? Number(shippingAddress.sgstAmount) : orderGst.sgstAmount,
        igstAmount: shippingAddress?.igstAmount !== undefined ? Number(shippingAddress.igstAmount) : orderGst.igstAmount,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        shippingAddress,
        billingAddress,
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
        items: mappedItems,
        delivery: o.deliveryAssignments[0] || null,
        shippingZone: shipMeta.shippingZone,
        totalWeightGrams: shipMeta.totalWeightGrams,
        billableWeightGrams: shipMeta.billableWeightGrams,
        billableUnits: shipMeta.billableUnits,
        shippingRate: shipMeta.shippingRate,
        estimatedDelivery: shipMeta.estimatedDelivery,
        courierName: (o as any).courierName || (o.deliveryAssignments[o.deliveryAssignments.length - 1] as any)?.courierName || (o.deliveryAssignments[o.deliveryAssignments.length - 1] as any)?.deliveryPartner?.name || null,
        trackingNumber: (o as any).trackingNumber || (o.deliveryAssignments[o.deliveryAssignments.length - 1] as any)?.trackingNumber || null,
        createdAt: o.createdAt,
      };
    });
  }

  async getUserOrderDetails(userId: number, orderId: number) {
    const order = await this.prisma.client.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: true,
        deliveryAssignments: {
          include: { deliveryPartner: true },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    let shippingAddress: any = null;
    try {
      shippingAddress = JSON.parse(order.shippingAddressJson);
    } catch {
      shippingAddress = null;
    }

    let billingAddress: any = null;
    if (order.billingAddressJson) {
      try {
        billingAddress = JSON.parse(order.billingAddressJson);
      } catch {
        billingAddress = null;
      }
    }

    const mappedItems = order.items.map((i) => {
      let snap: any = null;
      try {
        snap = JSON.parse(i.productSnapshotJson);
      } catch {
        snap = null;
      }
      const totalPrice = Number(i.totalPrice);
      const gstRate = Number(i.gstRate || 0);
      const gstAmount = Number(i.gstAmount || 0);
      const taxableValue = snap?.taxableValue ?? Math.round((totalPrice / (1 + (gstRate || 5) / 100)) * 100) / 100;
      const itemGst = computeGstBreakdown(taxableValue, gstAmount, shippingAddress?.state);

      return {
        id: i.id,
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice,
        taxableValue,
        gstRate,
        gstAmount,
        supplyType: snap?.supplyType || itemGst.supplyType,
        cgstAmount: snap?.cgstAmount !== undefined ? Number(snap.cgstAmount) : itemGst.cgstAmount,
        sgstAmount: snap?.sgstAmount !== undefined ? Number(snap.sgstAmount) : itemGst.sgstAmount,
        igstAmount: snap?.igstAmount !== undefined ? Number(snap.igstAmount) : itemGst.igstAmount,
        snapshot: snap,
      };
    });

    const totalTaxable = Math.round(mappedItems.reduce((acc, it) => acc + it.taxableValue, 0) * 100) / 100;
    const totalTax = Number(order.taxAmount || 0);
    const orderGst = computeGstBreakdown(totalTaxable, totalTax, shippingAddress?.state);
    const shipMeta = this.computeShippingMetadata(order, mappedItems, shippingAddress);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      taxableAmount: shippingAddress?.taxableAmount !== undefined ? Number(shippingAddress.taxableAmount) : orderGst.taxableAmount,
      taxAmount: totalTax,
      totalAmount: Number(order.totalAmount),
      supplyType: shippingAddress?.supplyType || orderGst.supplyType,
      sellerStateCode: '33',
      customerStateCode: shippingAddress?.stateCode || orderGst.customerStateCode,
      cgstAmount: shippingAddress?.cgstAmount !== undefined ? Number(shippingAddress.cgstAmount) : orderGst.cgstAmount,
      sgstAmount: shippingAddress?.sgstAmount !== undefined ? Number(shippingAddress.sgstAmount) : orderGst.sgstAmount,
      igstAmount: shippingAddress?.igstAmount !== undefined ? Number(shippingAddress.igstAmount) : orderGst.igstAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shippingAddress,
      billingAddress,
      items: mappedItems,
      payments: order.payments.map((p) => ({
        id: p.id,
        gatewayCode: p.gatewayCode,
        transactionId: p.transactionId,
        amount: Number(p.amount),
        status: p.status,
        verifiedAt: p.verifiedAt,
      })),
      deliveryAssignments: order.deliveryAssignments,
      shippingZone: shipMeta.shippingZone,
      totalWeightGrams: shipMeta.totalWeightGrams,
      billableWeightGrams: shipMeta.billableWeightGrams,
      billableUnits: shipMeta.billableUnits,
      shippingRate: shipMeta.shippingRate,
      estimatedDelivery: shipMeta.estimatedDelivery,
      courierName: (order as any).courierName || (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.courierName || (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.deliveryPartner?.name || null,
      trackingNumber: (order as any).trackingNumber || (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.trackingNumber || null,
      createdAt: order.createdAt,
    };
  }

  async cancelOrder(userId: number, orderId: number, reason?: string) {
    const order = await this.prisma.client.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, user: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new BadRequestException(`Order in "${order.orderStatus}" status cannot be cancelled.`);
    }

    return this.prisma.raw.$transaction(async (tx) => {
      // If stock was already deducted (for CONFIRMED / PROCESSING orders), restore stock
      if (order.orderStatus !== 'PENDING') {
        for (const item of order.items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (variant) {
              const restoredStock = variant.stockQuantity + item.quantity;
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stockQuantity: restoredStock },
              });

              // Log to immutable inventory ledger
              await tx.inventoryTransaction.create({
                data: {
                  productId: item.productId,
                  variantId: item.variantId,
                  type: 'RETURN',
                  quantityChange: item.quantity,
                  previousQuantity: variant.stockQuantity,
                  newQuantity: restoredStock,
                  reason: `Customer cancellation #${order.orderNumber}`,
                },
              });
            }
          }
        }
      }

      // Update Order Status
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'PAID' ? 'REFUND_PENDING' : order.paymentStatus,
          notes: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer',
        },
      });

      // Notification
      await tx.notificationLog.create({
        data: {
          recipient: order.user.email || order.user.phone || 'customer',
          channel: order.user.email ? 'EMAIL' : 'SMS',
          subject: `Ayngaran Store: Order Cancelled #${order.orderNumber}`,
          content: `Your order #${order.orderNumber} has been cancelled successfully.`,
          status: 'SENT',
        },
      });

      return {
        message: 'Order cancelled successfully. Stock restored.',
        orderId: updated.id,
        orderStatus: updated.orderStatus,
      };
    });
  }

  // -------------------------------------------------------------
  // ADMIN ORDER MANAGEMENT
  // -------------------------------------------------------------

  async getAllOrders(query: any = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.orderStatus && query.orderStatus !== 'ALL') {
      where.orderStatus = query.orderStatus;
    }

    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      where.paymentStatus = query.paymentStatus;
    }

    const searchTerm = (query.search || query.orderNumber || '').trim();
    if (searchTerm) {
      where.OR = [
        { orderNumber: { contains: searchTerm } },
        { user: { name: { contains: searchTerm } } },
        { user: { phone: { contains: searchTerm } } },
        { user: { email: { contains: searchTerm } } },
        { user: { userCode: { contains: searchTerm } } },
        { shippingAddressJson: { contains: searchTerm } },
        { items: { some: { snapshotJson: { contains: searchTerm } } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.client.order.count({ where }),
      this.prisma.client.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              userCode: true,
            },
          },

          items: true,

          deliveryAssignments: {
            include: {
              deliveryPartner: {
                select: {
                  name: true,
                  partnerCode: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },

        skip,
        take: limit,
      }),
    ]);

    const items = await Promise.all(
      orders.map(async (o) => {
        // ---------------------------------------------------------
        // Shipping Address
        // ---------------------------------------------------------

        let address: any = {};

        try {
          address = JSON.parse(o.shippingAddressJson || '{}');
        } catch {
          address = {};
        }

        // ---------------------------------------------------------
        // Customer
        // ---------------------------------------------------------

        const customerObj = {
          id: o.user?.id || o.userId,

          name:
            o.user?.name && o.user.name !== 'Customer'
              ? o.user.name
              : address.recipientName ||
              address.fullName ||
              'Customer',

          phone:
            o.user?.phone ||
            address.phone ||
            address.mobile ||
            'N/A',

          email:
            o.user?.email ||
            address.email ||
            '',

          userCode:
            o.user?.userCode ||
            `CUST-${o.userId}`,
        };

        // ---------------------------------------------------------
        // Order Items
        // ---------------------------------------------------------

        const mappedItems = await Promise.all(
          o.items.map(async (i) => {
            // -----------------------------------------------------
            // Parse historical snapshot
            // -----------------------------------------------------

            let snap: any = null;

            try {
              if (i.productSnapshotJson) {
                snap = JSON.parse(i.productSnapshotJson);
              }
            } catch {
              snap = null;
            }

            // -----------------------------------------------------
            // Fetch Product
            // -----------------------------------------------------

            const p = i.productId
              ? await this.prisma.client.product.findUnique({
                where: {
                  id: i.productId,
                },

                include: {
                  images: true,
                  brand: true,
                },
              })
              : null;

            // -----------------------------------------------------
            // Fetch Variant + Attributes
            // -----------------------------------------------------

            const v = i.variantId
              ? await this.prisma.client.productVariant.findUnique({
                where: {
                  id: i.variantId,
                },

                include: {
                  variantValues: {
                    include: {
                      attribute: true,
                      attributeValue: true,
                    },
                  },
                },
              })
              : null;

            // -----------------------------------------------------
            // Variant Attributes
            // -----------------------------------------------------

            const variantAttributes =
              v?.variantValues?.map((vv: any) => ({
                attributeId:
                  vv.attribute?.id || vv.attributeId,

                attributeName:
                  vv.attribute?.name || '',

                attributeSlug:
                  vv.attribute?.slug || '',

                attributeValueId:
                  vv.attributeValue?.id,

                value:
                  vv.attributeValue?.value || '',

                displayName:
                  vv.attributeValue?.displayName || '',

                unit:
                  vv.attribute?.unit || null,
              })) || [];

            // -----------------------------------------------------
            // Variant Label
            // -----------------------------------------------------

            const attrLabels = variantAttributes
              .map(
                (attr: any) =>
                  attr.displayName || attr.value,
              )
              .filter(Boolean);

            const vLabel =
              attrLabels.length > 0
                ? attrLabels.join(' / ')
                : v
                  ? v.weight
                    ? `${v.weight}g`
                    : v.sku
                  : undefined;

            // -----------------------------------------------------
            // Product Snapshot
            // -----------------------------------------------------

            snap = {
              name:
                snap?.name ||
                p?.name ||
                'Ayngaran Product',

              productCode:
                snap?.productCode ||
                p?.productCode ||
                '',

              brand:
                snap?.brand ||
                p?.brand?.name ||
                'Ayngaran',

              sku:
                snap?.sku ||
                v?.sku ||
                '',

              variantLabel:
                snap?.variantLabel ||
                vLabel,

              image:
                snap?.image ||
                p?.images?.[0]?.url ||
                null,
            };

            // -----------------------------------------------------
            // Return Order Item
            // -----------------------------------------------------

            return {
              id: i.id,

              productId: i.productId,

              variantId: i.variantId,

              quantity: i.quantity,

              // IMPORTANT:
              // This is the historical price actually paid.
              unitPrice: Number(i.unitPrice),

              totalPrice: Number(i.totalPrice),

              taxableValue: snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,

              gstRate: Number(i.gstRate || 0),

              gstAmount: Number(i.gstAmount || 0),

              supplyType: snap?.supplyType || computeGstBreakdown(
                snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
                Number(i.gstAmount || 0),
                address?.state,
              ).supplyType,

              cgstAmount: snap?.cgstAmount !== undefined ? Number(snap.cgstAmount) : computeGstBreakdown(
                snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
                Number(i.gstAmount || 0),
                address?.state,
              ).cgstAmount,

              sgstAmount: snap?.sgstAmount !== undefined ? Number(snap.sgstAmount) : computeGstBreakdown(
                snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
                Number(i.gstAmount || 0),
                address?.state,
              ).sgstAmount,

              igstAmount: snap?.igstAmount !== undefined ? Number(snap.igstAmount) : computeGstBreakdown(
                snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
                Number(i.gstAmount || 0),
                address?.state,
              ).igstAmount,

              // Historical product information
              snapshot: snap,

              // Current variant information
              variant: v
                ? {
                  id: v.id,

                  sku: v.sku,

                  price: Number(v.price),

                  stockQuantity:
                    v.stockQuantity,

                  barcode:
                    v.barcode,

                  weight:
                    v.weight,

                  status:
                    v.status,
                }
                : null,

              // Dynamic variant attributes
              attributes:
                variantAttributes,
            };
          }),
        );

        // ---------------------------------------------------------
        // Return Order
        // ---------------------------------------------------------

        const totalTaxable = Math.round(mappedItems.reduce((acc: number, it: any) => acc + (it.taxableValue || 0), 0) * 100) / 100;
        const totalTax = Number(o.taxAmount || 0);
        const orderGst = computeGstBreakdown(totalTaxable, totalTax, address?.state);

        const shipMeta = this.computeShippingMetadata(o, mappedItems, address);

        return {
          id: o.id,

          orderNumber: o.orderNumber,

          customer: customerObj,

          // Keep this for existing frontend compatibility
          user: customerObj,

          location: address.city
            ? `${address.city}, ${address.state || ''}`
            : 'India',

          subtotal: Number(o.subtotal),

          shippingFee: Number(o.shippingFee),

          taxableAmount: address?.taxableAmount !== undefined ? Number(address.taxableAmount) : orderGst.taxableAmount,

          taxAmount: totalTax,

          totalAmount: Number(o.totalAmount),

          supplyType: address?.supplyType || orderGst.supplyType,

          sellerStateCode: '33',

          customerStateCode: address?.stateCode || orderGst.customerStateCode,

          cgstAmount: address?.cgstAmount !== undefined ? Number(address.cgstAmount) : orderGst.cgstAmount,

          sgstAmount: address?.sgstAmount !== undefined ? Number(address.sgstAmount) : orderGst.sgstAmount,

          igstAmount: address?.igstAmount !== undefined ? Number(address.igstAmount) : orderGst.igstAmount,

          orderStatus: o.orderStatus,

          paymentStatus: o.paymentStatus,

          itemCount: o.items.reduce(
            (acc, i) => acc + i.quantity,
            0,
          ),

          items: mappedItems,

          shippingAddress: address,

          shippingAddressJson: o.shippingAddressJson,

          billingAddress: o.billingAddressJson
            ? (() => {
                try {
                  return JSON.parse(o.billingAddressJson);
                } catch {
                  return null;
                }
              })()
            : null,

          deliveryPartner:
            (o as any).courierName ||
            (o.deliveryAssignments[0] as any)?.courierName ||
            (o.deliveryAssignments[0] as any)?.deliveryPartner?.name ||
            'Unassigned',

          deliveryStatus:
            o.deliveryAssignments[0]?.status ||
            'UNASSIGNED',

          trackingNumber:
            (o as any).trackingNumber ||
            (o.deliveryAssignments[0] as any)?.trackingNumber || null,

          courierName:
            (o as any).courierName ||
            (o.deliveryAssignments[0] as any)?.courierName || null,

          shippingZone:
            shipMeta.shippingZone,

          totalWeightGrams:
            shipMeta.totalWeightGrams,

          billableWeightGrams:
            shipMeta.billableWeightGrams,

          billableUnits:
            shipMeta.billableUnits,

          shippingRate:
            shipMeta.shippingRate,

          estimatedDelivery:
            shipMeta.estimatedDelivery,

          createdAt: o.createdAt,
        };
      }),
    );

    return createPaginatedResponse(items, total, page, limit);
  }


  async getAdminOrderDetails(orderId: number) {
    // -----------------------------------------------------------
    // Fetch Order
    // -----------------------------------------------------------

    const order =
      await this.prisma.client.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          user: true,

          items: true,

          payments: true,

          deliveryAssignments: {
            include: {
              deliveryPartner: true,
            },
          },
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    // -----------------------------------------------------------
    // Shipping Address
    // -----------------------------------------------------------

    let address: any = {};

    try {
      address = JSON.parse(
        order.shippingAddressJson || '{}',
      );
    } catch {
      address = {};
    }

    // -----------------------------------------------------------
    // Customer
    // -----------------------------------------------------------

    const customerObj = {
      id:
        order.user?.id ||
        order.userId,

      name:
        order.user?.name &&
          order.user.name !== 'Customer'
          ? order.user.name
          : address.recipientName ||
          address.fullName ||
          'Customer',

      phone:
        order.user?.phone ||
        address.phone ||
        address.mobile ||
        'N/A',

      email:
        order.user?.email ||
        address.email ||
        '',

      userCode:
        order.user?.userCode ||
        `CUST-${order.userId}`,
    };

    // -----------------------------------------------------------
    // Order Items
    // -----------------------------------------------------------

    const mappedItems = await Promise.all(
      order.items.map(async (i) => {
        // -------------------------------------------------------
        // Parse Historical Snapshot
        // -------------------------------------------------------

        let snap: any = null;

        try {
          if (i.productSnapshotJson) {
            snap = JSON.parse(
              i.productSnapshotJson,
            );
          }
        } catch {
          snap = null;
        }

        // -------------------------------------------------------
        // Fetch Product
        // -------------------------------------------------------

        const p = i.productId
          ? await this.prisma.client.product.findUnique({
            where: {
              id: i.productId,
            },

            include: {
              images: true,
              brand: true,
            },
          })
          : null;

        // -------------------------------------------------------
        // Fetch Variant + Attributes
        // -------------------------------------------------------

        const v = i.variantId
          ? await this.prisma.client.productVariant.findUnique({
            where: {
              id: i.variantId,
            },

            include: {
              variantValues: {
                include: {
                  attribute: true,
                  attributeValue: true,
                },
              },
            },
          })
          : null;

        // -------------------------------------------------------
        // Variant Attributes
        // -------------------------------------------------------

        const variantAttributes =
          v?.variantValues?.map((vv: any) => ({
            attributeId:
              vv.attribute?.id ||
              vv.attributeId,

            attributeName:
              vv.attribute?.name || '',

            attributeSlug:
              vv.attribute?.slug || '',

            attributeValueId:
              vv.attributeValue?.id,

            value:
              vv.attributeValue?.value || '',

            displayName:
              vv.attributeValue?.displayName || '',

            unit:
              vv.attribute?.unit || null,
          })) || [];

        // -------------------------------------------------------
        // Variant Label
        // -------------------------------------------------------

        const attrLabels = variantAttributes
          .map(
            (attr: any) =>
              attr.displayName ||
              attr.value,
          )
          .filter(Boolean);

        const vLabel =
          attrLabels.length > 0
            ? attrLabels.join(' / ')
            : v
              ? v.weight
                ? `${v.weight}g`
                : v.sku
              : undefined;

        // -------------------------------------------------------
        // Product Snapshot
        // -------------------------------------------------------

        snap = {
          name:
            snap?.name ||
            p?.name ||
            'Ayngaran Product',

          productCode:
            snap?.productCode ||
            p?.productCode ||
            '',

          brand:
            snap?.brand ||
            p?.brand?.name ||
            'Ayngaran',

          sku:
            snap?.sku ||
            v?.sku ||
            '',

          variantLabel:
            snap?.variantLabel ||
            vLabel,

          image:
            snap?.image ||
            p?.images?.[0]?.url ||
            null,
        };

        // -------------------------------------------------------
        // Return Item
        // -------------------------------------------------------

        return {
          id: i.id,

          productId: i.productId,

          variantId: i.variantId,

          quantity: i.quantity,

          // Historical purchased price
          unitPrice: Number(i.unitPrice),

          totalPrice: Number(i.totalPrice),

          taxableValue: snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,

          gstRate: Number(i.gstRate || 0),

          gstAmount: Number(i.gstAmount || 0),

          supplyType: snap?.supplyType || computeGstBreakdown(
            snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
            Number(i.gstAmount || 0),
            address?.state,
          ).supplyType,

          cgstAmount: snap?.cgstAmount !== undefined ? Number(snap.cgstAmount) : computeGstBreakdown(
            snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
            Number(i.gstAmount || 0),
            address?.state,
          ).cgstAmount,

          sgstAmount: snap?.sgstAmount !== undefined ? Number(snap.sgstAmount) : computeGstBreakdown(
            snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
            Number(i.gstAmount || 0),
            address?.state,
          ).sgstAmount,

          igstAmount: snap?.igstAmount !== undefined ? Number(snap.igstAmount) : computeGstBreakdown(
            snap?.taxableValue ?? Math.round((Number(i.totalPrice) / (1 + (Number(i.gstRate || 0) || 5) / 100)) * 100) / 100,
            Number(i.gstAmount || 0),
            address?.state,
          ).igstAmount,

          // Historical product information
          snapshot: snap,

          // Current variant information
          variant: v
            ? {
              id: v.id,

              sku: v.sku,

              price: Number(v.price),

              stockQuantity:
                v.stockQuantity,

              barcode:
                v.barcode,

              weight:
                v.weight,

              status:
                v.status,
            }
            : null,

          // Dynamic variant attributes
          attributes:
            variantAttributes,
        };
      }),
    );

    // -----------------------------------------------------------
    // Return Complete Admin Order Details
    // -----------------------------------------------------------

    const totalTaxable = Math.round(mappedItems.reduce((acc: number, it: any) => acc + (it.taxableValue || 0), 0) * 100) / 100;
    const totalTax = Number(order.taxAmount || 0);
    const orderGst = computeGstBreakdown(totalTaxable, totalTax, address?.state);

    const shipMeta = this.computeShippingMetadata(order, mappedItems, address);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      user: customerObj,
      customer: customerObj,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      taxableAmount: address?.taxableAmount !== undefined ? Number(address.taxableAmount) : orderGst.taxableAmount,
      taxAmount: totalTax,
      totalAmount: Number(order.totalAmount),
      supplyType: address?.supplyType || orderGst.supplyType,
      sellerStateCode: '33',
      customerStateCode: address?.stateCode || orderGst.customerStateCode,
      cgstAmount: address?.cgstAmount !== undefined ? Number(address.cgstAmount) : orderGst.cgstAmount,
      sgstAmount: address?.sgstAmount !== undefined ? Number(address.sgstAmount) : orderGst.sgstAmount,
      igstAmount: address?.igstAmount !== undefined ? Number(address.igstAmount) : orderGst.igstAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shippingAddress: address,
      billingAddress: order.billingAddressJson
        ? JSON.parse(order.billingAddressJson)
        : null,
      notes: order.notes,
      itemCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
      items: mappedItems,
      payments: order.payments.map((p) => ({
        id: p.id,
        gatewayCode: p.gatewayCode,
        transactionId: p.transactionId,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        verifiedAt: p.verifiedAt,
      })),
      deliveryAssignments: order.deliveryAssignments,
      shippingZone: shipMeta.shippingZone,
      totalWeightGrams: shipMeta.totalWeightGrams,
      billableWeightGrams: shipMeta.billableWeightGrams,
      billableUnits: shipMeta.billableUnits,
      shippingRate: shipMeta.shippingRate,
      estimatedDelivery: shipMeta.estimatedDelivery,
      courierName:
        (order as any).courierName ||
        (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.courierName ||
        (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.deliveryPartner?.name ||
        null,
      trackingNumber:
        (order as any).trackingNumber ||
        (order.deliveryAssignments[order.deliveryAssignments.length - 1] as any)?.trackingNumber ||
        null,
      createdAt: order.createdAt,
    };
  }

  async updateOrderStatus(orderId: number, dto: UpdateOrderStatusDto, staffId?: number) {
    const existing = await this.prisma.client.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) throw new NotFoundException('Order not found');

    const updated = await this.prisma.client.order.update({
      where: { id: orderId },
      data: {
        orderStatus: dto.status,
        notes: dto.notes ? `${existing.notes || ''}\n${dto.notes}` : existing.notes,
      },
    });

    // Write audit log
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CHANGE_ORDER_STATUS',
        entityType: 'Order',
        entityId: String(orderId),
        oldValueJson: JSON.stringify({ status: existing.orderStatus }),
        newValueJson: JSON.stringify({ status: dto.status }),
      },
    });

    // Notification
    await this.prisma.raw.notificationLog.create({
      data: {
        recipient: existing.user.email || existing.user.phone || 'customer',
        channel: existing.user.email ? 'EMAIL' : 'SMS',
        subject: `Ayngaran Store: Order Status Updated #${existing.orderNumber}`,
        content: `Your order #${existing.orderNumber} status has been updated to: ${dto.status}.`,
        status: 'SENT',
      },
    });

    return updated;
  }

  async assignDeliveryPartner(orderId: number, dto: AssignDeliveryDto, staffId?: number) {
    const order = await this.prisma.client.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const courierName = dto.courierName?.trim() || null;
    const trackingNumber = dto.trackingNumber?.trim() || null;
    const deliveryPartnerId = dto.deliveryPartnerId || null;

    // Check if an existing assignment exists for this order
    const existingAssignment = await this.prisma.client.orderDeliveryAssignment.findFirst({
      where: { orderId },
      orderBy: { id: 'desc' },
    });

    let assignment;
    if (existingAssignment) {
      assignment = await this.prisma.client.orderDeliveryAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          deliveryPartnerId,
          courierName,
          trackingNumber,
          notes: dto.notes || existingAssignment.notes,
        } as any,
        include: { deliveryPartner: true },
      });
    } else {
      assignment = await this.prisma.client.orderDeliveryAssignment.create({
        data: {
          orderId,
          deliveryPartnerId,
          courierName,
          trackingNumber,
          status: 'ASSIGNED',
          notes: dto.notes || null,
        } as any,
        include: { deliveryPartner: true },
      });
    }

    // Update order snapshot columns directly
    await this.prisma.client.order.update({
      where: { id: orderId },
      data: {
        courierName,
        trackingNumber,
      } as any,
    });

    // Write audit log
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'ASSIGN_DELIVERY',
        entityType: 'Order',
        entityId: String(orderId),
        newValueJson: JSON.stringify({
          courierName,
          trackingNumber,
        }),
      },
    });

    return assignment;
  }
}
