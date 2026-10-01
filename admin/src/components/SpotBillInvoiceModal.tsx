import React, { useRef } from 'react';
import { X, Printer, Download, Store, CheckCircle2, User, CreditCard } from 'lucide-react';
import { SpotBill } from '../types';

interface SpotBillInvoiceModalProps {
  bill: SpotBill | any;
  onClose: () => void;
  isOpen?: boolean;
}

// Convert number to Indian Rupees in words
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

export const SpotBillInvoiceModal: React.FC<SpotBillInvoiceModalProps> = ({ bill, onClose, isOpen }) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!bill || (isOpen !== undefined && !isOpen)) return null;

  const items: any[] = bill.items || [];
  const returns: any[] = bill.returns || [];
  const isIntraState = bill.supplyType === 'INTRA_STATE' || bill.customerState === 'Tamil Nadu';

  const subtotal = Number(bill.subtotal || 0);
  const discountAmount = Number(bill.discountAmount || 0);
  const taxableAmount = Number(bill.taxableAmount || 0);
  const cgstAmount = Number(bill.cgstAmount || 0);
  const sgstAmount = Number(bill.sgstAmount || 0);
  const igstAmount = Number(bill.igstAmount || 0);
  const totalTaxAmount = Number(bill.totalTaxAmount || (cgstAmount + sgstAmount + igstAmount));
  const totalAmount = Number(bill.totalAmount || (subtotal - discountAmount));

  const amountReceived = bill.amountReceived !== null && bill.amountReceived !== undefined ? Number(bill.amountReceived) : totalAmount;
  const changeReturned = bill.changeReturned !== null && bill.changeReturned !== undefined ? Number(bill.changeReturned) : 0;

  const invoiceDate = bill.createdAt
    ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
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
          <base href="${window.location.origin}/" />
          <title>Invoice - ${bill.invoiceNumber || bill.billNumber}</title>
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
            .badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 10px;
              display: inline-block;
            }
            .badge-paid {
              background: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
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
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Action Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Spot Billing Tax Invoice
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Bill #{bill.billNumber} • {bill.invoiceNumber}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                fontSize: '0.85rem',
                borderRadius: '0.5rem',
              }}
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Content */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, backgroundColor: '#ffffff' }}>
          <div ref={printContainerRef}>
            {/* Header: Company & Tax Meta */}
            <div
              style={{
                borderBottom: '2px solid #1a3d2b',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src="/Ayngaran_logo.png"
                  alt="Ayngaran Foods Logo"
                  style={{
                    height: '56px',
                    width: 'auto',
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
                <div>
                  <h1
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 900,
                      color: '#1a3d2b',
                      margin: 0,
                      letterSpacing: '0.04em',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    AYNGARAN FOODS
                  </h1>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: '2px 0 0', fontWeight: 600 }}>
                    Pure, Healthy & Traditional South Indian Products
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    <div>No. 12, Gandhi Bazaar, Srirangam, Trichy, Tamil Nadu - 620006</div>
                    <div>
                      <strong>GSTIN:</strong> 33AAAAA0000A1Z5 | <strong>FSSAI:</strong> 12423000000123
                    </div>
                    <div>
                      <strong>Phone:</strong> +91 90250 84185 | <strong>Email:</strong> contact@ayngaranfoods.com
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '220px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '0.3rem 0.75rem',
                    backgroundColor: '#1a3d2b',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    borderRadius: '0.375rem',
                    letterSpacing: '0.06em',
                    marginBottom: '0.5rem',
                  }}
                >
                  RETAIL TAX INVOICE
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
                  Invoice: {bill.invoiceNumber}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Bill Ref: {bill.billNumber}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Date: {invoiceDate}</div>
                <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, marginTop: '2px' }}>
                  Cashier: {bill.cashierName || 'Staff'} {bill.cashier?.staffCode ? `(${bill.cashier.staffCode})` : ''}
                </div>
              </div>
            </div>

            {/* Bill To & Supply Meta */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                backgroundColor: '#f8fafc',
                padding: '0.85rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Customer / Buyer Details
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                  {bill.customerName || 'Walk-in Customer'}
                </div>
                {bill.customerPhone && <div style={{ color: '#475569' }}>Phone: {bill.customerPhone}</div>}
                {bill.customerEmail && <div style={{ color: '#475569' }}>Email: {bill.customerEmail}</div>}
                {bill.customerGstin && (
                  <div style={{ color: '#1a3d2b', fontWeight: 700 }}>GSTIN: {bill.customerGstin}</div>
                )}
                {bill.customerAddress && <div style={{ color: '#64748b' }}>{bill.customerAddress}</div>}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Place of Supply
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                  {bill.customerState || 'Tamil Nadu'} (Code: {bill.customerStateCode || '33'})
                </div>
                <div style={{ color: '#2d6a4f', fontWeight: 700, marginTop: '2px' }}>
                  {isIntraState ? 'Intra-State Supply (CGST + SGST)' : 'Inter-State Supply (IGST)'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: bill.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2',
                      color: bill.paymentStatus === 'PAID' ? '#166534' : '#991b1b',
                    }}
                  >
                    Payment: {bill.paymentStatus} via {bill.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.75rem', width: '35px' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.75rem' }}>Description</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontSize: '0.75rem', width: '130px' }}>SKU</th>
                  <th style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.75rem', width: '45px' }}>Qty</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '0.75rem', width: '70px' }}>Rate</th>
                  <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '0.75rem', width: '80px' }}>Taxable</th>
                  {isIntraState ? (
                    <>
                      <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '0.75rem', width: '70px' }}>
                        CGST
                      </th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', fontSize: '0.75rem', width: '70px' }}>
                        SGST
                      </th>
                    </>
                  ) : (
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: '0.75rem', width: '85px' }}>
                      IGST
                    </th>
                  )}
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.75rem', width: '90px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr
                    key={it.id || idx}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: idx % 2 === 1 ? '#fafafa' : '#ffffff',
                      fontSize: '0.8rem',
                    }}
                  >
                    <td style={{ padding: '7px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {it.productNameSnapshot || it.productName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Variant: {it.variantLabelSnapshot || it.variantLabel || 'Standard'}
                      </div>
                    </td>
                    <td style={{ padding: '7px 6px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                      {it.skuSnapshot || it.sku}
                    </td>
                    <td style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 700 }}>{it.quantity}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#334155' }}>
                      ₹{Number(it.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>
                      ₹{Number(it.taxableAmount).toFixed(2)}
                    </td>
                    {isIntraState ? (
                      <>
                        <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
                          ₹{Number(it.cgstAmount).toFixed(2)}
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({Number(it.cgstRate || 2.5)}%)</div>
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
                          ₹{Number(it.sgstAmount).toFixed(2)}
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({Number(it.sgstRate || 2.5)}%)</div>
                        </td>
                      </>
                    ) : (
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
                        ₹{Number(it.igstAmount).toFixed(2)}
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>({Number(it.igstRate || 5)}%)</div>
                      </td>
                    )}
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 800, color: '#1a3d2b' }}>
                      ₹{Number(it.totalPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '1.5rem',
                borderTop: '2px solid #e2e8f0',
                paddingTop: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {/* Left Column: Words & Payment Details */}
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                  <strong>Amount in Words:</strong>
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#1a3d2b',
                    fontStyle: 'italic',
                    backgroundColor: '#f8fafc',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0',
                    marginBottom: '0.75rem',
                  }}
                >
                  {numberToWordsINR(totalAmount)}
                </div>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div>
                    <strong>Payment Mode:</strong> {bill.paymentMethod}
                  </div>
                  {bill.paymentReference && (
                    <div>
                      <strong>Reference ID:</strong> {bill.paymentReference}
                    </div>
                  )}
                  {bill.paymentMethod === 'CASH' && (
                    <div style={{ marginTop: '2px' }}>
                      <span>
                        <strong>Amount Received:</strong> ₹{amountReceived.toFixed(2)}
                      </span>
                      <span style={{ marginLeft: '12px' }}>
                        <strong>Change:</strong> ₹{changeReturned.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Financial Breakdown */}
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ color: '#475569' }}>Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      color: '#b91c1c',
                      fontWeight: 700,
                    }}
                  >
                    <span>Discount {bill.discountType === 'PERCENTAGE' ? `(${bill.discountValue}%)` : ''}:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '3px 0',
                    borderTop: '1px dashed #cbd5e1',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ color: '#475569' }}>Taxable Value:</span>
                  <span style={{ fontWeight: 600 }}>₹{taxableAmount.toFixed(2)}</span>
                </div>

                {isIntraState ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ color: '#475569' }}>CGST:</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span style={{ color: '#475569' }}>SGST:</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ color: '#475569' }}>IGST:</span>
                    <span>₹{igstAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderTop: '2px solid #1a3d2b',
                    marginTop: '4px',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#1a3d2b',
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Returns History if any */}
            {returns && returns.length > 0 && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '2px' }}>
                  Returns Recorded for this Bill:
                </div>
                {returns.map((r, ri) => (
                  <div key={r.id || ri} style={{ color: '#78350f' }}>
                    • Return #{r.returnNumber} on {new Date(r.createdAt).toLocaleDateString('en-IN')}: Refunded ₹
                    {Number(r.refundAmount).toFixed(2)} ({r.refundMethod}) — Reason: {r.reason}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed #cbd5e1',
                textAlign: 'center',
                fontSize: '0.72rem',
                color: '#64748b',
              }}
            >
              <div style={{ fontWeight: 700, color: '#1a3d2b' }}>
                Thank you for shopping with Ayngaran Foods!
              </div>
              <div>This is a computer-generated tax invoice for counter spot sale. No signature required.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
