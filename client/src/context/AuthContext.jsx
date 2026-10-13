import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { errorMessage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('mt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setProviderProfile(data.providerProfile || null);
    } catch {
      localStorage.removeItem('mt_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('mt_token', data.token);
    setUser(data.user);
    if (data.user.role === 'provider') {
      const me = await api.get('/auth/me');
      setProviderProfile(me.data.providerProfile || null);
    }
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('mt_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('mt_token');
    setUser(null);
    setProviderProfile(null);
  };

  const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  const value = useMemo(
    () => ({ user, providerProfile, setProviderProfile, loading, login, register, logout, updateUser, refresh: loadSession }),
    [user, providerProfile, loading, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export { errorMessage };
