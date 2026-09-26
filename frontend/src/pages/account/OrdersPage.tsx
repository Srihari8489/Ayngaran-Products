import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Package, Truck, CheckCircle2, Clock, XCircle, ShoppingBag,
  MapPin, Phone, FileText, RefreshCw, Copy, Check, Search, Calendar,
  ShieldCheck, AlertCircle, ChevronRight, X, Eye, ExternalLink
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CustomerOrderInvoiceModal } from '../../components/CustomerOrderInvoiceModal';
import { resolveGstStateCode, getSupplyType } from '../../utils/gst.util';

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxableValue?: number;
  gstRate?: number;
  gstAmount?: number;
  supplyType?: 'INTRA_STATE' | 'INTER_STATE';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  snapshot: {
    name?: string;
    brand?: string;
    sku?: string;
    image?: string;
    variantLabel?: string;
    weight?: number;
    taxableValue?: number;
    gstRate?: number;
    gstAmount?: number;
    supplyType?: 'INTRA_STATE' | 'INTER_STATE';
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
  };
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  subtotal?: number;
  shippingFee?: number;
  taxableAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  supplyType?: 'INTRA_STATE' | 'INTER_STATE';
  sellerStateCode?: string;
  customerStateCode?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  items: OrderItem[];
  itemCount?: number;
  shippingAddress?: any;
  delivery?: { trackingNumber?: string; deliveryPartner?: { name: string; trackingUrlTemplate?: string } };
  shippingZone?: string;
  totalWeightGrams?: number;
  billableWeightGrams?: number;
  billableUnits?: number;
  shippingRate?: number;
  estimatedDelivery?: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
}

const STATUS_STEPS = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING:          { label: 'Pending',         color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  PAYMENT_PENDING:  { label: 'Pmt. Pending',    color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  CONFIRMED:        { label: 'Confirmed',       color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  PROCESSING:       { label: 'Processing',      color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  PACKED:           { label: 'Packed',          color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
  SHIPPED:          { label: 'Shipped',         color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  DELIVERED:        { label: 'Delivered',       color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  CANCELLED:        { label: 'Cancelled',       color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
};

const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getStepIndex = (status: string) => {
  if (status === 'PROCESSING') return 0;
  return STATUS_STEPS.indexOf(status);
};

export const OrdersPage: React.FC = () => {
  const { isAuthenticated, openLoginModal, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshOrders = async (showLoader = false, showSpinner = false) => {
    try {
      if (showLoader) setLoading(true);
      if (showSpinner) setRefreshing(true);
      const res: any = await api.get('/orders');
      setOrders(Array.isArray(res) ? res : []);
    } catch {
      /* silently fail on background polls */
    } finally {
      if (showLoader) setLoading(false);
      if (showSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    refreshOrders(true);
    // Poll every 30 seconds for live order status updates
    pollIntervalRef.current = setInterval(() => refreshOrders(false), 30000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isAuthenticated]);

  const handleManualRefresh = () => refreshOrders(false, true);

  const handleCopyOrderNumber = (e: React.MouseEvent, num: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(num);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  const handleCancel = async (orderId: number) => {
    if (!cancelReason.trim()) {
      alert('Please enter a reason for cancellation');
      return;
    }
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason });
      await refreshOrders(false);
      setCancellingId(null);
      setCancelReason('');
      if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
        setSelectedDetailOrder(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot cancel this order');
    }
  };

  const handleOpenInvoice = async (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
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

  const handleOpenDetail = async (order: Order) => {
    setSelectedDetailOrder(order);
    try {
      const detail: any = await api.get(`/orders/${order.id}`);
      if (detail && detail.id === order.id) {
        setSelectedDetailOrder(detail);
      }
    } catch (err) {
      console.error('Failed to fetch full order details for popup:', err);
    }
  };

  // Filtered orders based on selected tab and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'ACTIVE') {
        if (['DELIVERED', 'CANCELLED'].includes(order.orderStatus)) return false;
      } else if (activeTab === 'DELIVERED') {
        if (order.orderStatus !== 'DELIVERED') return false;
      } else if (activeTab === 'CANCELLED') {
        if (order.orderStatus !== 'CANCELLED') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(query);
        const matchesItem = (order.items || []).some((it) =>
          (it.snapshot?.name || '').toLowerCase().includes(query)
        );
        if (!matchesNumber && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.orderStatus)).length,
      delivered: orders.filter((o) => o.orderStatus === 'DELIVERED').length,
      cancelled: orders.filter((o) => o.orderStatus === 'CANCELLED').length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
        <p style={{ fontWeight: 700, margin: 0 }}>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#ffffff', borderRadius: '1.25rem', border: '1.5px dashed #cbd5e1' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShoppingBag size={30} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No orders placed yet</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
          Explore our premium herbal podis, wellness health mixes, and pure cold-pressed products today!
        </p>
        <a
          href="/catalog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
            color: '#fff',
            padding: '0.75rem 1.6rem',
            borderRadius: '0.625rem',
            fontWeight: 800,
            fontSize: '0.9rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
          }}
        >
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Top Header & Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            My Orders
            <span style={{ background: '#1a3d2b', color: '#fff', fontSize: '13px', padding: '2px 10px', borderRadius: '999px', fontWeight: 800 }}>
              {orders.length}
            </span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px', margin: 0 }}>
            Click any order card to view full tracking, GST tax breakdown, and shipping details.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '0.55rem 1.15rem',
            borderRadius: '0.625rem',
            background: refreshing ? '#f1f5f9' : '#ecfdf5',
            border: '1.5px solid #a7f3d0',
            color: '#065f46',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
          }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Updating...' : 'Refresh Status'}
        </button>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>

      {/* ── Controls Bar: Tabs & Search ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Orders', count: counts.all },
            { key: 'ACTIVE', label: 'In Progress', count: counts.active },
            { key: 'DELIVERED', label: 'Delivered', count: counts.delivered },
            { key: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive ? '#1a3d2b' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  boxShadow: isActive ? '0 2px 8px rgba(26,61,43,0.18)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: isActive ? '#ffffff' : '#475569',
                    fontWeight: 800,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 auto', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by Order # or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: '0.5rem',
              border: '1.5px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#fff',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* ── Basic Orders List: Clean, Clickable Cards ── */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <Package size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 700, margin: 0 }}>No orders match your filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOrders.map((order) => {
            const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
            const isDelivered = order.orderStatus === 'DELIVERED';
            const isCancelled = order.orderStatus === 'CANCELLED';

            // Items info
            const items = order.items || [];
            const primaryItem = items[0];
            const extraItemsCount = items.length - 1;
            const primarySnap = primaryItem?.snapshot || {};
            const primaryImg = primarySnap.image || (primaryItem as any)?.image;

            const finalTotal = Math.round(Number(order.totalAmount || 0));

            return (
              <div
                key={order.id}
                onClick={() => handleOpenDetail(order)}
                style={{
                  borderRadius: '1rem',
                  border: `1.5px solid ${isDelivered ? '#bbf7d0' : isCancelled ? '#fecaca' : '#e2e8f0'}`,
                  background: '#ffffff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  padding: '1.15rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a3d2b';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,61,43,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDelivered ? '#bbf7d0' : isCancelled ? '#fecaca' : '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* ── CARD TOP ROW: Order ID, Placed Date, Status Badge, Payment Badge ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          fontFamily: 'monospace',
                          letterSpacing: '0.02em',
                        }}
                      >
                        #{order.orderNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                        title="Copy Order ID"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedOrderNumber === order.orderNumber ? '#16a34a' : '#94a3b8',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {copiedOrderNumber === order.orderNumber ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Order Status Badge */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: st.bg,
                        color: st.color,
                        border: `1.5px solid ${st.border}`,
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }} />
                      {st.label}
                    </span>

                    {/* Payment Status Badge */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7',
                        color: order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                        border: order.paymentStatus === 'PAID' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                      }}
                    >
                      {order.paymentStatus === 'PAID' ? '✓ PAID' : 'Cash On Delivery'}
                    </span>
                  </div>

                  {/* Placed Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#64748b' }}>
                    <Calendar size={13} />
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* ── CARD MIDDLE: Product Image(s), Product Title & Delivery Timeline ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Primary Product Image Thumbnail */}
                    <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {primaryImg ? (
                        <img src={primaryImg} alt={primarySnap.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={24} color="#94a3b8" />
                      )}
                    </div>

                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                        {primarySnap.name || 'Ordered Product'}
                        {extraItemsCount > 0 && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginLeft: '6px' }}>
                            +{extraItemsCount} more item{extraItemsCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                        {primarySnap.variantLabel ? `Variant: ${primarySnap.variantLabel}` : `Qty: ${primaryItem?.quantity || 1}`}
                        <span style={{ margin: '0 6px' }}>•</span>
                        Total Items: <strong>{items.reduce((s, it) => s + (it.quantity || 1), 0)}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Delivery Timeline / Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                    {isDelivered ? (
                      <span style={{ color: '#15803d', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={16} /> Delivered
                      </span>
                    ) : isCancelled ? (
                      <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <XCircle size={16} /> Cancelled
                      </span>
                    ) : (
                      <span style={{ color: '#0369a1', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Truck size={16} />
                        Est. Delivery: <strong>{order.estimatedDelivery || 'Within 2 days'}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* ── CARD BOTTOM ROW: Price & Actions ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Paid:</span>
                    <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a3d2b' }}>
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenInvoice(e, order)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.5rem',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ecfdf5';
                        e.currentTarget.style.borderColor = '#a7f3d0';
                        e.currentTarget.style.color = '#065f46';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#475569';
                      }}
                    >
                      <FileText size={13} /> Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(order)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.45rem 0.95rem',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(26,61,43,0.18)',
                      }}
                    >
                      <span>View Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FULL ORDER DETAILS POPUP MODAL (Scrollable, Complete Data)
          ════════════════════════════════════════════════════════════ */}
      {selectedDetailOrder && (() => {
        const order = selectedDetailOrder;
        const st = STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
        const stepIdx = getStepIndex(order.orderStatus);
        const isCancelled = order.orderStatus === 'CANCELLED';
        const isDelivered = order.orderStatus === 'DELIVERED';
        const canCancel = ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.orderStatus);

        // Jurisdiction & GST
        const customerState = order.shippingAddress?.state || order.shippingAddress?.stateCode;
        const effectiveSupplyType = order.supplyType || getSupplyType(customerState);
        const isIntraState = effectiveSupplyType === 'INTRA_STATE';

        // Calculation of weights & billable slabs: Math.max(1, Math.ceil(totalWeightGrams / 1000))
        const baseWeight = 1000;
        let calculatedWeight = 0;

        (order.items || []).forEach((item) => {
          const snap = item.snapshot || {};
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

          const qty = Math.max(1, item.quantity || 1);
          calculatedWeight += itemUnitWeight * qty;
        });

        const totalWeightGrams = Number(order.totalWeightGrams && order.totalWeightGrams > 0 ? order.totalWeightGrams : (calculatedWeight > 0 ? calculatedWeight : 1000));
        const billableUnits = Math.max(1, Math.ceil(totalWeightGrams / baseWeight));
        const shippingRate = Number(order.shippingRate || (isIntraState ? 60 : 120));
        const shippingFee = Number(order.shippingFee !== undefined && order.shippingFee !== null ? order.shippingFee : billableUnits * shippingRate);

        const subtotal = Number(order.subtotal || 0);
        const taxAmount = Number(order.taxAmount || 0);
        const taxableAmount = order.taxableAmount !== undefined ? Number(order.taxableAmount) : Math.max(0, subtotal - taxAmount);
        const cgstAmount = isIntraState ? (order.cgstAmount !== undefined ? Number(order.cgstAmount) : Math.round((taxAmount / 2) * 100) / 100) : 0;
        const sgstAmount = isIntraState ? (order.sgstAmount !== undefined ? Number(order.sgstAmount) : Math.round((taxAmount - cgstAmount) * 100) / 100) : 0;
        const igstAmount = !isIntraState ? (order.igstAmount !== undefined ? Number(order.igstAmount) : taxAmount) : 0;

        const finalTotal = Math.round(Number(order.totalAmount || (subtotal + shippingFee)));
        const rawTotal = subtotal + shippingFee;
        const roundOff = Math.round((finalTotal - rawTotal) * 100) / 100;

        const isTN = order.shippingZone === 'TAMIL_NADU' || isIntraState;
        const zoneLabel = isTN ? 'Tamil Nadu (Intrastate Zone)' : 'Outside Tamil Nadu (Interstate Zone)';
        const estDelivery = order.estimatedDelivery || (isTN ? 'Within 2 days' : '3-5 days');
        const courier = order.courierName || order.delivery?.deliveryPartner?.name || null;
        const tracking = order.trackingNumber || order.delivery?.trackingNumber || null;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            onClick={() => setSelectedDetailOrder(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1.25rem',
                width: '100%',
                maxWidth: '860px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── STICKY POPUP HEADER ── */}
              <div
                style={{
                  padding: '1.2rem 1.5rem',
                  background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
                  borderBottom: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', fontFamily: 'monospace' }}>
                      #{order.orderNumber}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                      title="Copy Order ID"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedOrderNumber === order.orderNumber ? '#16a34a' : '#94a3b8', padding: '2px' }}
                    >
                      {copiedOrderNumber === order.orderNumber ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 11px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: st.bg,
                      color: st.color,
                      border: `1.5px solid ${st.border}`,
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }} />
                    {st.label}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 9px',
                      borderRadius: '6px',
                      background: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7',
                      color: order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                      border: order.paymentStatus === 'PAID' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                    }}
                  >
                    {order.paymentStatus === 'PAID' ? '✓ PAID' : 'Cash On Delivery'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={(e) => handleOpenInvoice(e, order)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.5rem',
                      background: '#1a3d2b',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={13} /> Tax Invoice
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailOrder(null)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#475569',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#cbd5e1';
                      e.currentTarget.style.color = '#0f172a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e2e8f0';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── SCROLLABLE MODAL BODY ── */}
              <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1. ORDER LIFECYCLE TRACKER */}
                {!isCancelled ? (
                  <div style={{ padding: '1.1rem 1.25rem', background: '#fafbfc', borderRadius: '0.875rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      {/* Connecting Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '14px',
                          left: '20px',
                          right: '20px',
                          height: '3px',
                          background: '#e2e8f0',
                          zIndex: 0,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '14px',
                          left: '20px',
                          width: `${Math.max(0, Math.min(100, (stepIdx / (STATUS_STEPS.length - 1)) * 100))}%`,
                          height: '3px',
                          background: '#15803d',
                          zIndex: 0,
                          transition: 'width 0.4s ease',
                        }}
                      />

                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = stepIdx >= idx;
                        const isCurrent = stepIdx === idx;
                        return (
                          <div
                            key={step}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              position: 'relative',
                              zIndex: 1,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: isDone ? '#1a3d2b' : '#ffffff',
                                color: isDone ? '#ffffff' : '#94a3b8',
                                border: `2px solid ${isDone ? '#1a3d2b' : '#cbd5e1'}`,
                                boxShadow: isCurrent ? '0 0 0 4px #bbf7d0' : 'none',
                                transition: 'all 0.2s',
                              }}
                            >
                              {isDone ? <Check size={14} /> : idx + 1}
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: isCurrent ? 800 : 600,
                                color: isDone ? '#1a3d2b' : '#94a3b8',
                                marginTop: '6px',
                                textAlign: 'center',
                                textTransform: 'capitalize',
                              }}
                            >
                              {step.toLowerCase().replace(/_/g, ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '0.85rem', fontWeight: 700 }}>
                    <AlertCircle size={16} />
                    <span>This order has been cancelled. If any payment was captured, refund will be processed to the original payment source.</span>
                  </div>
                )}

                {/* 2. ORDERED ITEMS SPECIFICATIONS */}
                <div style={{ background: '#ffffff', borderRadius: '0.875rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                    Ordered Items &amp; Variant Specifications:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(order.items || []).map((item) => {
                      const snap = item.snapshot || {};
                      const img = snap.image || (item as any).image;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            borderRadius: '0.625rem',
                            border: '1px solid #f1f5f9',
                            background: '#f8fafc',
                            gap: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '54px', height: '54px', borderRadius: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {img ? (
                                <img src={img} alt={snap.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Package size={22} color="#94a3b8" />
                              )}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                                {snap.name || 'Item'}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '3px' }}>
                                {snap.variantLabel && (
                                  <span style={{ fontSize: '11px', padding: '1px 6px', background: '#e2e8f0', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
                                    {snap.variantLabel}
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  Qty: <strong>{item.quantity}</strong> × ₹{Number(item.unitPrice).toFixed(2)}
                                </span>
                                {(item.gstRate !== undefined && item.gstRate !== null) && (
                                  <span style={{ fontSize: '10.5px', padding: '1px 5px', background: '#e0f2fe', color: '#0369a1', borderRadius: '3px', fontWeight: 700 }}>
                                    GST {item.gstRate}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontWeight: 900, color: '#1a3d2b', fontSize: '0.95rem' }}>
                            ₹{Number(item.totalPrice).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. TWO COLUMNS: Delivery Address & Dynamic Shipping Calculation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {/* Delivery Address Box */}
                  <div style={{ background: '#f8fafc', borderRadius: '0.875rem', border: '1px solid #e2e8f0', padding: '1.15rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="#059669" /> Delivery Destination Address
                    </div>
                    {order.shippingAddress ? (
                      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                        <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#0f172a' }}>
                          {order.shippingAddress.recipientName || order.shippingAddress.fullName || order.shippingAddress.name || 'Recipient'}
                        </p>
                        <p style={{ margin: '0 0 2px' }}>
                          {order.shippingAddress.addressLine1 || order.shippingAddress.address || ''}
                          {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                        </p>
                        <p style={{ margin: '0 0 2px' }}>
                          {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''} - {order.shippingAddress.pincode || order.shippingAddress.postalCode || ''}
                        </p>
                        {order.shippingAddress.phone && (
                          <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 700 }}>
                            <Phone size={11} /> {order.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Shipping address on file.</p>
                    )}
                  </div>

                  {/* Shipping & Delivery Calculation Box */}
                  <div style={{ background: '#f0fdf4', borderRadius: '0.875rem', border: '1px solid #bbf7d0', padding: '1.15rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', letterSpacing: '0.05em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Truck size={14} color="#166534" /> Shipping &amp; Delivery Calculation
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Shipping Zone:</span>
                        <strong style={{ color: '#166534' }}>{zoneLabel}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Total Weight:</span>
                        <strong>{(totalWeightGrams / 1000).toFixed(2)} KG ({totalWeightGrams}g)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Billable Slabs:</span>
                        <strong style={{ color: '#0369a1' }}>
                          {billableUnits} slab{billableUnits > 1 ? 's' : ''} ({billableUnits} × ₹{shippingRate})
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Est. Delivery:</span>
                        <strong>{estDelivery}</strong>
                      </div>
                      {courier && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #bbf7d0', paddingTop: '4px', marginTop: '2px' }}>
                          <span style={{ color: '#64748b' }}>Courier:</span>
                          <strong>{courier} {tracking ? `(#${tracking})` : ''}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. TAX & PRICE BREAKDOWN */}
                <div style={{ background: '#f8fafc', borderRadius: '0.875rem', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Tax &amp; Price Breakdown:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                      <span>Products Subtotal (All Taxes Included):</span>
                      <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem' }}>
                      <span>Price Before Tax (Base Value):</span>
                      <span>₹{taxableAmount.toFixed(2)}</span>
                    </div>

                    {isIntraState ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                          <span>Central Govt Tax (CGST):</span>
                          <span>₹{cgstAmount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                          <span>State Govt Tax (SGST):</span>
                          <span>₹{sgstAmount.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontSize: '0.78rem' }}>
                        <span>Integrated Interstate Tax (IGST):</span>
                        <span>₹{igstAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '4px', marginTop: '2px' }}>
                      <span>Delivery Charges ({billableUnits} KG slab{billableUnits > 1 ? 's' : ''}):</span>
                      <span style={{ fontWeight: 800, color: shippingFee === 0 ? '#15803d' : '#0f172a' }}>
                        {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                      </span>
                    </div>

                    {roundOff !== 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem' }}>
                        <span>Round Off:</span>
                        <span>{roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '8px', marginTop: '4px', fontSize: '1.05rem', fontWeight: 900, color: '#1a3d2b' }}>
                      <span>Total Amount Paid:</span>
                      <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 5. CANCELLATION FORM IF REQUESTED */}
                {cancellingId === order.id && (
                  <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fecaca' }}>
                    <p style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.88rem', margin: '0 0 0.5rem' }}>
                      Cancel Order #{order.orderNumber}
                    </p>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please provide reason for cancellation..."
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '0.5rem',
                        border: '1.5px solid #fca5a5',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#fff',
                        marginBottom: '0.65rem',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleCancel(order.id)}
                        style={{ padding: '0.55rem 1.15rem', borderRadius: '0.5rem', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Confirm Cancellation
                      </button>
                      <button
                        onClick={() => {
                          setCancellingId(null);
                          setCancelReason('');
                        }}
                        style={{ padding: '0.55rem 1rem', borderRadius: '0.5rem', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── STICKY MODAL FOOTER ── */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {canCancel && cancellingId !== order.id && (
                    <button
                      onClick={() => setCancellingId(order.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0.55rem 1rem',
                        borderRadius: '0.5rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <XCircle size={14} /> Cancel Order
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailOrder(null)}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: '0.5rem',
                      background: '#ffffff',
                      color: '#475569',
                      border: '1.5px solid #cbd5e1',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Customer Tax Invoice Modal ── */}
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
