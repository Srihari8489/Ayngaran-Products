import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isLiked = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const primaryVariant = product.variants?.[0];
    addToCart(product.id, primaryVariant?.id, 1).catch((err) => {
      alert(err.message);
    });
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const imageSrc =
    product.primaryImage ||
    product.images?.[0]?.url ||
    '/ayngaran-placeholder.svg';

  return (
    <div
      className="product-card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all var(--transition-normal)',
        position: 'relative',
      }}
    >
      {/* Thumbnail Container */}
      <Link
        to={`/product/${product.slug}`}
        style={{
          position: 'relative',
          paddingTop: '80%',
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
          display: 'block',
        }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          className="product-img"
        />

        {/* Low Stock Warning Pill */}
        {product.isLowStock && (
          <span
            className="badge badge-warning"
            style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}
          >
            Only {product.totalStock} Left
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: isLiked ? '#ffffff' : 'rgba(255, 255, 255, 0.92)',
            border: isLiked ? '1.5px solid #fecaca' : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 4,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart
            size={18}
            fill={isLiked ? '#ef4444' : 'none'}
            color={isLiked ? '#ef4444' : '#64748b'}
            style={{ transition: 'all 0.15s ease' }}
          />
        </button>

        {/* Brand Badge */}
        <span
          className="badge"
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {product.brand?.name}
        </span>
      </Link>

      {/* Content */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', color: '#f59e0b' }}>
              <Star size={14} fill="#f59e0b" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              {product.rating > 0 ? product.rating : '4.8'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({product.reviewsCount || 12})
            </span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`}>
            <h3
              style={{
                fontSize: '0.98rem',
                fontWeight: 600,
                lineHeight: 1.35,
                color: 'var(--text-main)',
                marginBottom: '0.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Action */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Starting from</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{Number(product.basePrice).toLocaleString()}
            </span>
          </div>

          {product.variants && product.variants.length > 1 ? (
            <Link
              to={`/product/${product.slug}`}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <span>{product.variants.length} Options</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={handleQuickAdd}
              className="btn-primary"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              title="Add to cart"
            >
              <ShoppingBag size={15} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-focus);
        }
        .product-card:hover .product-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};
