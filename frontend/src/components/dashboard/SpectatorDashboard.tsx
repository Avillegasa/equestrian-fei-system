'use client';

import { User } from '@/types/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SpectatorDashboardProps {
  user: User;
}

export default function SpectatorDashboard({ user }: SpectatorDashboardProps) {
  return (
    <DashboardLayout user={user} title="Panel de Espectador">
      <div className="space-y-6">
        {/* Bienvenida */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bienvenido, Espectador
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user.full_name}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Competencias disponibles */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Competencias en Vivo
            </h3>
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay competencias activas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cuando haya competencias en curso, podrás ver los rankings en tiempo real aquí.
              </p>
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Rankings Recientes
            </h3>
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                Los rankings de competencias recientes aparecerán aquí.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}