import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Headphones, ShoppingBag } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#f8fafc', marginTop: '5rem', borderTop: '1px solid #1e293b' }}>
      {/* Value Proposition Bar */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>Free Express Delivery</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>On all orders above ₹999 across India</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>100% Genuine Products</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Brand authorized warranty & verified specs</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>Easy 7-Day Returns</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Hassle-free replacement guarantee</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6' }}>
              <Headphones size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>Dedicated Support</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>24/7 technical customer support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container" style={{ padding: '4rem 1.5rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShoppingBag size={16} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>AYNGARAN</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>
            Ayngaran Products is a modern full-stack e-commerce experience offering cutting-edge electronics, dynamic catalog navigation, and secure authoritative checkout.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Coimbatore, Tamil Nadu, India.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Explore</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#94a3b8' }}>
            <li><Link to="/catalog">All Products</Link></li>
            <li><Link to="/catalog?categoryId=1">Electronics</Link></li>
            <li><Link to="/catalog?categoryId=2">Smartphones</Link></li>
            <li><Link to="/catalog?categoryId=5">Laptops</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.88rem', color: '#94a3b8' }}>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/orders">Order Tracking</Link></li>
            <li><a href="http://localhost:3001" target="_blank" rel="noreferrer" style={{ color: '#818cf8', fontWeight: 600 }}>Staff Admin Panel →</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment & Security</h4>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>
            Authoritative server-side payment verification powered by encrypted gateway integrations.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}>UPI</span>
            <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}>Credit Cards</span>
            <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}>NetBanking</span>
            <span className="badge" style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155' }}>COD</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e293b', padding: '1.5rem 0', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
        © {new Date().getFullYear()} Ayngaran Products. All rights reserved. Built with React, NestJS, Prisma & MySQL.
      </div>
    </footer>
  );
};
