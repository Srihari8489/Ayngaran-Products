import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  Package,
  User as UserIcon,
  Clock,
  Search,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { Review, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/reviews/admin/all?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setReviews(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchReviews();
  }, [page, limit, statusFilter, debouncedSearch]);

  const handleModerate = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await adminApi.patch(`/reviews/admin/${id}/moderate`, { status });
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to moderate review');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await adminApi.delete(`/reviews/admin/${id}`);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Customer Reviews</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Review and moderate feedback submitted by verified buyers before it appears on the storefront.
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
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => {
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
                {st === 'ALL' ? 'All Reviews' : st}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '380px' }}>
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
            placeholder="Search by title, comment, product..."
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

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            No reviews found matching criteria.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderColor: r.status === 'PENDING' ? '#f59e0b' : '#e2e8f0',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', color: '#d97706', gap: '0.1rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < r.rating ? '#f59e0b' : 'none'}
                          stroke="#d97706"
                        />
                      ))}
                    </div>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                      {r.title}
                    </span>
                    <span
                      className={`badge ${
                        r.status === 'APPROVED'
                          ? 'badge-success'
                          : r.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Product: <strong style={{ color: '#0f172a' }}>{r.product?.name || 'Product'}</strong></span>
                    <span>•</span>
                    <span>By: <strong style={{ color: '#0f172a' }}>{r.user?.name || 'Verified Buyer'}</strong></span>
                    <span>•</span>
                    <span>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {r.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleModerate(r.id, 'APPROVED')}
                      className="btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', backgroundColor: '#10b981', color: '#fff' }}
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleModerate(r.id, 'REJECTED')}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', color: '#e11d48' }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem' }}
                    title="Delete review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.88rem',
                  color: '#1e293b',
                  lineHeight: '1.5',
                }}
              >
                {r.comment}
              </div>
            </div>
          ))
        )}
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
  );
};

