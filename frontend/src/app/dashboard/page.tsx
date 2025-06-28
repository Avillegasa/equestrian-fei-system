'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { withAuth } from '@/contexts/AuthContext';

// Componentes específicos para cada rol
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import JudgeDashboard from '@/components/dashboard/JudgeDashboard';
import OrganizerDashboard from '@/components/dashboard/OrganizerDashboard';
import SpectatorDashboard from '@/components/dashboard/SpectatorDashboard';

function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error de autenticación
          </h1>
          <p className="text-gray-600">
            No se pudo cargar la información del usuario.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar dashboard específico según el rol
  const renderDashboard = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={user} />;
      case UserRole.JUDGE:
        return <JudgeDashboard user={user} />;
      case UserRole.ORGANIZER:
        return <OrganizerDashboard user={user} />;
      case UserRole.SPECTATOR:
        return <SpectatorDashboard user={user} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Rol no reconocido
              </h1>
              <p className="text-gray-600">
                Tu rol de usuario no está configurado correctamente.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
}

// Exportar el componente protegido
export default withAuth(DashboardPage);