import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Sliders,
  Tag,
  Boxes,
  Layers,
  ShoppingBag,
  Truck,
  CreditCard,
  MessageSquare,
  BarChart3,
  Users,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Search,
  Bell,
  Sparkles
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLayout: React.FC = () => {
  const { staff, logout, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Store Overview',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: null },
      ],
    },
    {
      label: 'Products & Catalog',
      items: [
        { name: 'Categories', path: '/categories', icon: FolderTree, permission: 'CATEGORIES_MANAGE' },
        { name: 'Specifications & Filters', path: '/attributes', icon: Sliders, permission: 'ATTRIBUTES_MANAGE' },
        { name: 'Brands', path: '/brands', icon: Tag, permission: 'BRANDS_MANAGE' },
        { name: 'Products', path: '/products', icon: Boxes, permission: 'PRODUCTS_MANAGE' },
      ],
    },
    {
      label: 'Orders & Stock',
      items: [
        { name: 'Customer Orders', path: '/orders', icon: ShoppingBag, permission: 'ORDERS_MANAGE' },
        { name: 'Stock & Inventory', path: '/inventory', icon: Layers, permission: 'INVENTORY_MANAGE' },
        { name: 'Customer Reviews', path: '/reviews', icon: MessageSquare, permission: 'REVIEWS_MANAGE' },
      ],
    },
    {
      label: 'Store Settings',
      items: [
        { name: 'Shipping Partners', path: '/delivery-partners', icon: Truck, permission: 'DELIVERY_MANAGE' },
        { name: 'Payment Methods', path: '/gateways', icon: CreditCard, permission: 'SETTINGS_MANAGE' },
      ],
    },
    {
      label: 'Team & Reports',
      items: [
        { name: 'Sales Reports', path: '/reports', icon: BarChart3, permission: 'REPORTS_VIEW' },
        { name: 'Team & Staff', path: '/staff', icon: Users, permission: 'STAFF_MANAGE' },
        { name: 'Activity Log', path: '/audit-logs', icon: ShieldCheck, permission: 'AUDIT_VIEW' },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '17rem',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`sidebar-nav ${isSidebarOpen ? 'translate-x-0' : ''}`}
      >
        {/* Logo Banner */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.65rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              A
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
                AYNGARAN
              </h2>
              <p style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', fontWeight: 600, letterSpacing: '0.06em' }}>
                OPERATIONS SUITE
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'none',
            }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links Grouped */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {navGroups.map((group) => {
            const filteredItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission),
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#94a3b8',
                    padding: '0 0.75rem 0.4rem',
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setIsSidebarOpen(false)}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.65rem',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#b45309' : '#475569',
                          backgroundColor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                          border: isActive
                            ? '1px solid rgba(245, 158, 11, 0.25)'
                            : '1px solid transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                        })}
                      >
                        <Icon size={17} style={{ opacity: 0.85 }} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Storefront Link & Active Staff Card */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <a
            href={window.location.port === '3002' ? 'http://localhost:3003' : 'http://localhost:3000'}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '0.78rem',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ExternalLink size={13} /> View Live Store
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>↗</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {staff?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {staff?.name || 'Staff User'}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  {typeof staff?.role === 'string' ? staff.role : staff?.role?.name || 'Administrator'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: '17rem',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="main-viewport"
      >
        {/* Top Header */}
        <header
          style={{
            height: '4rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#b45309',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              className="mobile-open-btn"
              title="Open Navigation Menu"
            >
              <Menu size={18} />
              <span>Modules Menu</span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Store Online</span>
              <a
                href={window.location.port === '3002' ? 'http://localhost:3003' : 'http://localhost:3000'}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginLeft: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#b45309',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>View Live Store</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
              <ShieldCheck size={14} /> {typeof staff?.role === 'string' ? staff.role : staff?.role?.name || (staff?.role as any)?.code?.replace(/_/g, ' ') || 'Store Admin'}
            </span>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main style={{ flex: 1, padding: '1.75rem' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-nav {
            transform: translateX(-100%);
          }
          .sidebar-nav.translate-x-0 {
            transform: translateX(0) !important;
          }
          .main-viewport {
            margin-left: 0 !important;
          }
          .mobile-open-btn {
            display: inline-flex !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
