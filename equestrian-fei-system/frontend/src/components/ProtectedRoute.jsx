import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Componente para proteger rutas que requieren autenticación
 * y/o roles específicos
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  fallbackPath = '/login' 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar autenticación si es requerida
  if (requireAuth && !isAuthenticated) {
    // Guardar la ruta actual para redirect después del login
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Verificar roles si están especificados
  if (allowedRoles.length > 0 && user) {
    const hasAllowedRole = allowedRoles.includes(user.role);
    
    if (!hasAllowedRole) {
      // Redirigir a página apropiada según el rol
      const roleRedirects = {
        admin: '/admin',
        organizer: '/organizer',
        judge: '/judge',
        rider: '/rider',
        viewer: '/'
      };

      const redirectPath = roleRedirects[user.role] || '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return children;
};

/**
 * Componente específico para rutas de admin
 * Nota: Permite también organizadores y jueces ya que necesitan acceso a competencias
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'organizer', 'judge']} fallbackPath="/">
    {children}
  </ProtectedRoute>
);

/**
 * Componente específico para rutas de organizador
 */
export const OrganizerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'organizer']} fallbackPath="/">
    {children}
  </ProtectedRoute>
);

/**
 * Componente específico para rutas de juez
 */
export const JudgeRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'judge']} fallbackPath="/">
    {children}
  </ProtectedRoute>
);

/**
 * Componente específico para rutas de rider
 */
export const RiderRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'rider']} fallbackPath="/">
    {children}
  </ProtectedRoute>
);

/**
 * Componente para rutas públicas (solo no autenticados)
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si está autenticado, redirigir al dashboard apropiado
  if (isAuthenticated && user) {
    const roleRedirects = {
      admin: '/admin',
      organizer: '/organizer',
      judge: '/judge',
      rider: '/rider',
      viewer: '/dashboard'
    };

    const redirectPath = roleRedirects[user.role] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;