import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'Product Inquiry',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.firstName;
      await api.post('/inquiries', {
        name: fullName,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
      });

      setLoading(false);
      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: 'Product Inquiry',
        message: '',
      });
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit your message. Please check your details and try again.'
      );
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '80vh', padding: '3.5rem 1rem 5rem' }}>
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4vw, 2.75rem)',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Get in Touch
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748b', fontWeight: 500, maxWidth: '600px', margin: '0 auto' }}>
            Have questions about our products, bulk orders, or partnerships?
          </p>
        </div>

        {/* 2-Column Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Contact Information Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={22} color="#dc2626" />
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#113926',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  ADDRESS
                </span>
                <p style={{ fontSize: '0.98rem', color: '#1f2937', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                  No. 12, Kamaraj Nagar, Coimbatore – 641001, Tamil Nadu
                </p>
              </div>
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Phone size={22} color="#dc2626" />
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#113926',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  PHONE
                </span>
                <a
                  href="tel:+919876543210"
                  style={{ fontSize: '0.98rem', color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                >
                  +91 98765 43210
                </a>
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Mail size={22} color="#dc2626" />
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#113926',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  EMAIL
                </span>
                <a
                  href="mailto:hello@ayngaran.com"
                  style={{ fontSize: '0.98rem', color: '#1f2937', textDecoration: 'none', fontWeight: 500 }}
                >
                  hello@ayngaran.com
                </a>
              </div>
            </div>

            {/* Hours */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e6f4ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={22} color="#113926" />
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#113926',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                  }}
                >
                  HOURS
                </span>
                <p style={{ fontSize: '0.98rem', color: '#1f2937', margin: 0, fontWeight: 500 }}>
                  Mon–Sat: 9AM–7PM
                </p>
                <p style={{ fontSize: '0.98rem', color: '#1f2937', margin: '0.2rem 0 0', fontWeight: 500 }}>
                  Sunday: 10AM–5PM
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: "Send a Message" Form Card (Matching Image 2) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              padding: '2.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '1.5rem',
              }}
            >
              Send a Message
            </h2>

            {submitted ? (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={42} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d', marginBottom: '0.5rem' }}>
                  Thank you for reaching out!
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  Your message has been received. Our team will get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  style={{
                    marginTop: '1.25rem',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {errorMessage && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: '0.625rem',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* First Name & Last Name (2-column row) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Priya"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#faf8f5',
                        fontSize: '0.92rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Suresh"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#faf8f5',
                        fontSize: '0.92rem',
                        color: '#111827',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#faf8f5',
                      fontSize: '0.92rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#faf8f5',
                      fontSize: '0.92rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#faf8f5',
                      fontSize: '0.92rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Bulk Orders & Wholesale">Bulk Orders &amp; Wholesale</option>
                    <option value="Order Status & Delivery">Order Status &amp; Delivery</option>
                    <option value="Partnership & Distributorship">Partnership &amp; Distributorship</option>
                    <option value="Feedback & Support">Feedback &amp; Support</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#faf8f5',
                      fontSize: '0.92rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Send Message Button (Matching Image 2 blue button) */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#0070f3',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '0.85rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(0, 112, 243, 0.3)',
                    transition: 'all 0.15s ease',
                    marginTop: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#005bb5';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#0070f3';
                  }}
                >
                  <Send size={16} />
                  <span>{loading ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
