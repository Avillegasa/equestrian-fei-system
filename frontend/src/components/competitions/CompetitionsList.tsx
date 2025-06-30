'use client';

import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  FunnelIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCompetitions, useChangeCompetitionStatus, useDeleteCompetition } from '@/hooks/useCompetitions';
import { useAuth } from '@/contexts/AuthContext';
import type { Competition, CompetitionFilters } from '@/types/competitions';
import { COMPETITION_STATUS_COLORS } from '@/types/competitions';

interface CompetitionsListProps {
  onCreateNew?: () => void;
  onEditCompetition?: (competition: Competition) => void;
  onViewCompetition?: (competitionId: string) => void;
}

export default function CompetitionsList({ 
  onCreateNew, 
  onEditCompetition, 
  onViewCompetition 
}: CompetitionsListProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CompetitionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: competitions = [], isLoading, error } = useCompetitions({ filters });
  const changeStatus = useChangeCompetitionStatus();
  const deleteCompetition = useDeleteCompetition();

  // Filtrar competencias por búsqueda local
  const filteredCompetitions = useMemo(() => {
    if (!searchQuery.trim()) return competitions;
    
    const query = searchQuery.toLowerCase();
    return competitions.filter(competition =>
      competition.name.toLowerCase().includes(query) ||
      competition.venue.toLowerCase().includes(query) ||
      competition.organizer.full_name.toLowerCase().includes(query)
    );
  }, [competitions, searchQuery]);

  const handleStatusChange = (competitionId: string, newStatus: string) => {
    changeStatus.mutate({ id: competitionId, status: newStatus });
  };

  const handleDelete = (competitionId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta competencia?')) {
      deleteCompetition.mutate(competitionId);
    }
  };

  const getStatusBadge = (status: string, statusDisplay: string) => {
    const color = COMPETITION_STATUS_COLORS[status] || 'gray';
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]}`}>
        {statusDisplay}
      </span>
    );
  };

  const canModifyCompetition = (competition: Competition) => {
    return competition.organizer.id === user?.id || user?.is_staff;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar competencias</h3>
        <p className="mt-1 text-sm text-gray-500">
          Hubo un problema al cargar la lista de competencias. Intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con título y acciones */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competencias</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona las competencias ecuestres del sistema FEI
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {(user?.role === 'ORGANIZER' || user?.is_staff) && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nueva Competencia
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar competencias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
            Filtros
          </button>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="OPEN">Abierta</option>
                  <option value="REGISTRATION_CLOSED">Inscripciones cerradas</option>
                  <option value="IN_PROGRESS">En progreso</option>
                  <option value="COMPLETED">Completada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={filters.start_date_from || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, start_date_from: e.target.value || undefined }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  value={filters.start_date_to || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, start_date_to: e.target.value || undefined }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({})}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de competencias */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredCompetitions.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay competencias</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'No se encontraron competencias que coincidan con tu búsqueda.' : 'Comienza creando una nueva competencia.'}
            </p>
            {!searchQuery && (user?.role === 'ORGANIZER' || user?.is_staff) && (
              <div className="mt-6">
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nueva Competencia
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredCompetitions.map((competition) => (
              <li key={competition.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {competition.name}
                        </h3>
                        {getStatusBadge(competition.status, competition.status_display)}
                        {competition.is_fei_sanctioned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold-100 text-gold-800">
                            FEI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {format(new Date(competition.start_date), 'dd MMM yyyy', { locale: es })} - 
                        {format(new Date(competition.end_date), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {competition.venue}
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {competition.total_registered_participants} / {competition.max_total_participants} participantes
                      </div>
                    </div>

                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>Organizado por: <span className="font-medium">{competition.organizer.full_name}</span></span>
                      {competition.days_until_start > 0 && (
                        <span className="ml-4 text-blue-600">
                          Faltan {competition.days_until_start} días
                        </span>
                      )}
                      {competition.is_registration_open && (
                        <span className="ml-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="mr-1 h-3 w-3" />
                          Inscripciones abiertas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Ver detalles */}
                    <button
                      onClick={() => onViewCompetition?.(competition.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>

                    {canModifyCompetition(competition) && (
                      <>
                        {/* Editar */}
                        <button
                          onClick={() => onEditCompetition?.(competition)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Editar competencia"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>

                        {/* Cambiar estado */}
                        {competition.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(competition.id, 'OPEN')}
                            disabled={changeStatus.isPending}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full disabled:opacity-50"
                            title="Abrir para inscripciones"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}

                        {competition.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusChange(competition.id, 'REGISTRATION_CLOSED')}
                            disabled={changeStatus.isPending}
                            className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full disabled:opacity-50"
                            title="Cerrar inscripciones"
                          >
                            <PauseIcon className="h-5 w-5" />
                          </button>
                        )}

                        {competition.status === 'REGISTRATION_CLOSED' && (
                          <button
                            onClick={() => handleStatusChange(competition.id, 'IN_PROGRESS')}
                            disabled={changeStatus.isPending}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-50"
                            title="Iniciar competencia"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}

                        {/* Eliminar */}
                        {competition.status === 'DRAFT' && (
                          <button
                            onClick={() => handleDelete(competition.id)}
                            disabled={deleteCompetition.isPending}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full disabled:opacity-50"
                            title="Eliminar competencia"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Información adicional */}
      {filteredCompetitions.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Mostrando {filteredCompetitions.length} de {competitions.length} competencias
        </div>
      )}
    </div>
  );
}