import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    // Avoid a full-page loader flash right after signing in when we already
    // have the user object from the login response.
    if (!userRef.current) setLoading(true);
    api
      .get('/auth/me')
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, logout]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    const handleStorage = (event) => {
      if (event.key === 'bugtrack_token' && !event.newValue) logout();
    };

    window.addEventListener('bugtrack:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('bugtrack:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorage);
    };
  }, [logout]);

  const applySession = useCallback((data) => {
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
    return data.user;
  }, []);

  const login = useCallback(
    async (credentials) => applySession(await api.post('/auth/login', credentials)),
    [applySession]
  );

  const register = useCallback(
    async (details) => applySession(await api.post('/auth/register', details)),
    [applySession]
  );

  const refreshUser = useCallback(async () => {
    const data = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser, setUser }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
