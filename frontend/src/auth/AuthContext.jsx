import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi, logoutApi } from './authApi';
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
} from '../shared/utils/apiHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    let isCancelled = false;

    async function checkAuth() {
      const existingToken = getToken();
      if (!existingToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMeApi();
        if (!isCancelled) {
          setUserState(currentUser);
          setStoredUser(currentUser);
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message);
        if (!isCancelled) {
          removeToken();
          removeStoredUser();
          setTokenState(null);
          setUserState(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    const { access_token, user: loggedUser } = data;

    setToken(access_token);
    setStoredUser(loggedUser);
    setTokenState(access_token);
    setUserState(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    }
    removeToken();
    removeStoredUser();
    setTokenState(null);
    setUserState(null);
  };

  const value = {
    user,
    token,
    role: user?.role?.toUpperCase() || null,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
