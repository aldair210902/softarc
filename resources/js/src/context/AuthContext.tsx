import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiMutate, ensureCsrf, prefetchMany, ADMIN_PREFETCH_URLS, invalidateApiCache } from '../lib/api';
import { canAccess, canAccessAny } from '../lib/permissions';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  role: string;
  permissions: string[];
  status: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (ability: string) => boolean;
  canAny: (abilities: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<{ user: AuthUser }>('/api/user', { fresh: true });
      setUser(data.user);
      // En cuanto hay sesión, calentar listas del admin
      prefetchMany(ADMIN_PREFETCH_URLS);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await ensureCsrf();
    const data = await apiMutate<{ user: AuthUser }>('post', '/api/login', { email, password });
    setUser(data.user);
    prefetchMany(ADMIN_PREFETCH_URLS);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiMutate('post', '/api/logout');
    } finally {
      setUser(null);
      invalidateApiCache();
    }
  }, []);

  const can = useCallback((ability: string) => canAccess(user, ability), [user]);
  const canAny = useCallback((abilities: string[]) => canAccessAny(user, abilities), [user]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, can, canAny }),
    [user, loading, login, logout, refresh, can, canAny],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
