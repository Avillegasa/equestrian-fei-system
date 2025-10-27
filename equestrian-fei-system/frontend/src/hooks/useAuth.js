import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

/**
 * Hook personalizado para manejo de autenticación
 * Proporciona acceso fácil al estado de auth y acciones
 */
const useAuth = () => {
  const {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,

    // Acciones
    initializeAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,

    // Utilidades
    hasRole,
    isAdmin,
    isOrganizer,
    isJudge,
    isRider,
    hasPermission,
    getFullName,
    getRoleDisplay
  } = useAuthStore();

  // Inicializar autenticación al montar el hook
  useEffect(() => {
    initializeAuth();
  }, []);

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
    updateProfile,
    changePassword,
    clearError,

    // Utilidades
    hasRole,
    isAdmin,
    isOrganizer,
    isJudge,
    isRider,
    hasPermission,
    getFullName,
    getRoleDisplay,

    // Datos derivados útiles
    userRole: user?.role,
    userName: getFullName(),
    userEmail: user?.email,
    isVerified: user?.is_verified || false
  };
};

export default useAuth;