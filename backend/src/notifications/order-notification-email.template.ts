import { OrderNotificationEmailParams } from '../auth/email-delivery.service';

export function generateOrderNotificationEmailHtml(params: OrderNotificationEmailParams): string {
  const itemsHtml = (params.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
          <strong>${escapeHtml(item.name)}</strong>
          ${item.variantLabel ? `<br/><span style="font-size: 12px; color: #64748b;">${escapeHtml(item.variantLabel)}</span>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: center; color: #1e293b;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right; color: #1e293b;">
          ₹${Number(item.totalPrice).toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join('');

  const paymentLabel =
    params.paymentMethod === 'COD' || params.paymentStatus === 'PENDING_COD'
      ? 'Cash on Delivery (Pending Collection)'
      : params.paymentStatus === 'PAID'
        ? 'PAID (Verified Online)'
        : params.paymentStatus;

  const adminUrl = params.adminOrderUrl || 'http://localhost:3001/orders';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Received — ${escapeHtml(params.orderNumber)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #1a3d2b; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #d4c56a; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 24px; }
    .meta-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .table th { background: #f1f5f9; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; text-align: left; }
    .totals { border-top: 2px solid #e2e8f0; padding-top: 12px; margin-bottom: 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #1a3d2b; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 8px; }
    .btn { display: inline-block; background: #1a3d2b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>AYNGARAN FOODS</h1>
      <p>🔔 New Customer Order Received</p>
    </div>
    <div class="content">
      <div class="meta-box">
        <div style="font-size: 16px; font-weight: 800; color: #1a3d2b; margin-bottom: 8px;">
          Order #${escapeHtml(params.orderNumber)}
        </div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">
          <strong>Date:</strong> ${escapeHtml(params.orderDate)}
        </div>
        <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">
          <strong>Customer:</strong> ${escapeHtml(params.customer.name)} (${escapeHtml(params.customer.email)})
        </div>
        <div style="font-size: 13px; color: #475569;">
          <strong>Phone:</strong> ${escapeHtml(params.customer.phone)}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal:</span><span>₹${Number(params.subtotal).toFixed(2)}</span></div>
        ${params.discount > 0 ? `<div class="total-row" style="color: #059669;"><span>Discount:</span><span>-₹${Number(params.discount).toFixed(2)}</span></div>` : ''}
        <div class="total-row"><span>GST / Tax:</span><span>₹${Number(params.tax).toFixed(2)}</span></div>
        <div class="total-row"><span>Shipping:</span><span>₹${Number(params.shipping).toFixed(2)}</span></div>
        <div class="total-row grand-total"><span>Total Amount:</span><span>₹${Number(params.total).toFixed(2)}</span></div>
      </div>

      <div style="margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px;">
        <div><strong>Payment:</strong> <span style="color: ${params.paymentStatus === 'PAID' ? '#16a34a' : '#d97706'}; font-weight: 700;">${escapeHtml(paymentLabel)}</span></div>
        <div style="margin-top: 4px;"><strong>Order Status:</strong> <span style="font-weight: 700; color: #1a3d2b;">${escapeHtml(params.orderStatus)}</span></div>
      </div>

      <div style="text-align: center;">
        <a href="${adminUrl}" class="btn">View Order in Admin Suite →</a>
      </div>
    </div>
    <div class="footer">
      This is an automated notification from Ayngaran Foods Store Management.
    </div>
  </div>
</body>
</html>
  `.trim();
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
