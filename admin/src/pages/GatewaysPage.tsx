import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import adminApi from '../api/client';
import { PaymentGateway } from '../types';

export const GatewaysPage: React.FC = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    isEnabled: true,
    mode: 'TEST' as 'TEST' | 'LIVE',
    keyId: '',
    secretKey: '',
    webhookSecret: '',
  });

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.get('/payments/admin/gateways');
      setGateways(res.data || res || []);
    } catch (err) {
      console.error('Failed to load gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleOpenEdit = (gw: PaymentGateway) => {
    setSelectedGateway(gw);
    setFormData({
      isEnabled: gw.isEnabled,
      mode: gw.mode,
      keyId: gw.keyId || '',
      secretKey: '',
      webhookSecret: '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;
    setFormError('');
    setSubmitting(true);

    try {
      const payload: any = {
        isEnabled: formData.isEnabled,
        mode: formData.mode,
        keyId: formData.keyId.trim() || undefined,
      };

      if (formData.secretKey.trim()) {
        payload.secretKey = formData.secretKey.trim();
      }
      if (formData.webhookSecret.trim()) {
        payload.webhookSecret = formData.webhookSecret.trim();
      }

      await adminApi.patch(`/payments/admin/gateways/${selectedGateway.id}`, payload);
      setIsEditModalOpen(false);
      fetchGateways();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update gateway settings');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Payment Methods</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Enable and configure checkout payment options (Cash on Delivery, UPI, Cards, NetBanking).
          </p>
        </div>
      </div>

      {/* Security Alert Banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          backgroundColor: '#ecfdf5',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <ShieldCheck size={22} style={{ color: '#059669' }} />
        <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
          <strong>Secure Payment Processing:</strong> Gateway secret keys and credentials are encrypted at rest with bank-grade AES-256 encryption. Plaintext secrets are never exposed to browsers.
        </div>
      </div>

      {/* Gateways Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading payment options...
          </div>
        ) : (
          gateways.map((gw) => (
            <div
              key={gw.id}
              className="glass-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: gw.isEnabled ? '#f59e0b' : '#e2e8f0',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '0.65rem',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{gw.name}</h3>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#b45309' }}>
                        {gw.code}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${gw.isEnabled ? 'badge-success' : 'badge-neutral'}`}>
                    {gw.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem', fontSize: '0.85rem', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Operating Mode</span>
                    <span className={`badge ${gw.mode === 'LIVE' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                      {gw.mode === 'LIVE' ? 'Live Production' : 'Test Sandbox'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Key / Merchant ID</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                      {gw.keyId || 'Not configured'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>API Secret Key</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: gw.hasSecretKey ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                      <Lock size={13} /> {gw.hasSecretKey ? 'Configured & Encrypted' : 'Not Set'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Webhook Secret</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: gw.hasWebhookSecret ? '#16a34a' : '#64748b', fontWeight: 500 }}>
                      <Lock size={13} /> {gw.hasWebhookSecret ? 'Configured & Encrypted' : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleOpenEdit(gw)}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <Edit2 size={14} /> Configure Method
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Gateway Modal */}
      {isEditModalOpen && selectedGateway && (
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
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '32rem', width: '100%', padding: '2rem', borderRadius: '1.25rem', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Configure {selectedGateway.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Enter payment gateway credentials. Secret parameters are encrypted before storage.
            </p>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>Enable Payment Option</span>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Show this option to customers at checkout</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Environment Mode
                </label>
                <select
                  className="form-select"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                >
                  <option value="TEST">Test / Sandbox (Test payments without real money)</option>
                  <option value="LIVE">Live Production (Real customer payments)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Merchant ID / Public Key
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.keyId}
                  onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                  placeholder="e.g. rzp_test_..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Secret Key {selectedGateway.hasSecretKey && <span style={{ color: '#16a34a', fontWeight: 400 }}>(Secret already set, leave empty to keep)</span>}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder={selectedGateway.hasSecretKey ? '••••••••••••••••' : 'Enter secret key'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Webhook Secret (Optional) {selectedGateway.hasWebhookSecret && <span style={{ color: '#16a34a', fontWeight: 400 }}>(Secret set, leave empty to keep)</span>}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.webhookSecret}
                  onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                  placeholder={selectedGateway.hasWebhookSecret ? '••••••••••••••••' : 'Enter webhook secret'}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {submitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
