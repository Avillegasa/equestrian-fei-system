import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import competitionsApi from '@/lib/api/competitions';
import type {
  Competition, CompetitionFormData, CompetitionFilters, Registration,
  RegistrationFormData, Category, Discipline, Horse, Rider,
  UseCompetitionsOptions, UseRegistrationsOptions
} from '@/types/competitions';

// Hook para competencias
export function useCompetitions(options?: UseCompetitionsOptions) {
  return useQuery({
    queryKey: ['competitions', options?.filters],
    queryFn: () => competitionsApi.competitions.getAll(options?.filters),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para una competencia específica
export function useCompetition(id: string) {
  return useQuery({
    queryKey: ['competitions', id],
    queryFn: () => competitionsApi.competitions.getById(id),
    enabled: !!id,
  });
}

// Hook para dashboard de competencia
export function useCompetitionDashboard(id: string) {
  return useQuery({
    queryKey: ['competition-dashboard', id],
    queryFn: () => competitionsApi.competitions.getDashboard(id),
    enabled: !!id,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}

// Hook para estadísticas de competencia
export function useCompetitionStatistics(id: string) {
  return useQuery({
    queryKey: ['competition-statistics', id],
    queryFn: () => competitionsApi.competitions.getStatistics(id),
    enabled: !!id,
  });
}

// Hook para inscripciones
export function useRegistrations(options?: UseRegistrationsOptions) {
  return useQuery({
    queryKey: ['registrations', options?.filters],
    queryFn: () => competitionsApi.registrations.getAll(options?.filters),
    enabled: options?.enabled !== false,
  });
}

// Hook para inscripciones de una competencia
export function useCompetitionRegistrations(competitionId: string, filters?: { category_id?: number; status?: string }) {
  return useQuery({
    queryKey: ['competition-registrations', competitionId, filters],
    queryFn: () => competitionsApi.competitions.getRegistrations(competitionId, filters),
    enabled: !!competitionId,
  });
}

// Hook para categorías
export function useCategories(filters?: { discipline_id?: number; level?: string }) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => competitionsApi.categories.getAll(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para disciplinas
export function useDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: () => competitionsApi.disciplines.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para caballos
export function useHorses(filters?: { owner?: string; country?: string }) {
  return useQuery({
    queryKey: ['horses', filters],
    queryFn: () => competitionsApi.horses.getAll(filters),
  });
}

// Hook para jinetes
export function useRiders(filters?: { nationality?: string; license_type?: string }) {
  return useQuery({
    queryKey: ['riders', filters],
    queryFn: () => competitionsApi.riders.getAll(filters),
  });
}

// Hook para búsqueda de participantes
export function useParticipantSearch() {
  return useMutation({
    mutationFn: competitionsApi.utils.searchParticipants,
  });
}

// Mutaciones para competencias
export function useCreateCompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.competitions.create,
    onSuccess: (newCompetition) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competencia creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear competencia');
    },
  });
}

export function useUpdateCompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompetitionFormData> }) =>
      competitionsApi.competitions.update(id, data),
    onSuccess: (updatedCompetition) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitions', updatedCompetition.id] });
      toast.success('Competencia actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar competencia');
    },
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.competitions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competencia eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar competencia');
    },
  });
}

export function useChangeCompetitionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      competitionsApi.competitions.changeStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['competitions', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard', variables.id] });
      toast.success(data.message || 'Estado cambiado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    },
  });
}

// Mutaciones para inscripciones
export function useCreateRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.registrations.create,
    onSuccess: (newRegistration) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] });
      toast.success('Inscripción creada exitosamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 
                          Object.values(error.response?.data || {}).flat().join(', ') ||
                          'Error al crear inscripción';
      toast.error(errorMessage);
    },
  });
}

export function useQuickRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.registrations.quickRegistration,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      toast.success(data.message || 'Inscripción rápida exitosa');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error en inscripción rápida');
    },
  });
}

export function useConfirmRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.registrations.confirm,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] });
      toast.success(data.message || 'Inscripción confirmada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al confirmar inscripción');
    },
  });
}

export function useMarkRegistrationPaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, amount, paymentReference }: { id: string; amount: number; paymentReference?: string }) =>
      competitionsApi.registrations.markPaid(id, amount, paymentReference),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] });
      toast.success(data.message || 'Pago registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al registrar pago');
    },
  });
}

export function useBulkUpdateRegistrations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.registrations.bulkUpdate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] });
      toast.success(data.message || 'Inscripciones actualizadas');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error en actualización masiva');
    },
  });
}

export function useAssignStartNumbers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.registrations.assignStartNumbers,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-registrations'] });
      toast.success(data.message || 'Números de dorsal asignados');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al asignar números');
    },
  });
}

// Mutaciones para participantes
export function useCreateHorse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.horses.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Caballo registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar caballo');
    },
  });
}

export function useUpdateHorse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Horse> }) =>
      competitionsApi.horses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horses'] });
      toast.success('Caballo actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar caballo');
    },
  });
}

export function useCreateRider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: competitionsApi.riders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Jinete registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar jinete');
    },
  });
}

export function useUpdateRider() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Rider> }) =>
      competitionsApi.riders.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast.success('Jinete actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar jinete');
    },
  });
}

// Mutaciones para asignación de jueces
export function useAssignJudges() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ competitionCategoryId, judges }: { competitionCategoryId: number; judges: any[] }) =>
      competitionsApi.competitionCategories.assignJudges(competitionCategoryId, judges),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition-categories'] });
      queryClient.invalidateQueries({ queryKey: ['competition-dashboard'] });
      toast.success('Jueces asignados exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al asignar jueces');
    },
  });
}

// Hook combinado para gestión completa de competencias
export function useCompetitionManagement(competitionId?: string) {
  const competition = useCompetition(competitionId!);
  const dashboard = useCompetitionDashboard(competitionId!);
  const registrations = useCompetitionRegistrations(competitionId!);
  const statistics = useCompetitionStatistics(competitionId!);
  
  const createCompetition = useCreateCompetition();
  const updateCompetition = useUpdateCompetition();
  const deleteCompetition = useDeleteCompetition();
  const changeStatus = useChangeCompetitionStatus();
  
  const createRegistration = useCreateRegistration();
  const confirmRegistration = useConfirmRegistration();
  const markPaid = useMarkRegistrationPaid();
  const bulkUpdate = useBulkUpdateRegistrations();
  const assignStartNumbers = useAssignStartNumbers();
  
  return {
    // Datos
    competition: competition.data,
    dashboard: dashboard.data,
    registrations: registrations.data,
    statistics: statistics.data,
    
    // Estados de carga
    isLoading: competition.isLoading || dashboard.isLoading,
    isError: competition.isError || dashboard.isError,
    
    // Mutaciones de competencia
    createCompetition: createCompetition.mutate,
    updateCompetition: updateCompetition.mutate,
    deleteCompetition: deleteCompetition.mutate,
    changeStatus: changeStatus.mutate,
    
    // Mutaciones de inscripciones
    createRegistration: createRegistration.mutate,
    confirmRegistration: confirmRegistration.mutate,
    markPaid: markPaid.mutate,
    bulkUpdate: bulkUpdate.mutate,
    assignStartNumbers: assignStartNumbers.mutate,
    
    // Estados de mutaciones
    isCreating: createCompetition.isPending,
    isUpdating: updateCompetition.isPending,
    isDeleting: deleteCompetition.isPending,
    isChangingStatus: changeStatus.isPending,
    
    // Refetch
    refetch: () => {
      competition.refetch();
      dashboard.refetch();
      registrations.refetch();
      statistics.refetch();
    }
  };
}

// Hook para datos públicos
export function usePublicCompetitions(filters?: { upcoming?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['public-competitions', filters],
    queryFn: () => competitionsApi.public.getCompetitions(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicCompetitionDetail(id: string) {
  return useQuery({
    queryKey: ['public-competition', id],
    queryFn: () => competitionsApi.public.getCompetitionDetail(id),
    enabled: !!id,
  });
}

// Hook para jueces
export function useJudgeCompetitions() {
  return useQuery({
    queryKey: ['judge-competitions'],
    queryFn: () => competitionsApi.utils.getJudgeCompetitions(),
  });
}