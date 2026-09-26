import React, { useRef } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { resolveGstStateCode, SELLER_STATE_CODE } from '../utils/gst.util';

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

  const subtotal = Number(order.subtotal || 0);
  const shippingFee = Number(order.shippingFee || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const grandTotal = Number(order.totalAmount || 0);

  // Determine Tax Jurisdiction using State Codes: Ayngaran Seller is Tamil Nadu (Code: 33)
  const stateName = shippingAddr.state?.trim() || 'Tamil Nadu';
  const customerStateCode = order.customerStateCode || shippingAddr.stateCode || resolveGstStateCode(stateName);
  const supplyType = order.supplyType || (customerStateCode === SELLER_STATE_CODE ? 'INTRA_STATE' : 'INTER_STATE');
  const isIntraState = supplyType === 'INTRA_STATE';

  // Calculate itemized Reverse GST
  const calculatedItems = items.map((item: any, idx: number) => {
    const snap = item.snapshot || {};
    const unitPrice = Number(item.unitPrice || 0);
    const qty = Number(item.quantity || 1);
    const lineGross = Number(item.totalPrice || unitPrice * qty);
    const gstRate = item.gstRate !== undefined && item.gstRate !== null && Number(item.gstRate) > 0 ? Number(item.gstRate) : (Number(snap.gstRate) > 0 ? Number(snap.gstRate) : 5);

    // Reverse GST Formula: Taxable Value = Line Gross / (1 + Rate / 100)
    const taxableValue = item.taxableValue ?? Math.round((lineGross / (1 + gstRate / 100)) * 100) / 100;
    const gstAmount = item.gstAmount ?? Math.round((lineGross - taxableValue) * 100) / 100;

    const itemSupplyType = item.supplyType || snap.supplyType || supplyType;
    const cgstAmount = itemSupplyType === 'INTRA_STATE'
      ? (item.cgstAmount !== undefined ? Number(item.cgstAmount) : Math.round((gstAmount / 2) * 100) / 100)
      : 0;
    const sgstAmount = itemSupplyType === 'INTRA_STATE'
      ? (item.sgstAmount !== undefined ? Number(item.sgstAmount) : Math.round((gstAmount - cgstAmount) * 100) / 100)
      : 0;
    const igstAmount = itemSupplyType === 'INTER_STATE'
      ? (item.igstAmount !== undefined ? Number(item.igstAmount) : gstAmount)
      : 0;

    return {
      ...item,
      snap,
      unitPrice,
      qty,
      lineGross,
      gstRate,
      taxableValue,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
    };
  });

  const totalTaxable = order.taxableAmount !== undefined ? Number(order.taxableAmount) : Math.round(calculatedItems.reduce((acc, it) => acc + it.taxableValue, 0) * 100) / 100;
  const totalGst = Number(order.taxAmount || calculatedItems.reduce((acc, it) => acc + it.gstAmount, 0));
  const totalCgst = isIntraState ? (order.cgstAmount !== undefined ? Number(order.cgstAmount) : Math.round((totalGst / 2) * 100) / 100) : 0;
  const totalSgst = isIntraState ? (order.sgstAmount !== undefined ? Number(order.sgstAmount) : Math.round((totalGst - totalCgst) * 100) / 100) : 0;
  const totalIgst = !isIntraState ? (order.igstAmount !== undefined ? Number(order.igstAmount) : totalGst) : 0;

  const rawGrandTotal = subtotal + shippingFee - discountAmount;
  const roundGrandTotal = Math.round(Number(order.totalAmount || rawGrandTotal));
  const roundOff = Math.round((roundGrandTotal - rawGrandTotal) * 100) / 100;

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

    const absoluteLogoUrl = window.location.origin + '/Ayngaran_logo.png';
    const printHtml = printContent.innerHTML.replace(/src="\/Ayngaran_logo\.png"/g, `src="${absoluteLogoUrl}"`);

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
            ${printHtml}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <img
                    src="/Ayngaran_logo.png"
                    alt="Ayngaran Products"
                    style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
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
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', width: '30px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Item &amp; Specifications</th>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '60px' }}>HSN</th>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '38px' }}>Qty</th>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '75px' }}>Rate (₹)</th>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '80px' }}>Taxable (₹)</th>
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '50px' }}>GST</th>
                  {isIntraState ? (
                    <>
                      <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '70px' }}>CGST (₹)</th>
                      <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '70px' }}>SGST (₹)</th>
                    </>
                  ) : (
                    <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '75px' }}>IGST (₹)</th>
                  )}
                  <th style={{ padding: '7px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '85px' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={isIntraState ? 10 : 9} style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b' }}>
                      No items recorded in this order.
                    </td>
                  </tr>
                ) : (
                  calculatedItems.map((item: any, idx: number) => {
                    const snap = item.snap || {};
                    const variantLabel = snap.variantLabel || (item.variant?.weight ? `${item.variant.weight}g` : null);

                    return (
                      <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{snap.name || 'Ayngaran Product'}</div>
                          {variantLabel && (
                            <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>
                              <span style={{ backgroundColor: '#dcfce7', padding: '1px 5px', borderRadius: '3px' }}>
                                {variantLabel}
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontFamily: 'monospace', fontSize: '10px' }}>
                          {snap.hsnCode || '210690'}
                        </td>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                          ₹{Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right', color: '#334155' }}>
                          ₹{Number(item.taxableValue).toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#0369a1', fontWeight: 700 }}>
                          {item.gstRate}%
                        </td>
                        {isIntraState ? (
                          <>
                            <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '10.5px' }}>
                              ₹{Number(item.cgstAmount).toFixed(2)}
                            </td>
                            <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '10.5px' }}>
                              ₹{Number(item.sgstAmount).toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right', fontSize: '10.5px' }}>
                            ₹{Number(item.igstAmount).toFixed(2)}
                          </td>
                        )}
                        <td style={{ padding: '6px 6px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 800, color: '#1a3d2b' }}>
                          ₹{Number(item.lineGross).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* 4. Calculation Summary & Tax Breakup */}
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
              {/* Left Box: Amount in words + Tax summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Total In Words:
                  </span>
                  <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#1a3d2b', fontSize: '0.82rem' }}>
                    {numberToWordsINR(grandTotal)}
                  </p>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45, backgroundColor: '#f8fafc', padding: '0.6rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#1a3d2b' }}>
                    GST Tax Jurisdiction: {isIntraState ? 'Tamil Nadu Supply (Intra-State • State Code: 33)' : `Interstate Supply (${stateName} • State Code: ${customerStateCode})`}
                  </p>
                  <p style={{ margin: '0 0 2px' }}>• Price Before Tax (Base): <strong>₹{totalTaxable.toFixed(2)}</strong></p>
                  {isIntraState ? (
                    <>
                      <p style={{ margin: '0 0 2px' }}>• Central Govt Tax (CGST): <strong>₹{totalCgst.toFixed(2)}</strong></p>
                      <p style={{ margin: '0 0 2px' }}>• State Govt Tax (SGST): <strong>₹{totalSgst.toFixed(2)}</strong></p>
                      <p style={{ margin: 0 }}>• Total Tax (GST Included): <strong>₹{totalGst.toFixed(2)}</strong></p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 2px' }}>• Integrated Interstate Tax (IGST): <strong>₹{totalIgst.toFixed(2)}</strong></p>
                      <p style={{ margin: 0 }}>• Total Tax (GST Included): <strong>₹{totalGst.toFixed(2)}</strong></p>
                    </>
                  )}
                  <p style={{ margin: '3px 0 0', color: '#166534', fontWeight: 700, fontSize: '0.72rem' }}>
                    * All product prices are inclusive of GST. No extra tax charged.
                  </p>
                </div>

                {/* Shipping & Delivery Calculation Summary */}
                <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45, backgroundColor: '#f0fdf4', padding: '0.6rem 0.85rem', borderRadius: '0.4rem', border: '1px solid #bbf7d0' }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 800, color: '#166534' }}>
                    Shipping & Delivery Calculation:
                  </p>
                  <p style={{ margin: '0 0 2px' }}>• Shipping Zone: <strong>{isIntraState ? 'Tamil Nadu (Intrastate Zone)' : `Outside Tamil Nadu (${stateName})`}</strong></p>
                  <p style={{ margin: '0 0 2px' }}>• Order Weight: <strong>{Number(order.totalWeightGrams || 0) > 0 ? `${(Number(order.totalWeightGrams) / 1000).toFixed(2)} KG (${order.totalWeightGrams}g)` : '1.00 KG (1000g)'}</strong> → Billable Slab: <strong>{order.billableUnits || Math.max(1, Math.ceil(Number(order.totalWeightGrams || 1000) / 1000))} slab{(order.billableUnits || Math.max(1, Math.ceil(Number(order.totalWeightGrams || 1000) / 1000))) > 1 ? 's' : ''} ({(order.billableUnits || Math.max(1, Math.ceil(Number(order.totalWeightGrams || 1000) / 1000)))} × ₹{order.shippingRate || (isIntraState ? 60 : 120)})</strong></p>
                  <p style={{ margin: '0 0 2px' }}>• Estimated Delivery: <strong>{order.estimatedDelivery || (isIntraState ? 'Within 2 days' : '3-5 days')}</strong></p>
                  {(order.courierName || order.trackingNumber) && (
                    <p style={{ margin: 0 }}>• Courier Partner: <strong>{order.courierName || 'Assigned'}</strong> {order.trackingNumber ? `• Tracking: ${order.trackingNumber}` : ''}</p>
                  )}
                </div>
              </div>

              {/* Right Box: Clean Summary Totals */}
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
                  <span>Products Subtotal (All Taxes Included):</span>
                  <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem' }}>
                  <span>Price Before Tax (Base Value):</span>
                  <span>₹{totalTaxable.toFixed(2)}</span>
                </div>

                {isIntraState ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                      <span>Central Govt Tax (CGST):</span>
                      <span>₹{totalCgst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                      <span>State Govt Tax (SGST):</span>
                      <span>₹{totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                    <span>Integrated Interstate Tax (IGST):</span>
                    <span>₹{totalIgst.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontSize: '0.78rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '3px' }}>
                  <span style={{ fontWeight: 700 }}>Total Tax (Included in Subtotal):</span>
                  <span style={{ fontWeight: 700 }}>₹{totalGst.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Delivery Charges ({order.billableUnits || 1} slab{(order.billableUnits || 1) > 1 ? 's' : ''}):</span>
                  <span style={{ fontWeight: 700, color: shippingFee === 0 ? '#15803d' : 'inherit' }}>
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Coupon / Discount:</span>
                    <span style={{ fontWeight: 700 }}>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.82rem' }}>
                  <span>Round Off:</span>
                  <span style={{ fontWeight: 700 }}>
                    {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                  </span>
                </div>

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
                  <span>Final Total Paid:</span>
                  <span>₹{roundGrandTotal.toLocaleString('en-IN')}</span>
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
