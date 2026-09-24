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
  Sparkles,
  HelpCircle,
  Mail,
  UserCheck,
  Star,
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
        { name: 'Customers', path: '/users', icon: UserCheck, permission: null },
        { name: 'Stock & Inventory', path: '/inventory', icon: Layers, permission: 'INVENTORY_MANAGE' },
        { name: 'Customer Reviews', path: '/reviews', icon: MessageSquare, permission: 'REVIEWS_MANAGE' },
      ],
    },
    {
      label: 'Inquiries & Marketing',
      items: [
        { name: 'Customer Inquiries', path: '/inquiries', icon: HelpCircle, permission: null },
        { name: 'Customer Feedbacks', path: '/feedbacks', icon: Star, permission: null },
        { name: 'Newsletter Subscribers', path: '/subscribers', icon: Mail, permission: null },
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
          background: 'var(--green-900)',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
        className={`sidebar-nav ${isSidebarOpen ? 'translate-x-0' : ''}`}
      >
        {/* Logo Banner */}
        <div
          style={{
            padding: '1.35rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #8b7d2a 0%, #d4c56a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.15rem',
                boxShadow: '0 4px 14px rgba(139,125,42,0.4)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              A
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.03em', color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                AYNGARAN
              </h2>
              <p style={{ fontSize: '0.65rem', color: '#ffffff', opacity: 0.9, fontWeight: 700, letterSpacing: '0.1em' }}>
                ADMIN SUITE
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.4rem',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'none',
            }}
            className="mobile-close-btn"
          >
            <X size={18} />
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
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#ffffff',
                    opacity: 0.95,
                    padding: '0 0.75rem 0.35rem',
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
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
                          gap: '0.7rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.6rem',
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 800 : 600,
                          color: '#ffffff',
                          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                          border: isActive
                            ? '1px solid rgba(255, 255, 255, 0.35)'
                            : '1px solid transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                        })}
                      >
                        <Icon size={16} style={{ color: '#ffffff', opacity: 1, flexShrink: 0 }} />
                        <span style={{ color: '#ffffff' }}>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Staff Footer */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
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
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffffff' }}>
              <ExternalLink size={13} style={{ color: '#ffffff' }} /> View Live Store
            </span>
            <span style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 800 }}>↗</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '2.1rem',
                  height: '2.1rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #8b7d2a 0%, #d4c56a 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(139,125,42,0.35)',
                }}
              >
                {staff?.name?.charAt(0) || 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {staff?.name || 'Staff User'}
                </p>
                <p style={{ fontSize: '0.68rem', color: '#ffffff', opacity: 0.85, fontWeight: 700 }}>
                  {typeof staff?.role === 'string' ? staff.role : staff?.role?.name || 'Administrator'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
                cursor: 'pointer',
                padding: '0.35rem 0.5rem',
                borderRadius: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <LogOut size={15} />
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
            borderBottom: '2px solid #d8f3dc',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            boxShadow: '0 1px 0 0 #d8f3dc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#1a3d2b',
                border: 'none',
                color: '#ffffff',
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
              <span>Menu</span>
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
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 8px #22c55e',
                }}
              />
              <span style={{ fontWeight: 700, color: '#1a3d2b' }}>Store Online</span>
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
                  background: '#f0fdf4',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid #bbf7d0',
                }}
              >
                <span>Live Store</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '999px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
              <ShieldCheck size={13} /> {typeof staff?.role === 'string' ? staff.role : staff?.role?.name || (staff?.role as any)?.code?.replace(/_/g, ' ') || 'Store Admin'}
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
