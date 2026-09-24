import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name && !user.name.startsWith('Customer ') ? user.name : (user?.name || ''),
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name && !user.name.startsWith('Customer ') ? user.name : (user.name || ''),
        email: user.email || '',
      });
    }
  }, [user]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.patch('/auth/customer/profile', {
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
        My Profile
      </h2>

      <div style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 100%)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, border: '2px solid rgba(255,255,255,0.25)' }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.05rem' }}>{user?.name || 'Guest'}</p>
            <p style={{ fontSize: '0.75rem', color: '#86efac', marginTop: '2px', fontFamily: 'monospace' }}>{user?.userCode}</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {user?.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)' }}>
              <Phone size={14} />
              <span>{user.phone}</span>
              <span style={{ background: '#22c55e', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>VERIFIED</span>
            </div>
          )}
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              <Mail size={14} /> {user.email}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.4rem', borderRadius: '0.625rem', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
          <div style={{ position: 'relative' }}>
            <Phone size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
            <input
              type="text"
              value={user?.phone || ''}
              readOnly
              style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.4rem', borderRadius: '0.625rem', border: '1.5px solid #e2e8f0', fontSize: '0.875rem', background: '#f8fafc', color: '#64748b', fontFamily: 'inherit', cursor: 'not-allowed' }}
            />
            <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#22c55e' }}>
              <Shield size={11} /> Verified
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>Phone is your primary login. Contact support to change.</p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Email <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.4rem', borderRadius: '0.625rem', border: '1.5px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
              onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: '0.625rem',
            background: saved ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'all 0.25s',
            boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
          }}
        >
          {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</>}
        </button>
      </form>
    </div>
  );
};
