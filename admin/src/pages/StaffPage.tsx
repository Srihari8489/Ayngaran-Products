import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Edit2,
  Trash2,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import adminApi from '../api/client';
import { Staff, Role } from '../types';
import { useAdminAuth } from '../context/AdminAuthContext';

export const StaffPage: React.FC = () => {
  const { staff: currentStaff } = useAdminAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes]: any = await Promise.all([
        adminApi.get('/staff'),
        adminApi.get('/staff/roles'),
      ]);

      setStaffList(staffRes.data || staffRes || []);
      const r = rolesRes.data || rolesRes || [];
      setRoles(r);
      if (r.length > 0 && !formData.roleId) {
        setFormData((prev) => ({ ...prev, roleId: String(r[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
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
      fetchData();
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
                    No staff records found.
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
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '30rem', width: '100%', padding: '2rem', borderRadius: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Add Team Member
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem', marginBottom: '1rem' }}>
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
                    Staff Code <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.35rem' }}>(Auto-generated, Immutable)</span>
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
          </div>
        </div>
      )}
    </div>
  );
};
