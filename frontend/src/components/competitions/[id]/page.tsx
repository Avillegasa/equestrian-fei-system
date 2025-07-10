// frontend/src/app/competitions/[id]/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useOffline } from '@/hooks/useOffline';
import { Download, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  categories: any[];
  participants: any[];
  judges: any[];
}

export default function CompetitionPage() {
  const params = useParams();
  const competitionId = params.id as string;
  const { cacheCompetition, isOnline, cacheStatus } = useOffline();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCaching, setIsCaching] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Cargar datos de la competencia
  useEffect(() => {
    const loadCompetition = async () => {
      try {
        const response = await fetch(`/api/competitions/${competitionId}/`);
        if (response.ok) {
          const data = await response.json();
          setCompetition(data);
        } else {
          toast.error('Error cargando competencia');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompetition();
  }, [competitionId]);

  // Cachear automáticamente al entrar a una competencia (opcional)
  useEffect(() => {
    if (competition && isOnline) {
      const autoCacheCompetition = async () => {
        console.log('Auto-cacheando competencia:', competitionId);
        await cacheCompetition(competitionId);
        setIsCached(true);
      };

      // Cache automático después de 2 segundos
      const timer = setTimeout(autoCacheCompetition, 2000);
      return () => clearTimeout(timer);
    }
  }, [competition, competitionId, cacheCompetition, isOnline]);

  // Verificar si la competencia está cacheada
  useEffect(() => {
    if (cacheStatus) {
      const competitionCached = cacheStatus.cachedUrls.some(url => 
        url.includes(`/competitions/${competitionId}`)
      );
      setIsCached(competitionCached);
    }
  }, [cacheStatus, competitionId]);

  const handleManualCache = async () => {
    if (!isOnline) {
      toast.error('Se requiere conexión para cachear datos');
      return;
    }

    setIsCaching(true);
    try {
      const success = await cacheCompetition(competitionId);
      if (success) {
        setIsCached(true);
        toast.success('Competencia preparada para uso offline');
      } else {
        toast.error('Error cacheando competencia');
      }
    } catch (error) {
      console.error('Error cacheando:', error);
      toast.error('Error cacheando competencia');
    } finally {
      setIsCaching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Cargando competencia...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Competencia no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con información de la competencia */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {competition.name}
            </h1>
            <div className="text-gray-600 dark:text-gray-400">
              <p>📅 {new Date(competition.date).toLocaleDateString('es-ES')}</p>
              <p>📍 {competition.location}</p>
            </div>
          </div>

          {/* Controles de cache */}
          <div className="mt-4 sm:mt-0 flex flex-col items-end space-y-2">
            {/* Estado de conexión */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-600 dark:text-orange-400">Offline</span>
                </>
              )}
            </div>

            {/* Estado de cache */}
            {isCached && (
              <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                <Download className="w-4 h-4" />
                <span>Disponible offline</span>
              </div>
            )}

            {/* Botón de cache manual */}
            {isOnline && (
              <button
                onClick={handleManualCache}
                disabled={isCaching || isCached}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${isCached 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 cursor-default'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                `}
              >
                {isCaching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Cacheando...</span>
                  </>
                ) : isCached ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Cache completo</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Preparar para Offline</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Advertencia offline */}
        {!isOnline && !isCached && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Datos limitados offline
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Esta competencia no está cacheada. Conéctate a internet para cachear todos los datos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal de la competencia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de categorías */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Categorías ({competition.categories?.length || 0})
          </h2>
          <div className="space-y-2">
            {competition.categories?.map((category: any) => (
              <div key={category.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{category.level}</p>
              </div>
            )) || (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No hay categorías disponibles</p>
            )}
          </div>
        </div>

        {/* Panel de participantes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Participantes ({competition.participants?.length || 0})
          </h2>
          <div className="space-y-2">
            {competition.participants?.slice(0, 5).map((participant: any) => (
              <div key={participant.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="font-medium text-gray-900 dark:text-white">{participant.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{participant.horse_name}</p>
              </div>
            )) || (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No hay participantes disponibles</p>
            )}
            {(competition.participants?.length || 0) > 5 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Y {(competition.participants?.length || 0) - 5} más...
              </p>
            )}
          </div>
        </div>

        {/* Panel de jueces */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Jueces ({competition.judges?.length || 0})
          </h2>
          <div className="space-y-2">
            {competition.judges?.map((judge: any) => (
              <div key={judge.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="font-medium text-gray-900 dark:text-white">{judge.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nivel {judge.fei_level} - {judge.country}
                </p>
              </div>
            )) || (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No hay jueces disponibles</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}