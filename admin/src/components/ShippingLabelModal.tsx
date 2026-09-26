import React, { useState, useRef } from 'react';
import { X, Printer, Tag, Truck, MapPin, Package, ArrowRight, Layers } from 'lucide-react';
import { Order } from '../types';

interface ShippingLabelModalProps {
  order: Order | any;
  onClose: () => void;
}

type LabelSize = '4x6' | 'A6' | '4x4' | 'A4';

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, onClose }) => {
  const [activeSize, setActiveSize] = useState<LabelSize>('4x6');
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

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
    'N/A';

  const addressLine1 = shippingAddr.addressLine1 || shippingAddr.address || shippingAddr.street || '';
  const addressLine2 = shippingAddr.addressLine2 || '';
  const city = shippingAddr.city || '';
  const state = shippingAddr.state || '';
  const pincode = shippingAddr.pincode || shippingAddr.postalCode || shippingAddr.pinCode || '';

  const items: any[] = order.items || [];
  const isCod = order.paymentStatus === 'PENDING_COD' || (order.paymentMethod || '').toUpperCase().includes('COD');

  // Courier partner name resolution (prevent printing "UNASSIGNED")
  const rawPartner =
    order.deliveryAssignments?.[0]?.deliveryPartner?.name ||
    order.deliveryPartner?.name ||
    (typeof (order as any).deliveryPartner === 'string' &&
     (order as any).deliveryPartner.toLowerCase() !== 'unassigned'
      ? (order as any).deliveryPartner
      : null);

  const hasAssignedCourier = Boolean(rawPartner);
  const courierName = rawPartner || 'STANDARD SURFACE COURIER';

  const assignedTracking =
    order.deliveryAssignments?.[0]?.trackingNumber ||
    (order.trackingNumber && !order.trackingNumber.startsWith('TRK-') ? order.trackingNumber : null);

  const awbLabel = assignedTracking
    ? `AWB: ${assignedTracking}`
    : `REF: #${order.orderNumber}`;

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Compute package weight estimate
  const totalWeightGrams = Number(order.totalWeightGrams ?? items.reduce((acc: number, it: any) => {
    const rawW = it.variant?.weight ?? it.weight ?? 0.25;
    const num = Number(rawW);
    const wGrams = num < 10 ? Math.round(num * 1000) : Math.round(num);
    return acc + wGrams * (it.quantity || 1);
  }, 0));
  const weightKg = (totalWeightGrams / 1000).toFixed(2);

  const handlePrint = () => {
    const printContent = printContainerRef.current;
    if (!printContent) return;

    let pageCss = 'size: 4in 6in; margin: 0;';
    if (activeSize === 'A6') {
      pageCss = 'size: A6 portrait; margin: 5mm;';
    } else if (activeSize === '4x4') {
      pageCss = 'size: 4in 4in; margin: 0;';
    } else if (activeSize === 'A4') {
      pageCss = 'size: A4 portrait; margin: 10mm;';
    }

    const printWindow = window.open('', '_blank', 'width=750,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${order.orderNumber} (${activeSize})</title>
          <style>
            @page {
              ${pageCss}
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000000;
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * { box-sizing: border-box; }
            .label-page {
              width: 100%;
              padding: 6px;
            }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="label-page">
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

  // Dimension settings for preview card
  const getContainerStyle = () => {
    switch (activeSize) {
      case '4x6':
        return { width: '400px', minHeight: '580px' };
      case 'A6':
        return { width: '380px', minHeight: '520px' };
      case '4x4':
        return { width: '400px', minHeight: '400px' };
      case 'A4':
        return { width: '600px', minHeight: '750px' };
      default:
        return { width: '400px', minHeight: '580px' };
    }
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
          maxWidth: '54rem',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Control Bar */}
        <div
          style={{
            padding: '0.85rem 1.4rem',
            backgroundColor: '#1a3d2b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Tag size={18} color="#ffffff" />
            <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>
              Shipping Courier Label — #{order.orderNumber}
            </span>
          </div>

          {/* Size Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '0.6rem' }}>
            {[
              { id: '4x6', label: '4" × 6" (Thermal Standard)' },
              { id: 'A6', label: 'A6 (Courier Slip)' },
              { id: '4x4', label: '4" × 4" (Compact)' },
              { id: 'A4', label: 'A4 (Sheet)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSize(tab.id as LabelSize)}
                style={{
                  border: 'none',
                  borderRadius: '0.4rem',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: activeSize === tab.id ? '#ffffff' : 'transparent',
                  color: activeSize === tab.id ? '#1a3d2b' : '#ffffff',
                  boxShadow: activeSize === tab.id ? '0 2px 5px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
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
              }}
            >
              <Printer size={15} /> Print Label ({activeSize})
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

        {/* Scrollable Label Preview Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* Outer Card for Label Preview */}
          <div
            ref={printContainerRef}
            style={{
              ...getContainerStyle(),
              backgroundColor: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '0',
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              fontSize: '11px',
              padding: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Header: Store Logo & Courier Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2px solid #000000',
                paddingBottom: '8px',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img
                  src="/Ayngaran_logo.png"
                  alt="Ayngaran"
                  style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '13px', lineHeight: 1 }}>AYNGARAN</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#333' }}>TRADITIONAL FOODS</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: hasAssignedCourier ? '#000000' : '#334155' }}>
                  {courierName}
                </div>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#333' }}>
                  {awbLabel}
                </div>
                {!hasAssignedCourier && (
                  <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 700 }}>
                    (Standard Courier Dispatch)
                  </div>
                )}
              </div>
            </div>

            {/* 2. Prominent COD / Prepaid Banner */}
            <div
              style={{
                border: '2px solid #000000',
                backgroundColor: isCod ? '#000000' : '#ffffff',
                color: isCod ? '#ffffff' : '#000000',
                padding: '6px 10px',
                textAlign: 'center',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '0.05em' }}>
                {isCod ? 'CASH ON DELIVERY (COD)' : 'PREPAID — DO NOT COLLECT CASH'}
              </div>
              <div style={{ fontWeight: 900, fontSize: '14px' }}>
                {isCod ? `COLLECT: ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}` : 'PAID'}
              </div>
            </div>

            {/* 3. Visual Order Barcode Simulation */}
            <div
              style={{
                textAlign: 'center',
                borderBottom: '1px solid #000000',
                paddingBottom: '8px',
                marginBottom: '10px',
              }}
            >
              {/* Clean SVG Barcode pattern */}
              <svg width="240" height="38" viewBox="0 0 240 38" style={{ margin: '0 auto', display: 'block' }}>
                <rect x="0" y="0" width="3" height="34" fill="#000" />
                <rect x="5" y="0" width="2" height="34" fill="#000" />
                <rect x="9" y="0" width="5" height="34" fill="#000" />
                <rect x="17" y="0" width="2" height="34" fill="#000" />
                <rect x="22" y="0" width="4" height="34" fill="#000" />
                <rect x="29" y="0" width="2" height="34" fill="#000" />
                <rect x="34" y="0" width="6" height="34" fill="#000" />
                <rect x="43" y="0" width="3" height="34" fill="#000" />
                <rect x="48" y="0" width="2" height="34" fill="#000" />
                <rect x="53" y="0" width="5" height="34" fill="#000" />
                <rect x="61" y="0" width="3" height="34" fill="#000" />
                <rect x="67" y="0" width="2" height="34" fill="#000" />
                <rect x="72" y="0" width="4" height="34" fill="#000" />
                <rect x="79" y="0" width="6" height="34" fill="#000" />
                <rect x="88" y="0" width="2" height="34" fill="#000" />
                <rect x="93" y="0" width="4" height="34" fill="#000" />
                <rect x="100" y="0" width="3" height="34" fill="#000" />
                <rect x="106" y="0" width="5" height="34" fill="#000" />
                <rect x="114" y="0" width="2" height="34" fill="#000" />
                <rect x="119" y="0" width="4" height="34" fill="#000" />
                <rect x="126" y="0" width="3" height="34" fill="#000" />
                <rect x="132" y="0" width="6" height="34" fill="#000" />
                <rect x="141" y="0" width="2" height="34" fill="#000" />
                <rect x="146" y="0" width="4" height="34" fill="#000" />
                <rect x="153" y="0" width="3" height="34" fill="#000" />
                <rect x="159" y="0" width="5" height="34" fill="#000" />
                <rect x="167" y="0" width="2" height="34" fill="#000" />
                <rect x="172" y="0" width="4" height="34" fill="#000" />
                <rect x="179" y="0" width="6" height="34" fill="#000" />
                <rect x="188" y="0" width="3" height="34" fill="#000" />
                <rect x="194" y="0" width="2" height="34" fill="#000" />
                <rect x="199" y="0" width="5" height="34" fill="#000" />
                <rect x="207" y="0" width="3" height="34" fill="#000" />
                <rect x="213" y="0" width="2" height="34" fill="#000" />
                <rect x="218" y="0" width="6" height="34" fill="#000" />
                <rect x="227" y="0" width="2" height="34" fill="#000" />
                <rect x="232" y="0" width="4" height="34" fill="#000" />
                <rect x="238" y="0" width="2" height="34" fill="#000" />
              </svg>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', marginTop: '2px' }}>
                *{order.orderNumber}*
              </div>
            </div>

            {/* 4. DELIVER TO (RECIPIENT / TO ADDRESS) — High Visibility Box */}
            <div
              style={{
                border: '2px solid #000000',
                padding: '8px 10px',
                marginBottom: '10px',
                backgroundColor: '#ffffff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #000000',
                  paddingBottom: '4px',
                  marginBottom: '6px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SHIP TO (DELIVERY ADDRESS):
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#333' }}>
                  Order: #{order.orderNumber}
                </span>
              </div>

              {/* Recipient Name */}
              <div style={{ fontSize: '14px', fontWeight: 900, color: '#000000', marginBottom: '4px' }}>
                {recipientName}
              </div>

              {/* Address Lines */}
              <div style={{ fontSize: '11px', lineHeight: 1.35, color: '#111827', marginBottom: '6px' }}>
                {addressLine1 ? (
                  <div>
                    {addressLine1}
                    {addressLine2 ? `, ${addressLine2}` : ''}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontStyle: 'italic' }}>Address not specified</div>
                )}
                {(city || state) && (
                  <div>
                    <strong>{[city, state].filter(Boolean).join(', ')}</strong>
                  </div>
                )}
              </div>

              {/* PIN Code Box & Phone */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed #000000',
                  paddingTop: '6px',
                  marginTop: '4px',
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>CONTACT NUMBER:</div>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#000000' }}>
                    📞 {recipientPhone}
                  </div>
                </div>

                {pincode ? (
                  <div
                    style={{
                      border: '2px solid #000000',
                      backgroundColor: '#f8fafc',
                      padding: '3px 8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.05em' }}>PIN CODE</div>
                    <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '0.08em' }}>
                      {pincode}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 5. SHIP FROM (SENDER / FROM ADDRESS) */}
            <div
              style={{
                border: '1.5px solid #000000',
                padding: '6px 8px',
                marginBottom: '10px',
                backgroundColor: '#fbfbfb',
                fontSize: '10px',
                lineHeight: 1.35,
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px', borderBottom: '1px dotted #888', paddingBottom: '2px' }}>
                RETURN TO SENDER (IF UNDELIVERED):
              </div>
              <div style={{ fontWeight: 900, fontSize: '11px' }}>AYNGARAN TRADITIONAL PRODUCTS</div>
              <div>No. 12, Kamaraj Nagar, Coimbatore – 641001, Tamil Nadu, India</div>
              <div>
                <strong>Support Phone:</strong> +91 94432 12345 | <strong>Email:</strong> support@ayngaran.com
              </div>
              <div>
                <strong>GSTIN:</strong> 33AAFFA1234F1Z8
              </div>
            </div>

            {/* 6. Package Specifications & Items Manifest */}
            <div
              style={{
                border: '1px solid #000000',
                padding: '6px 8px',
                fontSize: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #000000',
                  paddingBottom: '4px',
                  marginBottom: '4px',
                  fontWeight: 800,
                }}
              >
                <span>ITEMS: {items.length} Units</span>
                <span>EST. WEIGHT: {weightKg} kg</span>
                <span>DATE: {orderDate}</span>
              </div>

              {/* Manifest table / summary */}
              <div style={{ maxHeight: activeSize === '4x4' ? '60px' : '90px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <tbody>
                    {items.slice(0, activeSize === '4x4' ? 2 : 4).map((it: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ padding: '2px 0', fontWeight: 700 }}>
                          {it.snapshot?.name || 'Ayngaran Product'}
                        </td>
                        <td style={{ textAlign: 'right', padding: '2px 0', whiteSpace: 'nowrap' }}>
                          Qty: {it.quantity || 1}
                        </td>
                      </tr>
                    ))}
                    {items.length > (activeSize === '4x4' ? 2 : 4) && (
                      <tr>
                        <td colSpan={2} style={{ padding: '2px 0', fontSize: '8px', color: '#555', fontStyle: 'italic' }}>
                          + {items.length - (activeSize === '4x4' ? 2 : 4)} more items in this package
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  borderTop: '1px dotted #000000',
                  paddingTop: '4px',
                  marginTop: '4px',
                  fontSize: '8px',
                  color: '#444',
                  textAlign: 'center',
                }}
              >
                100% Traditional Food Products • Handle with Care • Do Not Tamper
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
