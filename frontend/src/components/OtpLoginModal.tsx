import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowRight, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
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
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
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

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestOtp(identifier.trim());
      setStep('VERIFY');
      setCooldown(60);
      if (res.devOtp) setDevOtp(res.devOtp);
    } catch (err: any) {
      setErrorMessage(err.message);
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
      await verifyOtp(identifier.trim(), otp);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await requestOtp(identifier.trim());
      setCooldown(60);
      if (res.devOtp) setDevOtp(res.devOtp);
    } catch (err: any) {
      setErrorMessage(err.message);
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
        zIndex: 100,
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
          }}
        >
          <X size={20} />
        </button>

        {step === 'REQUEST' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '0.65rem', background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                <Smartphone size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Login to Ayngaran</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Passwordless instant OTP login</p>
              </div>
            </div>

            {errorMessage && (
              <div className="badge-danger" style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', width: '100%', margin: '1rem 0', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRequestOtp} style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Mobile Number or Email
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 9876543210 or customer@ayngaran.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
              >
                <span>{isLoading ? 'Generating OTP...' : 'Send Verification Code'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '0.65rem', background: 'var(--success-bg)', color: 'var(--success)' }}>
                <KeyRound size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Verify OTP</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Code sent to {identifier}</p>
              </div>
            </div>

            {/* Sandbox Quick Testing Helper */}
            {devOtp && (
              <div
                onClick={() => setOtp(devOtp)}
                style={{
                  background: '#f0fdf4',
                  border: '1px dashed #86efac',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.65rem',
                  margin: '1rem 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'block' }}>DEV SANDBOX CODE:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.2em', color: '#15803d' }}>{devOtp}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Click to fill ↵</span>
              </div>
            )}

            {errorMessage && (
              <div className="badge-danger" style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', width: '100%', margin: '1rem 0', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
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
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontWeight: 700 }}
                autoFocus
              />

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem' }}
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
                <CheckCircle2 size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  style={{ color: 'var(--text-muted)' }}
                >
                  Change number
                </button>

                {cooldown > 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    style={{ color: 'var(--primary-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
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
