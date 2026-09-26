import React, { useState, useEffect } from 'react';
import {
  Truck,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Weight,
  DollarSign,
  ShieldAlert,
  Info,
} from 'lucide-react';
import adminApi from '../api/client';

export const ShippingSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    tamilNaduRatePerKg: 60,
    tamilNaduDeliveryTime: 'Within 2 days',
    outsideTnRatePerKg: 120,
    outsideTnMinDays: 3,
    outsideTnMaxDays: 5,
    outsideTnDeliveryTime: '3-5 days',
    baseWeightGrams: 1000,
    isActive: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data: any = await adminApi.get('/admin/shipping/settings');
      if (data) {
        setForm({
          tamilNaduRatePerKg: Number(data.tamilNaduRatePerKg ?? 60),
          tamilNaduDeliveryTime: data.tamilNaduDeliveryTime || 'Within 2 days',
          outsideTnRatePerKg: Number(data.outsideTnRatePerKg ?? 120),
          outsideTnMinDays: Number(data.outsideTnMinDays ?? 3),
          outsideTnMaxDays: Number(data.outsideTnMaxDays ?? 5),
          outsideTnDeliveryTime: data.outsideTnDeliveryTime || '3-5 days',
          baseWeightGrams: Number(data.baseWeightGrams ?? 1000),
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        });
      }
    } catch (err: any) {
      console.error('Failed to load shipping settings:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load shipping configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (form.tamilNaduRatePerKg < 0 || isNaN(form.tamilNaduRatePerKg)) {
      errors.tamilNaduRatePerKg = 'Rate must be greater than or equal to ₹0';
    }

    if (!form.tamilNaduDeliveryTime.trim()) {
      errors.tamilNaduDeliveryTime = 'Delivery time description is required';
    }

    if (form.outsideTnRatePerKg < 0 || isNaN(form.outsideTnRatePerKg)) {
      errors.outsideTnRatePerKg = 'Rate must be greater than or equal to ₹0';
    }

    if (form.outsideTnMinDays < 1 || isNaN(form.outsideTnMinDays)) {
      errors.outsideTnMinDays = 'Minimum delivery days must be at least 1';
    }

    if (form.outsideTnMaxDays < 1 || isNaN(form.outsideTnMaxDays)) {
      errors.outsideTnMaxDays = 'Maximum delivery days must be at least 1';
    }

    if (Number(form.outsideTnMinDays) > Number(form.outsideTnMaxDays)) {
      errors.outsideTnMinDays = 'Minimum days cannot be greater than maximum days';
      errors.outsideTnMaxDays = 'Maximum days must be greater than or equal to minimum days';
    }

    if (form.baseWeightGrams <= 0 || isNaN(form.baseWeightGrams)) {
      errors.baseWeightGrams = 'Base weight must be greater than 0 grams';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const computedOutsideDeliveryTime =
        form.outsideTnDeliveryTime.trim() ||
        `${form.outsideTnMinDays}-${form.outsideTnMaxDays} days`;

      const payload = {
        tamilNaduRatePerKg: Number(form.tamilNaduRatePerKg),
        tamilNaduDeliveryTime: form.tamilNaduDeliveryTime.trim(),
        outsideTnRatePerKg: Number(form.outsideTnRatePerKg),
        outsideTnMinDays: Number(form.outsideTnMinDays),
        outsideTnMaxDays: Number(form.outsideTnMaxDays),
        outsideTnDeliveryTime: computedOutsideDeliveryTime,
        baseWeightGrams: Number(form.baseWeightGrams),
        isActive: form.isActive,
      };

      const res: any = await adminApi.put('/admin/shipping/settings', payload);
      setSuccessMessage('Shipping configuration saved successfully! New checkouts and orders will use these settings.');

      if (res) {
        setForm((prev) => ({
          ...prev,
          tamilNaduRatePerKg: Number(res.tamilNaduRatePerKg),
          tamilNaduDeliveryTime: res.tamilNaduDeliveryTime,
          outsideTnRatePerKg: Number(res.outsideTnRatePerKg),
          outsideTnMinDays: Number(res.outsideTnMinDays),
          outsideTnMaxDays: Number(res.outsideTnMaxDays),
          outsideTnDeliveryTime: res.outsideTnDeliveryTime,
          baseWeightGrams: Number(res.baseWeightGrams),
        }));
      }

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Failed to update shipping settings:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save shipping settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Loading shipping configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}>
            <Truck size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Shipping Configuration
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
              Manage weight-based delivery rates and timelines for Tamil Nadu and interstate orders
            </p>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div style={{ marginBottom: '1.25rem', padding: '0.9rem 1.25rem', background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#065f46', fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle size={18} color="#059669" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div style={{ marginBottom: '1.25rem', padding: '0.9rem 1.25rem', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b', fontSize: '0.9rem', fontWeight: 600 }}>
          <AlertCircle size={18} color="#dc2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* SECTION 1: TAMIL NADU ZONE */}
        <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3d2b', margin: 0 }}>
                Tamil Nadu (Intrastate Zone)
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
              Seller State: TN (Code 33)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Rate per 1 KG */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Rate per 1 KG (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.tamilNaduRatePerKg}
                  onChange={(e) => setForm({ ...form, tamilNaduRatePerKg: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2rem',
                    borderRadius: '0.5rem',
                    border: validationErrors.tamilNaduRatePerKg ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>
              {validationErrors.tamilNaduRatePerKg && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  {validationErrors.tamilNaduRatePerKg}
                </p>
              )}
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Default: ₹60 per 1,000g slab (1-1000g = ₹60, 1001-2000g = ₹120, etc.)
              </p>
            </div>

            {/* Delivery Time */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Delivery Time <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                  <Clock size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Within 2 days"
                  value={form.tamilNaduDeliveryTime}
                  onChange={(e) => setForm({ ...form, tamilNaduDeliveryTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                    borderRadius: '0.5rem',
                    border: validationErrors.tamilNaduDeliveryTime ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
              {validationErrors.tamilNaduDeliveryTime && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  {validationErrors.tamilNaduDeliveryTime}
                </p>
              )}
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Shown to customer during checkout and order tracking
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: OUTSIDE TAMIL NADU ZONE */}
        <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3d2b', margin: 0 }}>
                Outside Tamil Nadu (Interstate Zone)
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
              All other Indian States & UTs
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Rate per 1 KG */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Rate per 1 KG (₹) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.outsideTnRatePerKg}
                  onChange={(e) => setForm({ ...form, outsideTnRatePerKg: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2rem',
                    borderRadius: '0.5rem',
                    border: validationErrors.outsideTnRatePerKg ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>
              {validationErrors.outsideTnRatePerKg && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                  {validationErrors.outsideTnRatePerKg}
                </p>
              )}
              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                Default: ₹120 per 1,000g slab (1-1000g = ₹120, 1001-2000g = ₹240, etc.)
              </p>
            </div>

            {/* Min & Max Days */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Min Days <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.outsideTnMinDays}
                  onChange={(e) => {
                    const min = parseInt(e.target.value, 10) || 1;
                    setForm({
                      ...form,
                      outsideTnMinDays: min,
                      outsideTnDeliveryTime: `${min}-${form.outsideTnMaxDays} days`,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: validationErrors.outsideTnMinDays ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
                {validationErrors.outsideTnMinDays && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                    {validationErrors.outsideTnMinDays}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Max Days <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.outsideTnMaxDays}
                  onChange={(e) => {
                    const max = parseInt(e.target.value, 10) || 1;
                    setForm({
                      ...form,
                      outsideTnMaxDays: max,
                      outsideTnDeliveryTime: `${form.outsideTnMinDays}-${max} days`,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: validationErrors.outsideTnMaxDays ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
                {validationErrors.outsideTnMaxDays && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                    {validationErrors.outsideTnMaxDays}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: BASE WEIGHT CONFIGURATION */}
        <div style={{ background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <Weight size={18} color="#059669" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3d2b', margin: 0 }}>
              Weight Slab Unit Configuration
            </h2>
          </div>

          <div style={{ maxWidth: '380px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Base Weight Slab (in Grams) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="100"
                step="50"
                value={form.baseWeightGrams}
                onChange={(e) => setForm({ ...form, baseWeightGrams: parseInt(e.target.value, 10) || 1000 })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: validationErrors.baseWeightGrams ? '1.5px solid #dc2626' : '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b', fontSize: '0.85rem' }}>
                grams ({(form.baseWeightGrams / 1000).toFixed(1)} KG)
              </span>
            </div>
            {validationErrors.baseWeightGrams && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                {validationErrors.baseWeightGrams}
              </p>
            )}
            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
              Every fraction or multiple of this weight counts as 1 billable unit. Default: 1000g (1 KG).
            </p>
          </div>
        </div>

        {/* LIVE CALCULATION PREVIEW */}
        <div style={{ background: '#f8fafc', borderRadius: '1rem', border: '1.5px dashed #cbd5e1', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', color: '#334155', fontSize: '0.85rem', fontWeight: 800 }}>
            <Info size={16} color="#0284c7" /> Live Slab Simulation Matrix
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#e2e8f0', color: '#1e293b' }}>
                  <th style={{ padding: '8px 12px', borderRadius: '6px 0 0 6px' }}>Order Weight</th>
                  <th style={{ padding: '8px 12px' }}>Billable Slab</th>
                  <th style={{ padding: '8px 12px' }}>Tamil Nadu Shipping</th>
                  <th style={{ padding: '8px 12px', borderRadius: '0 6px 6px 0' }}>Outside Tamil Nadu Shipping</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { wt: 500, label: '500g' },
                  { wt: 1000, label: '1000g (1 KG)' },
                  { wt: 1200, label: '1200g (1.2 KG)' },
                  { wt: 2000, label: '2000g (2 KG)' },
                  { wt: 2500, label: '2500g (2.5 KG)' },
                ].map((sample, idx) => {
                  const base = form.baseWeightGrams > 0 ? form.baseWeightGrams : 1000;
                  const units = Math.max(1, Math.ceil(sample.wt / base));
                  const tnCost = units * form.tamilNaduRatePerKg;
                  const outsideCost = units * form.outsideTnRatePerKg;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sample.label}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>
                        {units} unit{units > 1 ? 's' : ''} ({units * (base / 1000)} KG)
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: '#166534' }}>₹{tnCost}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0369a1' }}>₹{outsideCost}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.8rem 2rem',
              borderRadius: '0.6rem',
              background: '#1a3d2b',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Save size={18} />
            {saving ? 'Saving Settings...' : 'Save Shipping Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
