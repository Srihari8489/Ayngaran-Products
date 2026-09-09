import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  ShieldAlert,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { Brand } from '../types';
import { ImageUploadField } from '../components/ImageUploadField';

export const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    brandCode: '',
    name: '',
    slug: '',
    description: '',
    logo: '',
    isActive: true,
  });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res: any = await adminApi.get('/brands');
      setBrands(res.data || res || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.post('/brands', formData);
      setIsCreateModalOpen(false);
      setFormData({ brandCode: '', name: '', slug: '', description: '', logo: '', isActive: true });
      fetchBrands();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create brand');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setFormError('');
    try {
      await adminApi.patch(`/brands/${selectedBrand.id}`, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        logo: formData.logo,
        isActive: formData.isActive,
      });
      setIsEditModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update brand');
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;
    try {
      await adminApi.delete(`/brands/${brand.id}`);
      fetchBrands();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.brandCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Brands</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage product brands and logos displayed on your store.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              brandCode: `BRD-${Date.now().toString().slice(-4)}`,
              name: '',
              slug: '',
              description: '',
              logo: '',
              isActive: true,
            });
            setIsCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Add Brand</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.2rem' : '0.9rem' }}
            placeholder="Search by brand name or brand code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                color: 'var(--text-muted)',
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

        {search && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active filter:</span>
            <span
              className="badge badge-primary"
              style={{ cursor: 'pointer', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setSearch('')}
            >
              Search: "{search}" <X size={13} />
            </span>
          </div>
        )}
      </div>

      {/* Brands Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Brand Code</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Loading brands...
                  </td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      No matching brands found.
                    </p>
                    {search && (
                      <button onClick={() => setSearch('')} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                        Clear Search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBrands.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {b.logo ? (
                          <img
                            src={b.logo}
                            alt={b.name}
                            style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain', borderRadius: '0.5rem', backgroundColor: '#fff', border: '1px solid var(--border-color)', padding: '0.2rem' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '0.5rem',
                              backgroundColor: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Tag size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.name}</div>
                          {b.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                        {b.brandCode}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {b.slug}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${b.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedBrand(b);
                            setFormData({
                              brandCode: b.brandCode,
                              name: b.name,
                              slug: b.slug,
                              description: b.description || '',
                              logo: b.logo || '',
                              isActive: b.isActive,
                            });
                            setIsEditModalOpen(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.3rem',
                          }}
                          title="Edit brand"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            opacity: 0.8,
                          }}
                          title="Soft delete brand"
                        >
                          <Trash2 size={15} />
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
              Add Brand
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'BRD';
                    const currentCode = formData.brandCode;
                    const suffix = currentCode.split('-').pop() || String(Math.floor(1000 + Math.random() * 9000));
                    setFormData({
                      ...formData,
                      name,
                      brandCode: `BRD-${prefix}-${suffix}`,
                      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                    });
                  }}
                  placeholder="e.g. Apple, Samsung"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Brand Code <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.35rem' }}>(Auto-generated, Immutable)</span>
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  className="form-input"
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155', fontWeight: 700 }}
                  value={formData.brandCode}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Slug
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              {/* Brand Logo Upload Field */}
              <ImageUploadField
                label="Brand Logo"
                description="Upload official brand logo or select from server uploads/ folder"
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                multiple={false}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  style={{ height: '3.5rem', resize: 'none' }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedBrand && (
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
              Edit Brand: {selectedBrand.name}
            </h3>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Slug
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              {/* Brand Logo Upload Field */}
              <ImageUploadField
                label="Brand Logo"
                description="Upload official brand logo or select from server uploads/ folder"
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                multiple={false}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  style={{ height: '3.5rem', resize: 'none' }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
