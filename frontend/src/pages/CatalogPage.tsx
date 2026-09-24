import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowUpDown, X, Search } from 'lucide-react';
import api from '../api/client';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const categoryBarRef = useRef<HTMLDivElement>(null);

  // Fetch category list for quick browsing
  useEffect(() => {
    api.get('/categories/tree').then((res: any) => {
      setCategoriesList(res || []);
    });
  }, []);

  // Scroll to top on initial page mount only
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Sync category details & breadcrumbs when categoryIdParam changes
  useEffect(() => {
    if (categoryIdParam) {
      const catId = Number(categoryIdParam);
      // Immediately resolve from categoriesList if already cached for 0ms title update
      const cached = categoriesList.find((c) => c.id === catId);
      if (cached) {
        setCurrentCategory(cached);
        setBreadcrumbs([{ id: cached.id, name: cached.name, slug: cached.slug }]);
      }
      api.get(`/categories/${catId}`).then((res: any) => setCurrentCategory(res)).catch(() => {});
      api.get(`/categories/${catId}/breadcrumbs`).then((res: any) => setBreadcrumbs(res || [])).catch(() => {});
    } else {
      setCurrentCategory(null);
      setBreadcrumbs([]);
    }
  }, [categoryIdParam, categoriesList]);

  const handleSelectCategory = (catId: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (catId) {
      params.set('categoryId', String(catId));
    } else {
      params.delete('categoryId');
    }
    params.delete('page');
    // Update URL without whole page reload or scrolling
    setSearchParams(params, { replace: true });
  };

  // Fetch products
  useEffect(() => {
    setIsFetching(true);

    const params: Record<string, any> = {
      page: pageParam,
      limit: 24,
      sort: sortParam,
    };

    if (categoryIdParam) params.categoryId = categoryIdParam;
    if (brandIdParam) params.brandId = brandIdParam;
    if (queryParam) params.q = queryParam;

    api
      .get('/products', { params })
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        const total = res?.pagination?.total ?? (Array.isArray(res) ? res.length : (res?.total ?? items.length));
        const totalPages = res?.pagination?.totalPages ?? (Array.isArray(res) ? 1 : (res?.totalPages ?? 1));
        setProducts(items);
        setTotalProducts(total);
        setTotalPages(totalPages);
      })
      .catch((err) => {
        console.error('Failed to load products', err);
      })
      .finally(() => {
        setIsFetching(false);
        setIsInitialLoading(false);
      });
  }, [categoryIdParam, brandIdParam, sortParam, pageParam, queryParam]);

  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    if (sortParam) newParams.set('sort', sortParam);
    setSearchParams(newParams, { replace: true });
  };

  const handleClearSearch = () => {
    searchParams.delete('q');
    searchParams.delete('page');
    setSearchParams(searchParams, { replace: true });
  };

  const handleSortChange = (newSort: string) => {
    searchParams.set('sort', newSort);
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>

      {/* 1. Sticky Top Category Box (Fixed directly below Header - 100% Full Width) */}
      {categoriesList.length > 0 && (
        <div
          ref={categoryBarRef}
          style={{
            position: 'sticky',
            top: 'var(--site-header-height, 154px)',
            zIndex: 80,
            backgroundColor: '#ffffff',
            width: '100%',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          <div
            className="container"
            style={{
              paddingLeft: '1.5rem',
              paddingRight: '1.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                maxHeight: '92px',
                overflowY: 'auto',
                gap: '0.4rem',
                padding: '0.15rem 0',
              }}
              className="vertical-scrollbar"
            >
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                style={{
                  padding: '0.38rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  backgroundColor: !categoryIdParam ? '#113926' : '#f1f5f9',
                  color: !categoryIdParam ? '#ffffff' : '#1f2937',
                  border: !categoryIdParam ? '1px solid #113926' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: !categoryIdParam ? '0 2px 8px rgba(17, 57, 38, 0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (categoryIdParam) e.currentTarget.style.backgroundColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (categoryIdParam) e.currentTarget.style.backgroundColor = '#f1f5f9';
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
                      padding: '0.38rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      backgroundColor: isSelected ? '#113926' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#1f2937',
                      border: isSelected ? '1px solid #113926' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(17, 57, 38, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Content Container */}
      <div className="container" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* 2. Breadcrumb Bar (Below category box) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
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

        {/* 3. Catalog Title & Sort Header (Below category box) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {currentCategory ? currentCategory.name : 'All Products'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Showing {products.length} of {totalProducts} products
              </p>
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

        {/* Products Grid (Full-Width Responsive Catalog) */}
        <div style={{ width: '100%' }}>
          {isInitialLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
              Loading products...
            </div>
          ) : products.length === 0 && !isFetching ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4.5rem 2rem',
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Search size={28} color="#94a3b8" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b', marginBottom: '0.5rem' }}>
                {queryParam ? `No products found for "${queryParam}"` : 'No products found'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                {queryParam
                  ? `We couldn't find any products matching your search. Try checking for spelling errors or search with different keywords.`
                  : 'There are currently no products available in this category.'}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {queryParam && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', fontWeight: 700 }}
                  >
                    View All Products
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', minHeight: '320px' }}>
              {/* Sleek top indicator line while category data updates */}
              {isFetching && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#113926',
                      width: '45%',
                      borderRadius: '9999px',
                      animation: 'catalog-shimmer 0.85s infinite ease-in-out',
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '1.5rem',
                  opacity: isFetching ? 0.45 : 1,
                  transition: 'opacity 0.15s ease',
                  pointerEvents: isFetching ? 'none' : 'auto',
                }}
              >
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button
                    type="button"
                    disabled={pageParam <= 1}
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.set('page', String(pageParam - 1));
                      setSearchParams(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: pageParam <= 1 ? '#f8fafc' : '#ffffff',
                      color: pageParam <= 1 ? '#94a3b8' : '#1e293b',
                      cursor: pageParam <= 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => {
                        const p = new URLSearchParams(searchParams);
                        p.set('page', String(pg));
                        setSearchParams(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '0.5rem',
                        border: pg === pageParam ? '1px solid #113926' : '1px solid #e2e8f0',
                        backgroundColor: pg === pageParam ? '#113926' : '#ffffff',
                        color: pg === pageParam ? '#ffffff' : '#1e293b',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                      }}
                    >
                      {pg}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={pageParam >= totalPages}
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.set('page', String(pageParam + 1));
                      setSearchParams(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: pageParam >= totalPages ? '#f8fafc' : '#ffffff',
                      color: pageParam >= totalPages ? '#94a3b8' : '#1e293b',
                      cursor: pageParam >= totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .vertical-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .vertical-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .vertical-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .vertical-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes catalog-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  );
};
