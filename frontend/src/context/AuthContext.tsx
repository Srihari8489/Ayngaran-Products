import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  otpProvider: 'email' | 'whatsapp';
  openLoginModal: () => void;
  closeLoginModal: () => void;
  requestOtp: (identifier: string, name?: string) => Promise<{ success?: boolean; message: string; devOtp?: string; demoWhatsAppUrl?: string; expiresInSeconds?: number }>;
  verifyOtp: (identifier: string, otp: string, name?: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<{ success?: boolean; message: string; expiresInSeconds?: number; devOtp?: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<void>;
  getDevOtp: (email: string) => Promise<string | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active OTP Provider: defaults to 'email', can be switched to 'whatsapp' via VITE_OTP_PROVIDER
  const otpProvider: 'email' | 'whatsapp' =
    (import.meta.env.VITE_OTP_PROVIDER || 'email').toLowerCase() === 'whatsapp' ? 'whatsapp' : 'email';

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    return Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

  const refreshProfile = async () => {
    const token = localStorage.getItem('ayngaran_customer_token');
    const loginTimeStr = localStorage.getItem('ayngaran_customer_login_time');
    const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : 0;
    const isExpired = !loginTime || Date.now() - loginTime > TWENTY_FOUR_HOURS_MS || !isTokenValid(token);

    if (!token || isExpired) {
      localStorage.removeItem('ayngaran_customer_token');
      localStorage.removeItem('ayngaran_customer_refresh_token');
      localStorage.removeItem('ayngaran_customer_login_time');
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.get('/auth/customer/profile');
      setUser(profile as any);
    } catch {
      localStorage.removeItem('ayngaran_customer_token');
      localStorage.removeItem('ayngaran_customer_refresh_token');
      localStorage.removeItem('ayngaran_customer_login_time');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    const interval = setInterval(refreshProfile, 60000);
    return () => clearInterval(interval);
  }, []);

  const requestEmailOtp = async (email: string) => {
    return (await api.post('/auth/email/request-otp', { email: email.trim().toLowerCase() })) as any;
  };

  const getDevOtp = async (email: string): Promise<string | null> => {
    try {
      const res: any = await api.get(`/auth/email/dev-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      return res?.devOtp || null;
    } catch {
      return null;
    }
  };

  const verifyEmailOtp = async (email: string, otp: string) => {
    const res: any = await api.post('/auth/email/verify-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });

    localStorage.setItem('ayngaran_customer_token', res.accessToken);
    localStorage.setItem('ayngaran_customer_refresh_token', res.refreshToken);
    localStorage.setItem('ayngaran_customer_login_time', String(Date.now()));

    setUser(res.user);
    closeLoginModal();
  };

  const requestOtp = async (identifier: string, name?: string) => {
    if (identifier.includes('@')) {
      return requestEmailOtp(identifier);
    }
    // Preserved WhatsApp OTP flow
    return (await api.post('/auth/customer/send-otp', { phone: identifier, identifier })) as any;
  };

  const verifyOtp = async (identifier: string, otp: string, name?: string) => {
    if (identifier.includes('@')) {
      return verifyEmailOtp(identifier, otp);
    }

    // Preserved WhatsApp OTP verification flow
    let res: any;
    try {
      res = await api.post('/auth/customer/verify-otp', { phone: identifier, identifier, otp, name });
    } catch (err: any) {
      if (err.message && err.message.includes('name should not exist')) {
        res = await api.post('/auth/customer/verify-otp', { phone: identifier, identifier, otp });
      } else {
        throw err;
      }
    }

    localStorage.setItem('ayngaran_customer_token', res.accessToken);
    localStorage.setItem('ayngaran_customer_refresh_token', res.refreshToken);
    localStorage.setItem('ayngaran_customer_login_time', String(Date.now()));

    let loggedInUser = res.user;

    // Persist customer name if entered
    if (name && name.trim()) {
      try {
        const updated = (await api.patch('/auth/customer/profile', { name: name.trim() })) as any;
        if (updated && updated.name) {
          loggedInUser = { ...loggedInUser, name: updated.name };
        }
      } catch (err) {
        console.warn('Could not auto-update profile name:', err);
      }
    }

    setUser(loggedInUser);
    closeLoginModal();
  };

  const logout = () => {
    localStorage.removeItem('ayngaran_customer_token');
    localStorage.removeItem('ayngaran_customer_refresh_token');
    localStorage.removeItem('ayngaran_customer_login_time');
    setUser(null);
    closeLoginModal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoginModalOpen,
        otpProvider,
        openLoginModal,
        closeLoginModal,
        requestOtp,
        verifyOtp,
        requestEmailOtp,
        verifyEmailOtp,
        getDevOtp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
