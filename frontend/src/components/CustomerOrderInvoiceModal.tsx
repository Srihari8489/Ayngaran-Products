import React, { useRef } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';

interface CustomerOrderInvoiceModalProps {
  order: any;
  user?: any;
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

export const CustomerOrderInvoiceModal: React.FC<CustomerOrderInvoiceModalProps> = ({ order, user, onClose }) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const items: any[] = order.items || [];
  const customer = order.user || order.customer || user || {};

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
    'Valued Customer';

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
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * { box-sizing: border-box; }
            .invoice-box {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 6px 8px;
              font-size: 11px;
            }
            th {
              background-color: #1a3d2b !important;
              color: #ffffff !important;
              font-weight: 700;
              text-align: left;
            }
            td {
              border-bottom: 1px solid #e5e7eb;
            }
            .total-row td {
              border-top: 1.5px solid #1a3d2b;
              font-weight: 800;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
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
              Tax Invoice — #{order.orderNumber}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                color: '#1a3d2b',
                border: 'none',
                padding: '0.45rem 0.95rem',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              }}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            ref={printContainerRef}
            style={{
              maxWidth: '750px',
              margin: '0 auto',
              color: '#0f172a',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* 1. Header: Store Info & Tax Invoice Title */}
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
                <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#64748b' }}>
                  Order Ref: <strong style={{ color: '#1a3d2b' }}>#{order.orderNumber}</strong>
                </p>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
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
                <tr
                  style={{
                    backgroundColor: '#1a3d2b',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '7px 10px', textAlign: 'center', width: '36px' }}>#</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left' }}>Item Description &amp; Specifications</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left', width: '90px' }}>HSN</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '70px' }}>Unit Price</th>
                  <th style={{ padding: '7px 10px', textAlign: 'center', width: '45px' }}>Qty</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '70px' }}>GST Rate</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right', width: '90px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const snap = it.snapshot || {};
                  const itemName = snap.name || 'Ayngaran Product';
                  const sku = snap.sku || it.variant?.sku || '—';
                  const variantLabel = snap.variantLabel || (it.variant?.weight ? `${it.variant.weight}g` : null);
                  const gst = it.gstRate !== undefined && it.gstRate !== null ? Number(it.gstRate) : Number(snap.gstRate ?? 5);
                  const lineTotal = Number(it.totalPrice || (it.unitPrice * it.quantity) || 0);

                  return (
                    <tr
                      key={it.id || idx}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '0.82rem',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfdfd',
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{itemName}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px', fontSize: '0.72rem' }}>
                          {variantLabel && (
                            <span style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              {variantLabel}
                            </span>
                          )}
                          {sku !== '—' && (
                            <span style={{ color: '#64748b', fontFamily: 'monospace' }}>
                              SKU: {sku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.76rem' }}>
                        {snap.hsnCode || '2106.90'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                        ₹{Number(it.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                        {it.quantity}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#0369a1', fontWeight: 700 }}>
                        {gst}%
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#1a3d2b' }}>
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 4. Calculation Summary & Tax Breakup */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '1.5rem',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
              }}
            >
              {/* Left Box: Amount in words + Tax summary */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '3px' }}>
                  Total Amount In Words:
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1a3d2b', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  {numberToWordsINR(grandTotal)}
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.6rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                    GST Breakup Summary:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>
                    <span>CGST (Central Tax @ 2.5%):</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{cgst}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', margin: '2px 0' }}>
                    <span>SGST (State Tax @ 2.5%):</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{sgst}</span>
                  </div>
                </div>
              </div>

              {/* Right Box: Math Totals */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Items Subtotal:</span>
                  <strong style={{ color: '#0f172a' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div style={{ padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Shipping &amp; Handling:</span>
                  <span style={{ fontWeight: 700, color: shippingFee > 0 ? '#0f172a' : '#166534' }}>
                    {shippingFee > 0 ? `₹${shippingFee.toFixed(2)}` : 'FREE'}
                  </span>
                </div>

                {taxAmount > 0 && (
                  <div style={{ padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Total GST (CGST + SGST):</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{taxAmount.toFixed(2)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div style={{ padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9', color: '#dc2626' }}>
                    <span>Special Discount:</span>
                    <span style={{ fontWeight: 700 }}>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    backgroundColor: '#1a3d2b',
                    color: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Grand Total:
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Declaration & Authorized Signatory */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1rem',
                marginTop: '1rem',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '380px', lineHeight: 1.4 }}>
                <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#334155' }}>Terms &amp; Declaration:</p>
                <p style={{ margin: 0 }}>
                  We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold are backed by 100% Ayngaran Quality Guarantee.
                </p>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#1a3d2b', fontWeight: 700 }}>
                    Ayngaran Store
                  </span>
                </div>
                <div style={{ borderTop: '1.5px solid #1a3d2b', paddingTop: '3px', fontSize: '0.72rem', fontWeight: 800, color: '#1a3d2b', textTransform: 'uppercase' }}>
                  Authorized Signatory
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  Ayngaran Traditional Products
                </div>
              </div>
            </div>

            {/* 6. Footer Note */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed #e2e8f0',
                textAlign: 'center',
                fontSize: '0.72rem',
                color: '#64748b',
              }}
            >
              Thank you for trusting Ayngaran Products for your traditional nutrition &amp; wellness!
              <br />
              Need assistance? WhatsApp or Call us at +91 94432 12345 or email support@ayngaran.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
