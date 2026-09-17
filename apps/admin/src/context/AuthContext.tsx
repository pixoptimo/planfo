import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Permission } from '@cms/schemas';
import { RolePermissions } from '@cms/schemas';
import { api } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/login', { email, password });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    return RolePermissions[user.role]?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
