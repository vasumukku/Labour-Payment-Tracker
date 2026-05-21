import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { translations } from '../i18n/translations';

const AppContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || '/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lt_token');
      localStorage.removeItem('lt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lt_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lt_token'));
  const [language, setLanguageState] = useState(() => localStorage.getItem('lt_lang') || 'en');
  const [theme, setThemeState] = useState(() => localStorage.getItem('lt_theme') || 'light');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('lt_token', data.token);
        localStorage.setItem('lt_user', JSON.stringify(data.user));
        if (data.user.language) setLanguage(data.user.language);
        if (data.user.theme) setTheme(data.user.theme);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  };

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    localStorage.removeItem('lt_token');
    localStorage.removeItem('lt_user');
  }, []);

  const setLanguage = (lang) => { setLanguageState(lang); localStorage.setItem('lt_lang', lang); };
  const setTheme = (t) => { setThemeState(t); localStorage.setItem('lt_theme', t); };
  const updateUser = (u) => { setUser(u); localStorage.setItem('lt_user', JSON.stringify(u)); };

  // Role helpers
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdminViewer = user?.role === 'adminviewer';
  const isLeader = user?.role === 'leader';
  const canViewAll = user?.role === 'superadmin' || user?.role === 'adminviewer';
  const canEdit = user?.role === 'superadmin';

  return (
    <AppContext.Provider value={{
      user, token, language, theme, loading,
      isAuthenticated: !!token,
      isSuperAdmin, isAdminViewer, isLeader,
      canViewAll, canEdit,
      login, logout, setLanguage, setTheme, updateUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const useT = () => {
  const { language } = useApp();
  return translations[language] || translations.en;
};
