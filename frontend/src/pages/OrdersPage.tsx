import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertCircle,
  Star,
  CreditCard,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

export const OrdersPage: React.FC = () => {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [reviewOrder, setReviewOrder] = useState<{ orderId: number; productId: number; productName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { alert('Please allow popups to download invoices.'); return; }
    const placedDate = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const placedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const itemRows = (order.items || []).map((item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
          <div style="font-weight:600;color:#1a1a2e;font-size:13px;">${item.snapshot?.name || 'Product'}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;">${item.snapshot?.brand ? item.snapshot.brand + ' &bull; ' : ''}${item.snapshot?.sku ? 'SKU: ' + item.snapshot.sku : ''}</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;">&#8377;${Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;font-size:13px;color:#1a1a2e;">&#8377;${Number(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');
    const subtotal = order.items?.reduce((s, i) => s + Number(i.totalPrice), 0) || 0;
    const total = Number(order.totalAmount);
    const shipping = total - subtotal > 0 ? total - subtotal : 0;
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Invoice #${order.orderNumber}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;color:#333;background:#fff;}
    .w{max-width:800px;margin:0 auto;padding:40px 48px;}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;}
    .bn{font-size:26px;font-weight:900;color:#4f46e5;}.bs{font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
    .it{text-align:right;}.it h1{font-size:28px;font-weight:800;color:#1a1a2e;}.on{font-family:monospace;font-size:14px;color:#4f46e5;font-weight:700;margin-top:4px;}
    .div{border:none;border-top:2px solid #f0f0f0;margin:24px 0;}.mg{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;}
    .mb label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#aaa;font-weight:700;display:block;margin-bottom:4px;}
    .mb p{font-size:13px;font-weight:600;color:#1a1a2e;line-height:1.6;}.sb{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#d1fae5;color:#059669;}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;}thead th{background:#f8f9ff;padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#666;font-weight:700;border-bottom:2px solid #e8e8f0;}
    thead th:nth-child(2){text-align:center;}thead th:nth-child(3),thead th:nth-child(4){text-align:right;}
    .tot{margin-left:auto;width:280px;}.tr{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#555;}
    .gr{font-size:16px;font-weight:800;color:#1a1a2e;border-top:2px solid #e8e8f0;padding-top:10px;margin-top:4px;}
    .fn{margin-top:48px;padding-top:20px;border-top:1px dashed #ddd;display:flex;justify-content:space-between;align-items:center;}
    .fn p{font-size:11px;color:#aaa;}.ty{font-size:14px;font-weight:700;color:#4f46e5;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.w{padding:20px;}}</style></head>
    <body><div class="w"><div class="hdr"><div><div class="bn">AYNGARAN</div><div class="bs">Foods Store</div>
    <p style="margin-top:10px;font-size:12px;color:#888;line-height:1.6;">Coimbatore, Tamil Nadu<br/>India - 641004</p></div>
    <div class="it"><h1>INVOICE</h1><div class="on">#${order.orderNumber}</div><p style="font-size:12px;color:#888;margin-top:8px;">${placedDate} at ${placedTime}</p>
    <div style="margin-top:8px;"><span class="sb">${order.orderStatus}</span></div></div></div>
    <hr class="div"/>
    <div class="mg"><div class="mb"><label>Billed To</label><p>${user?.name || 'Customer'}<br/>${user?.phone || user?.email || ''}</p></div>
    <div class="mb" style="text-align:right;"><label>Payment Status</label><p>${order.paymentStatus}</p></div></div>
    <table><thead><tr><th style="width:55%;">Item</th><th style="width:12%;">Qty</th><th style="width:16%;">Unit Price</th><th style="width:17%;">Total</th></tr></thead>
    <tbody>${itemRows}</tbody></table>
    <div class="tot"><div class="tr"><span>Subtotal</span><span>&#8377;${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
    ${shipping > 0 ? `<div class="tr"><span>Shipping</span><span>&#8377;${shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : '<div class="tr"><span>Shipping</span><span style="color:#059669;">FREE</span></div>'}
    <div class="tr gr"><span>Total Amount</span><span>&#8377;${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div></div>
    <div class="fn"><div><p>Computer-generated invoice.</p><p>No signature required.</p></div><div class="ty">Thank you for shopping! ??</div></div>
    </div><script>window.onload=()=>{window.print();};<\/script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const fetchOrders = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      setLoading(true);
      const res: any = await api.get('/orders');
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancelling(true); setCancelError('');
    try {
      await api.post(`/orders/${cancelModalOrder.id}/cancel`, { reason: cancelReason || 'Customer requested cancellation' });
      setCancelModalOrder(null); setCancelReason(''); fetchOrders();
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Failed to cancel order');
    } finally { setCancelling(false); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    setReviewSubmitting(true); setReviewError('');
    try {
      await api.post(`/products/${reviewOrder.productId}/reviews`, { orderId: reviewOrder.orderId, rating: reviewRating, title: reviewTitle, comment: reviewComment });
      setReviewSuccess('Review submitted! Thank you.');
      setReviewTitle(''); setReviewComment(''); setReviewRating(5);
      setTimeout(() => { setReviewOrder(null); setReviewSuccess(''); }, 2000);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally { setReviewSubmitting(false); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
      PENDING:          { label: 'Pending',          color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
      PAYMENT_PENDING:  { label: 'Payment Pending',  color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
      CONFIRMED:        { label: 'Confirmed',         color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
      PROCESSING:       { label: 'Processing',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
      PACKED:           { label: 'Packed',            color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
      SHIPPED:          { label: 'Shipped',           color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
      DELIVERED:        { label: 'Delivered',         color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
      CANCELLED:        { label: 'Cancelled',         color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
    };
    const cfg = map[status] || { label: status, color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb' };
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'999px', fontSize:'11px', fontWeight:700, letterSpacing:'0.04em', color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
        {cfg.label}
      </span>
    );
  };

  const STEPS = [
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'PACKED',    label: 'Packed' },
    { key: 'SHIPPED',   label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];
  const getStepIndex = (status: string) => {
    if (['PENDING','PAYMENT_PENDING','PROCESSING'].includes(status)) return 0;
    if (status === 'OUT_FOR_DELIVERY') return 2;
    return STEPS.findIndex(s => s.key === status);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'2rem' }}>
        <div style={{ width:'5rem', height:'5rem', borderRadius:'1.5rem', background:'linear-gradient(135deg,#eef2ff,#f5f3ff)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem', boxShadow:'0 8px 24px rgba(79,70,229,0.12)' }}>
          <Package size={36} color="#4f46e5" />
        </div>
        <h2 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'0.75rem' }}>Track Your Orders</h2>
        <p style={{ color:'var(--text-muted)', maxWidth:'380px', marginBottom:'2rem', lineHeight:1.7 }}>
          Login with your phone or email to view past orders, real-time tracking, and leave verified reviews.
        </p>
        <button onClick={openLoginModal} className="btn-primary" style={{ padding:'0.75rem 2rem', fontSize:'1rem' }}>
          Login with OTP
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2.5rem 1.5rem' }}>
        {[1,2].map(n => (
          <div key={n} className="glass-panel" style={{ borderRadius:'1.25rem', padding:'1.75rem', marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <div style={{ height:'20px', width:'180px', background:'#e2e8f0', borderRadius:'6px' }} />
              <div style={{ height:'20px', width:'80px', background:'#e2e8f0', borderRadius:'6px' }} />
            </div>
            <div style={{ height:'14px', width:'60%', background:'#f1f5f9', borderRadius:'4px', marginBottom:'1rem' }} />
            <div style={{ height:'80px', background:'#f8fafc', borderRadius:'12px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', padding:'2.5rem 1.5rem 5rem' }}>

      {/* Page Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:'0.3rem' }}>My Orders</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Track shipments, manage orders and download invoices</p>
        </div>
        <Link to="/catalog" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'var(--primary-600)', fontWeight:600, fontSize:'0.875rem', padding:'0.5rem 1rem', borderRadius:'0.5rem', background:'var(--primary-50)', border:'1px solid var(--primary-100)' }}>
          <ShoppingBag size={15} /> Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius:'1.5rem', padding:'4rem 2rem', textAlign:'center', border:'2px dashed var(--border-color)' }}>
          <div style={{ width:'5rem', height:'5rem', borderRadius:'1.25rem', background:'linear-gradient(135deg,#eef2ff,#f5f3ff)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}>
            <Package size={36} color="#4f46e5" />
          </div>
          <h3 style={{ fontSize:'1.35rem', fontWeight:800, marginBottom:'0.5rem' }}>No Orders Yet</h3>
          <p style={{ color:'var(--text-muted)', maxWidth:'340px', margin:'0 auto 1.75rem', lineHeight:1.7, fontSize:'0.9rem' }}>
            You haven't placed any orders yet. Browse our catalog and discover quality products!
          </p>
          <Link to="/catalog" className="btn-primary">Explore Catalog</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.orderStatus);
            const isCancelled = order.orderStatus === 'CANCELLED';
            const canCancel = ['PENDING','CONFIRMED'].includes(order.orderStatus);

            return (
              <div key={order.id} className="glass-panel" style={{ borderRadius:'1.25rem', border:'1px solid var(--border-color)', overflow:'hidden', boxShadow:'0 4px 24px rgba(79,70,229,0.06)', transition:'box-shadow 0.2s' }}>

                {/* Card Header */}
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', padding:'1.25rem 1.5rem', background:'linear-gradient(135deg,#f8f9ff,#fff)', borderBottom:'1px solid var(--border-color)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1rem', color:'var(--primary-600)', background:'var(--primary-50)', padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--primary-100)' }}>
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'block' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })} &bull; {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                    </span>
                    <span style={{ fontSize:'1.35rem', fontWeight:900, color:'var(--primary-600)' }}>
                      ?{Number(order.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Stepper */}
                {!isCancelled && (
                  <div style={{ padding:'1.5rem 2rem 1.25rem', borderBottom:'1px solid var(--border-color)', background:'#fafbff' }}>
                    <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', textAlign:'center' }}>
                      {/* Track line */}
                      <div style={{ position:'absolute', top:'14px', left:'12.5%', right:'12.5%', height:'3px', background:'#e2e8f0', borderRadius:'9999px', zIndex:0 }}>
                        <div style={{ height:'100%', borderRadius:'9999px', background:'linear-gradient(90deg,#4f46e5,#7c3aed)', width:`${Math.max(0, Math.min(100, (stepIdx / (STEPS.length - 1)) * 100))}%`, transition:'width 0.6s ease' }} />
                      </div>
                      {STEPS.map((step, idx) => {
                        const done = stepIdx >= idx;
                        const current = stepIdx === idx;
                        return (
                          <div key={step.key} style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:1 }}>
                            <div style={{ width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, marginBottom:'6px', background:done ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#fff', color:done ? '#fff' : '#cbd5e1', border:done ? 'none' : '2px solid #e2e8f0', boxShadow:current ? '0 0 0 4px rgba(79,70,229,0.15)' : done ? '0 4px 12px rgba(79,70,229,0.3)' : 'none', transition:'all 0.3s' }}>
                              {done ? <CheckCircle2 size={15} /> : idx + 1}
                            </div>
                            <span style={{ fontSize:'11px', fontWeight:600, color:done ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancelled Banner */}
                {isCancelled && (
                  <div style={{ padding:'0.85rem 1.5rem', background:'#fef2f2', borderBottom:'1px solid #fecaca', display:'flex', alignItems:'center', gap:'0.6rem', color:'#991b1b', fontSize:'0.875rem', fontWeight:600 }}>
                    <XCircle size={16} /> This order has been cancelled.
                  </div>
                )}

                {/* Delivery Info */}
                {order.delivery && (
                  <div style={{ padding:'0.85rem 1.5rem', background:'#f0f9ff', borderBottom:'1px solid #bae6fd', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'0.75rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <Truck size={17} color="#0369a1" />
                      <div>
                        <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#0369a1' }}>{order.delivery.deliveryPartner?.name || 'Courier Partner'}</span>
                        {order.delivery.trackingNumber && (
                          <p style={{ fontSize:'12px', color:'#0369a1', marginTop:'1px' }}>Tracking: <strong style={{ fontFamily:'monospace' }}>{order.delivery.trackingNumber}</strong></p>
                        )}
                      </div>
                    </div>
                    {order.delivery.deliveryPartner?.trackingUrlTemplate && order.delivery.trackingNumber && (
                      <a href={order.delivery.deliveryPartner.trackingUrlTemplate.replace('{tracking_number}', order.delivery.trackingNumber)} target="_blank" rel="noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:600, color:'#0369a1', padding:'5px 12px', borderRadius:'6px', background:'#fff', border:'1px solid #bae6fd' }}>
                        Track Shipment <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* Items */}
                <div style={{ padding:'0 1.5rem' }}>
                  {order.items?.map((item, idx) => (
                    <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', padding:'1rem 0', borderBottom:idx < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.9rem', flex:1, minWidth:0 }}>
                        {item.snapshot?.image ? (
                          <img src={item.snapshot.image} alt={item.snapshot.name} style={{ width:'56px', height:'56px', objectFit:'cover', borderRadius:'10px', border:'1px solid var(--border-color)', flexShrink:0 }} />
                        ) : (
                          <div style={{ width:'56px', height:'56px', borderRadius:'10px', background:'var(--bg-card-hover)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border-color)', flexShrink:0 }}>
                            <Package size={22} color="var(--text-muted)" />
                          </div>
                        )}
                        <div style={{ minWidth:0 }}>
                          <h4 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'2px' }}>{item.snapshot?.name || 'Product'}</h4>
                          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                            {[item.snapshot?.brand, item.snapshot?.sku && `SKU: ${item.snapshot.sku}`].filter(Boolean).join(' • ')}
                          </p>
                          <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Qty: {item.quantity} × ?{Number(item.unitPrice).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexShrink:0 }}>
                        <span style={{ fontWeight:800, fontSize:'0.95rem', color:'var(--primary-600)' }}>?{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                        {order.orderStatus === 'DELIVERED' && (
                          <button onClick={() => setReviewOrder({ orderId:order.id, productId:(item as any).productId, productName:item.snapshot?.name || 'Product' })}
                            style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:600, color:'#d97706', padding:'5px 10px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'6px', cursor:'pointer' }}>
                            <Star size={13} /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div style={{ padding:'1rem 1.5rem', background:'#fafbff', borderTop:'1px solid var(--border-color)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:'0.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'var(--text-muted)' }}>
                    <CreditCard size={14} color="var(--text-muted)" />
                    Payment: <strong style={{ color:'var(--text-main)', marginLeft:'2px' }}>{order.paymentStatus}</strong>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                    <button onClick={() => handleDownloadInvoice(order)}
                      style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:700, padding:'6px 14px', borderRadius:'7px', cursor:'pointer', background:'linear-gradient(135deg,#eef2ff,#f5f3ff)', color:'var(--primary-600)', border:'1px solid var(--primary-100)', transition:'all 0.15s' }}>
                      <Download size={13} /> Invoice
                    </button>
                    {canCancel && (
                      <button onClick={() => setCancelModalOrder(order)}
                        style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:600, cursor:'pointer', padding:'6px 14px', borderRadius:'7px', color:'var(--danger)', background:'#fef2f2', border:'1px solid #fecaca', transition:'all 0.15s' }}>
                        <XCircle size={13} /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOrder && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)' }}>
          <div className="glass-panel" style={{ maxWidth:'460px', width:'100%', borderRadius:'1.25rem', padding:'2rem', border:'1px solid var(--border-color)', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'ordFadeIn 0.2s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={22} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontWeight:800, fontSize:'1.1rem' }}>Cancel Order?</h3>
                <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>#{cancelModalOrder.orderNumber}</p>
              </div>
            </div>
            <p style={{ fontSize:'0.875rem', color:'var(--text-muted)', marginBottom:'1.25rem', lineHeight:1.6 }}>
              Are you sure? Allocated stock will be immediately released back to inventory.
            </p>
            {cancelError && (
              <div style={{ marginBottom:'1rem', padding:'0.75rem 1rem', borderRadius:'0.6rem', background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', fontSize:'0.85rem' }}>
                {cancelError}
              </div>
            )}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Reason (optional)</label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="E.g. Ordered by mistake..." className="input-field" rows={3} style={{ resize:'none' }} />
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setCancelModalOrder(null); setCancelError(''); }}>Keep Order</button>
              <button onClick={handleCancelOrder} disabled={cancelling} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'0.6rem 1.25rem', borderRadius:'0.5rem', background:'#ef4444', color:'#fff', fontWeight:700, fontSize:'0.875rem', border:'none', cursor:cancelling ? 'not-allowed' : 'pointer', opacity:cancelling ? 0.7 : 1 }}>
                {cancelling ? 'Cancelling...' : <><XCircle size={14} /> Confirm Cancel</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)' }}>
          <div className="glass-panel" style={{ maxWidth:'480px', width:'100%', borderRadius:'1.25rem', padding:'2rem', border:'1px solid var(--border-color)', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'ordFadeIn 0.2s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Star size={22} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontWeight:800, fontSize:'1.1rem' }}>Write a Review</h3>
                <p style={{ fontSize:'0.78rem', color:'#d97706', fontWeight:600 }}>{reviewOrder.productName}</p>
              </div>
            </div>
            {reviewSuccess && <div style={{ padding:'0.75rem 1rem', borderRadius:'0.6rem', background:'#ecfdf5', border:'1px solid #a7f3d0', color:'#065f46', fontSize:'0.875rem', marginBottom:'1rem' }}>? {reviewSuccess}</div>}
            {reviewError && <div style={{ padding:'0.75rem 1rem', borderRadius:'0.6rem', background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', fontSize:'0.875rem', marginBottom:'1rem' }}>{reviewError}</div>}
            <form onSubmit={handleReviewSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Rating</label>
                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} style={{ fontSize:'1.75rem', background:'none', border:'none', cursor:'pointer', color:star <= reviewRating ? '#f59e0b' : '#e2e8f0', lineHeight:1 }}>?</button>
                  ))}
                  <span style={{ marginLeft:'8px', fontSize:'13px', fontWeight:700, color:'#d97706' }}>{reviewRating}/5</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Review Title</label>
                <input type="text" required className="input-field" placeholder="E.g. Great quality!" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Detailed Feedback</label>
                <textarea required rows={4} className="input-field" placeholder="What did you like or dislike?" value={reviewComment} onChange={e => setReviewComment(e.target.value)} style={{ resize:'none' }} />
              </div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setReviewOrder(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ordFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};
