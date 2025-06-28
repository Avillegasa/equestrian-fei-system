'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  UserRole 
} from '@/types/auth';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>; // ← Agregar esta línea
  logout: () => void;
  clearError: () => void;
  isAdmin: () => boolean;
  isJudge: () => boolean;
  isOrganizer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsLoading(false);
        return true;
      } else {
        const errorMessage = response.error?.detail || 'Error de autenticación';
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      setError('Error de conexión');
      setIsLoading(false);
      return false;
    }
  };

  // ← AGREGAR ESTA FUNCIÓN REGISTER
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.register(data);
      
      if (response.success) {
        // Después del registro exitoso, hacer login automático
        const loginSuccess = await login({
          email: data.email,
          password: data.password,
        });
        return loginSuccess;
      } else {
        let errorMessage = 'Error en el registro';
        
        if (response.error?.errors) {
          const errors = Object.entries(response.error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join(' | ');
          errorMessage = errors;
        } else if (response.error?.detail || response.error?.message) {
          errorMessage = response.error.detail || response.error.message;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      setError('Error de conexión');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const isAdmin = () => user?.role === UserRole.ADMIN;
  const isJudge = () => user?.role === UserRole.JUDGE;
  const isOrganizer = () => user?.role === UserRole.ORGANIZER;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register, // ← Agregar aquí también
    logout,
    clearError,
    isAdmin,
    isJudge,
    isOrganizer,
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

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }
    
    return <Component {...props} />;
  };
}