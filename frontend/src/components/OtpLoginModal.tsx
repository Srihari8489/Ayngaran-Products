import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowRight, RefreshCw, KeyRound, CheckCircle2, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OtpLoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const OtpLoginModal: React.FC<OtpLoginModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onSuccess,
}) => {
  const { requestOtp, verifyOtp, isLoginModalOpen, closeLoginModal } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isLoginModalOpen;
  const onClose = propOnClose || closeLoginModal;

  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [demoWhatsAppUrl, setDemoWhatsAppUrl] = useState<string | null>(null);

  // Countdown timer for 60s cooldown limit
  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset state whenever modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStep('REQUEST');
      setName('');
      setPhone('');
      setOtp('');
      setErrorMessage('');
      setDemoWhatsAppUrl(null);
      setCooldown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestOtp(phone.trim(), name.trim());
      setStep('VERIFY');
      setCooldown(60);

      if (res?.demoWhatsAppUrl) {
        setDemoWhatsAppUrl(res.demoWhatsAppUrl);
        window.open(res.demoWhatsAppUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      await verifyOtp(phone.trim(), otp, name.trim());
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestOtp(phone.trim(), name.trim());
      setCooldown(60);

      if (res?.demoWhatsAppUrl) {
        setDemoWhatsAppUrl(res.demoWhatsAppUrl);
        window.open(res.demoWhatsAppUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '1.25rem',
          padding: '2rem',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: '#ffffff',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            color: 'var(--text-muted)',
            padding: '0.4rem',
            borderRadius: '9999px',
            background: '#f1f5f9',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {step === 'REQUEST' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '0.65rem', background: '#25D366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b' }}>Login via WhatsApp</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Fast & secure WhatsApp OTP verification</p>
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#166534', fontWeight: 700, margin: '1rem 0' }}>
              ⚡ DEMO MODE: Clicking continue opens WhatsApp with your pre-filled verification code.
            </div>

            {errorMessage && (
              <div style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRequestOtp} style={{ marginTop: '1rem' }}>
              {/* Full Name Field */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.9rem 0.7rem 2.4rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      borderRadius: '0.625rem',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  WhatsApp Phone Number
                </label>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.7rem 0.85rem', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>
                    +91
                  </div>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={10}
                    style={{
                      flex: 1,
                      padding: '0.7rem 0.9rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '0.625rem',
                      border: '1.5px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone.trim() || !name.trim()}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: isLoading || !phone.trim() || !name.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
                }}
              >
                <span>{isLoading ? 'Generating OTP...' : 'Continue with WhatsApp OTP'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '0.65rem', background: '#25D366', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b' }}>Verify WhatsApp OTP</h3>
                <p style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>OTP sent via WhatsApp Demo</p>
              </div>
            </div>

            <div style={{ padding: '0.6rem 0.85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.625rem', fontSize: '0.85rem', color: '#334155', margin: '0.85rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Account Name:</span>
                <strong style={{ color: '#1a3d2b' }}>{name}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Target Phone:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#1a3d2b' }}>
                  +91 {phone.length >= 10 ? `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}` : phone}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setStep('REQUEST'); setOtp(''); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#2d6a4f', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '0.75rem', textDecoration: 'underline' }}
            >
              ← Change name or phone number
            </button>

            {demoWhatsAppUrl && (
              <button
                type="button"
                onClick={() => window.open(demoWhatsAppUrl, '_blank')}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <MessageSquare size={14} /> Open WhatsApp Demo Link Again
              </button>
            )}

            {errorMessage && (
              <div style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  letterSpacing: '0.35em',
                  fontWeight: 800,
                  padding: '0.75rem',
                  borderRadius: '0.625rem',
                  border: '2px solid #2d6a4f',
                  outline: 'none',
                }}
                autoFocus
              />

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.85rem',
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: isLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: isLoading || otp.length !== 6 ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
                }}
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
                <CheckCircle2 size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Change number
                </button>

                {cooldown > 0 ? (
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Resend OTP in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{ color: '#2d6a4f', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <RefreshCw size={14} />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
