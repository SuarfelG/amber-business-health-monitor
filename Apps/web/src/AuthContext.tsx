import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  businessName: string;
  timezone: string;
  currency: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (
    email: string,
    password: string,
    name: string,
    businessName: string,
    timezone: string,
    currency: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data, error } = await apiClient.getMe();
      if (data) {
        setUser(data);
      } else if (error) {
        // Try to refresh token
        const refreshResult = await apiClient.refresh();
        if (refreshResult.data) {
          apiClient.setAccessToken(refreshResult.data.accessToken);
          const meResult = await apiClient.getMe();
          if (meResult.data) {
            setUser(meResult.data);
          }
        }
      }
    } catch (err) {
      // User is not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    businessName: string,
    timezone: string,
    currency: string
  ) => {
    setError(null);
    try {
      const { data, error } = await apiClient.register(
        email,
        password,
        name,
        businessName,
        timezone,
        currency
      );
      if (error) {
        setError(error);
        throw new Error(error);
      }
      if (data) {
        apiClient.setAccessToken(data.accessToken);
        const userResult = await apiClient.getMe();
        if (userResult.data) {
          setUser(userResult.data);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error } = await apiClient.login(email, password);
      if (error) {
        setError(error);
        throw new Error(error);
      }
      if (data) {
        apiClient.setAccessToken(data.accessToken);
        const userResult = await apiClient.getMe();
        if (userResult.data) {
          setUser(userResult.data);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      apiClient.setAccessToken(null);
      setUser(null);
    } catch (err) {
      // Still clear local state even if logout fails
      apiClient.setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
