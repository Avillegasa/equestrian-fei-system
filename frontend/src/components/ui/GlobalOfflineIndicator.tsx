'use client';

// frontend/src/components/ui/GlobalOfflineIndicator.tsx

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';

export function GlobalOfflineIndicator() {
  const { isOnline, pendingActions, lastSyncTime, isServiceWorkerReady } = useOffline();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastToggle, setLastToggle] = useState<Date | null>(null);

  // Detectar cambios de conectividad para mostrar temporalmente
  useEffect(() => {
    setLastToggle(new Date());
    
    // Auto-expandir por 3 segundos cuando cambia la conectividad
    setIsExpanded(true);
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOnline]);

  // Estado visual del indicador
  const getStatus = () => {
    if (!isOnline) return {
      color: 'bg-red-500',
      icon: '📵',
      text: 'Offline',
      details: 'Trabajando sin conexión'
    };
    
    if (pendingActions.length > 0) return {
      color: 'bg-yellow-500',
      icon: '🔄',
      text: 'Sincronizando',
      details: `${pendingActions.length} acciones pendientes`
    };
    
    return {
      color: 'bg-green-500',
      icon: '🌐',
      text: 'Online',
      details: 'Todo sincronizado'
    };
  };

  const status = getStatus();

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-auto'
    }`}>
      
      {/* Indicador principal */}
      <div 
        className={`
          flex items-center justify-between p-3 rounded-lg shadow-lg backdrop-blur-sm border-2 cursor-pointer
          ${status.color} border-white/30 text-white hover:shadow-xl transition-all duration-200
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{status.icon}</span>
          <div>
            <div className="font-semibold text-sm">{status.text}</div>
            {isExpanded && (
              <div className="text-xs opacity-90">{status.details}</div>
            )}
          </div>
        </div>
        
        {/* Indicador de acciones pendientes */}
        {pendingActions.length > 0 && (
          <div className="bg-white/30 px-2 py-1 rounded-full text-xs font-bold">
            {pendingActions.length}
          </div>
        )}
        
        {/* Flecha de expansión */}
        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ⌄
        </div>
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="bg-white/95 backdrop-blur-sm border-2 border-t-0 border-gray-200 rounded-b-lg shadow-lg p-4">
          
          {/* Estado detallado */}
          <div className="space-y-3">
            
            {/* Conectividad */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Conectividad:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <span className="text-sm text-gray-600">{status.text}</span>
              </div>
            </div>
            
            {/* Service Worker */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Service Worker:</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isServiceWorkerReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isServiceWorkerReady ? 'Activo' : 'Cargando'}
                </span>
              </div>
            </div>
            
            {/* Acciones pendientes */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pendientes:</span>
              <span className="text-sm text-gray-600">{pendingActions.length} acciones</span>
            </div>
            
            {/* Última sincronización */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Última sync:</span>
              <span className="text-xs text-gray-500">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Nunca'}
              </span>
            </div>
            
            {/* Separador */}
            <div className="border-t border-gray-200 pt-3">
              
              {/* Información del sistema */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>📍 Página actual: {typeof window !== 'undefined' ? window.location.pathname : '/'}</div>
                <div>🕐 Último cambio: {lastToggle ? lastToggle.toLocaleTimeString() : 'N/A'}</div>
                <div>🔧 Estado: {isOnline ? 'Completamente funcional' : 'Modo offline activo'}</div>
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Navegar a página de test
                  if (typeof window !== 'undefined') {
                    window.location.href = '/test-scoring';
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                🧪 Test Página
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}