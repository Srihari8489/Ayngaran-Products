import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Search, User as UserIcon, Menu, X, ChevronDown, MapPin, Package, LogOut, Heart, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/client';
import { Category } from '../types';

interface HeaderProps {
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLogin }) => {
  const { user, isAuthenticated, logout, openLoginModal } = useAuth();
  const handleOpenLogin = onOpenLogin || openLoginModal;
  const { cart, openCart } = useCart();
  const { wishlistCount, openWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [collectionsPos, setCollectionsPos] = useState({ top: 0, left: 0 });

  // Recent Searches state (per-user, max 3 items)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const accountBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const collectionsBtnRef = useRef<HTMLButtonElement>(null);
  const collectionsDropdownRef = useRef<HTMLDivElement>(null);

  // Storage key per user (or guest)
  const recentStorageKey = user?.id ? `ayngaran_recent_searches_${user.id}` : 'ayngaran_recent_searches_guest';

  // Load user-specific recent searches from localStorage (max 3)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(recentStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 3));
        }
      } else {
        setRecentSearches([]);
      }
    } catch {
      setRecentSearches([]);
    }
  }, [recentStorageKey]);

  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 3);
      setRecentSearches(updated);
      localStorage.setItem(recentStorageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = recentSearches.filter((q) => q.toLowerCase() !== itemToRemove.toLowerCase());
    setRecentSearches(updated);
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(updated));
    } catch { }
  };

  const clearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentSearches([]);
    try {
      localStorage.removeItem(recentStorageKey);
    } catch { }
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    saveSearchQuery(query);
    setIsSearchFocused(false);
    navigate(`/catalog?q=${encodeURIComponent(query)}`);
  };

  // Close account, collections, & search dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedAccountButton = accountBtnRef.current?.contains(target);
      const clickedAccountDropdown = dropdownRef.current?.contains(target);
      if (!clickedAccountButton && !clickedAccountDropdown) {
        setIsAccountMenuOpen(false);
      }

      const clickedCollectionsButton = collectionsRef.current?.contains(target);
      const clickedCollectionsDropdown = collectionsDropdownRef.current?.contains(target);
      if (!clickedCollectionsButton && !clickedCollectionsDropdown) {
        setIsCollectionsOpen(false);
      }

      const clickedSearch = searchContainerRef.current?.contains(target);
      if (!clickedSearch) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reposition account dropdown on scroll/resize while open
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const updatePos = () => {
      if (accountBtnRef.current) {
        const rect = accountBtnRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 12,
          right: window.innerWidth - rect.right,
        });
      }
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isAccountMenuOpen]);

  const [categoryImageMap, setCategoryImageMap] = useState<Record<string | number, string>>({});
  const collectionsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reposition collections dropdown on scroll/resize while open
  useEffect(() => {
    if (!isCollectionsOpen) return;
    const updatePos = () => {
      if (collectionsBtnRef.current) {
        const rect = collectionsBtnRef.current.getBoundingClientRect();
        setCollectionsPos({
          top: rect.bottom + 6,
          left: rect.left + rect.width / 2,
        });
      }
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isCollectionsOpen]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.search]);

  // Fetch categories and product images for rich category thumbnails
  useEffect(() => {
    api.get('/categories/tree').then((res: any) => {
      const cats = Array.isArray(res) ? res : (res?.data || []);
      setCategories(cats);
    });

    api.get('/products?limit=100').then((res: any) => {
      const prods: any[] = Array.isArray(res)
        ? res
        : (res?.items || res?.data?.items || (Array.isArray(res?.data) ? res.data : []));
      const map: Record<string | number, string> = {};
      prods.forEach((p: any) => {
        const cId = p.categoryId || p.category?.id;
        const parentId = p.category?.parentId;
        const cName = p.category?.name?.toLowerCase()?.trim();
        const img = p.primaryImage || p.images?.[0]?.url;
        if (img) {
          if (cId && !map[cId]) {
            map[cId] = img;
          }
          if (parentId && !map[parentId]) {
            map[parentId] = img;
          }
          if (cName && !map[cName]) {
            map[cName] = img;
          }
        }
      });
      setCategoryImageMap(map);
    }).catch(() => { });

    return () => {
      if (collectionsCloseTimerRef.current) {
        clearTimeout(collectionsCloseTimerRef.current);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      saveSearchQuery(trimmed);
      setIsSearchFocused(false);
      navigate(`/catalog?q=${encodeURIComponent(trimmed)}`);
    } else {
      setIsSearchFocused(false);
      navigate('/catalog');
    }
  };

  const toggleAccountMenu = () => {
    if (!isAccountMenuOpen && accountBtnRef.current) {
      const rect = accountBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
    setIsAccountMenuOpen((prev) => !prev);
  };

  const openCollectionsMenu = () => {
    if (collectionsCloseTimerRef.current) {
      clearTimeout(collectionsCloseTimerRef.current);
      collectionsCloseTimerRef.current = null;
    }
    // Prevent collections dropdown from colliding with active search
    if (isSearchFocused) return;
    if (collectionsBtnRef.current) {
      const rect = collectionsBtnRef.current.getBoundingClientRect();
      setCollectionsPos({
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      });
    }
    setIsCollectionsOpen(true);
  };

  const closeCollectionsMenu = (immediate = false) => {
    if (collectionsCloseTimerRef.current) {
      clearTimeout(collectionsCloseTimerRef.current);
      collectionsCloseTimerRef.current = null;
    }
    if (immediate) {
      setIsCollectionsOpen(false);
    } else {
      collectionsCloseTimerRef.current = setTimeout(() => {
        setIsCollectionsOpen(false);
      }, 220);
    }
  };

  const toggleCollectionsMenu = () => {
    if (isCollectionsOpen) {
      closeCollectionsMenu(true);
    } else {
      openCollectionsMenu();
    }
  };

  const isHomeActive = location.pathname === '/';
  const isCollectionsActive = location.pathname.startsWith('/catalog');
  const isAboutActive = location.pathname === '/about';
  const isContactActive = location.pathname === '/contact';

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          '--site-header-height',
          `${headerRef.current.offsetHeight}px`
        );
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    const timer = setTimeout(updateHeight, 300);
    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* 1. Top Announcement Bar (Non-sticky, scrolls away naturally with page) */}
      <div
        style={{
          backgroundColor: '#113926',
          color: '#ffffff',
          padding: '0.35rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.85rem',
          flexWrap: 'wrap',
          textAlign: 'center',
          fontSize: '0.84rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          lineHeight: 1.35,
        }}
      >
        <span>100% Natural Traditional Products - Free Shipping Above Rs 499!</span>
        <Link
          to="/catalog"
          style={{
            backgroundColor: '#ffb703',
            color: '#0d2016',
            fontWeight: 800,
            fontSize: '0.8rem',
            padding: '0.24rem 1rem',
            borderRadius: '9999px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fca311';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffb703';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>Shop Now</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>&rarr;</span>
        </Link>
      </div>

      {/* Sticky Main Header matching Image 2 */}
      <header
        ref={headerRef}
        className="sticky top-0 shadow-sm"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          overflow: 'visible',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          className="container header-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
            gap: '1.25rem',
            paddingTop: '0.2rem',
            paddingBottom: '0.2rem',
            overflow: 'visible',
          }}
        >
          {/* Column 1 (Left): Brand Logo Centered Vertically Across Both Rows */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: '100%',
              flexShrink: 0,
            }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <img
                src="/Ayngaran_logo.png"
                alt="Ayngaran Store Logo"
                style={{
                  height: '5rem',
                  maxHeight: '82px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  transform: 'scale(1.15)',
                  transformOrigin: 'left center',
                }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                }}
              />
            </Link>
          </div>

          {/* Column 2 (Center): Search Bar + Nav Links in the Center of the Screen */}
          <div
            className="header-center-col"
            style={{
              width: 'clamp(380px, 48vw, 620px)',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.45rem',
              minWidth: 0,
            }}
          >
            {/* Row 1: Search Bar */}
            <div
              ref={searchContainerRef}
              style={{ width: '100%', position: 'relative', zIndex: 1000 }}
              className="search-desktop"
            >
              <form onSubmit={handleSearch} style={{ width: '100%', margin: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ paddingLeft: '0.85rem', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                    <Search size={18} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      setIsSearchFocused(true);
                      closeCollectionsMenu(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchFocused(false);
                        searchInputRef.current?.blur();
                      }
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      backgroundColor: 'transparent',
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
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                  {/* Gold Search Button matching Image 2 */}
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#b58315',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#9a6e0f')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#b58315')}
                    title="Search"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>

              {/* Recent Searches Floating Dropdown */}
              {isSearchFocused && recentSearches.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 20px 35px -5px rgba(17, 57, 38, 0.16), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
                    zIndex: 1001,
                    overflow: 'hidden',
                    animation: 'searchDropdownFadeIn 0.15s ease-out',
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 1rem 0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Clock size={13} color="#16a34a" />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.1rem 0.3rem',
                        borderRadius: '0.25rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      Clear All
                    </button>
                  </div>

                  <div style={{ padding: '0.4rem 0' }}>
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleRecentSearchClick(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          color: '#1e293b',
                          transition: 'background-color 0.12s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Search size={15} style={{ color: '#94a3b8' }} />
                          <span>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '0.3rem',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            marginLeft: '0.5rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Navigation Links Centered Directly Below Search Bar */}
            <nav
              className="desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2.5rem',
                paddingTop: '0.1rem',
                paddingBottom: '0.1rem',
                width: '100%',
              }}
            >
              {/* Home */}
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: isHomeActive ? '#113926' : '#1f2937',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  textDecoration: 'none',
                  paddingBottom: '2px',
                  borderBottom: isHomeActive ? '2px solid #113926' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isHomeActive) e.currentTarget.style.color = '#113926';
                }}
                onMouseLeave={(e) => {
                  if (!isHomeActive) e.currentTarget.style.color = '#1f2937';
                }}
              >
                Home
              </Link>

              {/* Our Collections with Hover & Click Dropdown */}
              <div
                ref={collectionsRef}
                onMouseEnter={openCollectionsMenu}
                onMouseLeave={() => closeCollectionsMenu(false)}
                style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
              >
                <button
                  ref={collectionsBtnRef}
                  type="button"
                  onClick={toggleCollectionsMenu}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: (isCollectionsActive || isCollectionsOpen) ? '#113926' : '#1f2937',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    textDecoration: 'none',
                    paddingBottom: '2px',
                    borderBottom: (isCollectionsActive || isCollectionsOpen) ? '2px solid #113926' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCollectionsActive && !isCollectionsOpen) e.currentTarget.style.color = '#113926';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCollectionsActive && !isCollectionsOpen) e.currentTarget.style.color = '#1f2937';
                  }}
                >
                  <span>Our Collections</span>
                  <ChevronDown
                    size={14}
                    style={{
                      strokeWidth: 2.4,
                      color: (isCollectionsActive || isCollectionsOpen) ? '#113926' : '#374151',
                      transition: 'transform 0.2s ease',
                      transform: isCollectionsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {/* Collections Dropdown Menu — portaled to document.body, opens on hover and click */}
                {isCollectionsOpen && createPortal(
                  <div
                    ref={collectionsDropdownRef}
                    onMouseEnter={openCollectionsMenu}
                    onMouseLeave={() => closeCollectionsMenu(false)}
                    style={{
                      position: 'fixed',
                      top: collectionsPos.top,
                      left: collectionsPos.left,
                      transform: 'translateX(-50%)',
                      width: 'clamp(360px, 42vw, 440px)',
                      backgroundColor: '#ffffff',
                      borderRadius: '1rem',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 16px 40px rgba(17, 57, 38, 0.16)',
                      zIndex: 999999,
                      overflow: 'hidden',
                      animation: 'collectionsFadeIn 0.15s ease-out',
                    }}
                  >
                    {/* Header matching Image 2 */}
                    <div
                      style={{
                        padding: '1rem 1.25rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#113926',
                          margin: 0,
                          fontFamily: 'Outfit, sans-serif',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        Our Collections
                      </h3>
                      <Link
                        to="/catalog"
                        onClick={() => closeCollectionsMenu(true)}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#16a34a',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: '#f0fdf4',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          border: '1px solid #dcfce7',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#113926';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0fdf4';
                          e.currentTarget.style.color = '#16a34a';
                        }}
                      >
                        <span>Full Store</span>
                        <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>&rarr;</span>
                      </Link>
                    </div>

                    {/* Divider Line */}
                    <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0 1.25rem 0.85rem' }} />

                    {/* 2-Column Grid of Categories with Authentic Product Images */}
                    <div
                      className="collections-dropdown-scrollbar"
                      style={{
                        maxHeight: '215px',
                        overflowY: 'auto',
                        padding: '0 1.25rem 1.15rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '0.65rem',
                      }}
                    >
                      {categories.map((cat) => {
                        const catNameKey = (cat.name || '').toLowerCase().trim();
                        const thumbUrl =
                          cat.image ||
                          categoryImageMap[cat.id] ||
                          categoryImageMap[catNameKey] ||
                          '/traditional_spices.jpg';
                        return (
                          <Link
                            key={cat.id}
                            to={`/catalog?categoryId=${cat.id}`}
                            onClick={() => closeCollectionsMenu(true)}
                            className="collection-grid-card"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              padding: '0.6rem 0.85rem',
                              backgroundColor: '#f2f9f5',
                              borderRadius: '0.75rem',
                              border: '1px solid #e2f2e9',
                              textDecoration: 'none',
                              color: '#0f172a',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            <div
                              className="cat-thumb-box"
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                flexShrink: 0,
                                border: '1.5px solid rgba(17, 57, 38, 0.15)',
                                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <img
                                src={thumbUrl}
                                alt={cat.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/traditional_spices.jpg';
                                }}
                              />
                            </div>

                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#111827',
                                lineHeight: 1.25,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {cat.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    <style>{`
                      .collection-grid-card:hover {
                        background-color: #113926 !important;
                        border-color: #113926 !important;
                        color: #ffffff !important;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 18px rgba(17, 57, 38, 0.25) !important;
                      }
                      .collection-grid-card:hover span {
                        color: #ffffff !important;
                      }
                      .collection-grid-card:hover .cat-thumb-box {
                        border-color: #ffb703 !important;
                        transform: scale(1.08);
                      }
                      .collections-dropdown-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #113926 #f1f5f9;
                      }
                      .collections-dropdown-scrollbar::-webkit-scrollbar {
                        width: 5px;
                      }
                      .collections-dropdown-scrollbar::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 9999px;
                      }
                      .collections-dropdown-scrollbar::-webkit-scrollbar-thumb {
                        background: #113926;
                        border-radius: 9999px;
                      }
                      .collections-dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #0d2b1c;
                      }
                    `}</style>
                  </div>,
                  document.body
                )}
              </div>

              {/* About Us */}
              <Link
                to="/about"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: isAboutActive ? '#113926' : '#1f2937',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  textDecoration: 'none',
                  paddingBottom: '2px',
                  borderBottom: isAboutActive ? '2px solid #113926' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isAboutActive) e.currentTarget.style.color = '#113926';
                }}
                onMouseLeave={(e) => {
                  if (!isAboutActive) e.currentTarget.style.color = '#1f2937';
                }}
              >
                About Us
              </Link>

              {/* Contact Us */}
              <Link
                to="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: isContactActive ? '#113926' : '#1f2937',
                  fontWeight: 700,
                  fontSize: '0.94rem',
                  textDecoration: 'none',
                  paddingBottom: '2px',
                  borderBottom: isContactActive ? '2px solid #113926' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isContactActive) e.currentTarget.style.color = '#113926';
                }}
                onMouseLeave={(e) => {
                  if (!isContactActive) e.currentTarget.style.color = '#1f2937';
                }}
              >
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Column 3 (Right): Actions (Wishlist, Cart, Account, Mobile Toggle) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            {/* Row 1: Actions horizontally aligned with Search Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexShrink: 0,
                minHeight: '42px',
              }}
            >
              {/* Wishlist */}
              <button
                onClick={openWishlist}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: wishlistCount > 0 ? '#ef4444' : '#1f2937',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem',
                }}
                title="My Wishlist"
              >
                <Heart size={21} fill={wishlistCount > 0 ? '#ef4444' : 'none'} color={wishlistCount > 0 ? '#ef4444' : '#1f2937'} />
              </button>

              {/* Cart with green circle count badge matching Image 2 */}
              <button
                onClick={openCart}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#1f2937',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem',
                }}
                title="Shopping Cart"
              >
                <ShoppingCart size={22} strokeWidth={1.8} />
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-7px',
                    backgroundColor: '#113926',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    width: '1.15rem',
                    height: '1.15rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cart?.totalItems || 0}
                </span>
              </button>

              {/* User / Account Button matching Image 2 */}
              {isAuthenticated ? (
                <div style={{ position: 'relative' }}>
                  <button
                    ref={accountBtnRef}
                    onClick={toggleAccountMenu}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#1f2937',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.35rem 0.5rem',
                    }}
                  >
                    <UserIcon size={20} />
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name?.split(' ')[0] || 'Account'}
                    </span>
                  </button>

                  {/* Account Dropdown */}
                  {isAccountMenuOpen && createPortal(
                    <div
                      ref={dropdownRef}
                      style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        right: dropdownPos.right,
                        width: '240px',
                        backgroundColor: '#ffffff',
                        borderRadius: '1rem',
                        boxShadow: '0 20px 35px -5px rgba(17, 57, 38, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e2e8f0',
                        zIndex: 999999,
                        animation: 'fadeInDown 0.15s ease-out',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f0fdf4' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: '#113926' }}>
                          {user?.name || 'Customer'}
                        </p>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                          {user?.phone || user?.email || ''}
                        </p>
                      </div>
                      <div style={{ padding: '0.4rem' }}>
                        {[
                          { to: '/account/profile', label: 'My Profile', icon: UserIcon },
                          { to: '/orders', label: 'Orders & Reorder', icon: Package },
                          { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
                        ].map(({ to, label, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setIsAccountMenuOpen(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '0.5rem',
                              color: '#334155',
                              textDecoration: 'none',
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              transition: 'all 0.12s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <Icon size={17} style={{ color: '#2d6a4f' }} />
                            <span>{label}</span>
                          </Link>
                        ))}
                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '0.25rem 0' }} />
                        <button
                          onClick={() => { logout(); setIsAccountMenuOpen(false); navigate('/'); }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            background: '#ffffff',
                            border: 'none',
                            color: '#e11d48',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderRadius: '0.5rem',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          <LogOut size={17} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              ) : (
                <button
                  onClick={handleOpenLogin}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#1f2937',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                  }}
                >
                  <UserIcon size={20} />
                  <span>Account</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ display: 'none', padding: '0.35rem', color: 'var(--text-main)' }}
                className="mobile-toggle"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Row 2: Spacer to keep Actions aligned with Search Bar */}
            <div style={{ height: '28px' }} className="desktop-spacer" />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(12px)',
            zIndex: 99999,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Mobile Drawer Header with Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.1rem' }}>Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ color: '#ffffff', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Sub-Nav Links for Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                backgroundColor: isHomeActive ? '#113926' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Home
            </Link>
            <Link
              to="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                backgroundColor: isCollectionsActive ? '#113926' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Our Collections
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                backgroundColor: isAboutActive ? '#113926' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                backgroundColor: isContactActive ? '#113926' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              Contact Us
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                gridColumn: 'span 2',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ffffff',
                padding: '0.7rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Heart size={16} fill="#ef4444" color="#ef4444" />
              <span>My Wishlist ({wishlistCount})</span>
            </Link>
          </div>
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

          {/* Recent Searches in Mobile View */}
          {recentSearches.length > 0 && (
            <div style={{ marginTop: '-0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={12} color="#86efac" /> Recent Searches
                </span>
                <button
                  type="button"
                  onClick={(e) => clearAllRecentSearches(e)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  Clear all
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {recentSearches.map((item, idx) => (
                  <div
                    key={`mob-recent-${item}-${idx}`}
                    onClick={() => {
                      handleRecentSearchClick(item);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Clock size={12} color="#86efac" />
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(e, item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        padding: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        @keyframes collectionsFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes searchDropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .search-desktop { display: block !important; }
        }
        @media (max-width: 767px) {
          .header-grid-container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .header-center-col {
            display: none !important;
          }
          .desktop-nav { display: none !important; }
          .search-desktop { display: none !important; }
          .desktop-spacer { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
};