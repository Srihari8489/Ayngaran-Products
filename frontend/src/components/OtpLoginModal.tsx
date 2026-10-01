import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, RefreshCw, KeyRound, CheckCircle2, MessageSquare, User, Mail, ShieldCheck } from 'lucide-react';
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
  const {
    requestEmailOtp,
    verifyEmailOtp,
    getDevOtp,
    requestOtp,
    verifyOtp,
    isLoginModalOpen,
    closeLoginModal,
    otpProvider,
  } = useAuth();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isLoginModalOpen;
  const onClose = propOnClose || closeLoginModal;

  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');

  // Email OTP state (ACTIVE flow)
  const [email, setEmail] = useState('');
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Preserved WhatsApp OTP state (INACTIVE / preserved for future switch)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsAppOtp, setWhatsAppOtp] = useState('');
  const [demoWhatsAppUrl, setDemoWhatsAppUrl] = useState<string | null>(null);

  // Common state
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setEmail('');
      setEmailOtpDigits(['', '', '', '', '', '']);
      setDevOtp(null);
      setName('');
      setPhone('');
      setWhatsAppOtp('');
      setErrorMessage('');
      setDemoWhatsAppUrl(null);
      setCooldown(0);
    }
  }, [isOpen]);

  // Auto-fetch active development OTP if in VERIFY step and devOtp is not yet set
  useEffect(() => {
    if (isOpen && step === 'VERIFY' && email.trim() && !devOtp) {
      getDevOtp(email.trim()).then((code) => {
        if (code) {
          setDevOtp(code);
          setEmailOtpDigits(code.split('').slice(0, 6));
        }
      });
    }
  }, [isOpen, step, email, devOtp, getDevOtp]);

  // Auto-focus first OTP input box on step change to VERIFY
  useEffect(() => {
    if (step === 'VERIFY' && otpProvider === 'email') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step, otpProvider]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // ACTIVE: EMAIL OTP HANDLERS
  // -------------------------------------------------------------

  const handleRequestEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestEmailOtp(cleanEmail);
      if (res?.devOtp) {
        setDevOtp(res.devOtp);
        setEmailOtpDigits(res.devOtp.split('').slice(0, 6));
      } else {
        setEmailOtpDigits(['', '', '', '', '', '']);
      }
      setStep('VERIFY');
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = emailOtpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      await verifyEmailOtp(email.trim().toLowerCase(), fullOtp);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (cooldown > 0) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestEmailOtp(email.trim().toLowerCase());
      if (res?.devOtp) {
        setDevOtp(res.devOtp);
        setEmailOtpDigits(res.devOtp.split('').slice(0, 6));
      } else {
        setEmailOtpDigits(['', '', '', '', '', '']);
      }
      setCooldown(60);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...emailOtpDigits];
      next[index] = '';
      setEmailOtpDigits(next);
      return;
    }

    // If pasted full string or multiple characters
    if (digitsOnly.length > 1) {
      const next = [...emailOtpDigits];
      for (let i = 0; i < 6; i++) {
        if (digitsOnly[i]) next[i] = digitsOnly[i];
      }
      setEmailOtpDigits(next);
      const focusTarget = Math.min(digitsOnly.length, 5);
      otpInputRefs.current[focusTarget]?.focus();
      return;
    }

    const next = [...emailOtpDigits];
    next[index] = digitsOnly[0];
    setEmailOtpDigits(next);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const next = [...emailOtpDigits];
    for (let i = 0; i < 6; i++) {
      next[i] = paste[i] || '';
    }
    setEmailOtpDigits(next);
    const focusTarget = Math.min(paste.length, 5);
    otpInputRefs.current[focusTarget]?.focus();
  };

  // -------------------------------------------------------------
  // PRESERVED: WHATSAPP OTP HANDLERS (Can be re-enabled anytime)
  // -------------------------------------------------------------

  const handleRequestWhatsAppOtp = async (e: React.FormEvent) => {
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

  const handleVerifyWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (whatsAppOtp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      await verifyOtp(phone.trim(), whatsAppOtp, name.trim());
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendWhatsAppOtp = async () => {
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
          maxWidth: '430px',
          borderRadius: '1.25rem',
          padding: '2.25rem 2rem',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        >
          <X size={18} />
        </button>

        {/* ========================================================= */}
        {/* ACTIVE AUTH FLOW: EMAIL OTP                               */}
        {/* ========================================================= */}
        {otpProvider === 'email' ? (
          step === 'REQUEST' ? (
            /* Screen 1: Request Email OTP */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.65rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(26,61,43,0.2)',
                  }}
                >
                  <Mail size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1a3d2b', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                    Login / Sign up
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                    Fast & secure 6-digit email verification
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    margin: '1rem 0 0.5rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRequestEmailOtp} style={{ marginTop: '1.25rem' }}>
                {/* Email Address Field */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="email"
                      className="input-field"
                      placeholder="user@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem 0.75rem 2.6rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        borderRadius: '0.625rem',
                        border: '1.5px solid #cbd5e1',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: '#0f172a',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
                    We'll send a 6-digit verification code to this email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
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
                    cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
                    opacity: isLoading || !email.trim() ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{isLoading ? 'Sending OTP...' : 'Continue'}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          ) : (
            /* Screen 2: Verify Email OTP */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.65rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #1a3d2b, #2d6a4f)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(26,61,43,0.2)',
                  }}
                >
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1a3d2b', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                    Verify your email
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                    Enter the 6-digit OTP sent to your email.
                  </p>
                </div>
              </div>

              {/* Target Email Info Badge */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.625rem',
                  fontSize: '0.85rem',
                  color: '#334155',
                  margin: '1rem 0 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} color="#2d6a4f" />
                  <span style={{ fontWeight: 700, color: '#1a3d2b' }}>{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('REQUEST');
                    setEmailOtpDigits(['', '', '', '', '', '']);
                    setDevOtp(null);
                    setErrorMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2d6a4f',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Change email
                </button>
              </div>

              {/* Development Mode OTP Display */}
              {devOtp && (
                <div
                  style={{
                    margin: '0.85rem 0',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#f0fdf4',
                    border: '1.5px dashed #22c55e',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#15803d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>🧪 Development OTP</span>
                    </div>
                    <div
                      style={{
                        fontSize: '1.55rem',
                        fontWeight: 900,
                        color: '#166534',
                        letterSpacing: '0.22em',
                        fontFamily: 'monospace',
                        marginTop: '2px',
                      }}
                    >
                      {devOtp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = devOtp.split('').slice(0, 6);
                      setEmailOtpDigits(digits);
                      otpInputRefs.current[5]?.focus();
                    }}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      backgroundColor: '#2d6a4f',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(45, 106, 79, 0.25)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a3d2b')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyEmailOtp} style={{ marginTop: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                  }}
                >
                  Enter 6-Digit OTP
                </label>

                {/* 6-Digit OTP Boxes */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                  }}
                  onPaste={handleOtpPaste}
                >
                  {emailOtpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      autoFocus={index === 0}
                      style={{
                        width: '46px',
                        height: '52px',
                        textAlign: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        borderRadius: '0.625rem',
                        border: digit ? '2px solid #2d6a4f' : '1.5px solid #cbd5e1',
                        background: digit ? '#f0fdf4' : '#ffffff',
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                        boxShadow: digit ? '0 2px 8px rgba(45,106,79,0.12)' : 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#2d6a4f';
                        e.target.style.boxShadow = '0 0 0 3px rgba(45,106,79,0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = digit ? '#2d6a4f' : '#cbd5e1';
                        e.target.style.boxShadow = digit ? '0 2px 8px rgba(45,106,79,0.12)' : 'none';
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || emailOtpDigits.join('').length !== 6}
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
                    cursor: isLoading || emailOtpDigits.join('').length !== 6 ? 'not-allowed' : 'pointer',
                    opacity: isLoading || emailOtpDigits.join('').length !== 6 ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(26,61,43,0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
                  <CheckCircle2 size={18} />
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1.25rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStep('REQUEST');
                      setEmailOtpDigits(['', '', '', '', '', '']);
                      setErrorMessage('');
                    }}
                    style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Change email
                  </button>

                  {cooldown > 0 ? (
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Resend OTP in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendEmailOtp}
                      style={{
                        color: '#2d6a4f',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )
        ) : (
          /* ========================================================= */
          /* PRESERVED: WHATSAPP OTP UI (Inactive / Enabled on switch) */
          /* ========================================================= */
          step === 'REQUEST' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    padding: '0.65rem',
                    borderRadius: '0.65rem',
                    background: '#25D366',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b' }}>Login via WhatsApp</h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Fast & secure WhatsApp OTP verification</p>
                </div>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#166534',
                  fontWeight: 700,
                  margin: '1rem 0',
                }}
              >
                ⚡ DEMO MODE: Clicking continue opens WhatsApp with your pre-filled verification code.
              </div>

              {errorMessage && (
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleRequestWhatsAppOtp} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Your Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
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

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: '0.4rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    WhatsApp Phone Number
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div
                      style={{
                        padding: '0.7rem 0.85rem',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '0.625rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#334155',
                      }}
                    >
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
                <div
                  style={{
                    padding: '0.65rem',
                    borderRadius: '0.65rem',
                    background: '#25D366',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b' }}>Verify WhatsApp OTP</h3>
                  <p style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>OTP sent via WhatsApp Demo</p>
                </div>
              </div>

              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.625rem',
                  fontSize: '0.85rem',
                  color: '#334155',
                  margin: '0.85rem 0',
                }}
              >
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
                onClick={() => {
                  setStep('REQUEST');
                  setWhatsAppOtp('');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2d6a4f',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '0.75rem',
                  textDecoration: 'underline',
                }}
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
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyWhatsAppOtp} style={{ marginTop: '0.5rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '0.4rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456"
                  maxLength={6}
                  value={whatsAppOtp}
                  onChange={(e) => setWhatsAppOtp(e.target.value.replace(/\D/g, ''))}
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
                  disabled={isLoading || whatsAppOtp.length !== 6}
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
                    cursor: isLoading || whatsAppOtp.length !== 6 ? 'not-allowed' : 'pointer',
                    opacity: isLoading || whatsAppOtp.length !== 6 ? 0.7 : 1,
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

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1.25rem',
                    fontSize: '0.85rem',
                  }}
                >
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
                      onClick={handleResendWhatsAppOtp}
                      style={{
                        color: '#2d6a4f',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
};
