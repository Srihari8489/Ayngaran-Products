import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Sliders,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import adminApi from '../api/client';
import { Category, Attribute, PaginationMeta } from '../types';
import { ImageUploadField } from '../components/ImageUploadField';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { Search, LayoutList } from 'lucide-react';
import { AdminModal } from '../components/AdminModal';
import { DynamicGstSelect } from '../components/DynamicGstSelect';

export const CategoriesPage: React.FC = () => {
  const [categoriesTree, setCategoriesTree] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [inheritedAttributes, setInheritedAttributes] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [attrLoading, setAttrLoading] = useState(false);

  // Table view & server pagination states
  const [viewMode, setViewMode] = useState<'TREE' | 'TABLE'>('TABLE');
  const [tableCategories, setTableCategories] = useState<Category[]>([]);
  const [tablePagination, setTablePagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [tablePage, setTablePage] = useState(1);
  const [tableLimit, setTableLimit] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tableLoading, setTableLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMapAttrModalOpen, setIsMapAttrModalOpen] = useState(false);
  const [isEditingMapping, setIsEditingMapping] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    categoryCode: '',
    slug: '',
    description: '',
    image: '',
    parentId: '' as string | number,
    sortOrder: 0,
    gstRate: 0,
    isActive: true,
  });

  // Map attribute form
  const [mapAttrData, setMapAttrData] = useState({
    attributeId: '',
    isRequired: false,
    isFilterable: true,
    isVariant: false,
    sortOrder: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [treeRes, flatRes, attrRes]: any = await Promise.all([
        adminApi.get('/categories/tree'),
        adminApi.get('/categories'),
        adminApi.get('/attributes'),
      ]);

      const tree = treeRes.data || treeRes || [];
      const flat = flatRes.data || flatRes || [];
      const attrs = attrRes.data || attrRes || [];

      setCategoriesTree(tree);
      setFlatCategories(flat);
      setAllAttributes(attrs);

      // Expand root nodes by default
      const initialExpanded: Record<number, boolean> = {};
      tree.forEach((c: Category) => {
        initialExpanded[c.id] = true;
      });
      setExpandedNodes(initialExpanded);

      if (tree.length > 0 && !selectedCategory) {
        handleSelectCategory(tree[0]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableCategories = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(tablePage));
      params.append('limit', String(tableLimit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res: any = await adminApi.get(`/categories?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setTableCategories(Array.isArray(items) ? items : []);
      if (res?.pagination) {
        setTablePagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load table categories:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setTablePage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchTableCategories();
  }, [tablePage, tableLimit, debouncedSearch, statusFilter]);

  const handleSelectCategory = async (cat: Category) => {
    setSelectedCategory(cat);
    try {
      setAttrLoading(true);
      const res: any = await adminApi.get(`/categories/${cat.id}/attributes`);
      setInheritedAttributes(res.data || res || []);
    } catch (err) {
      console.error('Failed to load inherited attributes:', err);
    } finally {
      setAttrLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await adminApi.post('/categories', {
        ...formData,
        parentId: formData.parentId ? Number(formData.parentId) : null,
        gstRate: Number(formData.gstRate ?? 0),
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        categoryCode: '',
        slug: '',
        description: '',
        image: '',
        parentId: '',
        sortOrder: 0,
        gstRate: 0,
        isActive: true,
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    setFormError('');
    try {
      await adminApi.patch(`/categories/${selectedCategory.id}`, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        image: formData.image,
        parentId: formData.parentId ? Number(formData.parentId) : null,
        sortOrder: formData.sortOrder,
        gstRate: Number(formData.gstRate ?? 0),
        isActive: formData.isActive,
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to soft-delete "${cat.name}"? Historical code "${cat.categoryCode}" will remain reserved.`)) {
      return;
    }
    try {
      await adminApi.delete(`/categories/${cat.id}`);
      setSelectedCategory(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleMapAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !mapAttrData.attributeId) return;
    try {
      await adminApi.post(`/categories/${selectedCategory.id}/attributes`, {
        attributeId: Number(mapAttrData.attributeId),
        isRequired: mapAttrData.isRequired,
        isFilterable: mapAttrData.isFilterable,
        isVariant: mapAttrData.isVariant,
        sortOrder: mapAttrData.sortOrder,
      });
      setIsMapAttrModalOpen(false);
      handleSelectCategory(selectedCategory);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to map attribute');
    }
  };

  const handleUnmapAttribute = async (attributeId: number) => {
    if (!selectedCategory) return;
    if (!window.confirm('Remove this attribute mapping from the category?')) return;
    try {
      await adminApi.delete(`/categories/${selectedCategory.id}/attributes/${attributeId}`);
      handleSelectCategory(selectedCategory);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unmap attribute');
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: Category, level: number = 0) => {
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedCategory?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${level * 1.25}rem` }}>
        <div
          onClick={() => handleSelectCategory(node)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.75rem',
            borderRadius: '0.65rem',
            cursor: 'pointer',
            backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            border: isSelected ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
            marginBottom: '0.25rem',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.15rem',
                }}
              >
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <span style={{ width: '15px' }} />
            )}

            <FolderTree
              size={16}
              style={{ color: isSelected ? 'var(--accent-amber)' : 'var(--text-muted)' }}
            />
            <span style={{ fontSize: '0.86rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#b45309' : '#0f172a' }}>
              {node.name}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                backgroundColor: '#f1f5f9',
                padding: '0.1rem 0.35rem',
                borderRadius: '0.3rem',
              }}
            >
              {node.categoryCode}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}
            >
              L{level + 1}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginTop: '0.15rem' }}>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Product Categories</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Organize your store items into categories and assign custom specifications.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                backgroundColor: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <LayoutList size={14} /> Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TREE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                backgroundColor: viewMode === 'TREE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TREE' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: viewMode === 'TREE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <FolderTree size={14} /> Tree & Specs
            </button>
          </div>

          <button
            onClick={() => {
              setFormData({
                name: '',
                categoryCode: `CAT-${Date.now().toString().slice(-4)}`,
                slug: '',
                description: '',
                image: '',
                parentId: '',
                sortOrder: 0,
                gstRate: 0,
                isActive: true,
              });
              setIsCreateModalOpen(true);
            }}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {viewMode === 'TABLE' ? (
        /* TABLE VIEW with Server Pagination, Search, and Status Filter */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search & Filter Toolbar */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.2rem' : '0.9rem' }}
                placeholder="Search categories by name, code, slug, description..."
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
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={{ width: '160px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Code</th>
                    <th>Slug</th>
                    <th>Default GST</th>
                    <th>Parent Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        Loading categories...
                      </td>
                    </tr>
                  ) : tableCategories.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    tableCategories.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.name}
                                style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border-color)' }}
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
                                <FolderTree size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{c.name}</div>
                              {c.description && (
                                <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                            {c.categoryCode}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#64748b' }}>
                            {c.slug}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            GST {c.gstRate ?? 5}%
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                            {c.parent ? c.parent.name : '— (Root)'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${c.isActive ? 'badge-success' : 'badge-neutral'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c);
                                setFormData({
                                  name: c.name,
                                  categoryCode: c.categoryCode,
                                  slug: c.slug,
                                  description: c.description || '',
                                  image: c.image || '',
                                  parentId: c.parentId || '',
                                  sortOrder: c.sortOrder || 0,
                                  gstRate: c.gstRate !== undefined && c.gstRate !== null ? Number(c.gstRate) : 5,
                                  isActive: c.isActive,
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c);
                                setViewMode('TREE');
                                handleSelectCategory(c);
                              }}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              title="Configure specs in tree view"
                            >
                              <Sliders size={13} /> Specs
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={tablePagination}
              onPageChange={setTablePage}
              onLimitChange={setTableLimit}
              loading={tableLoading}
            />
          </div>
        </div>
      ) : (
      /* Main Grid: Tree Visualizer on Left, Detail & Attribute Inheritance on Right */
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.3fr)', gap: '1.5rem' }}>
        {/* Left Column: Tree Visualizer */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Categories List</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{flatCategories.length} Categories</span>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading hierarchy tree...
            </div>
          ) : categoriesTree.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No categories configured yet. Create a root category to start.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '600px' }}>
              {categoriesTree.map((rootNode) => renderTreeNode(rootNode, 0))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Category Details & Attribute Inheritance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedCategory ? (
            <>
              {/* Category Info Card */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {selectedCategory.image && (
                      <div style={{ width: '4rem', height: '4rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#fff', flexShrink: 0 }}>
                        <img src={selectedCategory.image} alt={selectedCategory.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Selected Category
                      </span>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.2rem' }}>
                        {selectedCategory.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Code: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedCategory.categoryCode}</strong>
                        </span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Slug: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{selectedCategory.slug}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setFormData({
                          name: selectedCategory.name,
                          categoryCode: selectedCategory.categoryCode,
                          slug: selectedCategory.slug,
                          description: selectedCategory.description || '',
                          image: selectedCategory.image || '',
                          parentId: selectedCategory.parentId || '',
                          sortOrder: selectedCategory.sortOrder || 0,
                          gstRate: selectedCategory.gstRate !== undefined ? Number(selectedCategory.gstRate) : 5,
                          isActive: selectedCategory.isActive,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                      title="Edit Category"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(selectedCategory)}
                      className="btn-danger"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
                      title="Soft Delete Category"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {selectedCategory.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              {/* Dynamic Inherited Attributes Engine Card */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      Category Specifications & Filters
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Specifications and search filters active for products in this category
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMapAttrData({
                        attributeId: allAttributes.length > 0 ? String(allAttributes[0].id) : '',
                        isRequired: false,
                        isFilterable: true,
                        isVariant: false,
                        sortOrder: 0,
                      });
                      setIsEditingMapping(false);
                      setIsMapAttrModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Plus size={14} /> Add Specification
                  </button>
                </div>

                {attrLoading ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Loading specifications...
                  </div>
                ) : inheritedAttributes.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No specifications added yet. Click "Add Specification" to set filters for this category.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {inheritedAttributes.map((attrItem: any) => {
                      const isDirect = attrItem.inheritedFromCategory?.id === selectedCategory.id;

                      return (
                        <div
                          key={attrItem.attributeId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            borderRadius: '0.65rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>
                                {attrItem.name}
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                {attrItem.dataType}
                              </span>
                              {isDirect ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Direct</span>
                              ) : (
                                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                                  From {attrItem.inheritedFromCategory?.name}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>Required: <strong style={{ color: attrItem.isRequired ? '#059669' : '#475569' }}>{attrItem.isRequired ? 'Yes' : 'No'}</strong></span>
                              <span>•</span>
                              <span>Filterable: <strong style={{ color: attrItem.isFilterable ? '#b45309' : '#475569' }}>{attrItem.isFilterable ? 'Yes' : 'No'}</strong></span>
                              <span>•</span>
                              <span>Variant Dimension: <strong style={{ color: attrItem.isVariant ? '#4f46e5' : '#475569' }}>{attrItem.isVariant ? 'Yes' : 'No'}</strong></span>
                            </div>
                          </div>

                          {isDirect && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button
                                onClick={() => {
                                  setMapAttrData({
                                    attributeId: String(attrItem.attributeId),
                                    isRequired: Boolean(attrItem.isRequired),
                                    isFilterable: Boolean(attrItem.isFilterable),
                                    isVariant: Boolean(attrItem.isVariant),
                                    sortOrder: attrItem.sortOrder ?? 0,
                                  });
                                  setIsEditingMapping(true);
                                  setIsMapAttrModalOpen(true);
                                }}
                                style={{
                                  background: '#fef3c7',
                                  border: 'none',
                                  color: '#b45309',
                                  cursor: 'pointer',
                                  padding: '0.35rem',
                                  borderRadius: '0.35rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Edit Specification Settings for this Category"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleUnmapAttribute(attrItem.attributeId)}
                                style={{
                                  background: '#fee2e2',
                                  border: 'none',
                                  color: '#e11d48',
                                  cursor: 'pointer',
                                  padding: '0.35rem',
                                  borderRadius: '0.35rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Unmap Attribute from this Category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a category on the left to inspect its details and inherited attribute specifications.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Create Category Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Category"
        subtitle="Create a new root or sub-category in the catalog hierarchy"
        maxWidth="34rem"
      >
        {formError && (
          <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Category Name *
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CAT';
                  const currentCode = formData.categoryCode;
                  const suffix = currentCode.split('-').pop() || String(Math.floor(1000 + Math.random() * 9000));
                  setFormData({
                    ...formData,
                    name,
                    categoryCode: `CAT-${prefix}-${suffix}`,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                  });
                }}
                placeholder="e.g. Gaming Laptops"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Category Code <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.35rem' }}>(Auto-generated)</span>
              </label>
              <input
                type="text"
                disabled
                readOnly
                className="form-input"
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155', fontWeight: 700 }}
                value={formData.categoryCode}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Parent Node (Empty for Root Category)
            </label>
            <select
              className="form-select"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">None (Root Category / Top-level)</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.categoryCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Slug (URL path)
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. gaming-laptops"
            />
          </div>

          <DynamicGstSelect
            label="Default GST Rate (%) *"
            value={Number(formData.gstRate ?? 0)}
            onChange={(rate) => setFormData({ ...formData, gstRate: rate })}
          />

          {/* Category Image Field */}
          <ImageUploadField
            label="Category Image"
            description="Upload banner or select an existing asset from the server's uploads/ folder"
            value={formData.image}
            onChange={(url) => setFormData({ ...formData, image: url })}
            multiple={false}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Description
            </label>
            <textarea
              className="form-input"
              style={{ height: '4rem', resize: 'none' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category overview..."
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
              Save Category
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Category Modal */}
      <AdminModal
        isOpen={isEditModalOpen && !!selectedCategory}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Category: ${selectedCategory?.name || ''}`}
        subtitle={`Category Code: ${selectedCategory?.categoryCode || ''}`}
        maxWidth="34rem"
      >
        {formError && (
          <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.8rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Category Name
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
              Parent Category
            </label>
            <select
              className="form-select"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">None (Root Category / Top-level)</option>
              {flatCategories
                .filter((c) => c.id !== selectedCategory?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.categoryCode})
                  </option>
                ))}
            </select>
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

          {/* Category Image Field */}
          <ImageUploadField
            label="Category Image"
            description="Upload banner or select an existing asset from the server's uploads/ folder"
            value={formData.image}
            onChange={(url) => setFormData({ ...formData, image: url })}
            multiple={false}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Description
            </label>
            <textarea
              className="form-input"
              style={{ height: '4rem', resize: 'none' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DynamicGstSelect
            label="Default GST Rate (%) *"
            value={Number(formData.gstRate ?? 0)}
            onChange={(rate) => setFormData({ ...formData, gstRate: rate })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
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
      </AdminModal>

      {/* Map Attribute Modal */}
      <AdminModal
        isOpen={isMapAttrModalOpen && !!selectedCategory}
        onClose={() => setIsMapAttrModalOpen(false)}
        title={isEditingMapping ? 'Edit Category Specification' : 'Add Category Specification'}
        subtitle={
          <span>
            {isEditingMapping ? 'Configure specification settings for ' : 'Attach to '}
            <strong style={{ color: '#0f172a' }}>{selectedCategory?.name}</strong>
          </span>
        }
        maxWidth="30rem"
      >
        <form onSubmit={handleMapAttribute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Specification Attribute
            </label>
            <select
              className="form-select"
              value={mapAttrData.attributeId}
              onChange={(e) => setMapAttrData({ ...mapAttrData, attributeId: e.target.value })}
              disabled={isEditingMapping}
              required
            >
              {allAttributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name} ({attr.dataType})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mapAttrData.isFilterable}
                onChange={(e) => setMapAttrData({ ...mapAttrData, isFilterable: e.target.checked })}
              />
              <span>Show in customer filter sidebar</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mapAttrData.isRequired}
                onChange={(e) => setMapAttrData({ ...mapAttrData, isRequired: e.target.checked })}
              />
              <span>Mandatory specification for products</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: '#0f172a', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mapAttrData.isVariant}
                onChange={(e) => setMapAttrData({ ...mapAttrData, isVariant: e.target.checked })}
              />
              <span>Use as variant option (e.g. Color, Storage, Size)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setIsMapAttrModalOpen(false)}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ fontSize: '0.85rem' }}>
              {isEditingMapping ? 'Save Changes' : 'Attach Attribute'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};
