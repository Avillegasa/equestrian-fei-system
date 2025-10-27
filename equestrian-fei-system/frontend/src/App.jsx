import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { PublicRoute } from './components/ProtectedRoute';
import ProtectedRoute, { AdminRoute, OrganizerRoute, JudgeRoute } from './components/ProtectedRoute';

// Componentes globales
import OfflineIndicator from './components/OfflineIndicator';

// Páginas de autenticación
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Páginas principales
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';

// Páginas por rol
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import JudgeDashboard from './pages/JudgeDashboard';

// Páginas de gestión
import UsersPage from './pages/UsersPage';
import CompetitionsPage from './pages/CompetitionsPage';
import CategoriesPage from './pages/CategoriesPage';
import CompetitionStaffPage from './pages/CompetitionStaffPage';
import ParticipantsPage from './pages/ParticipantsPage';
import CompetitionSchedulePage from './pages/CompetitionSchedulePage';
import PublicSchedulePage from './pages/PublicSchedulePage';
import ApprovalsPage from './pages/ApprovalsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ScoringPage from './pages/ScoringPage';
import RankingsPage from './pages/RankingsPage';

import './styles/App.css'

// Componente para redirigir al dashboard correcto según el rol
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'organizer':
      return <Navigate to="/organizer" replace />;
    case 'judge':
      return <Navigate to="/judge" replace />;
    default:
      return <DashboardPage />;
  }
};

function App() {
  const { isLoading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Indicador de modo offline - siempre visible */}
        <OfflineIndicator />

        <Routes>
          {/* Rutas públicas (solo para no autenticados) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />

          {/* Ruta de dashboard inteligente - redirige según el rol */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rankings/:competitionId"
            element={
              <ProtectedRoute>
                <RankingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule/:competitionId"
            element={
              <ProtectedRoute>
                <PublicSchedulePage />
              </ProtectedRoute>
            }
          />

          {/* Rutas específicas por rol */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <OrganizerRoute>
                <OrganizerDashboard />
              </OrganizerRoute>
            }
          />
          <Route
            path="/judge"
            element={
              <JudgeRoute>
                <JudgeDashboard />
              </JudgeRoute>
            }
          />
          <Route
            path="/judge/scoring/:competitionId"
            element={
              <JudgeRoute>
                <ScoringPage />
              </JudgeRoute>
            }
          />
          <Route
            path="/judge/competitions"
            element={
              <JudgeRoute>
                <CompetitionsPage />
              </JudgeRoute>
            }
          />

          {/* Rutas específicas del organizador */}
          <Route
            path="/organizer/competitions"
            element={
              <OrganizerRoute>
                <CompetitionsPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/categories"
            element={
              <OrganizerRoute>
                <CategoriesPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/participants"
            element={
              <OrganizerRoute>
                <ParticipantsPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:competitionId/participants"
            element={
              <OrganizerRoute>
                <ParticipantsPage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/competitions/:competitionId/staff"
            element={
              <OrganizerRoute>
                <CompetitionStaffPage />
              </OrganizerRoute>
            }
          />

          {/* Rutas específicas del admin con prefijo /admin/ */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/competitions"
            element={
              <AdminRoute>
                <CompetitionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <CategoriesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/competitions/:competitionId/staff"
            element={
              <AdminRoute>
                <CompetitionStaffPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/competitions/:competitionId/participants"
            element={
              <AdminRoute>
                <ParticipantsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/competitions/:competitionId/schedule"
            element={
              <OrganizerRoute>
                <CompetitionSchedulePage />
              </OrganizerRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <AdminRoute>
                <ApprovalsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activity-log"
            element={
              <AdminRoute>
                <ActivityLogPage />
              </AdminRoute>
            }
          />

          {/* Redirect root a dashboard */}
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />

          {/* Catch-all route */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-4">Página no encontrada</p>
                  <a href="/dashboard" className="text-blue-600 hover:text-blue-500">
                    Volver al inicio
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App