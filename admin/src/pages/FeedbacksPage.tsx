import React, { useEffect, useState } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  X,
  MessageSquareHeart,
  Mail,
  User as UserIcon,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import adminApi from '../api/client';
import { CustomerFeedback, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export const FeedbacksPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/feedback/admin/all?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setFeedbacks(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchFeedbacks();
  }, [page, limit, statusFilter, debouncedSearch]);

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'PENDING' | 'REJECTED') => {
    try {
      await adminApi.patch(`/feedback/admin/${id}/status`, { status });
      fetchFeedbacks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update feedback status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer feedback?')) return;
    try {
      await adminApi.delete(`/feedback/admin/${id}`);
      fetchFeedbacks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Customer Feedbacks</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Review, moderate, and manage storefront testimonials and customer feedback submissions.
          </p>
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
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#1a3d2b' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  border: isActive ? '1px solid #1a3d2b' : '1px solid #e2e8f0',
                  boxShadow: isActive ? '0 2px 6px rgba(26, 61, 43, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Feedbacks' : st}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
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
            placeholder="Search by customer name, email, or feedback..."
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
      </div>

      {/* Feedbacks Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            Loading customer feedbacks...
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            No customer feedbacks found matching criteria.
          </div>
        ) : (
          feedbacks.map((f) => (
            <div
              key={f.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderColor: f.status === 'PENDING' ? '#f59e0b' : '#e2e8f0',
              }}
            >
              {/* Header with stars, status, and actions */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* Stars */}
                    <div style={{ display: 'flex', color: '#d97706', gap: '0.1rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < f.rating ? '#f59e0b' : 'none'}
                          stroke="#d97706"
                        />
                      ))}
                    </div>

                    {/* Status Badge */}
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          f.status === 'APPROVED'
                            ? '#dcfce7'
                            : f.status === 'REJECTED'
                            ? '#fee2e2'
                            : '#fef3c7',
                        color:
                          f.status === 'APPROVED'
                            ? '#166534'
                            : f.status === 'REJECTED'
                            ? '#991b1b'
                            : '#92400e',
                      }}
                    >
                      {f.status}
                    </span>
                  </div>

                  {/* Customer Meta */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.65rem',
                      fontSize: '0.82rem',
                      color: '#64748b',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: '#0f172a' }}>
                      <UserIcon size={14} color="#64748b" />
                      {f.name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={14} color="#64748b" />
                      {f.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} color="#64748b" />
                      {new Date(f.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {f.status !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(f.id, 'APPROVED')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Approve
                    </button>
                  )}

                  {f.status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(f.id, 'REJECTED')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(f.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#f8fafc',
                      color: '#94a3b8',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                    title="Delete feedback"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Feedback Body */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.625rem',
                  border: '1px solid #edf2f7',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.6 }}>
                  "{f.feedback}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
          loading={loading}
        />
      )}
    </div>
  );
};
