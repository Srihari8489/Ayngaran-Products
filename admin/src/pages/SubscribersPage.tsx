import React, { useEffect, useState } from 'react';
import {
  Mail,
  Download,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle2,
  Users,
  Sparkles,
  Calendar,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import adminApi from '../api/client';
import { PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export interface NewsletterSubscriber {
  id: number;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const SubscribersPage: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [metaCounts, setMetaCounts] = useState<{ total: number; active: number }>({
    total: 0,
    active: 0,
  });

  const handleCopy = (id: number, text: string) => {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/newsletter/subscribers?${params.toString()}`);
      const list: NewsletterSubscriber[] = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setSubscribers(list);

      if (res?.pagination) {
        setPagination(res.pagination);
      }

      if (res?.totalAll !== undefined || res?.pagination?.total !== undefined) {
        setMetaCounts({
          total: res.totalAll ?? res.pagination?.total ?? list.length,
          active: res.activeCount ?? 0,
        });
      } else {
        setMetaCounts({
          total: list.length,
          active: list.filter((s: any) => s.isActive).length,
        });
      }
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSubscribers();
  }, [page, limit, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscribers();
  };

  const handleDelete = async (id: number, email: string) => {
    if (!window.confirm(`Are you sure you want to remove "${email}" from the subscriber list?`)) return;
    try {
      await adminApi.delete(`/newsletter/subscribers/${id}`);
      setSubscribers((prev) => prev.filter((item) => item.id !== id));
      setMetaCounts((prev) => ({
        total: Math.max(0, prev.total - 1),
        active: Math.max(0, prev.active - 1),
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove subscriber');
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      alert('No subscribers to export.');
      return;
    }

    const headers = ['ID', 'Email Address', 'Status', 'Subscribed Date'];
    const rows = subscribers.map((sub) => [
      sub.id,
      `"${sub.email}"`,
      sub.isActive ? 'Active' : 'Unsubscribed',
      `"${new Date(sub.subscribedAt || sub.createdAt).toLocaleString('en-IN')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ayngaran_newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = subscribers.filter((s) => s.isActive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Newsletter Subscribers
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Audience subscribed to recipes, festive promotional discounts, and store bulletins from the storefront footer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.1rem',
              backgroundColor: '#0b281b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: subscribers.length === 0 ? 'not-allowed' : 'pointer',
              opacity: subscribers.length === 0 ? 0.6 : 1,
            }}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchSubscribers}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.85rem',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Email List
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {metaCounts.total}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.85rem',
            padding: '1.25rem',
            border: '1px solid #bbf7d0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
            Active Subscribers
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
            {metaCounts.active}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
          padding: '0.85rem 1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by subscriber email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.25rem',
              fontSize: '0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              outline: 'none',
            }}
          />
          <Search
            className="w-4 h-4 text-slate-400"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '0.55rem 1.25rem',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          Search
        </button>

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchSubscribers();
            }}
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.82rem',
              textDecoration: 'underline',
            }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Table Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.85rem',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            <span>Loading subscribers...</span>
          </div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p style={{ margin: 0, fontWeight: 600 }}>No subscribers found</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>
              {searchQuery ? 'No match for your search term.' : 'Newsletter subscribers from the footer will appear here.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '40px' }}>#</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700 }}>Subscriber Email</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '150px' }}>Status</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '200px' }}>Date Subscribed</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, textAlign: 'right', width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((item, index) => {
                  const formattedDate = new Date(item.subscribedAt || item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      {/* Index */}
                      <td style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
                        {(page - 1) * limit + index + 1}
                      </td>

                      {/* Email + Sleek Actions */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1e293b' }}>
                            {item.email}
                          </span>

                          {/* Quick Gmail Compose */}
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.email)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Compose in Gmail Web"
                            style={{
                              color: '#94a3b8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px',
                              borderRadius: '4px',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <ExternalLink size={13} />
                          </a>

                          {/* Quick Copy */}
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.email)}
                            title="Copy email address"
                            style={{
                              background: copiedId === item.id ? '#dcfce7' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              color: copiedId === item.id ? '#166534' : '#94a3b8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (copiedId !== item.id) e.currentTarget.style.color = '#475569';
                            }}
                            onMouseLeave={(e) => {
                              if (copiedId !== item.id) e.currentTarget.style.color = '#94a3b8';
                            }}
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check size={12} className="text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status Dot Pill */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: item.isActive ? '#ecfdf5' : '#f1f5f9',
                            color: item.isActive ? '#065f46' : '#64748b',
                            border: item.isActive ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: item.isActive ? '#10b981' : '#94a3b8',
                            }}
                          />
                          <span>{item.isActive ? 'Active' : 'Unsubscribed'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.email)}
                          title="Remove subscriber"
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid transparent',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.borderColor = '#fecaca';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.borderColor = 'transparent';
                          }}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          pagination={pagination}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};
export default SubscribersPage;
