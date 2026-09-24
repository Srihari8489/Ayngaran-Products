import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, Heart, ArrowRight, Lock, UserCheck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const WishlistDrawer: React.FC = () => {
  const { wishlist, isWishlistOpen, closeWishlist, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const navigate = useNavigate();

  if (!isWishlistOpen) return null;

  const handleMoveToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const primaryVariant = product.variants?.[0];
      await addToCart(product.id, primaryVariant?.id, 1);
    } catch (err: any) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999990,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          animation: 'drawerFadeIn 0.2s ease-out forwards',
        }}
        onClick={closeWishlist}
      />

      {/* Slide-out Drawer Panel strictly anchored to the right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          height: '100%',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          animation: 'drawerSlideFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart size={20} fill="#ef4444" color="#ef4444" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                My Wishlist
              </h3>
              {isAuthenticated && user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                  <UserCheck size={12} color="#16a34a" />
                  <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                    {user.name && user.name !== 'Customer' ? user.name : user.phone}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    • {wishlist.length} item{wishlist.length === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                  Login required
                </span>
              )}
            </div>
          </div>
          <button
            onClick={closeWishlist}
            aria-label="Close Wishlist"
            style={{
              padding: '0.45rem',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={19} />
          </button>
        </div>

        {/* Items List / Unauthenticated Screen */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '4.5rem 1.5rem', color: '#64748b' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Lock size={38} color="#ef4444" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem' }}>
                Login to view your wishlist
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.75rem', maxWidth: '300px', margin: '0 auto 1.75rem' }}>
                Your wishlist is protected and linked directly to your customer account. Please log in to see and set your saved products.
              </p>
              <button
                onClick={() => {
                  closeWishlist();
                  openLoginModal();
                }}
                className="btn-primary"
                style={{ padding: '0.75rem 1.75rem', fontSize: '0.92rem', borderRadius: '9999px', margin: '0 auto' }}
              >
                Log In with Phone
              </button>
            </div>
          ) : isLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <p>Loading your saved favorites...</p>
            </div>
          ) : wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4.5rem 1.5rem', color: '#64748b' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Heart size={40} color="#ef4444" style={{ opacity: 0.8 }} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                Your wishlist is empty
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem', maxWidth: '280px', margin: '0 auto 1.5rem' }}>
                Tap the heart icon on any product to save your favorites directly to your account.
              </p>
              <button
                onClick={() => {
                  closeWishlist();
                  navigate('/catalog');
                }}
                className="btn-primary"
                style={{ padding: '0.7rem 1.5rem', fontSize: '0.9rem', borderRadius: '9999px', margin: '0 auto' }}
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wishlist.map((item) => {
                const imgUrl = item.primaryImage || item.images?.[0]?.url || '/ayngaran-placeholder.svg';
                const price = item.basePrice || item.variants?.[0]?.price || 0;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '0.9rem',
                      backgroundColor: '#fdfbf7',
                      borderRadius: '0.85rem',
                      border: '1px solid #f1ece1',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeWishlist}
                      style={{
                        width: '82px',
                        height: '82px',
                        borderRadius: '0.65rem',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        flexShrink: 0,
                        display: 'block',
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/traditional_spices.jpg';
                        }}
                      />
                    </Link>

                    {/* Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={closeWishlist}
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              textDecoration: 'none',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            aria-label="Remove from wishlist"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {item.brand && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            {item.brand.name}
                          </span>
                        )}
                      </div>

                      {/* Price & Move to Cart Button */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '0.65rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px dashed #e2e8f0',
                        }}
                      >
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#113926' }}>
                          ₹{Number(price).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleMoveToCart(e, item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: '#113926',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '9999px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(17, 57, 38, 0.2)',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#113926')}
                        >
                          <ShoppingBag size={13} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isAuthenticated && wishlist.length > 0 && (
          <div
            style={{
              padding: '1.15rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <button
              onClick={() => {
                closeWishlist();
                navigate('/wishlist');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                backgroundColor: '#113926',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(17, 57, 38, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>View Full Wishlist</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={clearWishlist}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                padding: '0.35rem',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              Clear all items
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
