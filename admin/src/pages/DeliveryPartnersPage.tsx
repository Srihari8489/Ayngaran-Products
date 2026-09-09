import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Phone,
  Mail
} from 'lucide-react';
import adminApi from '../api/client';
import { DeliveryPartner } from '../types';

export const DeliveryPartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    partnerCode: '',
    name: '',
    contactPhone: '',
    contactEmail: '',
    trackingUrlTemplate: '',
    isActive: true,
  });

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.get('/delivery-partners');
      setPartners(res.data || res || []);
    } catch (err) {
      console.error('Failed to load delivery partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.post('/delivery-partners', formData);
      setIsCreateModalOpen(false);
      setFormData({
        partnerCode: '',
        name: '',
        contactPhone: '',
        contactEmail: '',
        trackingUrlTemplate: '',
        isActive: true,
      });
      fetchPartners();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create delivery partner');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setFormError('');
    try {
      await adminApi.patch(`/delivery-partners/${selectedPartner.id}`, formData);
      setIsEditModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update partner');
    }
  };

  const handleDelete = async (partner: DeliveryPartner) => {
    if (!window.confirm(`Are you sure you want to delete "${partner.name}"?`)) return;
    try {
      await adminApi.delete(`/delivery-partners/${partner.id}`);
      fetchPartners();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete partner');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Shipping & Delivery Partners</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Manage the courier services and tracking templates used for fulfilling customer orders.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              partnerCode: `DLV-${Date.now().toString().slice(-4)}`,
              name: '',
              contactPhone: '',
              contactEmail: '',
              trackingUrlTemplate: 'https://track.courier.com/{tracking_number}',
              isActive: true,
            });
            setIsCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ fontSize: '0.88rem' }}
        >
          <Plus size={16} />
          <span>Add Delivery Partner</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Courier Partner</th>
                <th>Partner Code</th>
                <th>Contact Info</th>
                <th>Tracking URL Template</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    Loading courier partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No delivery partners registered yet. Click "Add Delivery Partner" to create one.
                  </td>
                </tr>
              ) : (
                partners.map((dp) => (
                  <tr key={dp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.25rem',
                            height: '2.25rem',
                            borderRadius: '0.5rem',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Truck size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{dp.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#b45309', fontWeight: 600 }}>
                        {dp.partnerCode}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                        {dp.contactPhone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} /> {dp.contactPhone}</div>}
                        {dp.contactEmail && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}><Mail size={12} /> {dp.contactEmail}</div>}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {dp.trackingUrlTemplate || '—'}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${dp.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {dp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedPartner(dp);
                            setFormData({
                              partnerCode: dp.partnerCode,
                              name: dp.name,
                              contactPhone: dp.contactPhone || '',
                              contactEmail: dp.contactEmail || '',
                              trackingUrlTemplate: dp.trackingUrlTemplate || '',
                              isActive: dp.isActive,
                            });
                            setIsEditModalOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem' }}
                          title="Edit partner"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(dp)}
                          style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', padding: '0.3rem' }}
                          title="Delete partner"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '30rem', width: '100%', padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Add Delivery Partner
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. BlueDart, Delhivery"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Partner Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.partnerCode}
                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91 1800..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Support Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="support@partner.com"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Live Tracking URL Template (Use <code>&#123;tracking_number&#125;</code>)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.trackingUrlTemplate}
                  onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                  placeholder="https://track.bluedart.com/?awb={tracking_number}"
                />
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
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedPartner && (
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
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '30rem', width: '100%', padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Edit Partner: {selectedPartner.name}
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Partner Name
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Tracking URL Template
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.trackingUrlTemplate}
                  onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

