'use client';

// frontend/src/app/test-navigation/page.tsx

import React, { useState, useEffect } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { ConnectivityToasts } from '@/components/ui/ConnectivityToasts';
import Link from 'next/link';

export default function TestNavigationPage() {
  const { isOnline, pendingActions, lastSyncTime } = useOffline();
  const [isHydrated, setIsHydrated] = useState(false);
  const [pageLoadTime] = useState(new Date());
  const [testActions, setTestActions] = useState<string[]>([]);

  useEffect(() => {
    setIsHydrated(true);
    addTestAction('🏁 Página de navegación cargada');
  }, []);

  const addTestAction = (action: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestActions(prev => [...prev, `${timestamp}: ${action}`]);
  };

  // Función para simular acción offline
  const simulateOfflineAction = async () => {
    addTestAction('🧪 Simulando acción mientras ' + (isOnline ? 'online' : 'offline'));
    
    // Simular una acción que va al hook offline
    try {
      const fakeData = {
        type: 'test_action',
        data: {
          page: 'navigation',
          timestamp: new Date().toISOString(),
          action: 'simulation'
        }
      };
      
      // Agregar al localStorage para simular acción pendiente
      if (!isOnline) {
        const existing = JSON.parse(localStorage.getItem('pendingActions') || '[]');
        existing.push({
          id: `nav-test-${Date.now()}`,
          type: 'score_update',
          data: {
            participant_id: 'nav_test',
            judge_id: 'nav_judge',
            scores: { test: { value: Math.random() * 10, timestamp: new Date().toISOString() } }
          },
          timestamp: new Date(),
          retryCount: 0
        });
        localStorage.setItem('pendingActions', JSON.stringify(existing));
        addTestAction('💾 Acción agregada a cola offline');
      } else {
        addTestAction('✅ Acción ejecutada directamente online');
      }
    } catch (error) {
      addTestAction('❌ Error en simulación');
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Test de Navegación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            🧭 Test de Navegación y Estado Global
            <span className={`ml-3 px-2 py-1 text-sm rounded-full ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </h1>
          <p className="text-gray-600 mt-1">
            Verificando que el estado offline persiste al navegar entre páginas
          </p>
        </div>

        {/* Progreso del testing */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Progreso del Testing:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800">Paso 6: Calificaciones</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800">Paso 7: Sincronización</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-green-800">Paso 8: Cache</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🔄</span>
              <span className="text-blue-800">Paso 9: Indicadores</span>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Panel de estado */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Estado Global del Sistema</h3>
            
            <div className="space-y-4">
              
              {/* Conectividad */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Conectividad:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'En línea' : 'Offline'}
                  </span>
                </div>
              </div>
              
              {/* Acciones pendientes */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Acciones Pendientes:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${
                    pendingActions.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-gray-600">{pendingActions.length} en cola</span>
                </div>
              </div>
              
              {/* Información de página */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Página Actual:</span>
                <span className="text-gray-600 font-mono">/test-navigation</span>
              </div>
              
              {/* Tiempo de carga */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Cargada a las:</span>
                <span className="text-gray-600">{pageLoadTime.toLocaleTimeString()}</span>
              </div>
              
              {/* Última sincronización */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Última Sync:</span>
                <span className="text-gray-600">
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Nunca'}
                </span>
              </div>
            </div>
          </div>

          {/* Panel de testing */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Testing de Estado</h3>
            
            {/* Botones de prueba */}
            <div className="space-y-3 mb-4">
              <button
                onClick={simulateOfflineAction}
                className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                🎭 Simular Acción de Test
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/test-scoring"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-center hover:bg-blue-200 transition-colors"
                >
                  ⬅️ Volver a Test
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 bg-green-100 text-green-700 rounded text-center hover:bg-green-200 transition-colors"
                >
                  🏠 Ir a Inicio
                </Link>
              </div>
            </div>
            
            {/* Log de acciones */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-2">📝 Log de Acciones:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {testActions.map((action, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Instrucciones del Paso 9 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-semibold text-purple-900 mb-3">🎯 Paso 9: Testing de Indicadores en Tiempo Real</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Instrucciones */}
            <div>
              <p className="text-sm text-purple-800 mb-3"><strong>📋 Instrucciones de prueba:</strong></p>
              <ol className="text-sm text-purple-700 space-y-2 list-decimal list-inside">
                <li>Observa el <strong>indicador flotante</strong> en la esquina inferior derecha</li>
                <li>Haz clic en el indicador para expandir el panel detallado</li>
                <li>Ve offline en DevTools y observa el cambio automático</li>
                <li>Navega entre páginas y verifica que el estado persiste</li>
                <li>Simula acciones en esta página y observa los cambios</li>
                <li>Vuelve online y verifica la sincronización automática</li>
              </ol>
            </div>
            
            {/* Objetivos */}
            <div>
              <p className="text-sm text-purple-800 mb-3"><strong>✅ Objetivos:</strong></p>
              <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                <li>Indicador flotante funciona en todas las páginas</li>
                <li>Estado offline persiste al navegar</li>
                <li>Cambios de conectividad se detectan en tiempo real</li>
                <li>Panel expandido muestra información detallada</li>
                <li>Toasts aparecen correctamente en cada página</li>
                <li>Navegación no afecta el estado offline</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toasts de conectividad */}
        <ConnectivityToasts />
      </div>
    </div>
  );
}