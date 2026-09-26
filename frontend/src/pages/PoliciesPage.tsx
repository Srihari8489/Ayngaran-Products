import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  FileText,
  Search,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  PackageCheck,
  Clock,
  MapPin,
  Sparkles,
  PhoneCall,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

type TabKey = 'shipping' | 'return' | 'privacy' | 'terms' | 'track' | 'faq';

interface TabConfig {
  key: TabKey;
  path: string;
  label: string;
  icon: React.ReactNode;
  subtitle: string;
}

const TABS: TabConfig[] = [
  {
    key: 'shipping',
    path: '/shipping-policy',
    label: 'Shipping Policy',
    icon: <Truck className="w-5 h-5" />,
    subtitle: 'Safe, hygienic dispatch across 19,000+ pin codes in India',
  },
  {
    key: 'return',
    path: '/return-policy',
    label: 'Return & Refund',
    icon: <RotateCcw className="w-5 h-5" />,
    subtitle: 'Transparent return terms for fresh traditional foods',
  },
  {
    key: 'privacy',
    path: '/privacy-policy',
    label: 'Privacy Policy',
    icon: <ShieldCheck className="w-5 h-5" />,
    subtitle: 'How we respect, safeguard, and encrypt your personal data',
  },
  {
    key: 'terms',
    path: '/terms-of-service',
    label: 'Terms of Service',
    icon: <FileText className="w-5 h-5" />,
    subtitle: 'Official guidelines and terms governing your purchases',
  },
  {
    key: 'track',
    path: '/track-order',
    label: 'Track Your Order',
    icon: <Search className="w-5 h-5" />,
    subtitle: 'Live consignment tracking and delivery status',
  },
  {
    key: 'faq',
    path: '/faq',
    label: 'Help & FAQ',
    icon: <HelpCircle className="w-5 h-5" />,
    subtitle: 'Frequently asked questions about ingredients, shelf life & orders',
  },
];

export const PoliciesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current pathname
  const getTabFromPath = (path: string): TabKey => {
    if (path.includes('return')) return 'return';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('terms')) return 'terms';
    if (path.includes('track')) return 'track';
    if (path.includes('faq')) return 'faq';
    return 'shipping';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getTabFromPath(location.pathname));

  // Sync state if user navigates with browser back/forward buttons
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tab: TabConfig) => {
    setActiveTab(tab.key);
    navigate(tab.path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State for Track Order lookup
  const [trackInput, setTrackInput] = useState('');
  const [trackResult, setTrackResult] = useState<{ searched: boolean; found: boolean; message: string } | null>(null);

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;

    // Provide friendly simulated feedback guiding to account / WhatsApp tracking
    setTrackResult({
      searched: true,
      found: true,
      message: `Consignment query received for "${trackInput.trim()}". For instant live location, please sign in to your Account Orders or message our dispatch desk on WhatsApp.`,
    });
  };

  // State for FAQ accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const currentTabConfig = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '85vh', padding: '3.5rem 1rem 6rem' }}>
      <div className="container" style={{ maxWidth: '1150px', margin: '0 auto' }}>

        {/* Page Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              color: '#92400e',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '1rem',
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Ayngaran Customer Support & Policies</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.1rem, 4vw, 2.75rem)',
              fontWeight: 900,
              color: '#0b281b',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '0.75rem',
            }}
          >
            {currentTabConfig.label}
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '650px', margin: '0 auto' }}>
            {currentTabConfig.subtitle}
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.6rem',
            marginBottom: '3.5rem',
            backgroundColor: '#f8fafc',
            padding: '0.6rem',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '0.85rem',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#ffffff' : '#334155',
                  backgroundColor: isActive ? '#0b281b' : 'transparent',
                  border: isActive ? '1px solid #0b281b' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease-in-out',
                  boxShadow: isActive ? '0 4px 12px rgba(11, 40, 27, 0.18)' : 'none',
                }}
              >
                <span style={{ color: isActive ? '#d4af37' : '#64748b' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Layout with 2 Columns (Content + Sticky Contact Card) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 320px)',
            gap: '3rem',
            alignItems: 'start',
          }}
          className="policy-grid-layout"
        >
          {/* Main Tab Details Area */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              border: '1px solid #e2e8f0',
              padding: '2.5rem',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* 1. SHIPPING POLICY */}
            {activeTab === 'shipping' && (
              <div style={{ color: '#334155', lineHeight: 1.75 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '1rem' }}>
                  Shipping & Delivery Information
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  At <strong>Ayngaran Traditional Foods</strong>, we prepare our sweets, savories, and health mixes with
                  the utmost care in hygienic traditional kitchens. Because our items are freshly prepared without
                  artificial chemical preservatives, our dispatch pipeline is optimized for speed and maximum freshness.
                </p>

                <div
                  style={{
                    backgroundColor: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '1rem',
                  }}
                >
                  <PackageCheck className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1" />
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#854d0e', marginBottom: '0.25rem' }}>
                      Weight-Based Fair Shipping
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#713f12', margin: 0 }}>
                      Shipping charges are calculated automatically based on total order weight and destination zone (Tamil Nadu vs. Outside Tamil Nadu), ensuring transparent and fair delivery rates for all orders.
                    </p>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  1. Dispatch Timelines & Fresh Preparation
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  All orders are freshly packed and dispatched within <strong>24 to 48 business hours</strong> of order
                  confirmation. During festival rushes (e.g., Deepavali, Pongal), dispatches may take up to 72 hours due
                  to high artisan batch cooking volume.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  2. Estimated Delivery Transit Duration
                </h3>
                <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem 1rem', color: '#0b281b' }}>Destination Region</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#0b281b' }}>Estimated Transit</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#0b281b' }}>Courier Network</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tamil Nadu</td>
                        <td style={{ padding: '0.75rem 1rem' }}>Within 2 Business Days</td>
                        <td style={{ padding: '0.75rem 1rem' }}>Assigned Express Courier Network</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Outside Tamil Nadu (All Other States)</td>
                        <td style={{ padding: '0.75rem 1rem' }}>3 - 5 Business Days</td>
                        <td style={{ padding: '0.75rem 1rem' }}>Assigned National Courier / Speed Post Network</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  3. Food-Grade Secure Packaging
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  To maintain the authentic aroma, crunch, and moisture barrier, all products are packed in certified
                  food-grade multi-layer hermetic pouches. Fragile savory items (such as Kai Murukku and Seedai) are
                  reinforced with air-cushion bubble packaging within heavy-duty corrugated cartons.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  4. Real-Time Tracking Notification
                </h3>
                <p>
                  As soon as your parcel is handed to the courier partner, you will receive an automatic SMS and email
                  with the tracking number (AWB) and live tracker URL.
                </p>
              </div>
            )}

            {/* 2. RETURN & REFUND POLICY */}
            {activeTab === 'return' && (
              <div style={{ color: '#334155', lineHeight: 1.75 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '1rem' }}>
                  Return, Replacement & Refund Policy
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Customer satisfaction and authentic taste are our top priorities. Because our products are edible,
                  perishable items prepared according to traditional culinary traditions, we have clear guidelines to
                  guarantee hygiene and food safety for all our patrons.
                </p>

                <div
                  style={{
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '1rem',
                  }}
                >
                  <AlertCircle className="w-6 h-6 text-rose-700 flex-shrink-0 mt-1" />
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#9f1239', marginBottom: '0.25rem' }}>
                      Perishable Food Products Notice
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#881337', margin: 0 }}>
                      Under FSSAI guidelines and standard food safety laws, we do not accept returns for opened or
                      partially consumed food products.
                    </p>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  1. Circumstances Eligible for Free Replacement or Refund
                </h3>
                <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                  <li><strong>Transit Damage:</strong> Parcel carton arrived severely damaged, crushed, or soaked.</li>
                  <li><strong>Broken Seal:</strong> Internal food container seal was opened or tampered with before arrival.</li>
                  <li><strong>Incorrect Order:</strong> You received items different from what was ordered in your invoice.</li>
                  <li><strong>Quality Issue:</strong> In the rare event of spoilage or defect reported within 48 hours of receipt.</li>
                </ul>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  2. How to File an Issue (Within 48 Hours)
                </h3>
                <ol style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                  <li>Take clear photos or a short unboxing video of the damaged package/item and invoice.</li>
                  <li>Contact our customer happiness team via WhatsApp at <strong>+91 98765 43210</strong> or email <strong>support@ayngaranfoods.com</strong>.</li>
                  <li>Please include your 6-digit Order ID (e.g., #1042) in the subject line.</li>
                  <li>Our support team will verify and resolve your query within 4 business hours.</li>
                </ol>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  3. Refund Execution & Timelines
                </h3>
                <p>
                  Once approved, refunds are processed instantly from our end back to your original source of payment
                  (UPI, NetBanking, Credit/Debit Card). Financial institutions usually reflect the credit within{' '}
                  <strong>3 to 5 working days</strong>. If paid via COD, we will request your UPI ID or bank details for direct transfer.
                </p>
              </div>
            )}

            {/* 3. PRIVACY POLICY */}
            {activeTab === 'privacy' && (
              <div style={{ color: '#334155', lineHeight: 1.75 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '1rem' }}>
                  Privacy & Data Protection Policy
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Last updated: <em>September 2026</em>. This Privacy Policy details how <strong>Ayngaran Traditional Foods</strong>{' '}
                  collects, protects, and handles your personal information when you visit or order from our digital storefront.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  1. Information We Collect
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  When you make a purchase or attempt a purchase, we collect necessary customer details:
                </p>
                <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
                  <li>Name, shipping address, billing address, and PIN code for courier fulfillment.</li>
                  <li>Mobile phone number for courier dispatch SMS alerts and delivery OTP confirmation.</li>
                  <li>Email address for order invoice delivery and tracking links.</li>
                </ul>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  2. Payment Card & Banking Security
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  We do <strong>not</strong> record, store, or have access to your sensitive payment credentials (credit/debit card numbers,
                  CVVs, or UPI PINs). All transactions are encrypted with 256-bit SSL protocols and processed directly through certified PCI-DSS
                  compliant payment gateways (Razorpay).
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  3. Strict No-Spam & No Data Brokering
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  We value your trust. We will never sell, rent, or trade your personal contact details to third-party advertisers or telemarketers.
                  Information is shared solely with verified logistics partners (couriers) for delivering your physical packages.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  4. Cookies and Session State
                </h3>
                <p>
                  Our storefront utilizes local cookies to remember your shopping cart items, saved favorites, and session authentication.
                  You can clear your browser cookies anytime via your browser settings.
                </p>
              </div>
            )}

            {/* 4. TERMS OF SERVICE */}
            {activeTab === 'terms' && (
              <div style={{ color: '#334155', lineHeight: 1.75 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '1rem' }}>
                  Terms of Service & Usage
                </h2>
                <p style={{ marginBottom: '1.5rem' }}>
                  Welcome to <strong>Ayngaran Traditional Foods</strong>. By browsing, accessing, or placing orders on this website,
                  you agree to be bound by the following terms, conditions, and notices.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  1. Product Descriptions & Pricing Accuracy
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  All prices are listed in Indian National Rupees (INR) and are inclusive of statutory GST unless stated otherwise.
                  While we strive for precision in weight, ingredient lists, and nutritional facts, natural handcrafted foods may exhibit
                  slight traditional variations in color or shape.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  2. Order Acceptance & Right to Cancel
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  Receipt of an order confirmation does not signify our final acceptance. We reserve the right at any time after receipt of your
                  order to accept or decline it for reasons including unexpected ingredient shortage, logistic non-serviceability of remote PIN
                  codes, or payment authorization failures. In any such case, a 100% full refund is issued instantly.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  3. Intellectual Property Rights
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  All brand identifiers, product descriptions, photography, logos, culinary concepts, and digital design assets are the
                  exclusive intellectual property of Ayngaran Traditional Foods. Unauthorized commercial reproduction is strictly prohibited.
                </p>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0b281b', marginTop: '2rem', marginBottom: '0.75rem' }}>
                  4. Governing Law & Jurisdiction
                </h3>
                <p>
                  These terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising in
                  connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Tamil Nadu, India.
                </p>
              </div>
            )}

            {/* 5. TRACK YOUR ORDER */}
            {activeTab === 'track' && (
              <div style={{ color: '#334155', lineHeight: 1.75 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '0.5rem' }}>
                  Track Your Consignment
                </h2>
                <p style={{ marginBottom: '2rem', color: '#64748b' }}>
                  Enter your 6-digit Order ID or registered mobile phone number below to check dispatch progress.
                </p>

                {/* Track Order Input Form */}
                <form
                  onSubmit={handleTrackSearch}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '1rem',
                    padding: '2rem',
                    marginBottom: '2.5rem',
                  }}
                >
                  <label
                    htmlFor="trackInput"
                    style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b281b', marginBottom: '0.5rem' }}
                  >
                    Order Reference ID or Phone Number
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                      <input
                        id="trackInput"
                        type="text"
                        required
                        value={trackInput}
                        onChange={(e) => setTrackInput(e.target.value)}
                        placeholder="e.g. AYN-1048 or 9876543210"
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem 0.85rem 2.75rem',
                          borderRadius: '0.65rem',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.95rem',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <Search
                        className="w-5 h-5 text-slate-400"
                        style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        padding: '0.85rem 1.75rem',
                        backgroundColor: '#0b281b',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        borderRadius: '0.65rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#144630')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0b281b')}
                    >
                      <Search className="w-4 h-4 text-amber-400" />
                      <span>Track Status</span>
                    </button>
                  </div>

                  {trackResult && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.65rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p style={{ fontSize: '0.9rem', color: '#166534', margin: 0 }}>
                        {trackResult.message}
                      </p>
                    </div>
                  )}
                </form>

                {/* Account Direct Tracking Card */}
                <div
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0b281b', marginBottom: '0.35rem' }}>
                      Already have an Ayngaran Account?
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                      View itemized past invoices, live tracking links, and reorder your favorite traditional sweets in one click.
                    </p>
                  </div>
                  <Link
                    to="/account/orders"
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#d4af37',
                      color: '#0b281b',
                      fontWeight: 800,
                      borderRadius: '0.65rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>View My Orders</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Typical Delivery Steps visual */}
                <div style={{ marginTop: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0b281b', marginBottom: '1.25rem' }}>
                    Order Journey Stages
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0b281b', display: 'block', marginBottom: '0.35rem' }}>STEP 1</span>
                      <strong style={{ color: '#0b281b' }}>Order Received</strong>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>Fresh batch allocated in our kitchen.</p>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0b281b', display: 'block', marginBottom: '0.35rem' }}>STEP 2</span>
                      <strong style={{ color: '#0b281b' }}>Hygienic Sealed Pack</strong>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>Multi-layer airtight moisture-proof boxing.</p>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0b281b', display: 'block', marginBottom: '0.35rem' }}>STEP 3</span>
                      <strong style={{ color: '#0b281b' }}>Dispatched via Courier</strong>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>AWB tracking code sent via SMS/WhatsApp.</p>
                    </div>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0b281b', display: 'block', marginBottom: '0.35rem' }}>STEP 4</span>
                      <strong style={{ color: '#0b281b' }}>Delivered to Doorstep</strong>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', margin: 0 }}>Enjoy wholesome authentic Tamil flavors!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. FAQ */}
            {activeTab === 'faq' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0b281b', marginBottom: '0.5rem' }}>
                  Frequently Asked Questions (FAQ)
                </h2>
                <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                  Everything you need to know about our traditional ingredients, shelf life, shipping, and bulk festive orders.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    {
                      q: 'Are Ayngaran products 100% preservative-free and natural?',
                      a: 'Yes, absolutely! We strictly follow age-old Tamil kitchen traditions. None of our sweets, savories, or spice blends contain artificial chemical preservatives, synthetic food colorings, or MSG. We use cold-pressed wood-pressed oils, pure organic jaggery, country sugar, and farm-fresh spices.',
                    },
                    {
                      q: 'What is the shelf life of your traditional sweets and snacks?',
                      a: 'Because our products are preservative-free: Handcrafted Sweets (like Laddu, Mysore Pak, Adhirasam) remain fresh for 15 to 20 days. Savory Snacks (like Murukku, Mixture, Ribbon Pakoda) stay crispy for 45 to 60 days when stored in an airtight container. Podis and Masalas maintain their aroma for up to 9 months.',
                    },
                    {
                      q: 'How does Ayngaran ensure snack freshness during shipping?',
                      a: 'Every package is prepared in small batches and heat-sealed in premium moisture-barrier food-grade pouches immediately after cooling. We use shock-absorbent corrugated packaging so fragile savories reach your doorstep intact and crunch-ready.',
                    },
                    {
                      q: 'How are delivery charges calculated for my order?',
                      a: 'Delivery charges are calculated based on the total weight of the products and your delivery destination state (Tamil Nadu or Outside Tamil Nadu). The exact weight slab, rate, and estimated delivery timeline are calculated and displayed at checkout.',
                    },
                    {
                      q: 'Do you accept corporate gifting, wedding, or bulk festival orders?',
                      a: 'Yes! We regularly fulfill customized bulk orders for weddings, family ceremonies, corporate Diwali/Pongal gifting, and community gatherings. Please visit our Contact Us page or WhatsApp our bulk desk at +91 98765 43210 for tailored pricing and customized gift packaging.',
                    },
                    {
                      q: 'Can I cancel or amend my order after placing it?',
                      a: 'Because our kitchen dispatches items rapidly to ensure maximum shelf life, orders can be amended or cancelled within 2 hours of placement. Simply call or WhatsApp our support desk with your Order ID.',
                    },
                  ].map((faq, idx) => {
                    const isOpen = expandedFaq === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.85rem',
                          overflow: 'hidden',
                          backgroundColor: isOpen ? '#f8fafc' : '#ffffff',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.2rem 1.5rem',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#0b281b',
                            fontWeight: 700,
                            fontSize: '1rem',
                          }}
                        >
                          <span style={{ paddingRight: '1rem' }}>{faq.q}</span>
                          <ChevronDown
                            className="w-5 h-5 text-slate-500 flex-shrink-0"
                            style={{
                              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease-in-out',
                            }}
                          />
                        </button>

                        {isOpen && (
                          <div
                            style={{
                              padding: '0 1.5rem 1.25rem',
                              color: '#475569',
                              fontSize: '0.93rem',
                              lineHeight: 1.7,
                              borderTop: '1px solid #f1f5f9',
                              paddingTop: '0.85rem',
                            }}
                          >
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Side Card: Direct Support & Contact Assistance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '6rem' }}>
            <div
              style={{
                backgroundColor: '#0b281b',
                color: '#ffffff',
                borderRadius: '1.25rem',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(11, 40, 27, 0.2)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d4af37', marginBottom: '0.5rem' }}>
                Need Help Right Now?
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Our customer assistance team is available Monday through Saturday, 9:00 AM to 7:00 PM IST.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <a
                  href="tel:+919876543210"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ffffff',
                    textDecoration: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    fontWeight: 600,
                  }}
                >
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>+91 98765 43210</span>
                </a>

                <a
                  href="mailto:support@ayngaranfoods.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ffffff',
                    textDecoration: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    fontWeight: 600,
                  }}
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>support@ayngaranfoods.com</span>
                </a>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#94a3b8',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Mon – Sat: 9:00 AM – 7:00 PM</span>
                </div>
              </div>

              <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Link
                  to="/contact"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    backgroundColor: '#d4af37',
                    color: '#0b281b',
                    padding: '0.75rem',
                    borderRadius: '0.65rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  Send a Direct Message
                </Link>
              </div>
            </div>

            {/* Quick Guarantees Badge Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '1.25rem',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <strong style={{ fontSize: '0.92rem', color: '#0b281b' }}>Ayngaran Quality Promise</strong>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                100% Traditional South Indian recipes made using pure ingredients and cold-pressed oils. Every batch is taste-tested for authenticity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PoliciesPage;
