import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  Search,
  Filter,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { Staff, Role, PaginationMeta } from '../types';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { AdminModal } from '../components/AdminModal';

export const StaffPage: React.FC = () => {
  const { staff: currentStaff } = useAdminAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    staffCode: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
  });

  const fetchRoles = async () => {
    try {
      const rolesRes: any = await adminApi.get('/staff/roles');
      const r = rolesRes.data || rolesRes || [];
      setRoles(r);
      if (r.length > 0 && !formData.roleId) {
        setFormData((prev) => ({ ...prev, roleId: String(r[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (roleFilter !== 'ALL') params.append('roleId', roleFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res: any = await adminApi.get(`/staff?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setStaffList(items);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [page, limit, debouncedSearch, roleFilter, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.post('/staff', {
        staffCode: formData.staffCode.toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleId: Number(formData.roleId),
      });
      setIsCreateModalOpen(false);
      setFormData({
        staffCode: '',
        name: '',
        email: '',
        password: '',
        roleId: roles.length > 0 ? String(roles[0].id) : '',
      });
      fetchStaff();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create staff account');
    }
  };

  const handleDelete = async (staffMember: Staff) => {
    if (staffMember.id === currentStaff?.id) {
      alert('Security Policy: You cannot delete your own active staff account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to deactivate staff account "${staffMember.name}"?`)) return;
    try {
      await adminApi.delete(`/staff/${staffMember.id}`);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Team & Staff Members</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage store staff accounts, access permissions, and roles.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              staffCode: `STF-${Date.now().toString().slice(-4)}`,
              name: '',
              email: '',
              password: '',
              roleId: roles.length > 0 ? String(roles[0].id) : '',
            });
            setIsCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Add Team Member</span>
        </button>
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
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
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
            placeholder="Search by name, email, code..."
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

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {roles.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.8rem', minWidth: '140px', width: 'auto' }}
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => {
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
                  {st === 'ALL' ? 'All Staff' : st === 'ACTIVE' ? 'Active' : 'Suspended'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Staff Code</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const isSelf = s.id === currentStaff?.id;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '2.25rem',
                              height: '2.25rem',
                              borderRadius: '9999px',
                              backgroundColor: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--accent-amber)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{s.name}</span>
                              {isSelf && <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>You</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          {s.staffCode}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          <ShieldCheck size={12} /> {typeof s.role === 'string' ? s.role : s.role?.name || 'Administrator'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {s.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(s.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td>
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(s)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: '0.3rem', opacity: 0.8 }}
                            title="Soft delete staff member"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {/* Create Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Team Member"
        subtitle="Provision a new admin or staff login account"
        maxWidth="32rem"
      >
        {formError && (
          <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'STF';
                  const suffix = formData.staffCode.split('-').pop() || String(Math.floor(1000 + Math.random() * 9000));
                  setFormData({
                    ...formData,
                    name,
                    staffCode: `STF-${prefix}-${suffix}`,
                  });
                }}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Staff Code <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.35rem' }}>(Auto-generated)</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                className="form-input"
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155', fontWeight: 700 }}
                value={formData.staffCode}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Work Email *
            </label>
            <input
              type="email"
              required
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="employee@ayngaran.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Temporary Password * (Bcrypt Hashed)
            </label>
            <input
              type="password"
              required
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Assigned RBAC Role *
            </label>
            <select
              className="form-select"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
              Create Account
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
