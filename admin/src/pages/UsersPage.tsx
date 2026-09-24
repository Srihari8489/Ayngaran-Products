import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  Eye,
  ShieldAlert,
  ShieldCheck,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import adminApi from '../api/client';
import { Customer, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { AdminModal } from '../components/AdminModal';

export const UsersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Meta counts
  const [metaCounts, setMetaCounts] = useState({
    totalAll: 0,
    activeCount: 0,
  });

  // Customer Details Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/admin/users?${params.toString()}`);
      const items: Customer[] = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setCustomers(items);

      if (res?.pagination) {
        setPagination(res.pagination);
      }

      if (res?.totalAll !== undefined) {
        setMetaCounts({
          totalAll: res.totalAll,
          activeCount: res.activeCount ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [page, limit, debouncedSearch, statusFilter]);

  const handleViewDetails = async (id: number) => {
    setSelectedCustomerId(id);
    setLoadingDetails(true);
    try {
      const res: any = await adminApi.get(`/admin/users/${id}`);
      setCustomerDetails(res?.data || res);
    } catch (err) {
      console.error('Failed to load customer details:', err);
      alert('Failed to load customer details');
      setSelectedCustomerId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    const action = customer.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} customer account "${customer.name}"?`)) return;

    try {
      await adminApi.patch(`/admin/users/${customer.id}/status`, {
        isActive: !customer.isActive,
      });
      fetchCustomers();
      if (customerDetails && customerDetails.id === customer.id) {
        setCustomerDetails({ ...customerDetails, isActive: !customer.isActive });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} customer`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Customer Accounts</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Browse registered shoppers, review ordering history, and manage store account access.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <Users size={16} color="#2563eb" />
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Customers:</span>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{metaCounts.totalAll}</strong>
          </div>

          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <ShieldCheck size={16} color="#16a34a" />
            <span style={{ fontSize: '0.82rem', color: '#166534' }}>Active:</span>
            <strong style={{ fontSize: '0.9rem', color: '#14532d' }}>{metaCounts.activeCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '460px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, phone, email, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: '2.6rem',
              paddingRight: search ? '2.4rem' : '0.9rem',
              fontSize: '0.875rem',
            }}
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
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#1a3d2b' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: isActive ? '1px solid #1a3d2b' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 2px 6px rgba(26, 61, 43, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Customers' : st === 'ACTIVE' ? 'Active' : 'Suspended'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No customer accounts found matching criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    {/* Customer Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '9999px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          {(c.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#b45309', fontFamily: 'var(--font-mono)' }}>
                            {c.userCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                        {c.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={12} color="#64748b" /> {c.phone}
                          </div>
                        ) : null}
                        {c.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', marginTop: '2px' }}>
                            <Mail size={12} color="#94a3b8" /> {c.email}
                          </div>
                        ) : null}
                        {!c.phone && !c.email && (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No contact saved</span>
                        )}
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td>
                      <span
                        className="badge badge-info"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                      >
                        <ShoppingBag size={12} /> {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                        ₹{c.totalSpent.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {c.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleViewDetails(c.id)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="View Customer Profile"
                        >
                          <Eye size={13} /> View
                        </button>

                        <button
                          onClick={() => handleToggleStatus(c)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: c.isActive ? '#e11d48' : '#10b981',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={c.isActive ? 'Suspend Account' : 'Activate Account'}
                        >
                          {c.isActive ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Customer Profile Modal */}
      <AdminModal
        isOpen={!!selectedCustomerId}
        onClose={() => {
          setSelectedCustomerId(null);
          setCustomerDetails(null);
        }}
        title={customerDetails?.name || 'Customer Details'}
        subtitle="CUSTOMER PROFILE"
        maxWidth="42rem"
        footer={
          <button
            onClick={() => {
              setSelectedCustomerId(null);
              setCustomerDetails(null);
            }}
            className="btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            Close
          </button>
        }
      >
        {loadingDetails || !customerDetails ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading customer details...
                </div>
              ) : (
                <>
                  {/* Overview Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ padding: '0.85rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>User Code</div>
                      <div style={{ fontWeight: 700, color: '#b45309', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        {customerDetails.userCode}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Orders</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginTop: '0.2rem' }}>
                        {customerDetails.orderCount}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Spend</div>
                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1rem', marginTop: '0.2rem' }}>
                        ₹{customerDetails.totalSpent.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reviews Submitted</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginTop: '0.2rem' }}>
                        {customerDetails.reviewCount}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Contact Information</h4>
                    <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div>Phone: <strong>{customerDetails.phone || 'Not provided'}</strong></div>
                      <div>Email: <strong>{customerDetails.email || 'Not provided'}</strong></div>
                      <div>Account Status: <strong style={{ color: customerDetails.isActive ? '#16a34a' : '#e11d48' }}>{customerDetails.isActive ? 'Active & Verified' : 'Suspended'}</strong></div>
                    </div>
                  </div>

                  {/* Saved Addresses */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      Saved Delivery Addresses ({customerDetails.addresses?.length || 0})
                    </h4>
                    {customerDetails.addresses && customerDetails.addresses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {customerDetails.addresses.map((addr: any) => (
                          <div
                            key={addr.id}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '0.65rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.8rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <strong style={{ color: '#0f172a' }}>{addr.recipientName}</strong>
                              {addr.isDefault && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Default</span>}
                            </div>
                            <div style={{ color: '#475569', lineHeight: '1.4' }}>
                              {addr.addressLine1} {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} - {addr.pincode}<br />
                              Phone: {addr.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                        No delivery addresses on file.
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                      Recent Orders
                    </h4>
                    {customerDetails.recentOrders && customerDetails.recentOrders.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {customerDetails.recentOrders.map((ord: any) => (
                          <div
                            key={ord.id}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: '0.65rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                                #{ord.orderNumber}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                                {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                              </div>
                              <span
                                className={`badge ${
                                  ord.orderStatus === 'DELIVERED'
                                    ? 'badge-success'
                                    : ord.orderStatus === 'CANCELLED'
                                    ? 'badge-danger'
                                    : 'badge-warning'
                                }`}
                                style={{ fontSize: '0.68rem', marginTop: '2px' }}
                              >
                                {ord.orderStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                        No previous orders recorded for this customer.
                      </div>
                    )}
                  </div>
                </>
              )}
      </AdminModal>
    </div>
  );
};

export default UsersPage;
