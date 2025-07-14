// frontend/src/app/judge/scoring/[sessionId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PremiumScoringPanel } from '@/components/scoring/PremiumScoringPanel';
import { usePremiumScoring } from '@/hooks/usePremiumScoring';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Save, 
  RotateCcw,
  Settings,
  Home
} from 'lucide-react';

// Query client singleton
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function ScoringPageContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.sessionId as string);

  // Hook principal para la gestión de calificación
  const {
    session,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    syncStatus,
    offlineMode,
    error,
    currentParticipant,
    currentParameter,
    currentParticipantIndex,
    currentParameterIndex,
    completionStats,
    pendingScoresCount,
    updateScore,
    navigateToParticipant,
    navigateToParameter,
    saveAllPendingScores,
    addEventListener
  } = usePremiumScoring({
    sessionId,
    options: {
      auto_save: true,
      auto_save_interval: 30000, // 30 segundos
      enable_offline: true,
      validation_mode: 'strict',
      real_time_updates: true
    }
  });

  // Estado para controles de la interfaz
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Escuchar eventos de calificación
  useEffect(() => {
    const unsubscribe = addEventListener((event) => {
      console.log('Scoring event:', event);
      
      // Manejar eventos específicos si es necesario
      switch (event.type) {
        case 'SCORE_UPDATED':
          // Lógica adicional cuando se actualiza una puntuación
          break;
        case 'SYNC_STATUS_CHANGED':
          // Manejar cambios de estado de sincronización
          break;
      }
    });

    return unsubscribe;
  }, [addEventListener]);

  // Guardar automáticamente antes de salir
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Función para manejar actualización de puntuaciones
  const handleScoreUpdate = (participantId: number, parameterId: number, score: number, justification?: string) => {
    updateScore(participantId, parameterId, score, justification);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-800">Cargando sesión de calificación...</h2>
          <p className="text-gray-600">Preparando la interfaz para el juez</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <h3 className="font-semibold text-red-800 mb-2">Error al cargar la sesión</h3>
              <p className="text-red-700 mb-4">{error.message}</p>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button 
                  onClick={() => router.push('/judge')} 
                  size="sm" 
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Volver al Panel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No session state
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800">Sesión no encontrada</h2>
          <p className="text-gray-600">No se pudo encontrar la sesión de calificación solicitada</p>
          <Button onClick={() => router.push('/judge')}>
            <Home className="h-4 w-4 mr-2" />
            Volver al Panel Principal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Barra de estado superior */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            
            {/* Estado de conexión y guardado */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {offlineMode ? (
                  <WifiOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {offlineMode ? 'Modo Offline' : 'Conectado'}
                </span>
              </div>

              {syncStatus === 'pending' && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
                  <span className="text-sm">Sincronizando...</span>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Error de sincronización</span>
                </div>
              )}

              {syncStatus === 'synced' && lastSaved && (
                <div className="text-sm text-green-600">
                  Guardado: {new Date(lastSaved).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Controles de acción */}
            <div className="flex items-center space-x-3">
              {pendingScoresCount > 0 && (
                <div className="text-sm text-amber-600">
                  {pendingScoresCount} cambios pendientes
                </div>
              )}

              <Button
                onClick={saveAllPendingScores}
                disabled={!hasUnsavedChanges || isSaving}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
              </Button>

              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
                variant="ghost"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => router.push('/judge')}
                size="sm"
                variant="ghost"
              >
                <Home className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de configuración rápida */}
      {showSettings && (
        <div className="fixed top-16 right-6 z-40 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <h3 className="font-semibold text-gray-800 mb-3">Configuración Rápida</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-guardado</span>
              <Button
                size="sm"
                variant={autoSaveEnabled ? "default" : "outline"}
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                {autoSaveEnabled ? 'Activo' : 'Inactivo'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progreso</span>
              <span className="text-sm font-medium">
                {completionStats.percentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Participante</span>
              <span className="text-sm font-medium">
                {currentParticipantIndex + 1} / {session.participants.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Alertas importantes */}
      {hasUnsavedChanges && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center space-x-2">
              <span>Tienes cambios sin guardar</span>
              <Button 
                size="sm" 
                onClick={saveAllPendingScores}
                disabled={isSaving}
                className="ml-2"
              >
                Guardar ahora
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contenido principal con padding para la barra superior */}
      <div className="pt-16">
        <PremiumScoringPanel
          participants={session.participants}
          currentParticipantIndex={currentParticipantIndex}
          evaluationParameters={session.evaluation_parameters}
          onScoreUpdate={handleScoreUpdate}
          onParticipantChange={navigateToParticipant}
          competitionName={session.competition_name}
          categoryName={session.category_name}
        />
      </div>

      {/* Toaster para notificaciones */}
      <Toaster 
        position="bottom-right"
        expand={false}
        richColors
        closeButton
      />
    </div>
  );
}

// Componente principal con Provider
export default function PremiumScoringPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScoringPageContent />
    </QueryClientProvider>
  );
}