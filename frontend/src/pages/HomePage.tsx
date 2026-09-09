import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Zap, Award } from 'lucide-react';
import api from '../api/client';
import { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [columnsCount, setColumnsCount] = useState<number>(4);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) setColumnsCount(4);
      else if (width >= 900) setColumnsCount(3);
      else if (width >= 600) setColumnsCount(2);
      else setColumnsCount(1);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/categories/tree'),
      api.get('/brands'),
    ])
      .then(([prodRes, catRes, brandRes]: any) => {
        setAllProducts(prodRes?.items || []);
        setCategories(catRes || []);
        setBrands(brandRes || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleCategoryClick = (catId: number) => {
    setSelectedCategoryId(catId);
    const el = document.getElementById('products-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectedIndex = categories.findIndex((c) => c.id === selectedCategoryId);
  const orderedCategories =
    selectedIndex !== -1
      ? [
          ...categories.slice(selectedIndex),
          ...categories.slice(0, selectedIndex),
        ]
      : categories;

  const displayedCategories = showAllCategories ? categories : categories.slice(0, columnsCount);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #31104b 100%)',
          color: '#ffffff',
          padding: '5rem 0 6rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient background effects */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '10%',
            width: '450px',
            height: '450px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '640px' }}>
            <div
              className="badge"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.2)',
                color: '#fcd34d',
                border: '1px solid rgba(253, 230, 138, 0.3)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
              }}
            >
              <Sparkles size={14} />
              <span>Ayngaran Foods • Pure &amp; Traditional</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}
            >
              Authentic Traditional Foods &amp; Herbal Wellness
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2rem' }}>
              Explore certified traditional podi varieties, nutritious natural malts, organic wellness powders, stone-ground masalas, restorative soups, and herbal personal care from Ayngaran Foods.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/catalog" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
                <span>Explore Catalog</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid / Single Row */}
      <section style={{ padding: '4rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Curated Hierarchy
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '0.25rem', fontWeight: 800, color: '#0f172a' }}>Browse by Category</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAllCategories(!showAllCategories)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-600)',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
            >
              <span>{showAllCategories ? 'Show Fewer (Screen Width) ↑' : `View All (${categories.length}) →`}</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: showAllCategories
                ? 'repeat(auto-fill, minmax(230px, 1fr))'
                : `repeat(${columnsCount}, minmax(0, 1fr))`,
              gap: '1.25rem',
            }}
          >
            {displayedCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="glass-panel"
                  style={{
                    borderRadius: '1.25rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    width: '100%',
                    border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? '0 10px 25px -5px rgba(99, 102, 241, 0.25)' : 'var(--shadow-sm)',
                    transition: 'all var(--transition-normal)',
                  }}
                >
                  <div
                    style={{
                      width: '85px',
                      height: '85px',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      backgroundColor: '#e2e8f0',
                    }}
                  >
                    <img
                      src={cat.image || '/ayngaran-placeholder.svg'}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a' }}>{cat.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: isSelected ? 'var(--primary-600)' : 'var(--text-muted)', fontWeight: isSelected ? 600 : 400 }}>
                    {isSelected ? '✓ Category Active' : 'Explore products'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Showcase Grouped by Category */}
      <section id="products-showcase" style={{ padding: '3rem 0 5rem', backgroundColor: '#f8fafc' }}>
        <div className="container">
          {/* Header & Category Filter Pills */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Pure &amp; Traditional Foods
                </span>
                <h2 style={{ fontSize: '2.1rem', marginTop: '0.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedCategoryId
                    ? `${categories.find((c) => c.id === selectedCategoryId)?.name} & All Varieties`
                    : 'Ayngaran Popular Specialties'}
                </h2>
              </div>
              <Link to="/catalog" style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>See Full Store</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Quick Category Filter Bar */}
            <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedCategoryId(null)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedCategoryId === null ? 'var(--primary-600)' : '#ffffff',
                  color: selectedCategoryId === null ? '#ffffff' : '#475569',
                  boxShadow: 'var(--shadow-sm)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                All Varieties ({allProducts.length})
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const count = allProducts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: isSelected ? '2px solid var(--primary-600)' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--primary-600)' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      boxShadow: 'var(--shadow-sm)',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.6 }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading products...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
              {orderedCategories.map((cat) => {
                const catProducts = allProducts.filter((p) => p.categoryId === cat.id || p.category?.id === cat.id);
                if (catProducts.length === 0) return null;
                const isPriority = selectedCategoryId === cat.id;

                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
                          {cat.name}
                        </h3>
                        {isPriority && (
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                            Selected Category
                          </span>
                        )}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          ({catProducts.length} Products)
                        </span>
                      </div>
                      <Link
                        to={`/catalog?categoryId=${cat.id}`}
                        style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-600)', textDecoration: 'none' }}
                      >
                        Explore all in {cat.name} →
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.75rem' }}>
                      {catProducts.map((prod) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Brand Partners Showcase */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Official Partners
            </span>
            <h2 style={{ fontSize: '1.8rem', marginTop: '0.25rem' }}>Authorized Global Brands</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
            {brands.map((b) => (
              <Link
                key={b.id}
                to={`/catalog?brandId=${b.id}`}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                <Award size={20} color="var(--primary-600)" />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{b.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
