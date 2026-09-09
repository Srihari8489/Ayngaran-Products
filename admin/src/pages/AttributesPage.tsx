import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Check,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import adminApi from '../api/client';
import { Attribute, AttributeValue } from '../types';

export const AttributesPage: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [isEditAttrModalOpen, setIsEditAttrModalOpen] = useState(false);
  const [isEditValueModalOpen, setIsEditValueModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states
  const [attrForm, setAttrForm] = useState({
    name: '',
    slug: '',
    dataType: 'SINGLE_SELECT' as Attribute['dataType'],
    unit: '',
  });

  const [valueForm, setValueForm] = useState({
    value: '',
    displayName: '',
    sortOrder: 0,
  });

  // Edit form states
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);
  const [editAttrForm, setEditAttrForm] = useState({
    name: '',
    unit: '',
    isActive: true,
  });

  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [editValueForm, setEditValueForm] = useState({
    displayName: '',
    value: '',
    sortOrder: 0,
  });

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.get('/attributes');
      const data = res.data || res || [];
      setAttributes(data);
      if (data.length > 0 && !selectedAttribute) {
        setSelectedAttribute(data[0]);
      } else if (selectedAttribute) {
        const updated = data.find((a: Attribute) => a.id === selectedAttribute.id);
        if (updated) setSelectedAttribute(updated);
      }
    } catch (err) {
      console.error('Failed to load attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.post('/attributes', attrForm);
      setIsCreateModalOpen(false);
      setAttrForm({ name: '', slug: '', dataType: 'SINGLE_SELECT', unit: '' });
      fetchAttributes();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create attribute');
    }
  };

  const handleDeleteAttribute = async (attr: Attribute) => {
    if (!window.confirm(`Are you sure you want to delete specification "${attr.name}"?`)) return;
    try {
      await adminApi.delete(`/attributes/${attr.id}`);
      setSelectedAttribute(null);
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute) return;
    try {
      await adminApi.post(`/attributes/${selectedAttribute.id}/values`, valueForm);
      setIsAddValueModalOpen(false);
      setValueForm({ value: '', displayName: '', sortOrder: 0 });
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add attribute value');
    }
  };

  const handleDeleteValue = async (valId: number) => {
    if (!window.confirm('Delete this attribute value option?')) return;
    try {
      await adminApi.delete(`/attributes/values/${valId}`);
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete value');
    }
  };

  const handleOpenEditAttr = (attr: Attribute) => {
    setEditingAttr(attr);
    setEditAttrForm({
      name: attr.name,
      unit: attr.unit || '',
      isActive: attr.isActive ?? true,
    });
    setFormError('');
    setIsEditAttrModalOpen(true);
  };

  const handleUpdateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttr) return;
    setFormError('');
    try {
      await adminApi.patch(`/attributes/${editingAttr.id}`, editAttrForm);
      setIsEditAttrModalOpen(false);
      fetchAttributes();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update specification');
    }
  };

  const handleOpenEditValue = (val: AttributeValue) => {
    setEditingValue(val);
    setEditValueForm({
      displayName: val.displayName,
      value: val.value,
      sortOrder: val.sortOrder ?? 0,
    });
    setFormError('');
    setIsEditValueModalOpen(true);
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingValue) return;
    try {
      await adminApi.patch(`/attributes/values/${editingValue.id}`, editValueForm);
      setIsEditValueModalOpen(false);
      fetchAttributes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update option value');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Product Specifications & Filters</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Create specifications like Color, Storage, RAM, and Brand to use for product details and store filters.
          </p>
        </div>

        <button
          onClick={() => {
            setAttrForm({ name: '', slug: '', dataType: 'SINGLE_SELECT', unit: '' });
            setIsCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Add Specification</span>
        </button>
      </div>

      {/* Grid Layout: Attribute List on Left, Predefined Options on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)', gap: '1.5rem' }}>
        {/* Left Column: Attributes Table */}
        <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Specifications List</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attributes.length} Definitions</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Type</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Loading attributes...
                    </td>
                  </tr>
                ) : attributes.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No attributes created yet.
                    </td>
                  </tr>
                ) : (
                  attributes.map((attr) => {
                    const isSelected = selectedAttribute?.id === attr.id;
                    return (
                      <tr
                        key={attr.id}
                        onClick={() => setSelectedAttribute(attr)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.1)' : undefined,
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{attr.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {attr.slug}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                            {attr.dataType}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                            {attr.unit || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAttr(attr);
                              }}
                              style={{
                                background: '#fef3c7',
                                border: 'none',
                                color: '#b45309',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '0.375rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Edit specification"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAttribute(attr);
                              }}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#e11d48',
                                cursor: 'pointer',
                                padding: '0.35rem',
                                borderRadius: '0.375rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete attribute"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Predefined Options for Selected Attribute */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {selectedAttribute ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedAttribute.name} Options
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Options used in product variant selections and customer filters
                  </p>
                </div>

                {['SINGLE_SELECT', 'MULTI_SELECT'].includes(selectedAttribute.dataType) && (
                  <button
                    onClick={() => {
                      setValueForm({ value: '', displayName: '', sortOrder: 0 });
                      setIsAddValueModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Plus size={14} /> Add Value
                  </button>
                )}
              </div>

              {!['SINGLE_SELECT', 'MULTI_SELECT'].includes(selectedAttribute.dataType) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  This attribute type is <strong>{selectedAttribute.dataType}</strong>. Products accept freeform numeric or text values directly without predefined option pills.
                </div>
              ) : !selectedAttribute.values || selectedAttribute.values.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No predefined values registered. Click "Add Value" to define allowed options (e.g. 128GB, 256GB).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedAttribute.values.map((val) => (
                    <div
                      key={val.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.6rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                          {val.displayName}
                        </span>
                        <span
                          style={{
                            marginLeft: '0.65rem',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          value: "{val.value}"
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenEditValue(val)}
                          style={{
                            background: '#fef3c7',
                            border: 'none',
                            color: '#b45309',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            borderRadius: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Edit option value"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteValue(val.id)}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            color: '#e11d48',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            borderRadius: '0.35rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete value option"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select an attribute from the directory to inspect and configure predefined values.
            </div>
          )}
        </div>
      </div>

      {/* Create Attribute Modal */}
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
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '28rem', width: '100%', padding: '2rem', borderRadius: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
              Add Specification
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAttribute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Attribute Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={attrForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setAttrForm({
                      ...attrForm,
                      name,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    });
                  }}
                  placeholder="e.g. Battery Capacity"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Slug (Unique Key) *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={attrForm.slug}
                  onChange={(e) => setAttrForm({ ...attrForm, slug: e.target.value })}
                  placeholder="e.g. battery-capacity"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Data Type *
                </label>
                <select
                  className="form-select"
                  value={attrForm.dataType}
                  onChange={(e) => setAttrForm({ ...attrForm, dataType: e.target.value as any })}
                >
                  <option value="SINGLE_SELECT">SINGLE_SELECT (Pill / Option Choice)</option>
                  <option value="MULTI_SELECT">MULTI_SELECT (Checkboxes)</option>
                  <option value="TEXT">TEXT (Freeform String)</option>
                  <option value="NUMBER">NUMBER (Numeric specification)</option>
                  <option value="BOOLEAN">BOOLEAN (True / False toggle)</option>
                  <option value="RANGE">RANGE (Numeric range)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Unit of Measurement (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={attrForm.unit}
                  onChange={(e) => setAttrForm({ ...attrForm, unit: e.target.value })}
                  placeholder="e.g. mAh, GB, inch, kg"
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
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Value Modal */}
      {isAddValueModalOpen && selectedAttribute && (
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
          <div className="glass-panel animate-fadeIn" style={{ maxWidth: '28rem', width: '100%', padding: '2rem', borderRadius: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Add Option
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              For specification: <strong style={{ color: '#0f172a' }}>{selectedAttribute.name}</strong>
            </p>

            <form onSubmit={handleAddValue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Display Label *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={valueForm.displayName}
                  onChange={(e) => {
                    const disp = e.target.value;
                    setValueForm({
                      ...valueForm,
                      displayName: disp,
                      value: disp.trim(),
                    });
                  }}
                  placeholder="e.g. 128 GB or Titanium Blue"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Internal Value (Stored Key) *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={valueForm.value}
                  onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                  placeholder="e.g. 128GB or titanium_blue"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={valueForm.sortOrder}
                  onChange={(e) => setValueForm({ ...valueForm, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddValueModalOpen(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  Add Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attribute Modal */}
      {isEditAttrModalOpen && editingAttr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Edit Specification</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Code: <span style={{ fontFamily: 'var(--font-mono)' }}>{editingAttr.slug}</span> ({editingAttr.dataType})
                </p>
              </div>
              <button
                onClick={() => setIsEditAttrModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(244,63,94,0.1)', color: '#e11d48', fontSize: '0.82rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateAttribute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Specification Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editAttrForm.name}
                  onChange={(e) => setEditAttrForm({ ...editAttrForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Measurement Unit (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editAttrForm.unit}
                  onChange={(e) => setEditAttrForm({ ...editAttrForm, unit: e.target.value })}
                  placeholder="e.g. g, kg, ml, L, pcs"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="checkbox"
                  id="attrIsActive"
                  checked={editAttrForm.isActive}
                  onChange={(e) => setEditAttrForm({ ...editAttrForm, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-amber)' }}
                />
                <label htmlFor="attrIsActive" style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500, cursor: 'pointer' }}>
                  Active in store and filter panels
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditAttrModalOpen(false)}
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

      {/* Edit Attribute Value Modal */}
      {isEditValueModalOpen && editingValue && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Edit Option Value</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Update option pill display name and internal identifier
                </p>
              </div>
              <button
                onClick={() => setIsEditValueModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateValue} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Display Name (Customer Facing) *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editValueForm.displayName}
                  onChange={(e) => setEditValueForm({ ...editValueForm, displayName: e.target.value })}
                  placeholder="e.g. 100 g or 1 Kg"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Internal Value (Code/Slug) *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editValueForm.value}
                  onChange={(e) => setEditValueForm({ ...editValueForm, value: e.target.value })}
                  placeholder="e.g. 100g or 1kg"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={editValueForm.sortOrder}
                  onChange={(e) => setEditValueForm({ ...editValueForm, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditValueModalOpen(false)}
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

