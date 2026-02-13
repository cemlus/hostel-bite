import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'buyer' | 'owner' | 'admin';
  hostel?: {
    id: string;
    _id?: string;
    name: string;
  };
  room?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  hostelId?: string;
  room?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'hostelbite_token';
const USER_KEY = 'hostelbite_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (userData: User): User => ({
    ...userData,
    id: userData.id || userData._id || '',
  });

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<{ user: User }>(ENDPOINTS.AUTH.ME);
      if (response.data?.user) {
        const normalizedUser = normalizeUser(response.data.user);
        setUser(normalizedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      } else if (response.error) {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: User; token: string }>(
        ENDPOINTS.AUTH.LOGIN,
        { email, password }
      );

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: userData, token: newToken } = response.data;
        const normalizedUser = normalizeUser(userData);
        
        setToken(newToken);
        setUser(normalizedUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post<{ user: User; token: string }>(
        ENDPOINTS.AUTH.REGISTER,
        data
      );
      console.log(response);
      console.log(data);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        const { user: userData, token: newToken } = response.data;
        const normalizedUser = normalizeUser(userData);
        
        setToken(newToken);
        setUser(normalizedUser);
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
