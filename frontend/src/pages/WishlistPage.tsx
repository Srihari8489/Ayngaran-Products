import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronRight, ShoppingBag, Trash2, Lock, UserCheck } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist, isLoading } = useWishlist();
  const { user, isAuthenticated, openLoginModal } = useAuth();

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Breadcrumb Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.84rem',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
        }}
      >
        <Link to="/" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
          Home
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>My Wishlist</span>
      </div>

      {/* Page Title Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                fontWeight: 800,
                color: '#113926',
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              My Wishlist
            </h1>

            {isAuthenticated && user && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <UserCheck size={14} color="#16a34a" />
                <span>Customer: {user.name && user.name !== 'Customer' ? user.name : user.phone}</span>
              </div>
            )}

            {isAuthenticated && (
              <span
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                }}
              >
                {wishlist.length} item{wishlist.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', margin: 0 }}>
            {isAuthenticated && user
              ? `Personalized wishlist for ${user.name || user.phone} synced with your customer account`
              : 'Sign in to access and set your saved items'}
          </p>
        </div>

        {isAuthenticated && wishlist.length > 0 && (
          <button
            onClick={clearWishlist}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#ef4444',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Trash2 size={15} />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {!isAuthenticated ? (
        /* Protected Login State */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            padding: '5rem 1.5rem',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '3rem auto',
          }}
        >
          <div
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.35rem',
            }}
          >
            <Lock size={42} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
            Login to Access Your Wishlist
          </h2>
          <p style={{ fontSize: '0.94rem', color: '#64748b', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '380px', margin: '0 auto 2rem' }}>
            Wishlist is protected by customer login. Please log in with your phone number to see who set the wishlist and manage your saved products.
          </p>
          <button
            onClick={openLoginModal}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.8rem 2rem',
              fontSize: '0.95rem',
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            <span>Log In with Phone</span>
          </button>
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#64748b' }}>
          <p>Loading your saved wishlist items...</p>
        </div>
      ) : wishlist.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            border: '1px dashed #cbd5e1',
            padding: '5rem 1.5rem',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '2rem auto',
          }}
        >
          <div
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Heart size={44} color="#ef4444" style={{ opacity: 0.8 }} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            Your wishlist is empty
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            You haven’t saved any items yet. Explore our traditional foods and tap the heart icon on any product to save it here.
          </p>
          <Link
            to="/catalog"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              fontSize: '0.95rem',
              borderRadius: '9999px',
              textDecoration: 'none',
            }}
          >
            <ShoppingBag size={18} />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        /* Product Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {wishlist.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
