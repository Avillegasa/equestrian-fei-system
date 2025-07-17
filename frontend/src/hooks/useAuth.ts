/**
 * Hook de Autenticación para Sistema FEI
 * ======================================
 * 
 * Hook personalizado que integra el AuthContext con el API client,
 * proporcionando una interfaz simple para manejo de autenticación
 * en toda la aplicación.
 * 
 * Características:
 * - Integración completa con AuthContext
 * - Métodos de autenticación tipados
 * - Estado de loading y error manejado
 * - Helpers para verificar roles
 * - Persistencia automática de estado
 * - Compatible con SSR (Next.js)
 * 
 * Autor: Sistema FEI - Fase 6.6 Día 8
 * Fecha: 17 Julio 2025
 */

'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/AuthContext';
import { authAPI, TokenManager } from '@/lib/api';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  PasswordChangeData 
} from '@/types/api-types';
import type { UserRole } from '@/types/auth';

// ===== TIPOS DEL HOOK =====
interface UseAuthReturn {
  // Estado de autenticación
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones de autenticación
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<boolean>;
  
  // Utilidades
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Helpers de roles
  isAdmin: () => boolean;
  isJudge: () => boolean;
  isOrganizer: () => boolean;
  isParticipant: () => boolean;
  isViewer: () => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  
  // Helpers de perfiles
  hasJudgeProfile: () => boolean;
  hasOrganizerProfile: () => boolean;
  
  // Helpers de navegación
  requireAuth: () => void;
  requireRole: (role: UserRole, redirectTo?: string) => void;
  requireAnyRole: (roles: UserRole[], redirectTo?: string) => void;
}

// ===== CONFIGURACIÓN =====
const DEFAULT_REDIRECT_ROUTES = {
  login: '/auth/login',
  dashboard: '/dashboard',
  unauthorized: '/unauthorized'
};

// ===== HOOK PRINCIPAL =====
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Verificar que el hook se usa dentro del AuthProvider
  if (!context) {
    throw new Error(
      'useAuth debe ser usado dentro de un AuthProvider. ' +
      'Asegúrate de envolver tu aplicación con <AuthProvider>.'
    );
  }

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    clearError
  } = context;

  // ===== INICIALIZACIÓN =====
  useEffect(() => {
    // Verificar si hay usuario guardado en localStorage al inicializar
    if (!isInitialized && !isLoading) {
      const storedUser = TokenManager.getUser();
      const hasToken = TokenManager.isAuthenticated();
      
      if (storedUser && hasToken && !user) {
        // Hay usuario guardado pero no está en el contexto
        // El AuthContext debería manejar esto, pero por si acaso
        refreshUser();
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, isLoading, user]);

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  /**
   * Login con credenciales
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const success = await contextLogin(credentials);
      
      if (success) {
        // Redirigir al dashboard después del login exitoso
        router.push(DEFAULT_REDIRECT_ROUTES.dashboard);
      }
      
      return success;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  };

  /**
   * Registro de nuevo usuario
   */
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const success = await contextRegister(data);
      
      if (success) {
        // Redirigir al dashboard después del registro exitoso
        router.push(DEFAULT_REDIRECT_ROUTES.dashboard);
      }
      
      return success;
    } catch (error) {
      console.error('Error en registro:', error);
      return false;
    }
  };

  /**
   * Logout del usuario
   */
  const logout = async (): Promise<void> => {
    try {
      await contextLogout();
      router.push(DEFAULT_REDIRECT_ROUTES.login);
    } catch (error) {
      console.error('Error en logout:', error);
      // Limpiar estado local incluso si hay error
      TokenManager.clearAll();
      router.push(DEFAULT_REDIRECT_ROUTES.login);
    }
  };

  /**
   * Cambiar contraseña del usuario actual
   */
  const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
    try {
      const response = await authAPI.changePassword(data);
      return response.success;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return false;
    }
  };

  /**
   * Refrescar información del usuario desde el servidor
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success && response.data) {
        TokenManager.setUser(response.data);
        // El contexto debería actualizarse automáticamente
      }
    } catch (error) {
      console.error('Error refrescando usuario:', error);
      // Si hay error, probablemente el token expiró
      await logout();
    }
  };

  // ===== HELPERS DE ROLES =====

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  /**
   * Verificar si el usuario es juez
   */
  const isJudge = (): boolean => {
    return user?.role === 'judge';
  };

  /**
   * Verificar si el usuario es organizador
   */
  const isOrganizer = (): boolean => {
    return user?.role === 'organizer';
  };

  /**
   * Verificar si el usuario es participante
   */
  const isParticipant = (): boolean => {
    return user?.role === 'participant';
  };

  /**
   * Verificar si el usuario es viewer/espectador
   */
  const isViewer = (): boolean => {
    return user?.role === 'viewer';
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role as UserRole) : false;
  };

  // ===== HELPERS DE PERFILES =====

  /**
   * Verificar si el usuario tiene perfil de juez
   */
  const hasJudgeProfile = (): boolean => {
    return user?.has_judge_profile === true;
  };

  /**
   * Verificar si el usuario tiene perfil de organizador
   */
  const hasOrganizerProfile = (): boolean => {
    return user?.has_organizer_profile === true;
  };

  // ===== HELPERS DE NAVEGACIÓN =====

  /**
   * Requerir autenticación - redirige al login si no está autenticado
   */
  const requireAuth = (): void => {
    if (!isAuthenticated && isInitialized) {
      router.push(DEFAULT_REDIRECT_ROUTES.login);
    }
  };

  /**
   * Requerir rol específico - redirige si no tiene el rol
   */
  const requireRole = (role: UserRole, redirectTo?: string): void => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push(DEFAULT_REDIRECT_ROUTES.login);
        return;
      }
      
      if (!hasRole(role)) {
        router.push(redirectTo || DEFAULT_REDIRECT_ROUTES.unauthorized);
      }
    }
  };

  /**
   * Requerir alguno de los roles especificados
   */
  const requireAnyRole = (roles: UserRole[], redirectTo?: string): void => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push(DEFAULT_REDIRECT_ROUTES.login);
        return;
      }
      
      if (!hasAnyRole(roles)) {
        router.push(redirectTo || DEFAULT_REDIRECT_ROUTES.unauthorized);
      }
    }
  };

  // ===== RETURN DEL HOOK =====
  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Acciones
    login,
    register,
    logout,
    changePassword,
    clearError,
    refreshUser,
    
    // Helpers de roles
    isAdmin,
    isJudge,
    isOrganizer,
    isParticipant,
    isViewer,
    hasRole,
    hasAnyRole,
    
    // Helpers de perfiles
    hasJudgeProfile,
    hasOrganizerProfile,
    
    // Helpers de navegación
    requireAuth,
    requireRole,
    requireAnyRole,
  };
}

// ===== HOOKS ESPECIALIZADOS =====

/**
 * Hook para requerir autenticación en una página
 * Uso: const auth = useRequireAuth();
 */
export function useRequireAuth(): UseAuthReturn {
  const auth = useAuth();
  
  useEffect(() => {
    auth.requireAuth();
  }, [auth.isAuthenticated, auth]);
  
  return auth;
}

/**
 * Hook para requerir un rol específico
 * Uso: const auth = useRequireRole('admin');
 */
export function useRequireRole(role: UserRole, redirectTo?: string): UseAuthReturn {
  const auth = useAuth();
  
  useEffect(() => {
    auth.requireRole(role, redirectTo);
  }, [auth.isAuthenticated, auth.user, role, redirectTo]);
  
  return auth;
}

/**
 * Hook para requerir alguno de varios roles
 * Uso: const auth = useRequireAnyRole(['admin', 'organizer']);
 */
export function useRequireAnyRole(roles: UserRole[], redirectTo?: string): UseAuthReturn {
  const auth = useAuth();
  
  useEffect(() => {
    auth.requireAnyRole(roles, redirectTo);
  }, [auth.isAuthenticated, auth.user, roles, redirectTo]);
  
  return auth;
}

// ===== HOOKS DE CONVENIENCIA =====

/**
 * Hook solo para verificar roles (sin navegación)
 * Uso: const { isAdmin, isJudge } = useUserRoles();
 */
export function useUserRoles() {
  const { user, isAdmin, isJudge, isOrganizer, isParticipant, isViewer, hasRole, hasAnyRole } = useAuth();
  
  return {
    user,
    isAdmin: isAdmin(),
    isJudge: isJudge(),
    isOrganizer: isOrganizer(),
    isParticipant: isParticipant(),
    isViewer: isViewer(),
    hasRole,
    hasAnyRole,
  };
}

/**
 * Hook para estado de autenticación simple
 * Uso: const { isAuthenticated, isLoading } = useAuthStatus();
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    error,
  };
}

// ===== EXPORTAR HOOK PRINCIPAL =====
export default useAuth;