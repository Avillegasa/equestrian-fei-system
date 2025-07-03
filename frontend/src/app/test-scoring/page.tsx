'use client';

import { useState, useEffect } from 'react';

interface APITestResult {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}

export default function TestScoringPage() {
  const [apiTests, setApiTests] = useState<APITestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);

  // Endpoints a probar - ACTUALIZADOS para incluir endpoints públicos
  const endpoints = [
    // Endpoints públicos (sin autenticación)
    { name: 'Sistema General', url: '/api/scoring/test/', requiresAuth: false },
    { name: 'Motor de Cálculo', url: '/api/scoring/test/calculator/', requiresAuth: false },
    { name: 'Parámetros (Demo)', url: '/api/scoring/test/parameters/', requiresAuth: false },
    
    // Endpoints protegidos (requieren autenticación)
    { name: 'Parameters (Auth)', url: '/api/scoring/parameters/', requiresAuth: true },
    { name: 'Scores (Auth)', url: '/api/scoring/scores/', requiresAuth: true },
    { name: 'Evaluations (Auth)', url: '/api/scoring/evaluations/', requiresAuth: true },
    { name: 'Rankings (Auth)', url: '/api/scoring/rankings/', requiresAuth: true },
  ];

  // Función para probar un endpoint
  const testEndpoint = async (endpoint: { name: string; url: string; requiresAuth: boolean }) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const fullURL = `${baseURL}${endpoint.url}`;

    try {
      const response = await fetch(fullURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          endpoint: endpoint.name,
          status: 'success' as const,
          data: data,
        };
      } else if (response.status === 401 && endpoint.requiresAuth) {
        // 401 es esperado para endpoints protegidos
        return {
          endpoint: endpoint.name,
          status: 'success' as const,
          data: { 
            message: '✅ Endpoint protegido funcionando (401 esperado)',
            status: 401,
            note: 'Este endpoint requiere autenticación'
          },
        };
      } else {
        return {
          endpoint: endpoint.name,
          status: 'error' as const,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        endpoint: endpoint.name,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  // Probar todos los endpoints
  const testAllEndpoints = async () => {
    setIsTestingAll(true);
    setApiTests([]);

    for (const endpoint of endpoints) {
      // Mostrar estado de carga
      setApiTests(prev => [...prev, {
        endpoint: endpoint.name,
        status: 'loading'
      }]);

      const result = await testEndpoint(endpoint);
      
      // Actualizar con el resultado
      setApiTests(prev => 
        prev.map(test => 
          test.endpoint === endpoint.name ? result : test
        )
      );

      // Esperar un poco entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsTestingAll(false);
  };

  // Probar automáticamente al cargar
  useEffect(() => {
    testAllEndpoints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'loading': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '⚪';
    }
  };

  // Contar resultados
  const successCount = apiTests.filter(test => test.status === 'success').length;
  const errorCount = apiTests.filter(test => test.status === 'error').length;
  const totalTests = apiTests.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Pruebas de Integración - Fase 4
          </h1>
          <p className="text-lg text-gray-600">
            Verificación de comunicación entre Frontend y Backend
          </p>
        </div>

        {/* Resumen de resultados */}
        {totalTests > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Resumen de Pruebas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">Con Errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            
            {successCount === totalTests && totalTests > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium text-center">
                  🎉 ¡Todas las pruebas pasaron exitosamente!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Información del sistema */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            ℹ️ Configuración del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Frontend URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'localhost:3000'}
            </div>
            <div>
              <strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
            </div>
          </div>
        </div>

        {/* Botón de prueba */}
        <div className="mb-8">
          <button
            onClick={testAllEndpoints}
            disabled={isTestingAll}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isTestingAll
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isTestingAll ? '🔄 Probando...' : '🔄 Probar Nuevamente'}
          </button>
        </div>

        {/* Resultados de las pruebas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📊 Resultados de Pruebas API
          </h2>

          {apiTests.map((test, index) => (
            <div key={index} className="bg-white rounded-lg border shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {getStatusIcon(test.status)} {test.endpoint}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(test.status)}`}>
                    {test.status.toUpperCase()}
                  </span>
                </div>

                {test.status === 'loading' && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Probando endpoint...
                  </div>
                )}

                {test.status === 'success' && (
                  <div>
                    <p className="text-green-600 mb-2">✅ Conexión exitosa</p>
                    {test.data && (
                      <details className="bg-gray-50 rounded p-3">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          Ver respuesta JSON
                        </summary>
                        <pre className="mt-2 text-xs text-gray-800 overflow-auto max-h-64">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {test.status === 'error' && (
                  <div>
                    <p className="text-red-600 mb-2">❌ Error de conexión</p>
                    <div className="bg-red-50 rounded p-3">
                      <code className="text-sm text-red-800">
                        {test.error}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Diagnóstico mejorado */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 Diagnóstico
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>Endpoints públicos:</strong> Deben mostrar ✅ - No requieren autenticación</p>
            <p>• <strong>Endpoints (Auth):</strong> ✅ con 401 es correcto - Requieren login</p>
            <p>• <strong>Si hay errores CORS:</strong> Verificar configuración de Django CORS</p>
            <p>• <strong>Si hay errores 404:</strong> Verificar que los endpoints públicos estén agregados</p>
            <p>• <strong>Si "Motor de Cálculo" es ✅:</strong> El sistema FEI funciona correctamente</p>
          </div>
        </div>

        {/* Enlaces útiles */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-4">
            🔗 Enlaces de Prueba Directa
          </h2>
          <div className="space-y-2">
            {endpoints.filter(e => !e.requiresAuth).map((endpoint, index) => {
              const fullURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${endpoint.url}`;
              return (
                <div key={index}>
                  <a
                    href={fullURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {endpoint.name}: {fullURL}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}