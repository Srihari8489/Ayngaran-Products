import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Trash2, Percent } from 'lucide-react';

export interface GstSlab {
  rate: number;
  label: string;
  isStandard?: boolean;
}

const DEFAULT_STANDARD_SLABS: GstSlab[] = [
  { rate: 0, label: '0% (Exempt / Nil Rated / Essential Goods)', isStandard: true },
  { rate: 5, label: '5% (Traditional Foods / Herbal / Edible Oils)', isStandard: true },
  { rate: 12, label: '12% (Processed Food / Specialties)', isStandard: true },
  { rate: 18, label: '18% (Standard / General Goods)', isStandard: true },
  { rate: 28, label: '28% (Luxury / Aerated / High Tier)', isStandard: true },
];

const STORAGE_KEY = 'ayngaran_custom_gst_slabs';

export const getStoredGstSlabs = (): GstSlab[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STANDARD_SLABS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_STANDARD_SLABS;

    // Merge standard slabs with custom slabs, ensuring uniqueness by rate
    const map = new Map<number, GstSlab>();
    DEFAULT_STANDARD_SLABS.forEach((s) => map.set(s.rate, s));
    parsed.forEach((s: any) => {
      if (typeof s?.rate === 'number' && !isNaN(s.rate)) {
        map.set(s.rate, {
          rate: s.rate,
          label: s.label || `${s.rate}% Custom Rate`,
          isStandard: false,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.rate - b.rate);
  } catch (err) {
    console.error('Failed to parse custom GST slabs from storage:', err);
    return DEFAULT_STANDARD_SLABS;
  }
};

export const saveCustomGstSlab = (rate: number, label?: string): GstSlab[] => {
  const current = getStoredGstSlabs();
  const customList = current.filter((s) => !s.isStandard);
  const exists = customList.find((s) => s.rate === rate);

  const cleanLabel = label?.trim() ? `${rate}% (${label.trim()})` : `${rate}% (Custom Rate)`;

  let updatedCustom: GstSlab[];
  if (exists) {
    updatedCustom = customList.map((s) => (s.rate === rate ? { ...s, label: cleanLabel } : s));
  } else {
    updatedCustom = [...customList, { rate, label: cleanLabel, isStandard: false }];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
    window.dispatchEvent(new Event('gst_slabs_updated'));
  } catch (err) {
    console.error('Failed to save custom GST slab:', err);
  }

  return getStoredGstSlabs();
};

export const deleteCustomGstSlab = (rate: number): GstSlab[] => {
  const current = getStoredGstSlabs();
  const updatedCustom = current.filter((s) => !s.isStandard && s.rate !== rate);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustom));
    window.dispatchEvent(new Event('gst_slabs_updated'));
  } catch (err) {
    console.error('Failed to delete custom GST slab:', err);
  }
  return getStoredGstSlabs();
};

interface DynamicGstSelectProps {
  value: number;
  onChange: (rate: number) => void;
  label?: string;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
  showManagement?: boolean;
}

export const DynamicGstSelect: React.FC<DynamicGstSelectProps> = ({
  value,
  onChange,
  label = 'Default GST Rate (%) *',
  required = true,
  style,
  className = 'form-select',
  showManagement = true,
}) => {
  const [slabs, setSlabs] = useState<GstSlab[]>(getStoredGstSlabs());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRateInput, setNewRateInput] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [addError, setAddError] = useState('');

  const reloadSlabs = () => {
    setSlabs(getStoredGstSlabs());
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      reloadSlabs();
    };
    window.addEventListener('gst_slabs_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('gst_slabs_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__ADD_NEW__') {
      setIsAddingNew(true);
      return;
    }
    const num = Number(selected);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleAddNewRate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddError('');

    const rateNum = parseFloat(newRateInput);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setAddError('Please enter a valid rate between 0 and 100');
      return;
    }

    saveCustomGstSlab(rateNum, newLabelInput);
    setSlabs(getStoredGstSlabs());
    onChange(rateNum);
    setIsAddingNew(false);
    setNewRateInput('');
    setNewLabelInput('');
  };

  const handleDeleteCustomRate = (rateToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Remove custom GST slab (${rateToDelete}%) from the list?`)) {
      deleteCustomGstSlab(rateToDelete);
      setSlabs(getStoredGstSlabs());
      if (value === rateToDelete) {
        onChange(0);
      }
    }
  };

  // Ensure current value is in slabs list (in case it came from database with non-standard value)
  const allRates = [...slabs];
  const valueNum = Number(value ?? 0);
  const hasCurrentValue = allRates.some((s) => s.rate === valueNum);
  if (!hasCurrentValue && !isNaN(valueNum)) {
    allRates.push({
      rate: valueNum,
      label: `${valueNum}% (Existing Applied Rate)`,
      isStandard: false,
    });
    allRates.sort((a, b) => a.rate - b.rate);
  }

  const customSlabs = slabs.filter((s) => !s.isStandard);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {label && (
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
            {label}
          </label>
        )}
        {showManagement && !isAddingNew && (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(true);
              setNewRateInput('');
              setNewLabelInput('');
              setAddError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#b45309',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.1rem 0.35rem',
              borderRadius: '0.35rem',
            }}
          >
            <Plus size={13} />
            <span>Add New GST Rate</span>
          </button>
        )}
      </div>

      <select
        className={className}
        value={valueNum}
        onChange={handleSelectChange}
        required={required}
      >
        {allRates.map((slab) => (
          <option key={slab.rate} value={slab.rate}>
            {slab.label}
          </option>
        ))}
        {showManagement && (
          <option value="__ADD_NEW__">
            ➕ + Add Custom GST Rate...
          </option>
        )}
      </select>

      {/* Inline Form to Add New GST Rate */}
      {isAddingNew && (
        <div
          style={{
            marginTop: '0.4rem',
            padding: '0.85rem',
            borderRadius: '0.75rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Percent size={14} style={{ color: '#b45309' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                Add Custom GST Slab
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setAddError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#92400e',
                cursor: 'pointer',
                padding: '0.15rem',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {addError && (
            <div style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 600 }}>
              {addError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#78350f', fontWeight: 600, marginBottom: '0.2rem' }}>
                GST % *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                placeholder="e.g. 3 or 7.5"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.55rem', backgroundColor: '#ffffff' }}
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewRate();
                  }
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#78350f', fontWeight: 600, marginBottom: '0.2rem' }}>
                Tag / Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Gold / Gems / Special Goods"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.55rem', backgroundColor: '#ffffff' }}
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewRate();
                  }
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setAddError('');
              }}
              className="btn-secondary"
              style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAddNewRate()}
              className="btn-primary"
              style={{ fontSize: '0.76rem', padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Check size={13} />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      )}

      {/* List of custom slabs with ability to delete */}
      {showManagement && customSlabs.length > 0 && !isAddingNew && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', alignSelf: 'center' }}>Custom Slabs:</span>
          {customSlabs.map((s) => (
            <span
              key={s.rate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: valueNum === s.rate ? '#fef3c7' : '#f1f5f9',
                color: valueNum === s.rate ? '#92400e' : '#475569',
                border: valueNum === s.rate ? '1px solid #fde68a' : '1px solid #e2e8f0',
                padding: '0.1rem 0.4rem',
                borderRadius: '0.375rem',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {s.rate}%
              <button
                type="button"
                onClick={(e) => handleDeleteCustomRate(s.rate, e)}
                title={`Delete ${s.rate}% custom slab`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
