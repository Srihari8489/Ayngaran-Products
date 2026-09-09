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

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ayngaran_admin_token');
    const cachedStaff = localStorage.getItem('ayngaran_admin_staff');
    if (token && cachedStaff) {
      try {
        setStaff(JSON.parse(cachedStaff));
      } catch {
        localStorage.removeItem('ayngaran_admin_staff');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await adminApi.post('/auth/staff/login', { email, password });
    // ResponseInterceptor unwraps into { accessToken, staff }
    const { accessToken, staff: staffData } = res.data || res;
    localStorage.setItem('ayngaran_admin_token', accessToken);
    localStorage.setItem('ayngaran_admin_staff', JSON.stringify(staffData));
    setStaff(staffData);
  };

  const logout = () => {
    localStorage.removeItem('ayngaran_admin_token');
    localStorage.removeItem('ayngaran_admin_staff');
    setStaff(null);
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
