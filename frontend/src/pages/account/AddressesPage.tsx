import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Star, Edit2, Phone, CheckCircle2, X, Save } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Address {
  id: number;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
};

export const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/auth/customer/addresses');
      setAddresses(Array.isArray(res) ? res : []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (addr: Address) => {
    setForm({
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientName || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setError('Please fill in all required fields');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.patch(`/auth/customer/addresses/${editingId}`, form);
      } else {
        await api.post('/auth/customer/addresses', form);
      }
      await loadAddresses();
      setShowForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await api.delete(`/auth/customer/addresses/${id}`);
      await loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.patch(`/auth/customer/addresses/${id}/set-default`, {});
      await loadAddresses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to set default');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', borderRadius: '0.625rem',
    border: '1.5px solid #cbd5e1', fontSize: '0.875rem', outline: 'none',
    fontFamily: 'inherit', background: '#fff', color: '#0f172a',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569',
    marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
          My Addresses
        </h2>
        {!showForm && (
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,61,43,0.2)' }}
          >
            <Plus size={16} /> Add Address
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: '#f0fdf4', borderRadius: '1rem', border: '1.5px solid #86efac', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#166534' }}>
              {editingId ? 'Edit Address' : 'New Address'}
            </h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Recipient Name *</label>
                <input
                  type="text" required
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="Full name of recipient"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="tel" required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit phone"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address Line 1 *</label>
                <input
                  type="text" required
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  placeholder="House no, Street, Area"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Address Line 2</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  placeholder="Apartment, Landmark (optional)"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  type="text" required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div>
                <label style={labelStyle}>State *</label>
                <input
                  type="text" required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div>
                <label style={labelStyle}>Pincode *</label>
                <input
                  type="text" required
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="6-digit PIN"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="India"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.85rem', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#1a3d2b' }}
              />
              Set as default delivery address
            </label>

            {error && (
              <div style={{ marginTop: '0.75rem', padding: '0.65rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.7rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={16} /> {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ padding: '0.7rem 1.25rem', borderRadius: '0.625rem', background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <MapPin size={40} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No addresses saved yet</p>
          <p style={{ fontSize: '0.875rem' }}>Add your first delivery address to speed up checkout.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                borderRadius: '0.875rem',
                border: addr.isDefault ? '2px solid #86efac' : '1.5px solid #e2e8f0',
                background: addr.isDefault ? '#f0fdf4' : '#fff',
                padding: '1.1rem 1.25rem',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {addr.isDefault && (
                <span style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#1a3d2b', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                  <Star size={9} fill="#fff" /> DEFAULT
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: addr.isDefault ? '#1a3d2b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={17} color={addr.isDefault ? '#86efac' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '3px' }}>{addr.recipientName}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Phone size={11} /> {addr.phone}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', background: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <CheckCircle2 size={12} /> Set Default
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', background: '#fff', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
