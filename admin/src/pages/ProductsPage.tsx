import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Package,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { Product, Category, Brand, PaginationMeta } from '../types';
import { ImageUploadField } from '../components/ImageUploadField';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { DynamicGstSelect } from '../components/DynamicGstSelect';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [categories, setFlatCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);


  // Creation Wizard States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Product Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editActiveTab, setEditActiveTab] = useState<'general' | 'specs' | 'variants'>('general');
  const [editCategoryAttributes, setEditCategoryAttributes] = useState<any[]>([]);
  const [editSpecsLoading, setEditSpecsLoading] = useState(false);
  const [editDynamicSpecs, setEditDynamicSpecs] = useState<Record<number, {
    attributeValueId?: number;
    valueText?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
  }>>({});
  const [editVariants, setEditVariants] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    name: '',
    productCode: '',
    slug: '',
    description: '',
    categoryId: '',
    brandId: '',
    basePrice: '',
    minStockAlert: '5',
    useCategoryGst: true,
    gstRate: '5',
    status: 'ACTIVE',
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Dynamic Inherited Specs for selected category
  const [categoryInheritedAttributes, setCategoryInheritedAttributes] = useState<any[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);

  // Form State
  const [baseForm, setBaseForm] = useState({
    name: '',
    productCode: '',
    slug: '',
    description: '',
    categoryId: '',
    brandId: '',
    basePrice: '',
    minStockAlert: '5',
    useCategoryGst: true,
    gstRate: '5',
    status: 'ACTIVE',
  });

  // Dynamic spec values keyed by attributeId
  const [dynamicSpecs, setDynamicSpecs] = useState<Record<number, {
    attributeValueId?: number;
    valueText?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
  }>>({});

  // Variants list
  const [variantsList, setVariantsList] = useState<any[]>([
    {
      sku: '',
      price: '',
      stockQuantity: '20',
      barcode: '',
      weight: '0.5',
      attributes: [],
    },
  ]);

  // Images list
  const [imagesList, setImagesList] = useState<any[]>([
    { url: '', isPrimary: true },
  ]);

  // Fetch categories and brands for filters & form creation
  const fetchMeta = async () => {
    try {
      const [catRes, brandRes]: any = await Promise.all([
        adminApi.get('/categories'),
        adminApi.get('/brands'),
      ]);
      const catList = Array.isArray(catRes?.data)
        ? catRes.data
        : Array.isArray(catRes)
        ? catRes
        : Array.isArray(catRes?.data?.items)
        ? catRes.data.items
        : [];
      const brandList = Array.isArray(brandRes?.data)
        ? brandRes.data
        : Array.isArray(brandRes)
        ? brandRes
        : Array.isArray(brandRes?.data?.items)
        ? brandRes.data.items
        : [];
      setFlatCategories(catList);
      setBrands(brandList);
    } catch (err) {
      console.error('Failed to load category/brand metadata:', err);
    }
  };

  // Fetch products with server-side pagination, search, and filters
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategoryFilter) params.append('categoryId', selectedCategoryFilter);
      if (selectedStatusFilter && selectedStatusFilter !== 'ALL') {
        params.append('status', selectedStatusFilter);
      } else if (selectedStatusFilter === 'ALL') {
        params.append('status', 'ALL');
      }

      const res: any = await adminApi.get(`/products?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setProducts(Array.isArray(items) ? items : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategoryFilter, selectedStatusFilter]);

  // Trigger query whenever page, limit, or filters change
  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedSearch, selectedCategoryFilter, selectedStatusFilter]);

  // When category changes in Step 1, load its dynamic inherited attributes
  const handleCategoryChange = async (catId: string) => {
    setBaseForm((prev) => ({ ...prev, categoryId: catId }));
    if (!catId) {
      setCategoryInheritedAttributes([]);
      return;
    }

    try {
      setSpecsLoading(true);
      const res: any = await adminApi.get(`/categories/${catId}/attributes`);
      const rawAttrs = res.data || res || [];
      const attrs = rawAttrs.map((a: any) => ({
        ...a,
        attributeId: a.attributeId || a.id,
        id: a.id || a.attributeId,
      }));
      setCategoryInheritedAttributes(attrs);

      // Pre-initialize empty values
      const initialSpecs: any = {};
      attrs.forEach((a: any) => {
        const attrId = a.attributeId || a.id;
        initialSpecs[attrId] = {
          attributeValueId: a.values && a.values.length > 0 ? a.values[0].id : undefined,
          valueText: '',
          valueNumber: undefined,
          valueBoolean: false,
        };
      });
      setDynamicSpecs(initialSpecs);
    } catch (err) {
      console.error('Failed to load category attributes:', err);
    } finally {
      setSpecsLoading(false);
    }
  };

  const handleOpenWizard = () => {
    const timestamp = Date.now().toString().slice(-4);
    const code = `PRD-DEV-${timestamp}`;
    setBaseForm({
      name: '',
      productCode: code,
      slug: '',
      description: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      brandId: brands.length > 0 ? String(brands[0].id) : '',
      basePrice: '',
      minStockAlert: '5',
      useCategoryGst: true,
      gstRate: '5',
      status: 'ACTIVE',
    });
    setVariantsList([
      {
        sku: `${code}-VAR-1`,
        price: '',
        stockQuantity: '25',
        barcode: '',
        weight: '0.4',
        attributes: [],
      },
    ]);
    setImagesList([]);
    setWizardStep(1);
    setFormError('');
    setIsWizardOpen(true);

    if (categories.length > 0) {
      handleCategoryChange(String(categories[0].id));
    }
  };

  const handleAddVariantRow = () => {
    const nextIdx = variantsList.length + 1;
    setVariantsList((prev) => [
      ...prev,
      {
        sku: `${baseForm.productCode}-VAR-${nextIdx}`,
        price: baseForm.basePrice || '100',
        stockQuantity: '10',
        barcode: '',
        weight: '0.5',
        attributes: [],
      },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    if (variantsList.length <= 1) return;
    setVariantsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddImageRow = () => {
    setImagesList((prev) => [...prev, { url: '', isPrimary: false }]);
  };

  const handleRemoveImageRow = (idx: number) => {
    if (imagesList.length <= 1) return;
    setImagesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitWizard = async () => {
    setFormError('');
    setSubmitting(true);

    try {
      // Format attributes payload
      const formattedAttributes = Object.entries(dynamicSpecs)
        .filter(([attrId, _]: any) => {
          const num = Number(attrId);
          return !isNaN(num) && num > 0;
        })
        .map(([attrId, val]) => ({
          attributeId: Number(attrId),
          attributeValueId: val?.attributeValueId ? Number(val.attributeValueId) : undefined,
          valueText: val?.valueText || undefined,
          valueNumber: val?.valueNumber !== undefined && !isNaN(Number(val.valueNumber)) ? Number(val.valueNumber) : undefined,
          valueBoolean: val?.valueBoolean,
        }))
        .filter((attr) => attr.attributeId && !isNaN(attr.attributeId));

      // Format variants payload
      const formattedVariants = variantsList.map((v) => ({
        sku: v.sku.trim().toUpperCase(),
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity),
        barcode: v.barcode ? v.barcode.trim() : undefined,
        weight: v.weight ? Number(v.weight) : undefined,
        attributes: v.attributes || [],
      }));

      // Format images payload
      const formattedImages = imagesList
        .filter((img) => img.url && img.url.trim().length > 0)
        .map((img, idx) => ({
          url: img.url.trim(),
          isPrimary: idx === 0 || img.isPrimary,
          sortOrder: idx,
        }));

      const payload = {
        name: baseForm.name.trim(),
        productCode: baseForm.productCode.trim().toUpperCase(),
        slug: baseForm.slug.trim().toLowerCase(),
        description: baseForm.description,
        categoryId: Number(baseForm.categoryId),
        brandId: Number(baseForm.brandId),
        basePrice: Number(baseForm.basePrice),
        minStockAlert: Number(baseForm.minStockAlert),
        useCategoryGst: baseForm.useCategoryGst !== false,
        gstRate: !baseForm.useCategoryGst && baseForm.gstRate ? Number(baseForm.gstRate) : null,
        status: baseForm.status,
        attributes: formattedAttributes,
        variants: formattedVariants,
        images: formattedImages,
      };

      await adminApi.post('/products', payload);
      setIsWizardOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create product. Check codes or required specifications.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = async (p: Product) => {
    setEditingProduct(p);
    setEditActiveTab('general');
    setEditError('');
    setIsEditModalOpen(true);

    const catId = p.categoryId || (p as any).category?.id;
    const brId = p.brandId || (p as any).brand?.id;
    setEditForm({
      name: p.name || '',
      productCode: p.productCode || '',
      slug: p.slug || '',
      description: p.description || '',
      categoryId: catId ? String(catId) : '',
      brandId: brId ? String(brId) : '',
      basePrice: p.basePrice ? String(p.basePrice) : '',
      minStockAlert: String(p.minStockAlert ?? 5),
      useCategoryGst: p.useCategoryGst !== false,
      gstRate: p.gstRate !== null && p.gstRate !== undefined ? String(p.gstRate) : '5',
      status: p.status || 'ACTIVE',
    });
    setEditImages(p.images?.map((img) => img.url) || []);

    try {
      setEditSpecsLoading(true);
      const [fullProdRes, catAttrsRes]: any = await Promise.all([
        adminApi.get(`/products/${p.id}`),
        catId ? adminApi.get(`/categories/${catId}/attributes`) : Promise.resolve({ data: [] }),
      ]);

      const fullProd = fullProdRes?.data || fullProdRes || p;
      const rawCatAttrs = catAttrsRes?.data || catAttrsRes || [];
      const catAttrs = rawCatAttrs.map((ca: any) => ({
        ...ca,
        attributeId: ca.attributeId || ca.id,
        id: ca.id || ca.attributeId,
      }));
      setEditCategoryAttributes(catAttrs);

      // Pre-fill dynamic specs from full product attributeValues
      const specsMap: any = {};
      catAttrs.forEach((ca: any) => {
        const attrId = ca.attributeId || ca.id;
        const existingVal = fullProd.attributeValues?.find((av: any) => av.attributeId === attrId);
        specsMap[attrId] = {
          attributeValueId: existingVal?.attributeValueId || (ca.values?.[0]?.id ?? undefined),
          valueText: existingVal?.valueText || '',
          valueNumber: existingVal?.valueNumber !== null && existingVal?.valueNumber !== undefined ? Number(existingVal.valueNumber) : undefined,
          valueBoolean: existingVal?.valueBoolean ?? false,
        };
      });
      setEditDynamicSpecs(specsMap);

      // Pre-fill variants
      const variantAttr = catAttrs.find((a: any) => a.isVariant) || catAttrs[0];
      const defaultVariantAttrId = variantAttr?.attributeId || variantAttr?.id;
      const vars = (fullProd.variants || []).map((v: any) => {
        const varVal = v.variantValues?.[0];
        return {
          id: v.id,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
          barcode: v.barcode || '',
          weight: v.weight || '',
          status: v.status || 'ACTIVE',
          attributeId: varVal?.attributeId || defaultVariantAttrId,
          attributeValueId: varVal?.attributeValueId,
          attributeValueDisplayName: varVal?.attributeValue?.displayName || varVal?.attributeValue?.value || '',
        };
      });
      setEditVariants(vars);
    } catch (err) {
      console.error('Failed to load full product specifications & variants:', err);
    } finally {
      setEditSpecsLoading(false);
    }
  };

  const handleEditCategoryChange = async (catId: string) => {
    setEditForm((prev) => ({ ...prev, categoryId: catId }));
    if (!catId) {
      setEditCategoryAttributes([]);
      return;
    }
    try {
      setEditSpecsLoading(true);
      const res: any = await adminApi.get(`/categories/${catId}/attributes`);
      const rawCatAttrs = res.data || res || [];
      const catAttrs = rawCatAttrs.map((ca: any) => ({
        ...ca,
        attributeId: ca.attributeId || ca.id,
        id: ca.id || ca.attributeId,
      }));
      setEditCategoryAttributes(catAttrs);
      setEditDynamicSpecs((prev) => {
        const next: any = { ...prev };
        catAttrs.forEach((ca: any) => {
          const attrId = ca.attributeId || ca.id;
          if (!next[attrId]) {
            next[attrId] = {
              attributeValueId: ca.values?.[0]?.id ?? undefined,
              valueText: '',
              valueNumber: undefined,
              valueBoolean: false,
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to update category attributes for edit:', err);
    } finally {
      setEditSpecsLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      const attributesPayload = Object.entries(editDynamicSpecs)
        .filter(([attrId, _]: any) => {
          const num = Number(attrId);
          return !isNaN(num) && num > 0;
        })
        .map(([attrId, val]: any) => ({
          attributeId: Number(attrId),
          attributeValueId: val?.attributeValueId ? Number(val.attributeValueId) : undefined,
          valueText: val?.valueText || undefined,
          valueNumber: val?.valueNumber !== undefined && !isNaN(Number(val.valueNumber)) ? Number(val.valueNumber) : undefined,
          valueBoolean: val?.valueBoolean,
        }))
        .filter((attr) => attr.attributeId && !isNaN(attr.attributeId));

      const variantAttr = editCategoryAttributes.find((a: any) => a.isVariant) || editCategoryAttributes[0];
      const fallbackAttrId = variantAttr?.attributeId || variantAttr?.id;

      const variantsPayload = editVariants.map((v) => {
        const effectiveAttrId = v.attributeId || fallbackAttrId;
        return {
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          stockQuantity: Number(v.stockQuantity),
          barcode: v.barcode || undefined,
          weight: v.weight ? Number(v.weight) : undefined,
          status: v.status,
          attributes: effectiveAttrId && v.attributeValueId ? [
            { attributeId: Number(effectiveAttrId), attributeValueId: Number(v.attributeValueId) }
          ] : [],
        };
      });

      const payload: any = {
        name: editForm.name.trim(),
        slug: editForm.slug.trim().toLowerCase(),
        description: editForm.description || undefined,
        categoryId: editForm.categoryId ? Number(editForm.categoryId) : undefined,
        brandId: editForm.brandId ? Number(editForm.brandId) : undefined,
        basePrice: editForm.basePrice ? Number(editForm.basePrice) : undefined,
        minStockAlert: editForm.minStockAlert ? Number(editForm.minStockAlert) : undefined,
        useCategoryGst: editForm.useCategoryGst !== false,
        gstRate: !editForm.useCategoryGst && editForm.gstRate ? Number(editForm.gstRate) : null,
        status: editForm.status,
        images: editImages
          .filter((url) => url && url.trim().length > 0)
          .map((url, idx) => ({
            url: url.trim(),
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        attributes: attributesPayload,
        variants: variantsPayload,
      };

      await adminApi.patch(`/products/${editingProduct.id}`, payload);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update product');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await adminApi.delete(`/products/${product.id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filteredProducts = Array.isArray(products) ? products : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Products</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage your store's products, pricing, specifications, and stock.
          </p>
        </div>

        <button onClick={handleOpenWizard} className="btn-primary" style={{ fontSize: '0.85rem' }}>
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.2rem' : '0.9rem' }}
            placeholder="Search by product name, code, brand..."
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

        <div style={{ width: '200px' }}>
          <select
            className="form-select"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '150px' }}>
          <select
            className="form-select"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Active Filters Bar */}
      {(search || selectedCategoryFilter || selectedStatusFilter !== 'ALL') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active filters:</span>
          {search && (
            <span
              className="badge badge-primary"
              style={{ cursor: 'pointer', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setSearch('')}
              title="Remove search query"
            >
              Search: "{search}" <X size={13} />
            </span>
          )}
          {selectedCategoryFilter && (
            <span
              className="badge badge-primary"
              style={{ cursor: 'pointer', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setSelectedCategoryFilter('')}
              title="Clear category filter"
            >
              Category: {categories.find((c) => String(c.id) === selectedCategoryFilter)?.name || selectedCategoryFilter} <X size={13} />
            </span>
          )}
          {selectedStatusFilter !== 'ALL' && (
            <span
              className="badge badge-primary"
              style={{ cursor: 'pointer', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setSelectedStatusFilter('ALL')}
              title="Clear status filter"
            >
              Status: {selectedStatusFilter} <X size={13} />
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategoryFilter('');
              setSelectedStatusFilter('ALL');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '0.5rem',
            }}
          >
            Reset all
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Base Price</th>
                <th>GST Rate</th>
                <th>Stock / Alert</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                      No products found matching filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setSelectedCategoryFilter('');
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.82rem' }}
                    >
                      Clear Search & Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url;
                  const totalStock = p.totalStock ?? p.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) ?? 0;
                  const isLow = totalStock <= (p.minStockAlert || 5);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={p.name}
                              style={{ width: '2.75rem', height: '2.75rem', objectFit: 'cover', borderRadius: '0.6rem', border: '1px solid var(--border-color)' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '0.6rem',
                                backgroundColor: '#f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <Package size={18} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {p.productCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {p.category?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {p.brand?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(p.basePrice).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        {p.useCategoryGst !== false ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.22rem 0.6rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                            }}
                            title={`Inherited from Category (${p.category?.name || 'Category Default'})`}
                          >
                            <span>GST {p.effectiveGstRate ?? p.category?.gstRate ?? 5}%</span>
                            <span style={{ fontSize: '0.66rem', opacity: 0.75, fontWeight: 600 }}>(Cat)</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.22rem 0.6rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                            }}
                            title="Product Custom GST Override"
                          >
                            <span>GST {p.gstRate ?? p.effectiveGstRate ?? 5}%</span>
                            <span style={{ fontSize: '0.66rem', opacity: 0.75, fontWeight: 600 }}>(Custom)</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: isLow ? '#b45309' : '#0f172a' }}>
                            {totalStock} units
                          </span>
                          {isLow && (
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#b45309',
                              cursor: 'pointer',
                              padding: '0.35rem',
                              borderRadius: '0.4rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fef3c7',
                            }}
                            title="Edit product"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#e11d48',
                              cursor: 'pointer',
                              padding: '0.35rem',
                              borderRadius: '0.4rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#fee2e2',
                            }}
                            title="Delete product"
                          >
                            <Trash2 size={15} />
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

      {/* Multi-Step Creation Wizard Modal */}
      {isWizardOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsWizardOpen(false);
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              maxWidth: '46rem',
              width: '100%',
              maxHeight: 'calc(100vh - 2.5rem)',
              borderRadius: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Wizard Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  Add New Product
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Step {wizardStep} of 4: {
                    wizardStep === 1 ? 'Basic Details & Pricing' :
                    wizardStep === 2 ? 'Specifications & Details' :
                    wizardStep === 3 ? 'Variants & Stock Levels' :
                    'Product Photos'
                  }
                </p>
              </div>

              {/* Step indicator pills & Close button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: wizardStep === step ? 'var(--accent-amber)' : 'rgba(0,0,0,0.05)',
                        color: wizardStep === step ? '#ffffff' : 'var(--text-muted)',
                        border: wizardStep === step ? 'none' : '1px solid var(--border-color)',
                      }}
                    >
                      {step}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Close Wizard (Esc)"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = '#fca5a5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Wizard Content Body */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              {formError && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(244,63,94,0.15)', color: '#fb7185', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                  {formError}
                </div>
              )}

              {/* STEP 1: Core Details */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={baseForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PRD';
                          const suffix = baseForm.productCode.split('-').pop() || String(Math.floor(1000 + Math.random() * 9000));
                          const newProductCode = `PRD-${prefix}-${suffix}`;
                          setBaseForm({
                            ...baseForm,
                            name,
                            productCode: newProductCode,
                            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                          });
                          // Keep existing variants synchronized with the product code
                          setVariantsList((prev) =>
                            prev.map((v, i) => ({
                              ...v,
                              sku: `${newProductCode}-VAR-${i + 1}`,
                            }))
                          );
                        }}
                        placeholder="e.g. Galaxy S24 Ultra 5G"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Product Code <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600, marginLeft: '0.35rem' }}>(Auto-generated, Immutable)</span>
                      </label>
                      <input
                        type="text"
                        disabled
                        readOnly
                        className="form-input"
                        style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155', fontWeight: 700 }}
                        value={baseForm.productCode}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Category * (Determines Inherited Specs)
                      </label>
                      <select
                        className="form-select"
                        value={baseForm.categoryId}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.categoryCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Manufacturer Brand *
                      </label>
                      <select
                        className="form-select"
                        value={baseForm.brandId}
                        onChange={(e) => setBaseForm({ ...baseForm, brandId: e.target.value })}
                        required
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Base Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        className="form-input"
                        value={baseForm.basePrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBaseForm((prev) => ({ ...prev, basePrice: val }));
                          setVariantsList((prev) =>
                            prev.map((v, idx) => (idx === 0 && (!v.price || v.price === baseForm.basePrice) ? { ...v, price: val } : v))
                          );
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Min Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={baseForm.minStockAlert}
                        onChange={(e) => setBaseForm({ ...baseForm, minStockAlert: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Publish Status
                      </label>
                      <select
                        className="form-select"
                        value={baseForm.status}
                        onChange={(e) => setBaseForm({ ...baseForm, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE (Storefront Visible)</option>
                        <option value="DRAFT">DRAFT (Hidden)</option>
                      </select>
                    </div>

                    {/* GST Tax Configuration */}
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginBottom: baseForm.useCategoryGst ? '0' : '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={baseForm.useCategoryGst}
                          onChange={(e) => setBaseForm({ ...baseForm, useCategoryGst: e.target.checked })}
                          style={{ width: '1.1rem', height: '1.1rem', accentColor: '#166534', cursor: 'pointer' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                            Use Category Default GST Rate
                          </strong>
                          <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>
                            Inherit tax percentage from the selected category (e.g. 5%).
                          </p>
                        </div>
                      </label>

                      {!baseForm.useCategoryGst && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                          <DynamicGstSelect
                            label="Product Custom GST Rate Override (%) *"
                            value={Number(baseForm.gstRate || 0)}
                            onChange={(rate) => setBaseForm({ ...baseForm, gstRate: String(rate) })}
                            style={{ maxWidth: '360px' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Detailed Product Description
                    </label>
                    <textarea
                      className="form-input"
                      style={{ height: '4.5rem', resize: 'none' }}
                      value={baseForm.description}
                      onChange={(e) => setBaseForm({ ...baseForm, description: e.target.value })}
                      placeholder="Highlights, hardware details, warranty info..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Category Inherited Specifications Dynamic Form */}
              {wizardStep === 2 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                      Dynamic Specifications for Selected Category
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Automatically inherited from category ancestry hierarchy. Fill in the values below:
                    </p>
                  </div>

                  {specsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Resolving inherited specifications from category tree...
                    </div>
                  ) : categoryInheritedAttributes.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem' }}>
                      No specifications mapped to this category. You can proceed directly to the variant matrix.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      {categoryInheritedAttributes.map((attrItem) => {
                        const currentVal = dynamicSpecs[attrItem.attributeId] || {};

                        return (
                          <div
                            key={attrItem.attributeId}
                            style={{
                              padding: '1rem',
                              borderRadius: '0.75rem',
                              backgroundColor: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
                              <span>{attrItem.name} {attrItem.unit && `(${attrItem.unit})`}</span>
                              {attrItem.isRequired && <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>Required</span>}
                            </label>

                            {/* Single Select Predefined Option */}
                            {attrItem.dataType === 'SINGLE_SELECT' && (
                              <select
                                className="form-select"
                                value={currentVal.attributeValueId || ''}
                                onChange={(e) => {
                                  setDynamicSpecs({
                                    ...dynamicSpecs,
                                    [attrItem.attributeId]: {
                                      ...currentVal,
                                      attributeValueId: Number(e.target.value),
                                    },
                                  });
                                }}
                              >
                                <option value="">Select option...</option>
                                {attrItem.values?.map((v: any) => (
                                  <option key={v.id} value={v.id}>
                                    {v.displayName}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Freeform Number */}
                            {attrItem.dataType === 'NUMBER' && (
                              <input
                                type="number"
                                className="form-input"
                                placeholder={`Enter numeric value in ${attrItem.unit || 'units'}`}
                                value={currentVal.valueNumber ?? ''}
                                onChange={(e) => {
                                  setDynamicSpecs({
                                    ...dynamicSpecs,
                                    [attrItem.attributeId]: {
                                      ...currentVal,
                                      valueNumber: e.target.value ? Number(e.target.value) : undefined,
                                    },
                                  });
                                }}
                              />
                            )}

                            {/* Freeform Text */}
                            {attrItem.dataType === 'TEXT' && (
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Specification details..."
                                value={currentVal.valueText || ''}
                                onChange={(e) => {
                                  setDynamicSpecs({
                                    ...dynamicSpecs,
                                    [attrItem.attributeId]: {
                                      ...currentVal,
                                      valueText: e.target.value,
                                    },
                                  });
                                }}
                              />
                            )}

                            {/* Boolean Toggle */}
                            {attrItem.dataType === 'BOOLEAN' && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '0.35rem' }}>
                                <input
                                  type="checkbox"
                                  checked={!!currentVal.valueBoolean}
                                  onChange={(e) => {
                                    setDynamicSpecs({
                                      ...dynamicSpecs,
                                      [attrItem.attributeId]: {
                                        ...currentVal,
                                        valueBoolean: e.target.checked,
                                      },
                                    });
                                  }}
                                />
                                <span>Supported / Included</span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Variant Matrix Generator */}
              {wizardStep === 3 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        Product Variants & Stock
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Add options like different colors, sizes, or storage with their prices and stock quantities.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                    >
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {variantsList.map((v, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          display: 'grid',
                          gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
                          gap: '0.75rem',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            SKU Identifier <span style={{ fontSize: '0.62rem', color: '#2563eb', fontWeight: 600 }}>(Auto-generated)</span>
                          </label>
                          <input
                            type="text"
                            disabled
                            readOnly
                            className="form-input"
                            style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#334155', fontWeight: 600 }}
                            value={v.sku}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            Price (₹) *
                          </label>
                          <input
                            type="number"
                            required
                            className="form-input"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variantsList];
                              updated[idx].price = e.target.value;
                              setVariantsList(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            Stock Units *
                          </label>
                          <input
                            type="number"
                            required
                            className="form-input"
                            value={v.stockQuantity}
                            onChange={(e) => {
                              const updated = [...variantsList];
                              updated[idx].stockQuantity = e.target.value;
                              setVariantsList(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            Barcode / EAN
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={v.barcode}
                            placeholder="Optional"
                            onChange={(e) => {
                              const updated = [...variantsList];
                              updated[idx].barcode = e.target.value;
                              setVariantsList(updated);
                            }}
                          />
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            disabled={variantsList.length <= 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              cursor: variantsList.length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '0.4rem',
                              opacity: variantsList.length <= 1 ? 0.3 : 0.8,
                              marginTop: '1.2rem',
                            }}
                            title="Delete variant"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Product Images & Review */}
              {wizardStep === 4 && (
                <div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                      Product Photos & Gallery
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Upload product images or choose existing media. The first image will be shown as the main storefront image.
                    </p>
                  </div>

                  <ImageUploadField
                    label="Product Gallery Images"
                    description="Files are stored on the server in uploads/ and persisted in the MySQL database"
                    value={imagesList.map((img) => img.url).filter(Boolean)}
                    onChange={(urls: string[]) => {
                      setImagesList(urls.map((url, idx) => ({ url, isPrimary: idx === 0 })));
                    }}
                    multiple={true}
                  />
                </div>
              )}
            </div>

            {/* Wizard Footer Controls */}
            <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => prev - 1)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) {
                      if (!baseForm.name || !baseForm.productCode || !baseForm.basePrice) {
                        setFormError('Please fill all required basic fields before proceeding.');
                        return;
                      }
                      setVariantsList((prev) =>
                        prev.map((v, idx) => (idx === 0 && !v.price ? { ...v, price: baseForm.basePrice } : v))
                      );
                    }
                    setFormError('');
                    setWizardStep((prev) => prev + 1);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <span>Next Step</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitWizard}
                  disabled={submitting}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Sparkles size={16} />
                  <span>{submitting ? 'Saving Product...' : 'Save & Publish Product'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              maxWidth: '54rem',
              width: '100%',
              maxHeight: 'calc(100vh - 2.5rem)',
              borderRadius: '1.25rem',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700 }}>EDIT PRODUCT</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                      {editForm.productCode}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>
                    {editingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.3rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0 1.75rem', gap: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setEditActiveTab('general')}
                style={{
                  padding: '0.85rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: editActiveTab === 'general' ? '2px solid #b45309' : '2px solid transparent',
                  color: editActiveTab === 'general' ? '#b45309' : '#64748b',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                General & Photos
              </button>

              <button
                type="button"
                onClick={() => setEditActiveTab('specs')}
                style={{
                  padding: '0.85rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: editActiveTab === 'specs' ? '2px solid #b45309' : '2px solid transparent',
                  color: editActiveTab === 'specs' ? '#b45309' : '#64748b',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>Specifications & Attributes</span>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                  {editCategoryAttributes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditActiveTab('variants')}
                style={{
                  padding: '0.85rem 0.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: editActiveTab === 'variants' ? '2px solid #b45309' : '2px solid transparent',
                  color: editActiveTab === 'variants' ? '#b45309' : '#64748b',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <span>Package Sizes & Pricing</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                  {editVariants.length}
                </span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {editError && (
                  <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem' }}>
                    {editError}
                  </div>
                )}

                {/* TAB 1: General & Photos */}
                {editActiveTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Name & Slug */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="e.g. Sambar Podi"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          URL Slug *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editForm.slug}
                          onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Category & Brand */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Category *
                        </label>
                        <select
                          className="form-select"
                          value={editForm.categoryId}
                          onChange={(e) => handleEditCategoryChange(e.target.value)}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Brand *
                        </label>
                        <select
                          className="form-select"
                          value={editForm.brandId}
                          onChange={(e) => setEditForm({ ...editForm, brandId: e.target.value })}
                          required
                        >
                          <option value="">Select Brand</option>
                          {brands.map((b) => (
                            <option key={b.id} value={String(b.id)}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price, Stock Alert, Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Base Starting Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          className="form-input"
                          value={editForm.basePrice}
                          onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Low Stock Alert Qty
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={editForm.minStockAlert}
                          onChange={(e) => setEditForm({ ...editForm, minStockAlert: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                          Status
                        </label>
                        <select
                          className="form-select"
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>

                    {/* GST Tax Configuration in Edit Modal */}
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginBottom: editForm.useCategoryGst ? '0' : '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={editForm.useCategoryGst}
                          onChange={(e) => setEditForm({ ...editForm, useCategoryGst: e.target.checked })}
                          style={{ width: '1.1rem', height: '1.1rem', accentColor: '#166534', cursor: 'pointer' }}
                        />
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                            Use Category Default GST Rate
                          </strong>
                          <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>
                            Inherit tax percentage from the selected category.
                          </p>
                        </div>
                      </label>

                      {!editForm.useCategoryGst && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                          <DynamicGstSelect
                            label="Product Custom GST Rate Override (%) *"
                            value={Number(editForm.gstRate || 0)}
                            onChange={(rate) => setEditForm({ ...editForm, gstRate: String(rate) })}
                            style={{ maxWidth: '360px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="form-input"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Product summary and key information..."
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Product Photos */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Product Photos (Multiselect & Server Uploads)
                      </label>
                      <ImageUploadField
                        label=""
                        value={editImages}
                        onChange={(imgs) => setEditImages(Array.isArray(imgs) ? imgs : imgs ? [imgs] : [])}
                        multiple={true}
                        description="Upload images or choose existing assets from server uploads folder"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: Dynamic Category Specifications */}
                {editActiveTab === 'specs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ padding: '0.85rem 1rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        Category Specifications & Dynamic Attributes
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Values set here apply to this product and power customer filters and specification tables.
                      </p>
                    </div>

                    {editSpecsLoading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Loading specifications for selected category...
                      </div>
                    ) : editCategoryAttributes.length === 0 ? (
                      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                        <Sliders size={28} style={{ color: '#94a3b8', margin: '0 auto 0.5rem auto' }} />
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                          No specifications mapped to this category yet
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '380px', margin: '0.25rem auto 0' }}>
                          Go to <strong>Categories → Category Specifications & Filters</strong> to map attributes (e.g. Package Size, Ingredients, Shelf Life) to this category.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {editCategoryAttributes.map((attr: any) => {
                          const attrId = attr.attributeId || attr.id;
                          const currentSpec = editDynamicSpecs[attrId] || {};

                          return (
                            <div
                              key={attrId}
                              style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                                    {attr.name}
                                  </span>
                                  {attr.isRequired && (
                                    <span style={{ color: '#e11d48', fontWeight: 700, fontSize: '0.8rem' }}>*</span>
                                  )}
                                </div>
                                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                  {attr.dataType} {attr.unit ? `(${attr.unit})` : ''}
                                </span>
                              </div>

                              {/* Input based on data type */}
                              {['SINGLE_SELECT', 'MULTI_SELECT'].includes(attr.dataType) ? (
                                <select
                                  className="form-select"
                                  value={currentSpec.attributeValueId || ''}
                                  onChange={(e) => {
                                    const valId = e.target.value ? Number(e.target.value) : undefined;
                                    setEditDynamicSpecs({
                                      ...editDynamicSpecs,
                                      [attrId]: {
                                        ...currentSpec,
                                        attributeValueId: valId,
                                      },
                                    });
                                  }}
                                >
                                  <option value="">-- Select Option --</option>
                                  {attr.values?.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                      {v.displayName || v.value}
                                    </option>
                                  ))}
                                </select>
                              ) : attr.dataType === 'BOOLEAN' ? (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(currentSpec.valueBoolean)}
                                    onChange={(e) => {
                                      setEditDynamicSpecs({
                                        ...editDynamicSpecs,
                                        [attrId]: {
                                          ...currentSpec,
                                          valueBoolean: e.target.checked,
                                        },
                                      });
                                    }}
                                    style={{ width: '16px', height: '16px', accentColor: '#b45309' }}
                                  />
                                  <span style={{ fontSize: '0.82rem', color: '#334155' }}>Yes / Enabled</span>
                                </label>
                              ) : attr.dataType === 'NUMBER' ? (
                                <input
                                  type="number"
                                  className="form-input"
                                  value={currentSpec.valueNumber ?? ''}
                                  onChange={(e) => {
                                    setEditDynamicSpecs({
                                      ...editDynamicSpecs,
                                      [attrId]: {
                                        ...currentSpec,
                                        valueNumber: e.target.value !== '' ? Number(e.target.value) : undefined,
                                      },
                                    });
                                  }}
                                  placeholder={`e.g. 100 ${attr.unit || ''}`}
                                />
                              ) : (
                                <input
                                  type="text"
                                  className="form-input"
                                  value={currentSpec.valueText || ''}
                                  onChange={(e) => {
                                    setEditDynamicSpecs({
                                      ...editDynamicSpecs,
                                      [attrId]: {
                                        ...currentSpec,
                                        valueText: e.target.value,
                                      },
                                    });
                                  }}
                                  placeholder={`Enter ${attr.name}`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Package Sizes & Pricing (Variants) */}
                {editActiveTab === 'variants' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '0.65rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          Package Sizes & Pricing Variants
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Manage sizes (e.g. 50g, 100g, 200g, 500g, 1kg), price per pack, and stock inventory.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const variantAttr = editCategoryAttributes.find((a: any) => a.isVariant) || editCategoryAttributes[0];
                          const firstVal = variantAttr?.values?.[0];
                          setEditVariants([
                            ...editVariants,
                            {
                              sku: `${editingProduct.productCode}-VAR-${editVariants.length + 1}`,
                              price: editForm.basePrice || '100',
                              stockQuantity: '50',
                              barcode: '',
                              weight: '',
                              status: 'ACTIVE',
                              attributeId: variantAttr?.attributeId || variantAttr?.id,
                              attributeValueId: firstVal?.id,
                              attributeValueDisplayName: firstVal?.displayName || 'New Size',
                            },
                          ]);
                        }}
                        className="btn-primary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                      >
                        <Plus size={14} /> Add Package Size
                      </button>
                    </div>

                    {editVariants.length === 0 ? (
                      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                        <Package size={28} style={{ color: '#94a3b8', margin: '0 auto 0.5rem auto' }} />
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                          No package sizes defined yet
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.25rem auto 0.75rem' }}>
                          Add package size options with individual prices and inventory stock.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const variantAttr = editCategoryAttributes.find((a: any) => a.isVariant) || editCategoryAttributes[0];
                            const firstVal = variantAttr?.values?.[0];
                            setEditVariants([
                              {
                                sku: `${editingProduct.productCode}-VAR-1`,
                                price: editForm.basePrice || '100',
                                stockQuantity: '50',
                                barcode: '',
                                weight: '',
                                status: 'ACTIVE',
                                attributeId: variantAttr?.attributeId || variantAttr?.id,
                                attributeValueId: firstVal?.id,
                                attributeValueDisplayName: firstVal?.displayName || 'Standard',
                              },
                            ]);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <Plus size={14} /> Add First Package Size
                        </button>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Package Size / Option</th>
                              <th>SKU Code</th>
                              <th>Price (₹) *</th>
                              <th>Stock Qty *</th>
                              <th>Status</th>
                              <th style={{ width: '40px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {editVariants.map((v, idx) => {
                              const variantAttr = editCategoryAttributes.find((a: any) => a.isVariant) || editCategoryAttributes[0];
                              const allowedValues = variantAttr?.values || [];

                              return (
                                <tr key={v.id || `temp-${idx}`}>
                                  <td>
                                    {allowedValues.length > 0 ? (
                                      <select
                                        className="form-select"
                                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                        value={v.attributeValueId || ''}
                                        onChange={(e) => {
                                          const selectedId = Number(e.target.value);
                                          const selectedVal = allowedValues.find((val: any) => val.id === selectedId);
                                          const next = [...editVariants];
                                          next[idx] = {
                                            ...next[idx],
                                            attributeId: variantAttr?.attributeId || variantAttr?.id,
                                            attributeValueId: selectedId,
                                            attributeValueDisplayName: selectedVal?.displayName || selectedVal?.value || '',
                                          };
                                          setEditVariants(next);
                                        }}
                                      >
                                        <option value="">Select Size</option>
                                        {allowedValues.map((val: any) => (
                                          <option key={val.id} value={val.id}>
                                            {val.displayName || val.value}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        className="form-input"
                                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                                        value={v.attributeValueDisplayName || ''}
                                        onChange={(e) => {
                                          const next = [...editVariants];
                                          next[idx] = { ...next[idx], attributeValueDisplayName: e.target.value };
                                          setEditVariants(next);
                                        }}
                                        placeholder="e.g. 100g, 500g"
                                      />
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-input"
                                      style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', padding: '0.35rem 0.6rem' }}
                                      value={v.sku}
                                      onChange={(e) => {
                                        const next = [...editVariants];
                                        next[idx] = { ...next[idx], sku: e.target.value };
                                        setEditVariants(next);
                                      }}
                                    />
                                  </td>
                                  <td style={{ width: '130px' }}>
                                    <div style={{ position: 'relative' }}>
                                      <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.8rem' }}>
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        required
                                        className="form-input"
                                        style={{ paddingLeft: '1.5rem', fontSize: '0.85rem', fontWeight: 600, padding: '0.35rem 0.5rem 0.35rem 1.4rem' }}
                                        value={v.price}
                                        onChange={(e) => {
                                          const next = [...editVariants];
                                          next[idx] = { ...next[idx], price: e.target.value };
                                          setEditVariants(next);
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td style={{ width: '110px' }}>
                                    <input
                                      type="number"
                                      required
                                      className="form-input"
                                      style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                                      value={v.stockQuantity}
                                      onChange={(e) => {
                                        const next = [...editVariants];
                                        next[idx] = { ...next[idx], stockQuantity: e.target.value };
                                        setEditVariants(next);
                                      }}
                                    />
                                  </td>
                                  <td style={{ width: '110px' }}>
                                    <select
                                      className="form-select"
                                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                                      value={v.status}
                                      onChange={(e) => {
                                        const next = [...editVariants];
                                        next[idx] = { ...next[idx], status: e.target.value };
                                        setEditVariants(next);
                                      }}
                                    >
                                      <option value="ACTIVE">ACTIVE</option>
                                      <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditVariants(editVariants.filter((_, i) => i !== idx));
                                      }}
                                      style={{
                                        background: '#fee2e2',
                                        border: 'none',
                                        color: '#e11d48',
                                        cursor: 'pointer',
                                        padding: '0.3rem',
                                        borderRadius: '0.35rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      title="Remove this package size variant"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
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
                  disabled={editSubmitting}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
