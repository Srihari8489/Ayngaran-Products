import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react';
import api from '../api/client';
import { CategoryFiltersResponse, Category } from '../types';

interface DynamicFilterSidebarProps {
  categoryId?: number;
  onSelectCategory?: (categoryId: number | null) => void;
  selectedBrandIds: number[];
  onSelectBrand: (brandId: number) => void;
  minPrice?: number | null;
  maxPrice?: number | null;
  onPriceChange: (min: number | null, max: number | null) => void;
  selectedAttrs: Record<string, string[]>;
  onAttrChange: (attrSlug: string, value: string) => void;
  onResetFilters: () => void;
}

export const DynamicFilterSidebar: React.FC<DynamicFilterSidebarProps> = ({
  categoryId,
  onSelectCategory,
  selectedBrandIds = [],
  onSelectBrand,
  minPrice,
  maxPrice,
  onPriceChange,
  selectedAttrs = {},
  onAttrChange,
  onResetFilters,
}) => {
  const [generalBrands, setGeneralBrands] = useState<any[]>([]);
  const [filterConfig, setFilterConfig] = useState<CategoryFiltersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    brand: true,
  });

  // Fetch general brands on mount
  useEffect(() => {
    api.get('/brands').then((res: any) => {
      setGeneralBrands(res || []);
    });
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setFilterConfig(null);
      return;
    }

    setIsLoading(true);
    api
      .get(`/products/filters?categoryId=${categoryId}`)
      .then((res: any) => {
        setFilterConfig(res);
        const exp: Record<string, boolean> = { categories: true, price: true, brand: true };
        if (res.attributes) {
          res.attributes.forEach((attr: any) => {
            exp[attr.slug] = true;
          });
        }
        setExpandedSections(exp);
      })
      .catch(() => {
        setFilterConfig(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [categoryId]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasActiveFilters =
    categoryId !== undefined ||
    selectedBrandIds.length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    Object.keys(selectedAttrs).length > 0;

  const brandsToDisplay = filterConfig?.brands && filterConfig.brands.length > 0
    ? filterConfig.brands
    : generalBrands;


  return (
    <aside
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Sidebar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--primary-600)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'var(--primary-600)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>



      {/* 1. Price Range Filter */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
        <div
          onClick={() => toggleSection('price')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.75rem' }}
        >
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Price Range</h4>
          {expandedSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expandedSections.price && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              placeholder={filterConfig?.priceRange ? `₹${filterConfig.priceRange.min}` : 'Min ₹'}
              className="input-field"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
              value={minPrice ?? ''}
              onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : null, maxPrice ?? null)}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input
              type="number"
              placeholder={filterConfig?.priceRange ? `₹${filterConfig.priceRange.max}` : 'Max ₹'}
              className="input-field"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
              value={maxPrice ?? ''}
              onChange={(e) => onPriceChange(minPrice ?? null, e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        )}
      </div>

      {/* 2. Brands Filter */}
      {brandsToDisplay.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
          <div
            onClick={() => toggleSection('brand')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.75rem' }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Brand</h4>
            {expandedSections.brand ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {expandedSections.brand && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {brandsToDisplay.map((b: any) => {
                const isSelected = selectedBrandIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: '0.2rem 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectBrand(b.id)}
                        style={{ accentColor: 'var(--primary-600)', width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{b.name}</span>
                    </div>
                    {b.count !== undefined && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({b.count})</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. DYNAMIC INHERITED ATTRIBUTES (Generated completely from category hierarchy!) */}
      {filterConfig?.attributes &&
        filterConfig.attributes.map((attr) => {
          const isExpanded = expandedSections[attr.slug] ?? true;
          const currentVals = selectedAttrs[attr.slug] || [];

          return (
            <div
              key={attr.id}
              style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}
            >
              <div
                onClick={() => toggleSection(attr.slug)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.75rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{attr.name}</h4>
                  {attr.unit && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({attr.unit})</span>
                  )}
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {attr.options.map((opt) => {
                    const isChecked = currentVals.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          padding: '0.2rem 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onAttrChange(attr.slug, opt.value)}
                            style={{ accentColor: 'var(--primary-600)', width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: isChecked ? 600 : 400 }}>{opt.displayName}</span>
                        </div>
                        {opt.count > 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({opt.count})</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </aside>
  );
};
