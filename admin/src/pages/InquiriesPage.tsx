import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  ExternalLink,
  MessageSquare,
  Eye,
  Filter,
  RefreshCw,
  X,
  Send,
  User,
  Copy,
  Check,
} from 'lucide-react';
import adminApi from '../api/client';
import { PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const InquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [metaCounts, setMetaCounts] = useState<{ total: number; pending: number; resolved: number }>({
    total: 0,
    pending: 0,
    resolved: 0,
  });

  const handleCopy = (text: string) => {
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
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/inquiries?${params.toString()}`);
      const list: ContactInquiry[] = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setInquiries(list);

      if (res?.pagination) {
        setPagination(res.pagination);
      }

      if (res?.totalAll !== undefined || res?.pagination?.total !== undefined) {
        setMetaCounts({
          total: res.totalAll ?? res.pagination?.total ?? list.length,
          pending: res.pendingCount ?? 0,
          resolved: res.resolvedCount ?? 0,
        });
      } else {
        setMetaCounts({
          total: list.length,
          pending: list.filter((i: any) => i.status === 'PENDING').length,
          resolved: list.filter((i: any) => i.status === 'RESOLVED').length,
        });
      }
    } catch (err) {
      console.error('Failed to load contact inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedInquiry) {
        setSelectedInquiry(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInquiry]);

  useEffect(() => {
    fetchInquiries();
  }, [page, limit, statusFilter, debouncedSearch]);

  const handleStatusChange = async (id: number, newStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      setUpdatingStatus(true);
      await adminApi.patch(`/inquiries/${id}/status`, { status: newStatus });
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      await fetchInquiries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update inquiry status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async (id: number) => {
    try {
      setUpdatingStatus(true);
      await adminApi.patch(`/inquiries/${id}/status`, { notes: noteDraft });
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, notes: noteDraft } : null));
      }
      await fetchInquiries();
      alert('Internal staff notes saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save staff notes');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently remove this customer inquiry?')) return;
    try {
      await adminApi.delete(`/inquiries/${id}`);
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(null);
      }
      await fetchInquiries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete inquiry');
    }
  };

  const openDetailsModal = (item: ContactInquiry) => {
    setSelectedInquiry(item);
    setNoteDraft(item.notes || '');
  };

  const countPending = inquiries.filter((i) => i.status === 'PENDING').length;
  const countResolved = inquiries.filter((i) => i.status === 'RESOLVED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
          label: 'Pending',
        };
      case 'IN_PROGRESS':
        return {
          bg: '#e0f2fe',
          color: '#075985',
          border: '1px solid #bae6fd',
          label: 'In Progress',
        };
      case 'RESOLVED':
        return {
          bg: '#dcfce7',
          color: '#166534',
          border: '1px solid #bbf7d0',
          label: 'Resolved',
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '1px solid #cbd5e1',
          label: status,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner & Heading */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            Customer Inquiries & Messages
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Review customer contact form messages, bulk order requests, and feedback stored in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={fetchInquiries}
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

      {/* Summary Cards */}
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
            Total Inquiries
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
            border: '1px solid #fef08a',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>
            Awaiting Response
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
            {metaCounts.pending}
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
            Resolved Inquiries
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
            {metaCounts.resolved}
          </div>
        </div>
      </div>

      {/* Control Bar: Status Filter Tabs & Search */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === st ? '#0b281b' : '#f8fafc',
                color: statusFilter === st ? '#ffffff' : '#475569',
                border: statusFilter === st ? '1px solid #0b281b' : '1px solid #e2e8f0',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Inquiries' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
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
      </div>

      {/* Inquiries Table Container */}
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
            <span>Loading inquiries...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p style={{ margin: 0, fontWeight: 600 }}>No inquiries found</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem' }}>
              {searchQuery ? 'Try changing your search keywords.' : 'No customer messages in this status category.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '160px' }}>Date</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '220px' }}>Customer</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700 }}>Subject & Message</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, width: '130px' }}>Status</th>
                  <th style={{ padding: '0.7rem 1rem', fontWeight: 700, textAlign: 'right', width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
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
                      {/* Date */}
                      <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          {item.email}
                          {item.phone && <span style={{ marginLeft: '6px', color: '#94a3b8' }}>• {item.phone}</span>}
                        </div>
                      </td>

                      {/* Subject & Preview */}
                      <td style={{ padding: '0.65rem 1rem', maxWidth: '340px' }}>
                        <div style={{ fontWeight: 600, color: '#0b281b', fontSize: '0.82rem', marginBottom: '1px' }}>
                          {item.subject}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: '#64748b',
                            fontSize: '0.76rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.message}
                        </p>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: badge.border,
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: badge.color,
                            }}
                          />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.65rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(item)}
                            title="View full inquiry"
                            style={{
                              padding: '3px 8px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Delete inquiry"
                            style={{
                              padding: '3px 5px',
                              backgroundColor: 'transparent',
                              border: '1px solid transparent',
                              borderRadius: '4px',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
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
                          </button>
                        </div>
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

      {/* Detail & Response Modal */}
      {selectedInquiry && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedInquiry(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.25rem',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '650px',
              maxHeight: 'calc(100vh - 2.5rem)',
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              border: '1px solid #cbd5e1',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Inquiry #{selectedInquiry.id} Details
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Received on {new Date(selectedInquiry.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.35rem',
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', flex: 1 }}>
              {/* Customer Contact Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.65rem',
                  padding: '1rem 1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Customer Name
                  </span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>
                    {selectedInquiry.name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Email Address
                  </span>
                  <div style={{ marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedInquiry.email)}&su=${encodeURIComponent('Re: ' + selectedInquiry.subject)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compose in Gmail Web"
                      style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>{selectedInquiry.email}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedInquiry.email)}
                      title="Copy email address"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.15rem',
                        color: copiedEmail ? '#16a34a' : '#64748b',
                      }}
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Phone Contact
                  </span>
                  <div style={{ marginTop: '0.15rem' }}>
                    {selectedInquiry.phone ? (
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        style={{ color: '#059669', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>{selectedInquiry.phone}</span>
                        <Phone className="w-3 h-3" />
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject & Message Content */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Subject Line
                </label>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0b281b', marginBottom: '0.75rem' }}>
                  {selectedInquiry.subject}
                </div>

                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Customer Message
                </label>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.65rem',
                    padding: '1rem 1.25rem',
                    color: '#1e293b',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Update Inquiry Status
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as const).map((st) => {
                    const isCurrent = selectedInquiry.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange(selectedInquiry.id, st)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          backgroundColor: isCurrent ? '#0b281b' : '#f1f5f9',
                          color: isCurrent ? '#ffffff' : '#475569',
                          border: isCurrent ? '1px solid #0b281b' : '1px solid #cbd5e1',
                        }}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Internal Staff Notes (Private)
                </label>
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Record customer resolution, callback timestamp, or dispatch remarks..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleSaveNotes(selectedInquiry.id)}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.45rem 1rem',
                    backgroundColor: '#d4af37',
                    color: '#0b281b',
                    fontWeight: 800,
                    borderRadius: '0.45rem',
                    border: 'none',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Save Notes
                </button>
              </div>

              {/* Direct Reply Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Option 1: Direct Gmail Web (Guaranteed to open in browser) */}
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedInquiry.email)}&su=${encodeURIComponent('Re: ' + selectedInquiry.subject)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      minWidth: '170px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#ea4335',
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(234, 67, 53, 0.2)',
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Reply via Gmail Web</span>
                  </a>

                  {/* Option 2: Default Desktop Mail Client (mailto) */}
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#0b281b',
                      color: '#ffffff',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                    }}
                    title="Open in default desktop mail app (Outlook, Thunderbird, etc.)"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Desktop Mail App</span>
                  </a>

                  {/* Option 3: WhatsApp Customer */}
                  {selectedInquiry.phone && (
                    <a
                      href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(selectedInquiry.name)},%20thank%20you%20for%20contacting%20Ayngaran%20Traditional%20Foods.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        minWidth: '170px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#22c55e',
                        color: '#ffffff',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(34, 197, 94, 0.2)',
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>WhatsApp Customer</span>
                    </a>
                  )}
                </div>

                {/* Quick Copy Email Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafc',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.83rem',
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    Email: <strong style={{ color: '#0f172a' }}>{selectedInquiry.email}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedInquiry.email)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      backgroundColor: copiedEmail ? '#dcfce7' : '#ffffff',
                      color: copiedEmail ? '#166534' : '#334155',
                      border: copiedEmail ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InquiriesPage;
