import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import api from '../api/client';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { DynamicFilterSidebar } from '../components/DynamicFilterSidebar';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryIdParam = searchParams.get('categoryId');
  const brandIdParam = searchParams.get('brandId');
  const queryParam = searchParams.get('q');
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = Number(searchParams.get('page')) || 1;

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic filter states
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(
    brandIdParam ? Number(brandIdParam) : null,
  );
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  // Fetch category list for quick category browsing
  useEffect(() => {
    api.get('/categories/tree').then((res: any) => {
      setCategoriesList(res || []);
    });
  }, []);

  // Sync category & breadcrumbs and scroll to top immediately
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    if (categoryIdParam) {
      const catId = Number(categoryIdParam);
      api.get(`/categories/${catId}`).then((res: any) => setCurrentCategory(res));
      api.get(`/categories/${catId}/breadcrumbs`).then((res: any) => setBreadcrumbs(res || []));
    } else {
      setCurrentCategory(null);
      setBreadcrumbs([]);
    }
  }, [categoryIdParam, queryParam]);

  const handleSelectCategory = (catId: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('categoryId', String(catId));
    } else {
      params.delete('categoryId');
    }
    params.delete('page');
    setSearchParams(params);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };


  // Fetch products with active filters
  useEffect(() => {
    setIsLoading(true);

    const params: Record<string, any> = {
      page: pageParam,
      limit: 12,
      sort: sortParam,
    };

    if (categoryIdParam) params.categoryId = categoryIdParam;
    if (selectedBrandId) params.brandId = selectedBrandId;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (queryParam) params.q = queryParam;

    if (Object.keys(selectedAttrs).length > 0) {
      params.attrs = JSON.stringify(selectedAttrs);
    }

    api
      .get('/products', { params })
      .then((res: any) => {
        setProducts(res.items || []);
        setTotalProducts(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [categoryIdParam, selectedBrandId, minPrice, maxPrice, selectedAttrs, sortParam, pageParam, queryParam]);

  const handleAttrChange = (slug: string, value: string | null) => {
    setSelectedAttrs((prev) => {
      const updated = { ...prev };
      if (value === null) {
        delete updated[slug];
      } else {
        updated[slug] = value;
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setSelectedBrandId(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSelectedAttrs({});
    const newParams = new URLSearchParams();
    if (sortParam) newParams.set('sort', sortParam);
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    searchParams.delete('q');
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const handleSortChange = (newSort: string) => {
    searchParams.set('sort', newSort);
    setSearchParams(searchParams);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Breadcrumb Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--primary-600)' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/catalog" style={{ color: !categoryIdParam && !queryParam ? 'var(--text-main)' : 'inherit' }}>Catalog</Link>
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={b.id}>
            <ChevronRight size={14} />
            <Link
              to={`/catalog?categoryId=${b.id}`}
              style={{
                color: idx === breadcrumbs.length - 1 ? 'var(--text-main)' : 'inherit',
                fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
              }}
            >
              {b.name}
            </Link>
          </React.Fragment>
        ))}
      </div>

      {/* Catalog Title & Sort Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {currentCategory ? currentCategory.name : queryParam ? `Search: "${queryParam}"` : 'All Products'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
              Showing {products.length} of {totalProducts} products
            </p>
            {queryParam && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                }}
                title="Clear active search query"
              >
                Clear search ✕
              </button>
            )}
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowUpDown size={15} /> Sort by:
          </span>
          <select
            value={sortParam}
            onChange={(e) => handleSortChange(e.target.value)}
            className="input-field"
            style={{ padding: '0.45rem 0.85rem', width: 'auto', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Quick Category Chips Carousel */}
      {categoriesList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => handleSelectCategory(null)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.84rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              backgroundColor: !categoryIdParam ? 'var(--primary-600)' : '#f1f5f9',
              color: !categoryIdParam ? '#ffffff' : 'var(--text-main)',
              border: !categoryIdParam ? '1px solid var(--primary-600)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Categories
          </button>
          {categoriesList.map((cat) => {
            const isSelected = String(cat.id) === categoryIdParam;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  backgroundColor: isSelected ? 'var(--primary-600)' : '#f1f5f9',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Catalog Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }} className="catalog-grid-layout">
        {/* Left Column: Dynamic Database-driven Filter Sidebar with Category Browsing */}
        <DynamicFilterSidebar
          categoryId={categoryIdParam ? Number(categoryIdParam) : undefined}
          onSelectCategory={handleSelectCategory}
          selectedBrandId={selectedBrandId}
          onSelectBrand={(id) => setSelectedBrandId(id)}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
          selectedAttrs={selectedAttrs}
          onAttrChange={handleAttrChange}
          onResetFilters={handleResetFilters}
        />

        {/* Right Column: Product Grid & Active Filter Pills */}
        <div>
          {/* Active Filter Chips */}
          {(selectedBrandId !== null || Object.keys(selectedAttrs).length > 0 || queryParam) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active filters:</span>
              {queryParam && (
                <span
                  className="badge badge-primary"
                  style={{ cursor: 'pointer', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={handleClearSearch}
                  title="Remove search query"
                >
                  Search: "{queryParam}" <X size={13} />
                </span>
              )}
              {selectedBrandId && (
                <span
                  className="badge badge-primary"
                  style={{ cursor: 'pointer', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => setSelectedBrandId(null)}
                >
                  Brand <X size={13} />
                </span>
              )}
              {Object.entries(selectedAttrs).map(([slug, val]) => (
                <span
                  key={slug}
                  className="badge badge-primary"
                  style={{ cursor: 'pointer', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => handleAttrChange(slug, null)}
                >
                  {slug}: {val} <X size={13} />
                </span>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
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

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <SlidersHorizontal size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                {queryParam ? `No products found for "${queryParam}"` : 'No products match your filters'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {queryParam ? 'Try searching with different keywords or reset your search to view all products.' : 'Try adjusting your price range or clearing attribute filters.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {queryParam && (
                  <button onClick={handleClearSearch} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    Clear Search & View All Products
                  </button>
                )}
                <button onClick={handleResetFilters} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .catalog-grid-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
