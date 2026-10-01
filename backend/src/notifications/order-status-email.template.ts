export interface OrderStatusEmailParams {
  to: string;
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  orderTotal: number;
  orderDate: string;
  customerOrderUrl?: string;
  notes?: string | null;
  from?: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice?: number;
    totalPrice: number;
    variantLabel?: string;
  }>;
}

/**
 * Only these 5 statuses send email to the customer:
 * 1. CONFIRMED
 * 2. SHIPPED
 * 3. OUT_FOR_DELIVERY
 * 4. DELIVERED
 * 5. CANCELLED
 */
export const CUSTOMER_NOTIFIABLE_STATUSES = [
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export function isCustomerEmailEligibleStatus(status: string): boolean {
  return CUSTOMER_NOTIFIABLE_STATUSES.includes(status.toUpperCase().trim() as any);
}

export function getCustomerOrderStatusSubject(orderNumber: string, status: string): string {
  switch (status.toUpperCase().trim()) {
    case 'CONFIRMED':
      return `Order Confirmed: #${orderNumber} - Ayngaran Foods`;
    case 'SHIPPED':
      return `Your Order #${orderNumber} Has Been Shipped - Ayngaran Foods`;
    case 'OUT_FOR_DELIVERY':
      return `Out for Delivery: Your Order #${orderNumber} Arrives Today! - Ayngaran Foods`;
    case 'DELIVERED':
      return `Delivered: Your Order #${orderNumber} Has Arrived - Ayngaran Foods`;
    case 'CANCELLED':
      return `Order Cancelled: #${orderNumber} - Ayngaran Foods`;
    default:
      return `Ayngaran Foods Order #${orderNumber} Update: ${status}`;
  }
}

export const STATUS_MESSAGES: Record<
  string,
  { label: string; heading: string; message: string; color: string; bg: string; icon: string }
> = {
  CONFIRMED: {
    label: 'Order Confirmed',
    heading: 'Your Order is Confirmed!',
    message:
      'Thank you for ordering with Ayngaran Foods. Your order has been verified and our kitchen team is carefully preparing your fresh, traditional items.',
    color: '#065f46',
    bg: '#ecfdf5',
    icon: '✅',
  },
  SHIPPED: {
    label: 'Shipped',
    heading: 'Your Order Has Been Shipped!',
    message:
      'Your order has been safely packed and handed over to our delivery partner. It is now in transit to your delivery address.',
    color: '#0369a1',
    bg: '#f0f9ff',
    icon: '📦',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    heading: 'Out for Delivery Today!',
    message:
      'Great news! Your package is out for delivery with our delivery executive and will reach you today. Please keep your contact phone reachable.',
    color: '#b45309',
    bg: '#fffbeb',
    icon: '🚚',
  },
  DELIVERED: {
    label: 'Delivered',
    heading: 'Package Successfully Delivered!',
    message:
      'Your order has been successfully delivered. We hope you enjoy the authentic taste and health benefits of Ayngaran Foods. Thank you for shopping with us!',
    color: '#15803d',
    bg: '#dcfce7',
    icon: '🎉',
  },
  CANCELLED: {
    label: 'Cancelled',
    heading: 'Order Cancelled',
    message:
      'Your order has been cancelled. If any online payment was deducted, your full refund will be processed back to your original payment method within 3 to 5 business days.',
    color: '#991b1b',
    bg: '#fef2f2',
    icon: '⚠️',
  },
  // Fallbacks for internal statuses
  PENDING: {
    label: 'Order Placed',
    heading: 'Order Placed',
    message: 'Your order has been received and is awaiting confirmation.',
    color: '#92400e',
    bg: '#fffbeb',
    icon: '📋',
  },
  PROCESSING: {
    label: 'Processing',
    heading: 'Processing Order',
    message: 'Your order is currently being prepared by our team.',
    color: '#1e40af',
    bg: '#eff6ff',
    icon: '🍳',
  },
  PACKED: {
    label: 'Packed',
    heading: 'Order Packed',
    message: 'Your order has been packed and is ready for dispatch.',
    color: '#6b21a8',
    bg: '#faf5ff',
    icon: '📦',
  },
};

export function getStatusDetails(status: string) {
  const normalized = (status || '').toUpperCase().trim();
  return (
    STATUS_MESSAGES[normalized] || {
      label: status,
      heading: `Order Status: ${status}`,
      message: `Your order status has been updated to ${status}.`,
      color: '#374151',
      bg: '#f3f4f6',
      icon: '🔔',
    }
  );
}

function escapeHtml(text?: string | number): string {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateOrderStatusEmailHtml(params: OrderStatusEmailParams): string {
  const statusInfo = getStatusDetails(params.newStatus);
  const oldStatusInfo = getStatusDetails(params.oldStatus);
  const orderUrl = params.customerOrderUrl || 'http://localhost:3000/account/orders';

  const isShippingMilestone =
    params.newStatus === 'SHIPPED' ||
    params.newStatus === 'OUT_FOR_DELIVERY' ||
    Boolean(params.courierName) ||
    Boolean(params.trackingNumber);

  const courierDisplay = params.courierName || 'Ayngaran Delivery Partner';
  const trackingDisplay = params.trackingNumber || 'Available shortly / In transit';

  const itemsHtml =
    params.items && params.items.length > 0
      ? `
      <div style="margin: 22px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">
          Ordered Items
        </h4>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; background: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">
              <th style="padding: 10px 14px; text-align: left;">Item</th>
              <th style="padding: 10px 14px; text-align: center;">Qty</th>
              <th style="padding: 10px 14px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${params.items
              .map(
                (item) => `
              <tr style="border-top: 1px solid #e5e7eb; font-size: 13px; color: #1e293b;">
                <td style="padding: 10px 14px; text-align: left;">
                  <strong style="color: #0f172a;">${escapeHtml(item.name)}</strong>
                  ${item.variantLabel ? `<br><span style="font-size: 12px; color: #64748b;">${escapeHtml(item.variantLabel)}</span>` : ''}
                </td>
                <td style="padding: 10px 14px; text-align: center; color: #475569;">${item.quantity}</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #0f172a;">₹${Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(getCustomerOrderStatusSubject(params.orderNumber, params.newStatus))}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      vertical-align: middle;
    }
  </style>
</head>
<body style="background-color: #f4f4f5; margin: 0; padding: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e4e4e7;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: #ffffff; padding: 24px 28px; text-align: left;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">AYNGARAN FOODS</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; color: #dcfce7;">Traditional Foods &bull; Natural Wellness</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px;">
      <div style="font-size: 17px; font-weight: 700; color: #18181b; margin-bottom: 10px;">
        Hello ${escapeHtml(params.customerName || 'Customer')},
      </div>
      <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">
        Here is an update regarding your order <strong>#${escapeHtml(params.orderNumber)}</strong>:
      </p>

      <!-- Status Highlight Banner -->
      <div style="background: ${statusInfo.bg}; border: 1px solid ${statusInfo.color}33; border-left: 5px solid ${statusInfo.color}; border-radius: 8px; padding: 16px 20px; margin-bottom: 22px;">
        <h3 style="margin: 0 0 6px 0; font-size: 16px; color: ${statusInfo.color}; font-weight: 800;">
          ${statusInfo.icon} ${escapeHtml(statusInfo.heading)}
        </h3>
        <p style="margin: 0; font-size: 14px; color: #27272a; line-height: 1.5;">
          ${escapeHtml(statusInfo.message)}
        </p>
      </div>

      <!-- Prominent Courier & Tracking Card (Displayed for Shipped / Out for Delivery) -->
      ${
        isShippingMilestone
          ? `
      <div style="background: #f0f9ff; border: 1.5px solid #0284c7; border-left: 6px solid #0284c7; border-radius: 8px; padding: 16px 20px; margin-bottom: 22px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td colspan="2" style="padding-bottom: 10px; border-bottom: 1px dashed #bae6fd;">
              <span style="font-size: 14px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                🚚 Delivery Partner & Tracking Details
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 6px 0; color: #475569; font-size: 13px; font-weight: 600; width: 45%;">
              Courier / Delivery Partner:
            </td>
            <td style="padding: 10px 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 800; text-align: right; width: 55%;">
              ${escapeHtml(courierDisplay)}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0 10px 0; color: #475569; font-size: 13px; font-weight: 600; width: 45%;">
              AWB / Tracking Number:
            </td>
            <td style="padding: 6px 0 10px 0; color: #0284c7; font-size: 14px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 800; text-align: right; width: 55%; letter-spacing: 0.5px;">
              ${escapeHtml(trackingDisplay)}
            </td>
          </tr>
          ${
            params.trackingUrl
              ? `
          <tr>
            <td colspan="2" style="padding-top: 10px; text-align: right; border-top: 1px dashed #bae6fd;">
              <a href="${escapeHtml(params.trackingUrl)}" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                Track Live on Courier Portal &rarr;
              </a>
            </td>
          </tr>
          `
              : ''
          }
        </table>
      </div>
      `
          : ''
      }

      <!-- Order Details Summary Table (Email-client robust with table cells) -->
      <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              Order Number
            </td>
            <td style="padding: 8px 0; color: #18181b; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f4f4f5; text-align: right; width: 55%;">
              #${escapeHtml(params.orderNumber)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              Order Date
            </td>
            <td style="padding: 8px 0; color: #18181b; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f4f4f5; text-align: right; width: 55%;">
              ${escapeHtml(params.orderDate)}
            </td>
          </tr>
          ${
            params.oldStatus && params.oldStatus !== params.newStatus && params.oldStatus !== 'ORDER_PLACED'
              ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              Previous Status
            </td>
            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f4f4f5; width: 55%;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; background: #f4f4f5; color: #71717a;">
                ${escapeHtml(oldStatusInfo.label)}
              </span>
            </td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              Current Status
            </td>
            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f4f4f5; width: 55%;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; background: ${statusInfo.bg}; color: ${statusInfo.color}; border: 1px solid ${statusInfo.color}44;">
                ${escapeHtml(statusInfo.label)}
              </span>
            </td>
          </tr>
          ${
            isShippingMilestone
              ? `
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              Courier Partner
            </td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f4f4f5; text-align: right; width: 55%;">
              ${escapeHtml(courierDisplay)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f4f4f5; text-align: left; width: 45%;">
              AWB / Tracking Number
            </td>
            <td style="padding: 8px 0; color: #0284c7; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f4f4f5; text-align: right; width: 55%;">
              ${escapeHtml(trackingDisplay)}
            </td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 10px 0 2px 0; color: #18181b; font-size: 13px; font-weight: 700; text-align: left; width: 45%;">
              Total Amount
            </td>
            <td style="padding: 10px 0 2px 0; color: #15803d; font-size: 16px; font-weight: 800; text-align: right; width: 55%;">
              ₹${Number(params.orderTotal).toFixed(2)}
            </td>
          </tr>
        </table>
      </div>

      ${itemsHtml}

      ${
        params.notes
          ? `
      <div style="font-size: 13px; color: #475569; background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #0284c7; margin: 16px 0;">
        <strong style="color: #0f172a;">Order Notes:</strong> ${escapeHtml(params.notes)}
      </div>
      `
          : ''
      }

      <div style="text-align: center; margin: 28px 0 10px 0;">
        <a href="${orderUrl}" target="_blank" style="display: inline-block; background: #15803d; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px; box-shadow: 0 2px 6px rgba(21, 128, 61, 0.3);">
          View & Track Order Online &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #fafafa; padding: 20px 28px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; line-height: 1.6;">
      Thank you for shopping with Ayngaran Foods.<br>
      For any queries, contact our support team at <a href="mailto:support@ayngaranfoods.com" style="color: #15803d; text-decoration: none;">support@ayngaranfoods.com</a>.
    </div>
  </div>
</body>
</html>`.trim();
}
