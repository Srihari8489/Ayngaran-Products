import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  User as UserIcon,
  Code,
  Clock,
  Eye,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { AuditLog, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { AdminModal } from '../components/AdminModal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (entityFilter) params.append('entityType', entityFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/audit-logs?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setLogs(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [entityFilter, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, entityFilter, debouncedSearch]);

  const getActionBadge = (action: string) => {
    if (action.includes('DELETE')) {
      return <span className="badge badge-danger">{action}</span>;
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return <span className="badge badge-warning">{action}</span>;
    }
    if (action.includes('MAP') || action.includes('ASSIGN')) {
      return <span className="badge badge-info">{action}</span>;
    }
    return <span className="badge badge-success">{action}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Activity Log</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Permanent record of administrative changes, product updates, and staff actions.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <ShieldCheck size={22} style={{ color: '#2563eb' }} />
        <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
          <strong>Activity History:</strong> Administrative activities and configuration adjustments are securely cataloged for transparency and store security.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem' }}
            placeholder="Search by action, staff name, staff code..."
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

        <div style={{ width: '220px' }}>
          <select
            className="form-select"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All Activities</option>
            <option value="Category">Category</option>
            <option value="CategoryAttribute">Category Specification</option>
            <option value="Order">Order</option>
            <option value="Product">Product</option>
            <option value="Staff">Staff</option>
            <option value="PaymentGateway">Payment Gateway</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Date & Time</th>
                <th>Staff Member</th>
                <th>Action</th>
                <th>Item / Section</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    Loading activity records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <div>No activity records found matching criteria.</div>
                    {(search || entityFilter) && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setEntityFilter('');
                        }}
                        className="btn-secondary"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                        #{log.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{log.staff?.name || 'System Auto'}</div>
                      {log.staff?.staffCode && (
                        <div style={{ fontSize: '0.72rem', color: '#b45309', fontFamily: 'var(--font-mono)' }}>
                          {log.staff.staffCode}
                        </div>
                      )}
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{log.entityType}</span>
                      {log.entityId && (
                        <span style={{ marginLeft: '0.35rem', fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                          ID: {log.entityId}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                      >
                        <Eye size={13} /> View Changes
                      </button>
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

      {/* JSON Inspector Modal */}
      <AdminModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`${selectedLog?.action || ''} on ${selectedLog?.entityType || ''}`}
        subtitle={`ACTIVITY #${selectedLog?.id || ''}`}
        maxWidth="42rem"
        footer={
          <button
            onClick={() => setSelectedLog(null)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem' }}
          >
            Close
          </button>
        }
      >
        <div>
          <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            Updated Record State
          </h5>
          <pre
            style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              color: '#047857',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
            }}
          >
            {(() => {
              try {
                return JSON.stringify(JSON.parse(selectedLog?.newValueJson || '{}'), null, 2);
              } catch {
                return selectedLog?.newValueJson || 'None';
              }
            })()}
          </pre>
        </div>

        {selectedLog?.oldValueJson && (
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
              Previous Record State
            </h5>
            <pre
              style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                color: '#475569',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
              }}
            >
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(selectedLog.oldValueJson || '{}'), null, 2);
                } catch {
                  return selectedLog.oldValueJson || 'None';
                }
              })()}
            </pre>
          </div>
        )}
      </AdminModal>
    </div>
  );
};

