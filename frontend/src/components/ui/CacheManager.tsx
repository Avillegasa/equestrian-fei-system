'use client';

// frontend/src/components/ui/CacheManager.tsx - PROGRESO SUPER LENTO Y VISIBLE

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'react-hot-toast';

interface CacheItem {
  type: string;
  count: number;
  lastCached: string;
}

interface CacheProgress {
  isLoading: boolean;
  progress: number;
  currentStep: string;
  total: number;
}

export function CacheManager() {
  const { isOnline } = useOffline();
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [cacheProgress, setCacheProgress] = useState<CacheProgress>({
    isLoading: false,
    progress: 0,
    currentStep: '',
    total: 0
  });

  // Datos ficticios
  const competitionData = {
    competitions: [
      { id: 1, name: 'Campeonato Nacional FEI', date: '2025-08-15' },
      { id: 2, name: 'Copa Internacional', date: '2025-09-20' },
      { id: 3, name: 'Torneo Regional', date: '2025-10-10' }
    ],
    participants: [
      { id: 1, name: 'Ana García', horse: 'Thunder' },
      { id: 2, name: 'Carlos López', horse: 'Estrella' },
      { id: 3, name: 'María Rodríguez', horse: 'Rayo' },
      { id: 4, name: 'Diego Mamani', horse: 'Cóndor' },
      { id: 5, name: 'Laura Sánchez', horse: 'Viento' }
    ],
    judges: [
      { id: 1, name: 'Dr. Roberto Fernández', level: 'FEI 5*' },
      { id: 2, name: 'Ing. Patricia Morales', level: 'FEI 4*' },
      { id: 3, name: 'Lic. Juan Pérez', level: 'Nacional' }
    ],
    categories: [
      { id: 1, name: 'Preliminar', level: 'Básico' },
      { id: 2, name: 'Intermedio I', level: 'Intermedio' },
      { id: 3, name: 'Gran Premio', level: 'Avanzado' },
      { id: 4, name: 'Young Riders', level: 'Juvenil' }
    ],
    venues: [
      { id: 1, name: 'Club Hípico La Paz' },
      { id: 2, name: 'Centro Ecuestre Santa Cruz' },
      { id: 3, name: 'Hipódromo Cochabamba' }
    ]
  };

  const loadCacheStatus = () => {
    const cachedItems: CacheItem[] = [];
    const types = [
      { key: 'competitions', name: 'Competencias' },
      { key: 'participants', name: 'Participantes' },
      { key: 'judges', name: 'Jueces' },
      { key: 'categories', name: 'Categorías' },
      { key: 'venues', name: 'Sedes' }
    ];

    types.forEach(type => {
      const cached = localStorage.getItem(`fei_cache_${type.key}`);
      if (cached) {
        try {
          const parsedData = JSON.parse(cached);
          cachedItems.push({
            type: type.name,
            count: parsedData.data.length,
            lastCached: new Date(parsedData.timestamp).toLocaleString()
          });
        } catch (error) {
          // Ignorar errores
        }
      }
    });

    setCacheItems(cachedItems);
  };

  useEffect(() => {
    loadCacheStatus();
  }, []);

  const cacheCompetitionData = async () => {
    if (!isOnline) {
      toast.error('Necesitas estar online para preparar datos offline');
      return;
    }

    const steps = [
      { key: 'competitions', name: 'Competencias', data: competitionData.competitions },
      { key: 'participants', name: 'Participantes', data: competitionData.participants },
      { key: 'judges', name: 'Jueces', data: competitionData.judges },
      { key: 'categories', name: 'Categorías', data: competitionData.categories },
      { key: 'venues', name: 'Sedes', data: competitionData.venues }
    ];

    // INICIAR PROGRESO INMEDIATAMENTE
    setCacheProgress({
      isLoading: true,
      progress: 0,
      currentStep: '🚀 Iniciando preparación para offline...',
      total: steps.length
    });

    console.log('🔵 INICIANDO CACHE - Deberías ver la barra azul ahora');

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // ACTUALIZAR PROGRESO ANTES DEL DELAY
        setCacheProgress(prev => ({
          ...prev,
          progress: i,
          currentStep: `📦 Cacheando ${step.name}... (${i + 1}/${steps.length})`
        }));

        console.log(`🔵 PASO ${i + 1}: Cacheando ${step.name} - Progreso: ${i}/${steps.length}`);

        // DELAY SÚPER LARGO para que sea visible
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos por paso

        // Guardar en localStorage
        localStorage.setItem(`fei_cache_${step.key}`, JSON.stringify({
          data: step.data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }));

        console.log(`✅ COMPLETADO: ${step.name}`);
      }

      // PROGRESO COMPLETADO
      setCacheProgress(prev => ({
        ...prev,
        progress: steps.length,
        currentStep: '🎉 ¡Cache completado exitosamente!'
      }));

      console.log('🔵 CACHE COMPLETADO - Barra debe mostrar 100%');

      // Actualizar items
      const newItems: CacheItem[] = steps.map(step => ({
        type: step.name,
        count: step.data.length,
        lastCached: new Date().toLocaleString()
      }));
      setCacheItems(newItems);

      // ESPERAR ANTES DE LIMPIAR
      setTimeout(() => {
        setCacheProgress({
          isLoading: false,
          progress: 0,
          currentStep: '',
          total: 0
        });
        
        toast.success('🌐 Datos preparados para offline');
        console.log('🔵 PROGRESO LIMPIADO');
      }, 2000); // Esperar 2 segundos más

    } catch (error) {
      console.error('Error cacheando datos:', error);
      setCacheProgress({
        isLoading: false,
        progress: 0,
        currentStep: '',
        total: 0
      });
      toast.error('Error preparando datos offline');
    }
  };

  const clearCache = () => {
    const keys = ['competitions', 'participants', 'judges', 'categories', 'venues'];
    keys.forEach(key => localStorage.removeItem(`fei_cache_${key}`));
    setCacheItems([]);
    toast.success('Cache limpiado');
  };

  const testOfflineData = () => {
    const keys = ['competitions', 'participants', 'judges', 'categories', 'venues'];
    const availableData = keys.filter(key => localStorage.getItem(`fei_cache_${key}`) !== null);

    if (availableData.length === keys.length) {
      toast.success(`✅ ${availableData.length} tipos de datos disponibles offline`);
      console.log('📊 Datos cacheados disponibles:', availableData);
    } else {
      toast.warning(`⚠️ Solo ${availableData.length}/${keys.length} tipos disponibles`);
    }
  };

  const totalCachedItems = cacheItems.reduce((total, item) => total + item.count, 0);
  const progressPercentage = cacheProgress.total > 0 ? (cacheProgress.progress / cacheProgress.total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🌐 Cache de Competencias</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* BOTÓN PRINCIPAL */}
      <div className="mb-6">
        <button
          onClick={cacheCompetitionData}
          disabled={!isOnline || cacheProgress.isLoading}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cacheProgress.isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Preparando para offline... ({Math.round(progressPercentage)}%)</span>
            </div>
          ) : (
            '🌐 Preparar para Offline (15 segundos)'
          )}
        </button>
      </div>

      {/* BARRA DE PROGRESO SÚPER VISIBLE */}
      {cacheProgress.isLoading && (
        <div className="mb-6 p-6 bg-blue-100 border-4 border-blue-300 rounded-xl shadow-lg">
          <div className="text-center mb-4">
            <h4 className="text-xl font-bold text-blue-900 mb-2">
              🚀 Preparando Datos para Offline
            </h4>
            <p className="text-blue-800 font-medium text-lg">
              {cacheProgress.currentStep}
            </p>
          </div>
          
          {/* BARRA DE PROGRESO GIGANTE */}
          <div className="w-full bg-blue-300 rounded-full h-8 mb-4 border-2 border-blue-400 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* ANIMACIÓN DE BRILLO */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
              
              {/* TEXTO DE PORCENTAJE */}
              {progressPercentage > 20 && (
                <span className="text-white font-bold text-sm relative z-10">
                  {Math.round(progressPercentage)}%
                </span>
              )}
            </div>
          </div>
          
          {/* INFORMACIÓN ADICIONAL */}
          <div className="flex justify-between items-center text-blue-800">
            <span className="font-semibold">
              Progreso: {cacheProgress.progress} / {cacheProgress.total}
            </span>
            <span className="text-2xl font-bold">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      )}

      {/* Estado del cache */}
      {cacheItems.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            📦 Datos Cacheados ({totalCachedItems} elementos)
          </h4>
          <div className="space-y-2">
            {cacheItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-green-900">{item.type}</span>
                  <span className="text-xs text-green-700 ml-2 bg-green-100 px-2 py-1 rounded">
                    {item.count} elementos
                  </span>
                </div>
                <span className="text-xs text-green-600">{item.lastCached}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={testOfflineData}
          className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors font-medium"
        >
          🧪 Test Datos Offline
        </button>
        <button
          onClick={clearCache}
          disabled={cacheItems.length === 0}
          className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          🗑️ Limpiar Cache
        </button>
      </div>

      {/* Instrucciones */}
      <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 font-bold mb-2">
          ⚠️ AHORA LA BARRA AZUL DURA 15 SEGUNDOS
        </p>
        <p className="text-xs text-yellow-700">
          Presiona "Preparar para Offline" y deberías ver una barra azul gigante que avanza lentamente durante 15 segundos (3 segundos por paso × 5 pasos).
        </p>
      </div>
    </div>
  );
}