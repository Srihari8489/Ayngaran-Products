import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { User, MapPin, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccountLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, openLoginModal } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#64748b' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/account/profile', label: 'My Profile', icon: User, description: 'Name, email settings' },
    { path: '/account/addresses', label: 'My Addresses', icon: MapPin, description: 'Manage delivery addresses' },
    { path: '/account/orders', label: 'My Orders', icon: ShoppingBag, description: 'Order history & tracking' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #fdf6ec 100%)', paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.25rem' }}>

        {/* Page Title */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>My Account</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Manage your profile, addresses, and order history
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '5rem' }}>
            {/* User Card */}
            <div style={{ background: 'linear-gradient(135deg, #1a3d2b 0%, #2d6a4f 100%)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '0.75rem', color: '#fff' }}>
              <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', border: '2px solid rgba(255,255,255,0.2)' }}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>{user?.name || 'Customer'}</p>
              <p style={{ fontSize: '0.75rem', color: '#86efac', marginTop: '2px' }}>{user?.phone}</p>
            </div>

            {/* Nav Links */}
            <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.9rem 1.1rem',
                      textDecoration: 'none',
                      background: isActive ? '#f0fdf4' : '#fff',
                      borderLeft: isActive ? '3px solid #1a3d2b' : '3px solid transparent',
                      borderBottom: idx < navItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.15s',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActive ? '#1a3d2b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          <Icon size={15} color={isActive ? '#86efac' : '#64748b'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? '#1a3d2b' : '#334155' }}>{item.label}</p>
                          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>{item.description}</p>
                        </div>
                        <ChevronRight size={14} color="#cbd5e1" />
                      </>
                    )}
                  </NavLink>
                );
              })}

              <button
                onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.1rem', background: '#fff', border: 'none', borderTop: '2px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogOut size={15} color="#dc2626" />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626' }}>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.75rem', minHeight: '400px' }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
