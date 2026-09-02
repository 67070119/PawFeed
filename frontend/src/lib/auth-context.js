'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await api('/api/auth/me');
      setUser(current);
      return current;
    } catch (error) {
      if (error.status === 401) setUser(null);
      else throw error;
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh().catch(() => setLoading(false)); }, [refresh]);

  const login = useCallback(async (email, password) => {
    const current = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, login, logout }), [user, loading, refresh, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
