import React, { useEffect, useState } from 'react';
import {
  Package, Truck, CheckCircle2, Clock, XCircle, ShoppingBag,
  Download, MapPin, Star, ChevronDown, ChevronUp, Phone, FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CustomerOrderInvoiceModal } from '../../components/CustomerOrderInvoiceModal';

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate?: number;
  gstAmount?: number;
  snapshot: {
    name?: string;
    brand?: string;
    sku?: string;
    image?: string;
    variantLabel?: string;
    gstRate?: number;
    gstAmount?: number;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  subtotal?: number;
  shippingFee?: number;
  taxAmount?: number;
  orderStatus: string;
  paymentStatus: string;
  items: OrderItem[];
  itemCount?: number;
  shippingAddress?: any;
  delivery?: { trackingNumber?: string; deliveryPartner?: { name: string; trackingUrlTemplate?: string } };
  createdAt: string;
}

const STATUS_STEPS = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:          { label: 'Pending',        color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  PAYMENT_PENDING:  { label: 'Pmt. Pending',   color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  CONFIRMED:        { label: 'Confirmed',       color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  PROCESSING:       { label: 'Processing',      color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  PACKED:           { label: 'Packed',          color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  SHIPPED:          { label: 'Shipped',         color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  DELIVERED:        { label: 'Delivered',       color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  CANCELLED:        { label: 'Cancelled',       color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
};

const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const getStepIndex = (status: string) => STATUS_STEPS.indexOf(status);

export const OrdersPage: React.FC = () => {
  const { isAuthenticated, openLoginModal, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { openLoginModal(); return; }
    (async () => {
      try {
        setLoading(true);
        const res: any = await api.get('/orders');
        setOrders(Array.isArray(res) ? res : []);
      } catch { setOrders([]); } finally { setLoading(false); }
    })();
  }, [isAuthenticated]);

  const handleCancel = async (orderId: number) => {
    if (!cancelReason.trim()) { alert('Please enter a reason for cancellation'); return; }
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason });
      const res: any = await api.get('/orders');
      setOrders(Array.isArray(res) ? res : []);
      setCancellingId(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot cancel this order');
    }
  };

  const handleOpenInvoice = async (order: Order) => {
    setSelectedInvoiceOrder(order);
    try {
      const detail: any = await api.get(`/orders/${order.id}`);
      if (detail && detail.id === order.id) {
        setSelectedInvoiceOrder(detail);
      }
    } catch (err) {
      console.error('Failed to fetch full order details for invoice:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <ShoppingBag size={40} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <ShoppingBag size={48} style={{ margin: '0 auto 1rem', display: 'block', color: '#86efac' }} />
        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>No Orders Yet</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Your order history will appear here once you shop.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1.25rem', padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)', color: '#fff', borderRadius: '0.625rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
          Start Shopping
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
        My Orders
        <span style={{ marginLeft: '10px', background: '#1a3d2b', color: '#fff', fontSize: '12px', padding: '2px 10px', borderRadius: '999px', fontWeight: 700 }}>
          {orders.length}
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map((order) => {
          const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
          const isExpanded = expandedId === order.id;
          const stepIdx = getStepIndex(order.orderStatus);
          const isCancelled = order.orderStatus === 'CANCELLED';
          const isDelivered = order.orderStatus === 'DELIVERED';
          const canCancel = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.orderStatus);
          const firstItem = order.items?.[0]?.snapshot;

          return (
            <div
              key={order.id}
              style={{
                borderRadius: '1rem',
                border: `1.5px solid ${isDelivered ? '#a7f3d0' : isCancelled ? '#fecaca' : '#e2e8f0'}`,
                background: isDelivered ? '#f0fdf4' : isCancelled ? '#fef9f9' : '#fff',
                overflow: 'hidden',
                transition: 'all 0.25s',
                boxShadow: isExpanded ? '0 8px 24px rgba(26,61,43,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* ── Order Card Header ── */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}
              >
                {/* Product thumbnail */}
                <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                  {firstItem?.image ? (
                    <img src={firstItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={20} color="#94a3b8" />
                    </div>
                  )}
                </div>

                {/* Order info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a', fontFamily: 'monospace' }}>
                      #{order.orderNumber}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {order.itemCount || order.items?.length || 0} item(s)
                  </p>
                  {firstItem?.name && (
                    <p style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                      {firstItem.name}{(order.itemCount || order.items?.length || 0) > 1 ? ` +${(order.itemCount || order.items?.length || 0) - 1} more` : ''}
                    </p>
                  )}
                </div>

                {/* Amount + expand */}
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a3d2b' }}>{formatCurrency(order.totalAmount)}</p>
                    <p style={{ fontSize: '0.72rem', color: order.paymentStatus === 'PAID' ? '#065f46' : '#92400e', fontWeight: 700 }}>
                      {order.paymentStatus}
                    </p>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* ── Progress Tracker (only if not cancelled) ── */}
              {!isCancelled && (
                <div style={{ padding: '0 1.25rem 0.85rem', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: '0.75rem' }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const done = stepIdx >= idx;
                      const active = stepIdx === idx;
                      return (
                        <React.Fragment key={step}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: idx < STATUS_STEPS.length - 1 ? undefined : undefined }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '50%',
                              background: done ? '#1a3d2b' : '#f1f5f9',
                              border: active ? '2.5px solid #1a3d2b' : done ? 'none' : '1.5px solid #e2e8f0',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.3s',
                              boxShadow: active ? '0 0 0 3px rgba(26,61,43,0.15)' : 'none',
                            }}>
                              {done && <CheckCircle2 size={12} color="#fff" strokeWidth={3} />}
                            </div>
                            <p style={{ fontSize: '0.6rem', fontWeight: done ? 700 : 500, color: done ? '#1a3d2b' : '#94a3b8', marginTop: '3px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                              {step === 'OUT_FOR_DELIVERY' ? 'Delivery' : step.charAt(0) + step.slice(1).toLowerCase()}
                            </p>
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div style={{ flex: 1, height: '2px', background: stepIdx > idx ? '#1a3d2b' : '#e2e8f0', margin: '0 3px', marginBottom: '16px', transition: 'all 0.3s' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Expanded Detail ── */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                  {/* Items list */}
                  <div style={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {(order.items || []).map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        {item.snapshot?.image ? (
                          <img src={item.snapshot.image} alt="" style={{ width: '44px', height: '44px', borderRadius: '7px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '7px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={18} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{item.snapshot?.name || 'Product'}</p>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                            {item.snapshot?.brand && <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>{item.snapshot.brand}</span>}
                            {item.snapshot?.variantLabel && <span style={{ background: '#ecfdf5', color: '#065f46', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>{item.snapshot.variantLabel}</span>}
                            {(item.gstRate !== undefined || item.snapshot?.gstRate !== undefined) && (
                              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                GST {item.gstRate ?? item.snapshot?.gstRate}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontWeight: 800, color: '#1a3d2b', fontSize: '0.9rem' }}>{formatCurrency(item.totalPrice)}</p>
                          <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a3d2b' }}>
                        Total: {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {order.shippingAddress && (
                    <div style={{ display: 'flex', gap: '8px', padding: '0.85rem 1rem', background: '#fefce8', borderRadius: '0.75rem', border: '1px solid #fef08a' }}>
                      <MapPin size={16} style={{ color: '#713f12', flexShrink: 0, marginTop: '1px' }} />
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                        <strong>{order.shippingAddress.recipientName}</strong>
                        {order.shippingAddress.phone && <span style={{ marginLeft: '8px', color: '#64748b' }}><Phone size={10} style={{ display: 'inline' }} /> {order.shippingAddress.phone}</span>}
                        <br />
                        {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                      </div>
                    </div>
                  )}

                  {/* Tracking */}
                  {order.delivery?.trackingNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', background: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #bae6fd' }}>
                      <Truck size={15} color="#0369a1" />
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong style={{ color: '#0369a1' }}>{order.delivery.deliveryPartner?.name || 'Courier'}</strong>
                        <span style={{ color: '#64748b', marginLeft: '8px', fontFamily: 'monospace' }}>#{order.delivery.trackingNumber}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenInvoice(order)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 3px 10px rgba(26,61,43,0.2)' }}
                    >
                      <FileText size={14} /> Download Invoice
                    </button>

                    {canCancel && cancellingId !== order.id && (
                      <button
                        onClick={() => setCancellingId(order.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.55rem 1rem', borderRadius: '0.625rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        <XCircle size={14} /> Cancel Order
                      </button>
                    )}
                  </div>

                  {/* Cancel form */}
                  {cancellingId === order.id && (
                    <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                      <p style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.65rem' }}>Cancel Order #{order.orderNumber}</p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.5rem', border: '1.5px solid #fca5a5', fontSize: '0.875rem', outline: 'none', background: '#fff', fontFamily: 'inherit', marginBottom: '0.65rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleCancel(order.id)}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          Confirm Cancel
                        </button>
                        <button
                          onClick={() => { setCancellingId(null); setCancelReason(''); }}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          Keep Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customer Invoice Modal */}
      {selectedInvoiceOrder && (
        <CustomerOrderInvoiceModal
          order={selectedInvoiceOrder}
          user={user}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
