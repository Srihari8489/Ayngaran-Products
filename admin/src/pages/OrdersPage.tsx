import React, { useEffect, useState } from 'react';
import {
  ShoppingBag, Search, Truck, CheckCircle2, Clock, XCircle,
  Package, User as UserIcon, MapPin, CreditCard, Phone, Mail,
  X, RefreshCw, ChevronDown, ChevronUp, Eye, Tag, LayoutGrid, List,
  Calendar, ArrowRight, FileText, Printer, Download
} from 'lucide-react';
import adminApi from '../api/client';
import { Order, DeliveryPartner, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { OrderInvoiceModal } from '../components/OrderInvoiceModal';
import { ShippingLabelModal } from '../components/ShippingLabelModal';
import { resolveGstStateCode, getSupplyType } from '../utils/gst.util';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modals for Invoice & Shipping Label
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [labelOrder, setLabelOrder] = useState<Order | null>(null);

  const handleOpenInvoice = async (order: any) => {
    setInvoiceOrder(order);
    try {
      const detail: any = await adminApi.get(`/orders/admin/${order.id}`);
      if (detail && detail.id === order.id) {
        setInvoiceOrder(detail);
      }
    } catch (err) {
      console.error('Failed to load full order detail for invoice:', err);
    }
  };

  const handleOpenLabel = async (order: any) => {
    setLabelOrder(order);
    try {
      const detail: any = await adminApi.get(`/orders/admin/${order.id}`);
      if (detail && detail.id === order.id) {
        setLabelOrder(detail);
      }
    } catch (err) {
      console.error('Failed to load full order detail for label:', err);
    }
  };

  // Detail panel — fetch full detail separately
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orderUpdating, setOrderUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [deliveryForm, setDeliveryForm] = useState({ courierName: '', trackingNumber: '', notes: '' });

  const fetchDeliveryPartners = async () => {
    try {
      const partnersRes: any = await adminApi.get('/delivery-partners');
      setDeliveryPartners(Array.isArray(partnersRes) ? partnersRes : (partnersRes.data || []));
    } catch (err) {
      console.error('Failed to load delivery partners:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedStatusFilter !== 'ALL') params.append('orderStatus', selectedStatusFilter);
      if (selectedPaymentFilter !== 'ALL') params.append('paymentStatus', selectedPaymentFilter);

      const ordersRes: any = await adminApi.get(`/orders/admin/all?${params.toString()}`);
      const items = ordersRes?.data || ordersRes?.items || (Array.isArray(ordersRes) ? ordersRes : []);
      setOrders(Array.isArray(items) ? items : []);
      if (ordersRes?.pagination) {
        setPagination(ordersRes.pagination);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryPartners();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedStatusFilter, selectedPaymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [page, limit, debouncedSearch, selectedStatusFilter, selectedPaymentFilter]);

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder({ ...order, _loading: true });
    setStatusForm({ status: order.orderStatus, notes: '' });
    const anyOrder = order as any;
    const currentCourier = anyOrder.courierName || anyOrder.deliveryAssignments?.[0]?.courierName || anyOrder.deliveryAssignments?.[0]?.deliveryPartner?.name || '';
    const currentTracking = anyOrder.trackingNumber || anyOrder.deliveryAssignments?.[0]?.trackingNumber || '';
    setDeliveryForm({
      courierName: currentCourier,
      trackingNumber: currentTracking,
      notes: '',
    });
    setDetailLoading(true);
    try {
      const detail: any = await adminApi.get(`/orders/admin/${order.id}`);
      setSelectedOrder({ ...detail, _loading: false });
      setStatusForm({ status: detail.orderStatus, notes: '' });
      const fetchedCourier = detail.courierName || detail.deliveryAssignments?.[0]?.courierName || detail.deliveryAssignments?.[0]?.deliveryPartner?.name || '';
      const fetchedTracking = detail.trackingNumber || detail.deliveryAssignments?.[0]?.trackingNumber || '';
      setDeliveryForm({
        courierName: fetchedCourier,
        trackingNumber: fetchedTracking,
        notes: '',
      });
    } catch (err) {
      console.error('Failed to load order detail:', err);
      setSelectedOrder({ ...order, _loading: false });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const targetId = selectedOrder.id || (selectedOrder as any).data?.id;
    if (!targetId) {
      alert('Invalid order ID.');
      return;
    }
    setOrderUpdating(true);
    try {
      await adminApi.patch(`/orders/admin/${targetId}/status`, statusForm);
      await fetchOrders();
      const detail: any = await adminApi.get(`/orders/admin/${targetId}`);
      setSelectedOrder(detail);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setOrderUpdating(false);
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const targetId = selectedOrder.id || (selectedOrder as any).data?.id;
    if (!targetId) {
      alert('Invalid order ID.');
      return;
    }
    setOrderUpdating(true);
    try {
      await adminApi.put(`/admin/orders/${targetId}/delivery`, {
        courierName: deliveryForm.courierName?.trim() || null,
        trackingNumber: deliveryForm.trackingNumber?.trim() || null,
        notes: deliveryForm.notes || undefined,
      });
      await fetchOrders();
      const detail: any = await adminApi.get(`/orders/admin/${targetId}`);
      setSelectedOrder(detail);
      alert('Delivery details updated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update delivery details');
    } finally {
      setOrderUpdating(false);
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders : [];

  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string; icon: any }> = {
    PENDING: { label: 'Pending', bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: Clock },
    PAYMENT_PENDING: { label: 'Payment Pending', bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: Clock },
    CONFIRMED: { label: 'Confirmed', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', icon: CheckCircle2 },
    PROCESSING: { label: 'Processing', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', icon: Package },
    PACKED: { label: 'Packed', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff', icon: Package },
    SHIPPED: { label: 'Shipped', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', icon: Truck },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', icon: Truck },
    DELIVERED: { label: 'Delivered', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: XCircle },
  };

  const getStatusBadge = (status: string) => {
    const s = STATUS_CONFIG[status] || { label: status, bg: '#f8fafc', color: '#475569', border: '#e2e8f0', icon: Clock };
    const IconComponent = s.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        <IconComponent size={12} />
        {s.label}
      </span>
    );
  };

  const getPayBadge = (status: string) => {
    const m: Record<string, { bg: string; color: string; border: string }> = {
      PAID: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
      PENDING: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
      PENDING_COD: { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
      FAILED: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
      REFUNDED: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    };
    const s = m[status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.04em',
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`
      }}>
        <CreditCard size={11} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? Number(o.totalAmount || 0) : 0), 0);

  const filterTabs = [
    { key: 'ALL', label: 'All Orders', count: orders.length },
    { key: 'PENDING', label: 'Pending', count: orders.filter(o => ['PENDING', 'PAYMENT_PENDING'].includes(o.orderStatus)).length },
    { key: 'CONFIRMED', label: 'Confirmed', count: orders.filter(o => o.orderStatus === 'CONFIRMED').length },
    { key: 'PACKED', label: 'Packed', count: orders.filter(o => o.orderStatus === 'PACKED').length },
    { key: 'SHIPPED', label: 'Shipped', count: orders.filter(o => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length },
    { key: 'DELIVERED', label: 'Delivered', count: orders.filter(o => o.orderStatus === 'DELIVERED').length },
    { key: 'CANCELLED', label: 'Cancelled', count: orders.filter(o => o.orderStatus === 'CANCELLED').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>

      {/* ── 1. Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            Customer Orders & Products
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Accurate product specifications, customer destinations, and fulfillment tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '0.625rem', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('CARDS')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                color: viewMode === 'CARDS' ? '#1a3d2b' : '#64748b',
                boxShadow: viewMode === 'CARDS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <LayoutGrid size={14} /> Cards View
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#1a3d2b' : '#64748b',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <List size={14} /> Table View
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="btn-secondary"
            style={{ gap: '0.5rem', borderColor: '#2d6a4f', color: '#1a3d2b', fontWeight: 700, borderRadius: '0.625rem', padding: '0.55rem 1rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── 2. Top Summary KPI Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Total Orders', value: orders.length, color: '#1a3d2b', bg: '#ffffff', border: '#e2e8f0' },
          { label: 'Pending Action', value: orders.filter(o => ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED'].includes(o.orderStatus)).length, color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Packed & Transit', value: orders.filter(o => ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)).length, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
          { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'DELIVERED').length, color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: '0.875rem',
              background: stat.bg,
              border: `1.5px solid ${stat.border}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Filter Tabs & Search Bar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#ffffff', padding: '1rem', borderRadius: '1rem', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.6rem', borderRadius: '0.625rem', border: '1.5px solid #cbd5e1', fontSize: '0.9rem' }}
            placeholder="Search by Order # (e.g. ORD-2026-238958), customer name, phone, city, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {filterTabs.map((tab) => {
            const active = selectedStatusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusFilter(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: active ? '#1a3d2b' : '#f8fafc',
                  color: active ? '#ffffff' : '#475569',
                  border: active ? '1.5px solid #1a3d2b' : '1.5px solid #e2e8f0',
                  transition: 'all 0.15s',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: active ? '#ffffff' : '#475569',
                  fontWeight: 800,
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Main Content Area: Cards View vs Table View ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#ffffff', borderRadius: '1rem', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 700 }}>Loading customer orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#ffffff', borderRadius: '1rem', border: '1.5px dashed #cbd5e1', color: '#64748b' }}>
          <ShoppingBag size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.25rem' }}>No orders found</h4>
          <p style={{ fontSize: '0.85rem' }}>No orders match your search criteria or selected status filter.</p>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* ══════════════════════════════════════════════════════════
           MODERN ORDER CARDS VIEW (Clean, Spacious, No Cramming)
           ══════════════════════════════════════════════════════════ */
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredOrders.map((order) => {
              const itemsList: any[] = (order as any).items || [];
              const customer = order.user || (order as any).customer || {};
              const location = (order as any).location || 'India';
              const courier = (order as any).deliveryPartner || 'Unassigned';

              return (
                <div
                  key={order.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '1.1rem',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{
                    padding: '1rem 1.4rem',
                    background: '#f8fafc',
                    borderBottom: '1.5px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem'
                  }}>
                    {/* Left: Monospace Order Number + Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '0.98rem',
                        color: '#1a3d2b',
                        background: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        padding: '4px 10px',
                        borderRadius: '0.5rem',
                        letterSpacing: '0.03em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        #{order.orderNumber}
                      </span>

                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Right: Status Pill, Payment Pill, Total & View Order Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {getStatusBadge(order.orderStatus)}
                      {getPayBadge(order.paymentStatus)}

                      <div style={{ textAlign: 'right', marginLeft: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534', lineHeight: 1 }}>
                          ₹{Math.round(Number(order.totalAmount)).toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                          {itemsList.length} item{itemsList.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="btn-primary"
                        style={{
                          padding: '0.55rem 1rem',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          borderRadius: '0.625rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} /> View &amp; Update
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(order)}
                        title="Download / Print Tax Invoice"
                        style={{
                          padding: '0.55rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          borderRadius: '0.625rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1.5px solid #a7f3d0',
                          transition: 'all 0.15s',
                        }}
                      >
                        <FileText size={14} /> Invoice
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenLabel(order)}
                        title="Download / Print Courier Shipping Label"
                        style={{
                          padding: '0.55rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          borderRadius: '0.625rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1.5px solid #bfdbfe',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Tag size={14} /> Shipping Label
                      </button>
                    </div>
                  </div>

                  {/* Customer & Shipping Summary Strip */}
                  <div style={{
                    padding: '0.85rem 1.4rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#ffffff',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    alignItems: 'center',
                  }}>
                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        flexShrink: 0
                      }}>
                        {(customer.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', margin: 0 }}>
                          {customer.name || 'Customer'}
                        </p>
                        <p style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> {customer.phone || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Destination */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.82rem' }}>
                      <div style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0369a1' }}>
                        <MapPin size={15} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'block' }}>Destination</span>
                        <strong style={{ color: '#1e293b' }}>{location}</strong>
                      </div>
                    </div>

                    {/* Courier Partner */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.82rem' }}>
                      <div style={{ padding: '6px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#2d6a4f' }}>
                        <Truck size={15} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, display: 'block' }}>Courier Assignment</span>
                        <strong style={{ color: courier !== 'Unassigned' ? '#0369a1' : '#64748b' }}>
                          {courier}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Ordered Products Section (Clean, Neat Structured Rows) */}
                  <div style={{ padding: '1rem 1.4rem', background: '#ffffff' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                      Ordered Items &amp; Variant Specifications:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.75rem' }}>
                      {itemsList.map((item: any) => {
                        const snap = item.snapshot || {};

                        // Extract clean variant attribute tags
                        const attrTags: { label: string; value: string }[] = [];
                        if (Array.isArray(item.attributes) && item.attributes.length > 0) {
                          item.attributes.forEach((a: any) => {
                            attrTags.push({
                              label: a.attributeName || 'Attribute',
                              value: a.displayName || a.value,
                            });
                          });
                        } else if (snap.variantLabel) {
                          attrTags.push({ label: 'Variant', value: snap.variantLabel });
                        } else if (item.variant?.weight) {
                          attrTags.push({ label: 'Weight', value: `${item.variant.weight}g` });
                        }

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.85rem',
                              padding: '0.75rem 0.9rem',
                              borderRadius: '0.75rem',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {/* Image */}
                            {snap.image ? (
                              <img
                                src={snap.image}
                                alt={snap.name}
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #cbd5e1', flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={20} color="#64748b" />
                              </div>
                            )}

                            {/* Details */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {snap.name || 'Ayngaran Product'}
                              </p>

                              {/* Variant / Spec Pills */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                {attrTags.map((t, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: '#ecfdf5',
                                      color: '#065f46',
                                      border: '1px solid #a7f3d0',
                                    }}
                                  >
                                    {t.label}: {t.value}
                                  </span>
                                ))}

                                {item.variant?.sku && (
                                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                    SKU: {item.variant.sku}
                                  </span>
                                )}
                              </div>

                              {/* Qty & Calculation */}
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 800, color: '#1a3d2b', background: '#dcfce7', padding: '1px 5px', borderRadius: '3px' }}>
                                  {item.quantity}x
                                </span>
                                <span>× ₹{Number(item.unitPrice).toLocaleString('en-IN')}</span>
                                {(item.gstRate !== undefined && item.gstRate !== null) && (
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                                    GST {Number(item.gstRate)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Line Total */}
                            <div style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#1a3d2b', flexShrink: 0 }}>
                              ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '1.25rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={setLimit}
              loading={loading}
            />
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════
           COMPACT TABLE VIEW (No wrapping, Fixed columns)
           ══════════════════════════════════════════════════════════ */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1.5px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '0.78rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Products Ordered</th>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const itemsList: any[] = (order as any).items || [];
                  const firstItem = itemsList[0];
                  const extraCount = Math.max(0, itemsList.length - 1);
                  const customer = order.user || (order as any).customer || {};

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      {/* Order # */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#1a3d2b', fontSize: '0.88rem', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                          #{order.orderNumber}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', minWidth: '150px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {customer.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <Phone size={11} /> {customer.phone || 'N/A'}
                        </div>
                        {(order as any).location && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={10} /> {(order as any).location}
                          </div>
                        )}
                      </td>

                      {/* Products */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', minWidth: '240px' }}>
                        {itemsList.length === 0 ? (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>0 items</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {firstItem?.snapshot?.image ? (
                              <img src={firstItem.snapshot.image} alt={firstItem.snapshot.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '0.4rem', border: '1px solid #cbd5e1', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '0.4rem', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={18} color="#64748b" />
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                {firstItem?.snapshot?.name || 'Product'}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, color: '#1a3d2b', background: '#dcfce7', padding: '1px 5px', borderRadius: '3px', fontSize: '0.72rem' }}>
                                  {firstItem.quantity}x
                                </span>
                                {firstItem?.attributes?.[0]?.displayName ? (
                                  <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px', fontWeight: 800 }}>
                                    {firstItem.attributes[0].displayName}
                                  </span>
                                ) : firstItem?.snapshot?.variantLabel ? (
                                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '3px', fontWeight: 800 }}>
                                    {firstItem.snapshot.variantLabel}
                                  </span>
                                ) : null}
                                {extraCount > 0 && (
                                  <span style={{ fontSize: '0.72rem', color: '#2d6a4f', fontWeight: 700 }}>
                                    +{extraCount} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>
                          ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {getStatusBadge(order.orderStatus)}
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {getPayBadge(order.paymentStatus)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.9rem 1rem', verticalAlign: 'top', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', borderRadius: '0.5rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(order)}
                            title="Download / Print Tax Invoice"
                            style={{
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.78rem',
                              borderRadius: '0.5rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              cursor: 'pointer',
                            }}
                          >
                            <FileText size={13} /> Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLabel(order)}
                            title="Download / Print Courier Shipping Label"
                            style={{
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.78rem',
                              borderRadius: '0.5rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                            }}
                          >
                            <Tag size={13} /> Label
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={setLimit}
            loading={loading}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. ORDER DETAIL MODAL PANEL
          ══════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,25,15,0.65)', backdropFilter: 'blur(6px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              maxWidth: '62rem', width: '100%', maxHeight: 'calc(100vh - 2.5rem)',
              borderRadius: '1.25rem', background: '#ffffff',
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              background: 'linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  ORDER MANAGEMENT
                </p>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                  #{selectedOrder.orderNumber}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#86efac', marginTop: '2px' }}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {getStatusBadge(selectedOrder.orderStatus)}
                <button
                  type="button"
                  onClick={() => handleOpenInvoice(selectedOrder)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #dcfce7',
                    borderRadius: '0.5rem',
                    padding: '0.45rem 0.9rem',
                    color: '#14532d',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  <FileText size={14} /> Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLabel(selectedOrder)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '0.5rem',
                    padding: '0.45rem 0.9rem',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                  }}
                >
                  <Tag size={14} /> Shipping Label
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '0.5rem', padding: '0.45rem 0.9rem',
                    color: '#ffffff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.8rem', fontWeight: 700,
                  }}
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {detailLoading && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  Loading full order details...
                </div>
              )}

              {/* Info Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>

                {/* Customer Info Card */}
                <div style={{ padding: '1.1rem', borderRadius: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <h5 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <UserIcon size={12} /> Customer Profile
                  </h5>
                  <p style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{selectedOrder.user?.name || 'Guest'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {selectedOrder.user?.phone && (
                      <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} /> {selectedOrder.user.phone}
                        <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>VERIFIED</span>
                      </span>
                    )}
                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={11} /> {selectedOrder.user?.email || <em>Email not provided</em>}
                    </span>
                  </div>
                </div>

                {/* Payment Card */}
                <div style={{ padding: '1.1rem', borderRadius: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <h5 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CreditCard size={12} /> Payment Info
                  </h5>
                  <div style={{ marginBottom: '6px' }}>{getPayBadge(selectedOrder.paymentStatus)}</div>
                  {selectedOrder.payments?.[0] && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {selectedOrder.payments[0].gatewayCode && <span>Gateway: <strong>{selectedOrder.payments[0].gatewayCode}</strong></span>}
                      {selectedOrder.payments[0].transactionId && <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>TXN: {selectedOrder.payments[0].transactionId}</span>}
                    </div>
                  )}
                </div>

                {/* Shipping Details Card */}
                {(() => {
                  const isTN = selectedOrder.shippingZone === 'TAMIL_NADU' ||
                    (selectedOrder.shippingAddress?.state && (
                      selectedOrder.shippingAddress.state.toLowerCase().includes('tamil') ||
                      selectedOrder.shippingAddress.state.toUpperCase() === 'TN'
                    ));
                  const zoneLabel = isTN ? 'Tamil Nadu' : 'Outside Tamil Nadu';
                  const deliveryState = selectedOrder.shippingAddress?.state || (isTN ? 'Tamil Nadu' : 'Interstate');
                  const totalWeightGrams = Number(selectedOrder.totalWeightGrams ?? (
                    selectedOrder.items?.reduce((acc: number, it: any) => {
                      const w = it.variant?.weight ? Number(it.variant.weight) : (it.weight ? Number(it.weight) : 0.5);
                      const wGrams = w < 10 ? Math.round(w * 1000) : Math.round(w);
                      return acc + wGrams * (it.quantity || 1);
                    }, 0) || 1000
                  ));
                  const totalWeightKg = `${(totalWeightGrams / 1000).toFixed(2)} KG (${totalWeightGrams}g)`;
                  const billableUnits = Math.max(1, Math.ceil(totalWeightGrams / 1000));
                  const billableWeightGrams = billableUnits * 1000;
                  const billableWeightKg = `${(billableWeightGrams / 1000).toFixed(0)} KG (${billableUnits} slab${billableUnits > 1 ? 's' : ''})`;
                  const shippingRate = selectedOrder.shippingRate
                    ? `₹${Number(selectedOrder.shippingRate).toFixed(0)} / KG`
                    : (isTN ? '₹60 / KG' : '₹120 / KG');
                  const shippingCharge = `₹${Number(selectedOrder.shippingFee !== undefined && selectedOrder.shippingFee !== null ? selectedOrder.shippingFee : billableUnits * (isTN ? 60 : 120)).toFixed(0)}`;
                  const estimatedDelivery = selectedOrder.estimatedDelivery || (isTN ? 'Within 2 days' : '3-5 days');

                  return (
                    <div style={{ padding: '1.1rem', borderRadius: '0.75rem', background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                      <h5 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1a3d2b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Truck size={13} color="#059669" /> Shipping Details
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.45rem', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Delivery State:</span>
                          <strong style={{ color: '#0f172a' }}>{deliveryState}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Shipping Zone:</span>
                          <span style={{
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isTN ? '#dcfce7' : '#e0f2fe',
                            color: isTN ? '#15803d' : '#0369a1',
                          }}>
                            {zoneLabel}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Total Weight:</span>
                          <strong style={{ color: '#0f172a' }}>{totalWeightKg}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Billable Weight:</span>
                          <strong style={{ color: '#0f172a' }}>{billableWeightKg}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Shipping Rate:</span>
                          <strong style={{ color: '#0f172a' }}>{shippingRate}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Shipping Charge:</span>
                          <strong style={{ color: '#166534' }}>{shippingCharge}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Estimated Delivery:</span>
                          <strong style={{ color: '#0369a1' }}>{estimatedDelivery}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Delivery Assignment Card */}
                {(() => {
                  const assignedCourier = selectedOrder.courierName || selectedOrder.deliveryAssignments?.[0]?.courierName || selectedOrder.deliveryAssignments?.[0]?.deliveryPartner?.name || null;
                  const assignedTracking = selectedOrder.trackingNumber || selectedOrder.deliveryAssignments?.[0]?.trackingNumber || null;

                  return (
                    <div style={{ padding: '1.1rem', borderRadius: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <h5 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Truck size={12} /> Courier Assignment
                      </h5>
                      {assignedCourier || assignedTracking ? (
                        <div style={{ fontSize: '0.82rem', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Courier Partner:</span>
                            <strong style={{ color: '#0f172a' }}>{assignedCourier || 'Not specified'}</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>Tracking / AWB Number:</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0369a1', fontWeight: 700 }}>
                              {assignedTracking || 'Not available'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Not yet assigned to courier</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Delivery Address Card */}
              {selectedOrder.shippingAddress && (
                <div style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', background: '#fafafa', border: '1px solid #e4e4e7' }}>
                  <h5 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#2d6a4f" /> Delivery Shipping Destination
                  </h5>
                  <p style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 600, margin: 0 }}>
                    <strong>{selectedOrder.shippingAddress.recipientName}</strong> ({selectedOrder.shippingAddress.phone}) — {selectedOrder.shippingAddress.addressLine1}{selectedOrder.shippingAddress.addressLine2 ? `, ${selectedOrder.shippingAddress.addressLine2}` : ''}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - <strong>{selectedOrder.shippingAddress.pincode}</strong>
                  </p>
                </div>
              )}

              {/* ── ORDERED PRODUCTS LIST CARD ── */}
              <div style={{ borderRadius: '0.875rem', border: '1.5px solid #cbd5e1', overflow: 'hidden' }}>
                <div style={{
                  padding: '0.9rem 1.25rem',
                  background: 'linear-gradient(to right, #f8fffe, #f0fdf4)',
                  borderBottom: '1.5px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a3d2b', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Package size={18} color="#1a3d2b" />
                    Products Ordered by Customer
                    <span style={{ background: '#1a3d2b', color: '#ffffff', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 800 }}>
                      {selectedOrder.items?.length || 0} item(s)
                    </span>
                  </h4>
                </div>

                {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <Package size={32} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                    {detailLoading ? 'Loading product items...' : 'No products found for this order.'}
                  </div>
                ) : (
                  <>
                    {selectedOrder.items.map((item: any, idx: number) => {
                      const snap = item.snapshot || {};
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem 1.25rem',
                            borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                          }}
                        >
                          {/* Product Image */}
                          {snap.image ? (
                            <img
                              src={snap.image} alt={snap.name}
                              style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '58px', height: '58px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                              <Package size={24} color="#94a3b8" />
                            </div>
                          )}

                          {/* Product Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '3px' }}>
                              {snap.name || 'Product'}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                              {snap.brand && (
                                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                                  {snap.brand}
                                </span>
                              )}
                              {snap.productCode && (
                                <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600, fontFamily: 'monospace' }}>
                                  Code: {snap.productCode}
                                </span>
                              )}
                              {/* Dynamic Attributes (Attribute Name & Values) */}
                              {item.attributes && item.attributes.length > 0 ? (
                                item.attributes.map((attr: any, aIdx: number) => (
                                  <span key={aIdx} style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.74rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                                    {attr.attributeName ? `${attr.attributeName}: ` : ''}{attr.displayName || attr.value}
                                  </span>
                                ))
                              ) : snap.variantLabel ? (
                                <span style={{ background: '#d8f3dc', color: '#166534', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                                  Variant / Spec: {snap.variantLabel}
                                </span>
                              ) : null}
                              {item.variant?.sku && (
                                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b' }}>
                                  SKU: {item.variant.sku}
                                </span>
                              )}
                              {item.variant?.weight && (
                                <span style={{ background: '#f0fdf4', color: '#166534', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                                  Weight: {item.variant.weight}g
                                </span>
                              )}
                              {(item.gstRate !== undefined && item.gstRate !== null) && (() => {
                                const customerState = selectedOrder.shippingAddress?.state || selectedOrder.shippingAddress?.stateCode;
                                const effectiveSupply = item.supplyType || selectedOrder.supplyType || getSupplyType(customerState);
                                const isIntra = effectiveSupply === 'INTRA_STATE';
                                const rate = Number(item.gstRate);
                                return (
                                  <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bae6fd' }}>
                                    {isIntra
                                      ? `GST ${rate}% (CGST ${rate / 2}% + SGST ${rate / 2}%) : ₹${Number(item.gstAmount ?? 0).toFixed(2)}`
                                      : `IGST ${rate}% : ₹${Number(item.gstAmount ?? 0).toFixed(2)}`}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Calculation (qty x unit price) */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1a3d2b', margin: 0 }}>
                              ₹{Number(item.totalPrice).toFixed(2)}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Totals Summary */}
                    {(() => {
                      const customerState = selectedOrder.shippingAddress?.state || selectedOrder.shippingAddress?.stateCode;
                      const effectiveSupplyType = selectedOrder.supplyType || getSupplyType(customerState);
                      const isIntraState = effectiveSupplyType === 'INTRA_STATE';
                      const subtotal = Number(selectedOrder.subtotal || 0);
                      const taxAmount = Number(selectedOrder.taxAmount || 0);
                      const taxableAmount = selectedOrder.taxableAmount !== undefined ? Number(selectedOrder.taxableAmount) : Math.max(0, subtotal - taxAmount);
                      const cgstAmount = isIntraState ? (selectedOrder.cgstAmount !== undefined ? Number(selectedOrder.cgstAmount) : Math.round((taxAmount / 2) * 100) / 100) : 0;
                      const sgstAmount = isIntraState ? (selectedOrder.sgstAmount !== undefined ? Number(selectedOrder.sgstAmount) : Math.round((taxAmount - cgstAmount) * 100) / 100) : 0;
                      const igstAmount = !isIntraState ? (selectedOrder.igstAmount !== undefined ? Number(selectedOrder.igstAmount) : taxAmount) : 0;
                      const shippingFee = Number(selectedOrder.shippingFee || 0);
                      const rawTotal = subtotal + shippingFee;
                      // finalTotal from DB (already Math.round'ed to nearest rupee at checkout)
                      const finalTotal = Math.round(Number(selectedOrder.totalAmount || rawTotal));
                      // roundOff = small rounding adjustment (should be near 0 for new orders)
                      const roundOff = Math.round((finalTotal - rawTotal) * 100) / 100;

                      return (
                        <div style={{ padding: '1.25rem', background: '#f8fafc', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, color: '#334155' }}>Supply Type:</span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: isIntraState ? '#dcfce7' : '#e0e7ff',
                                color: isIntraState ? '#15803d' : '#4338ca',
                                border: isIntraState ? '1px solid #bbf7d0' : '1px solid #c7d2fe'
                              }}>
                                {isIntraState ? 'INTRA-STATE (TN → TN)' : `INTER-STATE (TN → ${selectedOrder.shippingAddress?.state || 'Other'})`}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Seller Code: 33 (TN) | Customer Code: {selectedOrder.customerStateCode || resolveGstStateCode(customerState)}
                            </span>
                          </div>

                          <div style={{ width: '290px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>Products Subtotal</span>
                              <span style={{ fontWeight: 700 }}>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>Price Before Tax</span>
                              <span style={{ fontWeight: 700 }}>₹{taxableAmount.toFixed(2)}</span>
                            </div>
                            {taxAmount > 0 && (
                              <>
                                {isIntraState ? (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                                      <span>Central Govt Tax (CGST)</span>
                                      <span style={{ fontWeight: 700 }}>₹{cgstAmount.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                                      <span>State Govt Tax (SGST)</span>
                                      <span style={{ fontWeight: 700 }}>₹{sgstAmount.toFixed(2)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                                    <span>Integrated Interstate Tax (IGST)</span>
                                    <span style={{ fontWeight: 700 }}>₹{igstAmount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontSize: '0.82rem', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                                  <span style={{ fontWeight: 700 }}>Total Tax (Included in Price)</span>
                                  <span style={{ fontWeight: 700 }}>₹{taxAmount.toFixed(2)}</span>
                                </div>
                              </>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>Delivery Charges</span>
                              <span style={{ fontWeight: 700, color: shippingFee === 0 ? '#166534' : 'inherit' }}>
                                {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>Round Off</span>
                              <span style={{ fontWeight: 700 }}>
                                {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem', color: '#0f172a', borderTop: '2px solid #cbd5e1', paddingTop: '8px', marginTop: '3px' }}>
                              <span>Final Total Paid</span>
                              <span style={{ color: '#1a3d2b' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* ── UPDATE ORDER STATUS & ASSIGN DELIVERY ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>

                {/* Update Status */}
                <form onSubmit={handleUpdateStatus} style={{ padding: '1.15rem', borderRadius: '0.75rem', border: '1.5px solid #cbd5e1', background: '#ffffff' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a3d2b', marginBottom: '0.75rem' }}>
                    Update Order Status
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>NEW STATUS</label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className="form-select"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        {Object.keys(STATUS_CONFIG).map((st) => (
                          <option key={st} value={st}>{st.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>INTERNAL NOTES (OPTIONAL)</label>
                      <input
                        type="text"
                        placeholder="e.g. Verified payment details..."
                        value={statusForm.notes}
                        onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={orderUpdating}
                      className="btn-primary"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '0.5rem', marginTop: '0.25rem' }}
                    >
                      {orderUpdating ? 'Saving...' : 'Save Order Status'}
                    </button>
                  </div>
                </form>

                {/* Shipping & Delivery Manual Assignment */}
                <form onSubmit={handleAssignDelivery} style={{ padding: '1.15rem', borderRadius: '0.75rem', border: '1.5px solid #cbd5e1', background: '#ffffff' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a3d2b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={15} /> Shipping & Delivery
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        COURIER / DELIVERY PARTNER NAME
                      </label>
                      <input
                        type="text"
                        placeholder="Enter courier name (e.g. DTDC, Local Delivery)"
                        value={deliveryForm.courierName}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, courierName: e.target.value })}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        AWB / TRACKING NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="Enter AWB / Tracking Number"
                        value={deliveryForm.trackingNumber}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                        className="form-input"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={orderUpdating}
                      className="btn-primary"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '0.5rem', marginTop: '0.25rem' }}
                    >
                      {orderUpdating ? 'Saving...' : 'Assign & Save Delivery'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoicing Modal */}
      {invoiceOrder && (
        <OrderInvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Shipping Label Modal */}
      {labelOrder && (
        <ShippingLabelModal
          order={labelOrder}
          onClose={() => setLabelOrder(null)}
        />
      )}
    </div>
  );
};
