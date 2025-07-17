'use client';

/**
 * AuthContext - Sistema FEI
 * =========================
 * 
 * Context React para manejo de autenticación global.
 * Integra completamente con el API client y maneja:
 * - Estado de usuario autenticado
 * - Login/logout/register
 * - Persistencia automática
 * - Manejo de errores
 * - Helpers de roles
 * 
 * Archivo: frontend/src/contexts/AuthContext.tsx
 * Autor: Sistema FEI - Fase 6.6 Día 9
 * Fecha: 17 Julio 2025
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  UserRole 
} from '@/types/auth';

// ===== TIPOS DEL CONTEXT =====
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isAdmin: () => boolean;
  isJudge: () => boolean;
  isOrganizer: () => boolean;
}

// ===== CREAR CONTEXT =====
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia en true para cargar usuario guardado
  const [error, setError] = useState<string | null>(null);

  // ===== EFECTO DE INICIALIZACIÓN =====
  useEffect(() => {
  const initializeAuth = () => {
    try {
      // Añadir esta verificación adicional
      if (typeof window === 'undefined') return;
      
      if (authAPI.isAuthenticated()) {
        const storedUser = authAPI.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          console.log('✅ Usuario cargado desde localStorage:', storedUser.email);
        }
      }
    } catch (error) {
      console.error('❌ Error inicializando auth:', error);
      authAPI.logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Delay la inicialización para evitar hydration mismatch
  setTimeout(initializeAuth, 0);
}, []);

  // ===== FUNCIÓN LOGIN =====
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Intentando login con API...');
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsLoading(false);
        console.log('✅ Login exitoso:', response.data.user.email);
        return true;
      } else {
        let errorMessage = 'Error de autenticación';
        
        // Manejar diferentes tipos de errores
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.detail) {
            errorMessage = response.error.detail;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
        console.log('❌ Login falló:', errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = 'Error de conexión con el servidor';
      setError(errorMessage);
      setIsLoading(false);
      console.error('❌ Error en login:', error);
      return false;
    }
  };

  // ===== FUNCIÓN REGISTER =====
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📝 Intentando registro con API...');
      const response = await authAPI.register(data);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsLoading(false);
        console.log('✅ Registro exitoso:', response.data.user.email);
        return true;
      } else {
        let errorMessage = 'Error en el registro';
        
        // Manejar errores de validación del servidor
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.errors) {
            // Combinar múltiples errores de validación
            const errors = Object.entries(response.error.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join(' | ');
            errorMessage = errors;
          } else if (response.error.detail) {
            errorMessage = response.error.detail;
          }
        }
        
        setError(errorMessage);
        setIsLoading(false);
        console.log('❌ Registro falló:', errorMessage);
        return false;
      }
    } catch (error) {
      const errorMessage = 'Error de conexión durante el registro';
      setError(errorMessage);
      setIsLoading(false);
      console.error('❌ Error en registro:', error);
      return false;
    }
  };

  // ===== FUNCIÓN LOGOUT =====
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Llamar logout del API (limpia tokens)
      await authAPI.logout();
      
      // Limpiar estado local
      setUser(null);
      setError(null);
      
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Aunque falle la llamada al API, limpiar estado local
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNCIÓN CLEAR ERROR =====
  const clearError = () => {
    setError(null);
  };

  // ===== HELPERS DE ROLES =====
  const isAdmin = (): boolean => user?.role === UserRole.ADMIN;
  const isJudge = (): boolean => user?.role === UserRole.JUDGE;
  const isOrganizer = (): boolean => user?.role === UserRole.ORGANIZER;

  // ===== VALOR DEL CONTEXT =====
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin,
    isJudge,
    isOrganizer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===== HOOK PERSONALIZADO =====
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// ===== HOC PARA PROTEGER COMPONENTES =====
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando autenticación...</p>
          </div>
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