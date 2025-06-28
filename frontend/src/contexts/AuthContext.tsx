'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthState,
  UserRole 
} from '@/types/auth';
import { apiClient } from '@/lib/api';

// Tipos para las acciones del reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// Estado inicial
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  error: null,
};

// Reducer para manejar el estado de autenticación
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        error: null,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Tipo para el contexto
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isJudge: () => boolean;
  isOrganizer: () => boolean;
  checkAuth: () => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    checkAuth();
  }, []);

  // Función para verificar autenticación
  const checkAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Verificar si hay tokens en localStorage
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      // Obtener información del usuario actual
      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data,
            accessToken,
            refreshToken,
          },
        });
      } else {
        // Token inválido, limpiar storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Función de login
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            accessToken: response.data.access,
            refreshToken: response.data.refresh,
          },
        });
        return true;
      } else {
        const errorMessage = response.error?.detail || 
                            response.error?.message || 
                            'Error de autenticación';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
      return false;
    }
  };

  // Función de registro
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
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
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
      return false;
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado y storage independientemente del resultado
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función para actualizar usuario
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Funciones helper para verificar roles
  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  const isJudge = (): boolean => {
    return hasRole(UserRole.JUDGE);
  };

  const isOrganizer = (): boolean => {
    return hasRole(UserRole.ORGANIZER);
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
    isAdmin,
    isJudge,
    isOrganizer,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC para proteger rutas que requieren autenticación
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, user, hasAnyRole } = useAuth();
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }
    
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600">
              No tienes permisos para acceder a esta página.
            </p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Hook para verificar permisos específicos
export function usePermissions() {
  const { user, isAdmin } = useAuth();

  const canViewUsers = (): boolean => {
    return isAdmin() || user?.role === UserRole.ORGANIZER;
  };

  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  const canViewCompetitions = (): boolean => {
    return !!user; // Todos los usuarios autenticados pueden ver competencias
  };

  const canCreateCompetitions = (): boolean => {
    return isAdmin() || user?.role === UserRole.ORGANIZER;
  };

  const canScore = (): boolean => {
    return isAdmin() || user?.role === UserRole.JUDGE;
  };

  const canViewReports = (): boolean => {
    return isAdmin() || user?.role === UserRole.ORGANIZER;
  };

  const canViewAudit = (): boolean => {
    return isAdmin();
  };

  return {
    canViewUsers,
    canManageUsers,
    canViewCompetitions,
    canCreateCompetitions,
    canScore,
    canViewReports,
    canViewAudit,
  };
}