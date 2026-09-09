import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  ChevronRight,
  Package,
  User as UserIcon,
  MapPin,
  CreditCard,
  AlertCircle,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { Order, DeliveryPartner } from '../types';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderUpdating, setOrderUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
  });

  // Assign delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryPartnerId: '',
    trackingNumber: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, partnersRes]: any = await Promise.all([
        adminApi.get('/orders/admin/all?limit=50'),
        adminApi.get('/delivery-partners'),
      ]);

      setOrders(ordersRes.items || ordersRes.data || ordersRes || []);
      setDeliveryPartners(partnersRes.data || partnersRes || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.orderStatus,
      notes: '',
    });
    setDeliveryForm({
      deliveryPartnerId: deliveryPartners.length > 0 ? String(deliveryPartners[0].id) : '',
      trackingNumber: order.delivery?.trackingNumber || '',
      notes: '',
    });
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setOrderUpdating(true);
    try {
      await adminApi.patch(`/orders/admin/${selectedOrder.id}/status`, statusForm);
      fetchData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setOrderUpdating(false);
    }
  };

  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !deliveryForm.deliveryPartnerId) return;
    setOrderUpdating(true);
    try {
      await adminApi.post(`/orders/admin/${selectedOrder.id}/assign-delivery`, {
        deliveryPartnerId: Number(deliveryForm.deliveryPartnerId),
        trackingNumber: deliveryForm.trackingNumber,
        notes: deliveryForm.notes,
      });
      fetchData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setOrderUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      selectedStatusFilter === 'ALL' || o.orderStatus === selectedStatusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(query) ||
      (o.user && o.user.name && o.user.name.toLowerCase().includes(query)) ||
      (o.user && o.user.email && o.user.email.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Confirmed</span>;
      case 'DELIVERED':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Delivered</span>;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-info"><Truck size={12} /> On the Way</span>;
      case 'PROCESSING':
      case 'PACKED':
        return <span className="badge badge-warning"><Clock size={12} /> Processing</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Customer Orders</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            View customer orders, update delivery progress, and assign shipping couriers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem' }}
            placeholder="Search by order number or customer name/email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem',
                borderRadius: '50%',
              }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', alignItems: 'center' }}>
          {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedStatusFilter === st ? '#fef3c7' : '#ffffff',
                color: selectedStatusFilter === st ? '#b45309' : '#64748b',
                border: selectedStatusFilter === st ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total Value</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Date Placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    Loading order list...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <div>No orders found matching criteria.</div>
                    {(search || selectedStatusFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setSelectedStatusFilter('ALL');
                        }}
                        className="btn-secondary"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                      >
                        Clear Filters & View All
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#b45309', fontSize: '0.88rem' }}>
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.user?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.user?.phone || order.user?.email || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                        {order.items?.length || 0} item(s)
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>{getStatusBadge(order.orderStatus)}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              maxWidth: '48rem',
              width: '100%',
              maxHeight: '90vh',
              borderRadius: '1.25rem',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>ORDER DETAILS</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Close
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Order Status Update */}
              <div style={{ padding: '1.25rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Update Order Status
                </h4>
                <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Change Status To
                    </label>
                    <select
                      className="form-select"
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    >
                      <option value="CONFIRMED">CONFIRMED (Ready to pack)</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PACKED">PACKED (Ready for pickup)</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                      <option value="CANCELLED">CANCELLED (Reverse stock)</option>
                    </select>
                  </div>

                  <div style={{ flex: 1.5, minWidth: '220px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Internal Order Notes
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={statusForm.notes}
                      onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                      placeholder="e.g. Dispatched with morning delivery fleet"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={orderUpdating}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.65rem 1rem' }}
                  >
                    Update Status
                  </button>
                </form>
              </div>

              {/* Courier Partner Assignment */}
              <div style={{ padding: '1.25rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Assign Shipping Courier
                </h4>
                <form onSubmit={handleAssignDelivery} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Courier Partner
                    </label>
                    <select
                      className="form-select"
                      value={deliveryForm.deliveryPartnerId}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryPartnerId: e.target.value })}
                    >
                      {deliveryPartners.map((dp) => (
                        <option key={dp.id} value={dp.id}>
                          {dp.name} ({dp.partnerCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Tracking / AWB Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={deliveryForm.trackingNumber}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                      placeholder="e.g. BD-89237498"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={orderUpdating}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.65rem 1rem' }}
                  >
                    Save Courier Info
                  </button>
                </form>
              </div>

              {/* Items in Order */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '0.75rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.snapshot?.image ? (
                          <img
                            src={item.snapshot.image}
                            alt=""
                            style={{ width: '2.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                            {item.snapshot?.name || 'Product'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {item.snapshot?.brand} {item.snapshot?.sku && `• SKU: ${item.snapshot.sku}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                          ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Address Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Address */}
                <div style={{ padding: '1.25rem', borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} style={{ color: '#d97706' }} /> Delivery Address
                  </h5>
                  {selectedOrder.shippingAddress ? (
                    <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.shippingAddress.recipientName}</div>
                      <div>{selectedOrder.shippingAddress.addressLine1}</div>
                      {selectedOrder.shippingAddress.addressLine2 && <div>{selectedOrder.shippingAddress.addressLine2}</div>}
                      <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</div>
                      <div style={{ marginTop: '0.35rem', color: '#64748b' }}>Phone: {selectedOrder.shippingAddress.phone}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Address not available</div>
                  )}
                </div>

                {/* Totals */}
                <div style={{ padding: '1.25rem', borderRadius: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{Number(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Shipping Fee</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{Number(selectedOrder.shippingFee || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Tax (GST)</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>₹{Number(selectedOrder.taxAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.4rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                    <span>Grand Total</span>
                    <span style={{ color: '#b45309' }}>₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

