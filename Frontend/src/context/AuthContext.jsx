/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => setUser(null);

  useEffect(() => {
    let active = true;
    const onSessionExpired = () => { if (active) { clearSession(); setLoading(false); } };
    const restoreSession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (active) setUser(data.user);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    window.addEventListener('opuspay:session-expired', onSessionExpired);
    restoreSession();
    return () => { active = false; window.removeEventListener('opuspay:session-expired', onSessionExpired); };
  }, []);

  const login = (userData) => setUser(userData);
  const updateUser = (userData) => setUser(userData);
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally { clearSession(); }
  };

  return <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAuthenticated: Boolean(user) }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
