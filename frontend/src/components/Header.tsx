import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, User as UserIcon, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import { Category } from '../types';

interface HeaderProps {
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const handleOpenLogin = onOpenLogin || openLoginModal;
  const { cart, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    api.get('/categories/tree').then((res: any) => {
      setCategories(res || []);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b" style={{ borderColor: 'var(--border-color)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '0.65rem',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
          }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AYNGARAN
            </span>
            <span style={{ fontSize: '0.7rem', display: 'block', fontWeight: 600, color: 'var(--text-muted)', marginTop: '-4px', letterSpacing: '0.12em' }}>
              STORE
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: '1', maxWidth: '440px', margin: '0 1.5rem', display: 'none' }} className="search-desktop">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search products, brands, models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '2.4rem',
                paddingRight: searchQuery ? '2.4rem' : '1rem',
                borderRadius: '9999px',
                fontSize: '0.9rem',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  navigate('/catalog');
                }}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
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
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Cart Icon */}
          <button
            onClick={openCart}
            style={{
              position: 'relative',
              padding: '0.6rem',
              borderRadius: '9999px',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f1f5f9',
              transition: 'background var(--transition-fast)',
            }}
            title="Shopping Cart"
          >
            <ShoppingBag size={20} />
            {cart && cart.totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--primary-600)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
              >
                {cart.totalItems}
              </span>
            )}
          </button>

          {/* User Auth */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link
                to="/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                }}
              >
                <UserIcon size={16} />
                <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
              </Link>
              <button
                onClick={logout}
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={handleOpenLogin} className="btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}>
              <UserIcon size={16} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ display: 'none', padding: '0.4rem', color: 'var(--text-main)' }}
            className="mobile-toggle"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>



      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '4.5rem',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Mobile Search Input */}
          <form
            onSubmit={(e) => {
              handleSearch(e);
              setIsMobileMenuOpen(false);
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search products, brands, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: '2.4rem',
                  paddingRight: searchQuery ? '2.4rem' : '1rem',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    navigate('/catalog');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Categories in Mobile View */}
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
              Shop by Category
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              <Link
                to="/catalog"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                All Products
              </Link>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <Link
                    to={`/catalog?categoryId=${cat.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {cat.children.length} items
                      </span>
                    )}
                  </Link>
                  {cat.children && cat.children.length > 0 && (
                    <div style={{ paddingLeft: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/catalog?categoryId=${sub.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          style={{
                            padding: '0.45rem 0.65rem',
                            color: '#cbd5e1',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                          }}
                        >
                          • {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Links on Mobile */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}
                >
                  My Orders & Account
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: 0,
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  handleOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <UserIcon size={16} />
                <span>Customer Login</span>
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .search-desktop { display: block !important; }
        }
        @media (max-width: 767px) {
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </header>
  );
};
