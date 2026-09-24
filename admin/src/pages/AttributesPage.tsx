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
import { Attribute, AttributeValue, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { Search } from 'lucide-react';
import { AdminModal } from '../components/AdminModal';

export const AttributesPage: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [dataTypeFilter, setDataTypeFilter] = useState('ALL');
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
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (dataTypeFilter !== 'ALL') params.append('dataType', dataTypeFilter);

      const res: any = await adminApi.get(`/attributes?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setAttributes(Array.isArray(items) ? items : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }

      if (items.length > 0 && !selectedAttribute) {
        setSelectedAttribute(items[0]);
      } else if (selectedAttribute) {
        const updated = items.find((a: Attribute) => a.id === selectedAttribute.id);
        if (updated) setSelectedAttribute(updated);
      }
    } catch (err) {
      console.error('Failed to load attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dataTypeFilter]);

  useEffect(() => {
    fetchAttributes();
  }, [page, limit, debouncedSearch, dataTypeFilter]);

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pagination.total} Definitions</span>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', paddingRight: search ? '1.8rem' : '0.6rem', fontSize: '0.8rem', height: '2.2rem' }}
                placeholder="Search specs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.15rem',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              className="form-select"
              value={dataTypeFilter}
              onChange={(e) => setDataTypeFilter(e.target.value)}
              style={{ width: '130px', height: '2.2rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Types</option>
              <option value="SINGLE_SELECT">Select</option>
              <option value="MULTI_SELECT">Multi Select</option>
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="BOOLEAN">Boolean</option>
            </select>
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
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={setLimit}
            loading={loading}
          />
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
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Specification"
        subtitle="Define a new reusable product attribute or specification"
        maxWidth="30rem"
      >
        {formError && (
          <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
      </AdminModal>

      {/* Add Value Modal */}
      <AdminModal
        isOpen={isAddValueModalOpen && !!selectedAttribute}
        onClose={() => setIsAddValueModalOpen(false)}
        title="Add Option"
        subtitle={
          <span>
            For specification: <strong style={{ color: '#0f172a' }}>{selectedAttribute?.name}</strong>
          </span>
        }
        maxWidth="30rem"
      >
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
      </AdminModal>

      {/* Edit Attribute Modal */}
      <AdminModal
        isOpen={isEditAttrModalOpen && !!editingAttr}
        onClose={() => setIsEditAttrModalOpen(false)}
        title="Edit Specification"
        subtitle={
          <span>
            Code: <span style={{ fontFamily: 'var(--font-mono)' }}>{editingAttr?.slug}</span> ({editingAttr?.dataType})
          </span>
        }
        maxWidth="30rem"
      >
        {formError && (
          <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(244,63,94,0.1)', color: '#e11d48', fontSize: '0.82rem' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
      </AdminModal>

      {/* Edit Attribute Value Modal */}
      <AdminModal
        isOpen={isEditValueModalOpen && !!editingValue}
        onClose={() => setIsEditValueModalOpen(false)}
        title="Edit Option Value"
        subtitle="Update option pill display name and internal identifier"
        maxWidth="30rem"
      >
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
      </AdminModal>
    </div>
  );
};

