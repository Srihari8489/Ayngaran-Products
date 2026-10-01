import React, { createContext, useContext, useState, useEffect } from 'react';
import adminApi from '../api/client';
import { Staff } from '../types';

interface AdminAuthContextType {
  staff: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

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

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('ayngaran_admin_token');
    localStorage.removeItem('ayngaran_admin_staff');
    localStorage.removeItem('ayngaran_admin_login_time');
    setStaff(null);
  };

  useEffect(() => {
    const checkAuthValidity = () => {
      const token = localStorage.getItem('ayngaran_admin_token');
      const cachedStaff = localStorage.getItem('ayngaran_admin_staff');
      const loginTimeStr = localStorage.getItem('ayngaran_admin_login_time');
      const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : 0;

      // Check both JWT expiration and strict 24-hour limit
      const isExpiredByTime = !loginTime || Date.now() - loginTime > TWENTY_FOUR_HOURS_MS;
      const isJwtActive = isTokenValid(token);

      if (token && cachedStaff && !isExpiredByTime && isJwtActive) {
        try {
          setStaff(JSON.parse(cachedStaff));
        } catch {
          logout();
        }
      } else if (token || cachedStaff) {
        // Automatically logout once 24 hours have passed
        logout();
      }
      setIsLoading(false);
    };

    checkAuthValidity();

    // Check periodically so session expires exactly at 24 hours
    const interval = setInterval(checkAuthValidity, 60000);
    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await adminApi.post('/auth/staff/login', { email, password });
    // ResponseInterceptor unwraps into { accessToken, staff }
    const { accessToken, staff: staffData } = res.data || res;
    localStorage.setItem('ayngaran_admin_token', accessToken);
    localStorage.setItem('ayngaran_admin_staff', JSON.stringify(staffData));
    localStorage.setItem('ayngaran_admin_login_time', String(Date.now()));
    setStaff(staffData);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!staff) return false;

    // Check if role is string or object
    const roleStr = typeof staff.role === 'string'
      ? staff.role
      : (staff.role as any)?.name || (staff.role as any)?.code || '';

    // Super admin or admin has full unrestricted access
    if (roleStr.toUpperCase().includes('ADMIN') || roleStr.toUpperCase() === 'SUPER_ADMIN') {
      return true;
    }

    // Check staff.permissions (array of string codes returned by login)
    if (Array.isArray(staff.permissions) && staff.permissions.includes(permissionCode)) {
      return true;
    }

    // Check role.permissions if role is populated as object
    const rolePermissions = (staff.role as any)?.permissions;
    if (Array.isArray(rolePermissions)) {
      return rolePermissions.some((p: any) => {
        const code = typeof p === 'string' ? p : p.permission?.code || p.code;
        return code === permissionCode;
      });
    }

    return false;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        staff,
        isAuthenticated: !!staff,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
