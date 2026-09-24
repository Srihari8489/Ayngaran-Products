import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  requestOtp: (identifier: string, name?: string) => Promise<{ success?: boolean; message: string; devOtp?: string; demoWhatsAppUrl?: string; expiresInSeconds?: number }>;
  verifyOtp: (identifier: string, otp: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const refreshProfile = async () => {
    const token = localStorage.getItem('ayngaran_customer_token');
    if (!token) {
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
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const requestOtp = async (phone: string, _name?: string) => {
    return (await api.post('/auth/customer/send-otp', { phone, identifier: phone })) as any;
  };

  const verifyOtp = async (phone: string, otp: string, name?: string) => {
    let res: any;
    try {
      res = await api.post('/auth/customer/verify-otp', { phone, identifier: phone, otp, name });
    } catch (err: any) {
      if (err.message && err.message.includes('name should not exist')) {
        res = await api.post('/auth/customer/verify-otp', { phone, identifier: phone, otp });
      } else {
        throw err;
      }
    }

    localStorage.setItem('ayngaran_customer_token', res.accessToken);
    localStorage.setItem('ayngaran_customer_refresh_token', res.refreshToken);

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
        openLoginModal,
        closeLoginModal,
        requestOtp,
        verifyOtp,
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
