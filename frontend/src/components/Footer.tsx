import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribeLoading(true);
    setSubscribeMsg('');

    try {
      const res: any = await api.post('/newsletter/subscribe', { email: email.trim() });
      setSubscribed(true);
      setSubscribeMsg(res?.message || 'Joined! ✓');
      setEmail('');
      setTimeout(() => {
        setSubscribed(false);
        setSubscribeMsg('');
      }, 5000);
    } catch (err: any) {
      setSubscribeMsg(err.response?.data?.message || 'Failed to subscribe. Please try again.');
      setTimeout(() => setSubscribeMsg(''), 4000);
    } finally {
      setSubscribeLoading(false);
    }
  };

  return (
    <footer style={{ backgroundColor: '#0b281b', color: '#e2e8f0', marginTop: '4rem', borderTop: '2px solid rgba(212, 197, 106, 0.3)' }}>
      <div className="container" style={{ padding: '4rem 1.5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>

          {/* Brand Tagline Column */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <img
                src="/Ayngaran_logo.png"
                alt="Ayngaran Logo"
                style={{ height: '6rem', width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#cbd5e1' }}>
              Bringing the wisdom of Tamil traditional foods to modern healthy living. 100% natural, no preservatives, homemade quality.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#d4af37', marginBottom: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              QUICK LINKS
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <li><Link to="/" style={{ transition: 'color 0.15s' }}>Home</Link></li>
              <li><Link to="/catalog" style={{ transition: 'color 0.15s' }}>Our Products</Link></li>
              <li><Link to="/about" style={{ transition: 'color 0.15s' }}>About Us</Link></li>
              <li><Link to="/contact" style={{ transition: 'color 0.15s' }}>Contact Us</Link></li>
              <li><Link to="/feedback" style={{ transition: 'color 0.15s' }}>Feedback</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#d4af37', marginBottom: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              HELP
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <li><Link to="/shipping-policy" style={{ transition: 'color 0.15s' }}>Shipping Policy</Link></li>
              <li><Link to="/return-policy" style={{ transition: 'color 0.15s' }}>Return Policy</Link></li>
              <li><Link to="/privacy-policy" style={{ transition: 'color 0.15s' }}>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" style={{ transition: 'color 0.15s' }}>Terms of Service</Link></li>
              <li><Link to="/track-order" style={{ transition: 'color 0.15s' }}>Track Your Order</Link></li>
              <li><Link to="/faq" style={{ transition: 'color 0.15s' }}>FAQ</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div style={{ maxWidth: '340px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#d4af37', marginBottom: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              NEWSLETTER
            </h4>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Subscribe for exclusive offers and new product alerts!
            </p>

            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  disabled={subscribeLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '160px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.65rem 0.9rem',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={subscribeLoading}
                  style={{
                    backgroundColor: subscribed ? '#22c55e' : '#f59e0b',
                    color: subscribed ? '#ffffff' : '#0b281b',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    opacity: subscribeLoading ? 0.7 : 1,
                  }}
                >
                  {subscribeLoading ? 'Joining...' : subscribed ? 'Joined! ✓' : 'Subscribe'}
                </button>
              </div>

              {subscribeMsg && (
                <div style={{ fontSize: '0.8rem', color: subscribed ? '#86efac' : '#fca5a5', marginTop: '2px', fontWeight: 600 }}>
                  {subscribeMsg}
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar Divider */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>
            © {new Date().getFullYear()} Ayngaran. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            Made with <span style={{ color: '#22c55e' }}>💚</span> in Tamil Nadu, India
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
            <span>🔒</span> Secure Shopping
          </div>
        </div>
      </div>
    </footer>
  );
};

