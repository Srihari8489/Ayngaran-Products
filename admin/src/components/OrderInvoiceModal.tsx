import React, { useRef } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { Order } from '../types';

interface OrderInvoiceModalProps {
  order: Order | any;
  onClose: () => void;
}

// Convert number to Indian Rupees words
function numberToWordsINR(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function convertHundreds(val: number): string {
    let str = '';
    if (val >= 100) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += b[Math.floor(val / 10)] + ' ';
      val %= 10;
    }
    if (val > 0) {
      str += a[val] + ' ';
    }
    return str.trim();
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  let res = '';
  if (crore > 0) res += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) res += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) res += convertHundreds(thousand) + ' Thousand ';
  if (remainder > 0) res += convertHundreds(remainder);

  return `Rupees ${res.trim()} Only`;
}

export const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, onClose }) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const items: any[] = order.items || [];
  const customer = order.user || order.customer || {};

  // Safely parse shipping address whether provided as object, parsed JSON, or raw JSON string
  let shippingAddr = order.shippingAddress;
  if (!shippingAddr && order.shippingAddressJson) {
    try {
      shippingAddr = typeof order.shippingAddressJson === 'string'
        ? JSON.parse(order.shippingAddressJson)
        : order.shippingAddressJson;
    } catch {
      shippingAddr = {};
    }
  } else if (typeof shippingAddr === 'string') {
    try {
      shippingAddr = JSON.parse(shippingAddr);
    } catch {
      shippingAddr = {};
    }
  }
  if (!shippingAddr || typeof shippingAddr !== 'object') {
    shippingAddr = {};
  }

  const recipientName =
    shippingAddr.recipientName ||
    shippingAddr.fullName ||
    shippingAddr.name ||
    customer.name ||
    'Customer';

  const recipientPhone =
    shippingAddr.phone ||
    shippingAddr.mobile ||
    customer.phone ||
    '';

  const addressLine1 = shippingAddr.addressLine1 || shippingAddr.address || shippingAddr.street || '';
  const addressLine2 = shippingAddr.addressLine2 || '';
  const city = shippingAddr.city || '';
  const state = shippingAddr.state || '';
  const pincode = shippingAddr.pincode || shippingAddr.postalCode || shippingAddr.pinCode || '';

  const isCod = order.paymentStatus === 'PENDING_COD' || (order.paymentMethod || '').toUpperCase().includes('COD');

  const subtotal = Number(order.subtotal || order.totalAmount || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const taxAmount = Number(order.taxAmount || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const grandTotal = Number(order.totalAmount || 0);

  // Approximate 5% GST split if tax isn't itemized separately
  const cgst = taxAmount > 0 ? (taxAmount / 2).toFixed(2) : '0.00';
  const sgst = taxAmount > 0 ? (taxAmount / 2).toFixed(2) : '0.00';

  const invoiceNumber = `INV-${order.orderNumber}`;
  const invoiceDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    const printContent = printContainerRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            * { box-sizing: border-box; }
            .invoice-box {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 7px 9px;
              border: 1px solid #e5e7eb;
              font-size: 11px;
            }
            th {
              background-color: #f8fafc;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              color: #374151;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .header-bar {
              border-bottom: 2px solid #1a3d2b;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .badge-paid {
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 10px;
            }
            .badge-cod {
              background: #fffbeb;
              color: #92400e;
              border: 1px solid #fde68a;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 15, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '52rem',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Modal Action Bar */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            backgroundColor: '#1a3d2b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} color="#ffffff" />
            <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>
              Tax Invoice Preview — #{order.orderNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#ffffff',
                color: '#1a3d2b',
                fontWeight: 800,
                fontSize: '0.82rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#ffffff',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            ref={printContainerRef}
            style={{
              maxWidth: '780px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              padding: '2rem 2.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              color: '#0f172a',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '12px',
            }}
          >
            {/* 1. Header Bar: Store Info & Tax Invoice Label */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '2.5px solid #1a3d2b',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src="/Ayngaran_logo.png"
                    alt="Ayngaran Store"
                    style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#1a3d2b',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      AYNGARAN PRODUCTS
                    </h2>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      100% Natural Traditional Products
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.45 }}>
                  <p style={{ margin: 0 }}>No. 12, Kamaraj Nagar, Coimbatore – 641001, Tamil Nadu, India</p>
                  <p style={{ margin: 0 }}>Phone: +91 94432 12345 | Email: support@ayngaran.com</p>
                  <p style={{ margin: 0 }}>
                    <strong>GSTIN:</strong> 33AAFFA1234F1Z8 &nbsp;|&nbsp; <strong>State Code:</strong> 33 (Tamil Nadu)
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    backgroundColor: '#1a3d2b',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Tax Invoice / Cash Memo
                </span>
                <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#64748b' }}>
                  Invoice No: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{invoiceNumber}</strong>
                </p>
                <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#64748b' }}>
                  Invoice Date: <strong style={{ color: '#0f172a' }}>{invoiceDate}</strong>
                </p>
                <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#64748b' }}>
                  Order Ref: <strong style={{ color: '#0f172a' }}>#{order.orderNumber}</strong>
                </p>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      backgroundColor: isCod ? '#fefce8' : '#ecfdf5',
                      color: isCod ? '#854d0e' : '#065f46',
                      border: `1px solid ${isCod ? '#fef08a' : '#a7f3d0'}`,
                    }}
                  >
                    {isCod ? 'PAYMENT: COD (COLLECT CASH)' : 'PAYMENT: PREPAID (ONLINE)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Customer & Address Details (2 Columns) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
                backgroundColor: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              {/* Billed To */}
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Billed To (Customer):
                </span>
                <p style={{ margin: '3px 0 1px', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  {recipientName}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>
                  Phone: {recipientPhone || 'N/A'}
                </p>
                {customer.email && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>
                    Email: {customer.email}
                  </p>
                )}
                {customer.userCode && (
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                    Customer Code: {customer.userCode}
                  </p>
                )}
              </div>

              {/* Shipped To */}
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Shipped / Delivered To:
                </span>
                <p style={{ margin: '3px 0 1px', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  {recipientName}
                </p>
                {addressLine1 ? (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                    {addressLine1}
                    {addressLine2 ? `, ${addressLine2}` : ''}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                    Address not specified
                  </p>
                )}
                {(city || state || pincode) && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>
                    {[city, state].filter(Boolean).join(', ')}{pincode ? ` — PIN: ${pincode}` : ''}
                  </p>
                )}
                {recipientPhone && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569' }}>
                    Phone: {recipientPhone}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Items Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1.25rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', width: '35px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Item &amp; Specifications</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '80px' }}>HSN</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '45px' }}>Qty</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '85px' }}>Unit Price</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '65px' }}>GST %</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                      No items recorded in this order.
                    </td>
                  </tr>
                ) : (
                  items.map((item: any, idx: number) => {
                    const snap = item.snapshot || {};
                    const unitPrice = Number(item.unitPrice || 0);
                    const qty = Number(item.quantity || 1);
                    const lineTotal = Number(item.totalPrice || unitPrice * qty);
                    const gstRate = item.gstRate !== undefined && item.gstRate !== null ? Number(item.gstRate) : 5;

                    // Collect variant attributes
                    const attrDetails: string[] = [];
                    if (Array.isArray(item.attributes) && item.attributes.length > 0) {
                      item.attributes.forEach((a: any) => {
                        attrDetails.push(`${a.attributeName || 'Attr'}: ${a.displayName || a.value}`);
                      });
                    } else if (snap.variantLabel) {
                      attrDetails.push(snap.variantLabel);
                    }

                    return (
                      <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{snap.name || 'Ayngaran Product'}</div>
                          {attrDetails.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                              {attrDetails.join(' | ')}
                            </div>
                          )}
                          {item.variant?.sku && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                              SKU: {item.variant.sku}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontFamily: 'monospace' }}>
                          {snap.hsnCode || '210690'}
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>
                          {qty}
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                          ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>
                          {gstRate}%
                        </td>
                        <td style={{ padding: '7px 8px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800, color: '#1a3d2b' }}>
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* 4. Totals & Tax Breakup (Bottom Section) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '1.25rem',
                borderTop: '1px solid #cbd5e1',
                paddingTop: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {/* Left: Amount in Words & Tax Split */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Total In Words:
                  </span>
                  <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#1a3d2b', fontSize: '0.82rem' }}>
                    {numberToWordsINR(grandTotal)}
                  </p>
                </div>

                {taxAmount > 0 && (
                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700 }}>GST Tax Calculation Breakup (Intra-state):</p>
                    <p style={{ margin: 0 }}>• CGST (Central Tax 2.5%): ₹{cgst}</p>
                    <p style={{ margin: 0 }}>• SGST (State Tax 2.5%): ₹{sgst}</p>
                  </div>
                )}
              </div>

              {/* Right: Calculations Box */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  backgroundColor: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Items Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Shipping &amp; Handling:</span>
                  <span style={{ fontWeight: 700, color: shippingFee === 0 ? '#15803d' : 'inherit' }}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Coupon / Discount:</span>
                    <span style={{ fontWeight: 700 }}>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Total GST:</span>
                    <span style={{ fontWeight: 700 }}>₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: '#1a3d2b',
                    borderTop: '2px solid #cbd5e1',
                    paddingTop: '6px',
                    marginTop: '3px',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* 5. Terms & Signature Footer */}
            <div
              style={{
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '0.72rem',
                color: '#64748b',
              }}
            >
              <div style={{ maxWidth: '420px', lineHeight: 1.4 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#334155' }}>Declaration &amp; Terms:</p>
                <p style={{ margin: 0 }}>
                  1. All items are authentic, natural products manufactured under strict quality standards.
                </p>
                <p style={{ margin: 0 }}>
                  2. This is a computer-generated invoice and does not require an ink signature.
                </p>
                <p style={{ margin: 0 }}>
                  3. For queries or support, reach us at support@ayngaran.com.
                </p>
              </div>

              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '0.95rem', color: '#1a3d2b', fontWeight: 800 }}>
                    Ayngaran Foods
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '2px', fontWeight: 700, color: '#1e293b' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
