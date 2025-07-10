// frontend/public/sw.js

const CACHE_NAME = 'equestrian-fei-v1';
const OFFLINE_CACHE_NAME = 'offline-v1';
const DATA_CACHE_NAME = 'data-v1';

// Archivos estáticos básicos para cachear
const FILES_TO_CACHE = [
  '/',
  '/manifest.json',
  // No incluir archivos específicos de Next.js build aquí
];

// URLs de API para cachear
const API_URLS = [
  '/api/competitions/',
  '/api/categories/',
  '/api/participants/',
  '/api/judges/',
  '/api/rankings/',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching basic files');
        // Solo cachear archivos que sabemos que existen
        return cache.addAll(['/manifest.json'])
          .catch(error => {
            console.log('[ServiceWorker] Pre-cache failed, continuing anyway:', error);
            return Promise.resolve();
          });
      })
  );
  
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== OFFLINE_CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests de la misma origin
  if (url.origin !== location.origin) {
    return;
  }
  
  // Manejar requests de API del backend
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Manejar requests de páginas
  if (request.destination === 'document') {
    event.respondWith(handlePageRequest(request));
    return;
  }
  
  // Para otros recursos, usar estrategia cache-first
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Cachear CSS, JS y otros assets importantes
        if (response.status === 200 && (
          request.url.includes('.css') || 
          request.url.includes('.js') ||
          request.url.includes('_next/static') ||
          request.destination === 'style' ||
          request.destination === 'script'
        )) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Si es un CSS crítico y falla, retornar CSS básico completo
        if (request.url.includes('.css') || request.destination === 'style') {
          return new Response(`
            /* Reset y base */
            html { 
              background-color: #ffffff !important; 
            }
            body { 
              background-color: #ffffff !important; 
              color: #000000 !important; 
              font-family: system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            * { box-sizing: border-box !important; }
            
            /* Layout básico */
            .container { 
              max-width: 1200px !important; 
              margin: 0 auto !important; 
              padding: 1rem !important; 
            }
            .grid { 
              display: grid !important; 
            }
            .grid-cols-1 { 
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important; 
            }
            .lg\\:grid-cols-3 { 
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important; 
            }
            @media (min-width: 1024px) {
              .lg\\:grid-cols-3 { 
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important; 
              }
              .lg\\:col-span-2 { 
                grid-column: span 2 / span 2 !important; 
              }
            }
            .gap-6 { gap: 1.5rem !important; }
            
            /* Backgrounds */
            .bg-white { background-color: #ffffff !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-blue-50 { background-color: #eff6ff !important; }
            .bg-yellow-50 { background-color: #fefce8 !important; }
            
            /* Borders y shapes */
            .rounded-lg { border-radius: 0.5rem !important; }
            .border { border: 1px solid #e5e7eb !important; }
            .shadow-md { 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; 
            }
            
            /* Spacing */
            .p-6 { padding: 1.5rem !important; }
            .p-4 { padding: 1rem !important; }
            .p-3 { padding: 0.75rem !important; }
            .mb-6 { margin-bottom: 1.5rem !important; }
            .mb-4 { margin-bottom: 1rem !important; }
            .mb-3 { margin-bottom: 0.75rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mt-6 { margin-top: 1.5rem !important; }
            .mt-4 { margin-top: 1rem !important; }
            
            /* Spacing utilities */
            .space-y-4 > * + * { margin-top: 1rem !important; }
            .space-y-3 > * + * { margin-top: 0.75rem !important; }
            .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .space-x-2 > * + * { margin-left: 0.5rem !important; }
            
            /* Flexbox */
            .flex { display: flex !important; }
            .items-center { align-items: center !important; }
            .justify-between { justify-content: space-between !important; }
            .justify-center { justify-content: center !important; }
            .flex-col { flex-direction: column !important; }
            .sm\\:flex-row { flex-direction: column !important; }
            @media (min-width: 640px) {
              .sm\\:flex-row { flex-direction: row !important; }
              .sm\\:items-center { align-items: center !important; }
              .sm\\:justify-between { justify-content: space-between !important; }
            }
            
            /* Typography */
            .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
            .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
            .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
            .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
            .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
            .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
            .font-bold { font-weight: 700 !important; }
            .font-semibold { font-weight: 600 !important; }
            .font-medium { font-weight: 500 !important; }
            .font-mono { font-family: ui-monospace, monospace !important; }
            
            /* Colors */
            .text-gray-900 { color: #111827 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-blue-600 { color: #2563eb !important; }
            .text-blue-800 { color: #1e40af !important; }
            .text-green-600 { color: #16a34a !important; }
            .text-red-600 { color: #dc2626 !important; }
            .text-yellow-600 { color: #ca8a04 !important; }
            .text-yellow-800 { color: #92400e !important; }
            
            /* Input específico - números siempre visibles */
            input[type="number"] { 
              color: #000000 !important;
              background-color: #ffffff !important;
              font-weight: bold !important;
              border: 1px solid #d1d5db !important; 
              padding: 0.5rem !important; 
              border-radius: 0.375rem !important; 
              text-align: center !important; 
            }
            input[type="number"]:disabled { 
              color: #6b7280 !important;
              background-color: #f3f4f6 !important;
            }
            input[type="number"]:focus { 
              border-color: #3b82f6 !important;
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
            }
            .text-yellow-800 input, 
            input.text-yellow-800 { 
              color: #92400e !important;
              background-color: #fefce8 !important;
              border-color: #fbbf24 !important;
            }
            .bg-yellow-50 { 
              background-color: #fefce8 !important; 
            }
            .border-yellow-400 { 
              border-color: #fbbf24 !important; 
            }
            
            /* Utilities */
            .w-5 { width: 1.25rem !important; }
            .h-5 { height: 1.25rem !important; }
            .w-4 { width: 1rem !important; }
            .h-4 { height: 1rem !important; }
            .mr-2 { margin-right: 0.5rem !important; }
            .max-w-4xl { max-width: 56rem !important; }
            .min-h-screen { min-height: 100vh !important; }
            .py-8 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
            .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
          `, {
            status: 200,
            headers: { 'Content-Type': 'text/css' }
          });
        }
        
        // Para otros recursos fallidos
        return new Response('', { status: 503 });
      });
    })
  );
});

// Manejar requests de API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = request.url;
  
  try {
    // Intentar request normal primero (network-first)
    const response = await fetch(request);
    
    // Si es exitoso, cachear para uso offline
    if (response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(cacheKey, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] API fetch failed, trying cache:', url.pathname);
    
    // Si falla, intentar servir desde cache
    const cachedResponse = await caches.match(cacheKey);
    if (cachedResponse) {
      // Agregar header para indicar que es data offline
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From-Cache', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    // Si no hay cache, retornar error offline
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Esta funcionalidad no está disponible sin conexión',
        offline: true
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-From-Cache': 'false'
        },
      }
    );
  }
}

// Manejar requests de páginas
async function handlePageRequest(request) {
  try {
    // Intentar fetch normal primero
    const response = await fetch(request);
    
    // Cachear páginas exitosas
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Page request failed, serving from cache or offline page');
    
    // Intentar servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, crear una página offline básica
    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Sistema FEI</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 1rem;
          }
          .offline-container { 
            text-align: center; 
            padding: 3rem 2rem; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            max-width: 500px;
            width: 100%;
          }
          .offline-icon { 
            font-size: 4rem; 
            margin-bottom: 1.5rem; 
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          h1 { 
            color: #1f2937; 
            margin: 0 0 1rem 0; 
            font-size: 2rem;
            font-weight: 700;
          }
          p { 
            color: #6b7280; 
            margin: 0 0 2rem 0; 
            line-height: 1.6;
            font-size: 1.1rem;
          }
          .button-group {
            display: flex;
            gap: 1rem;
            flex-direction: column;
          }
          button { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.875rem 1.5rem; 
            border-radius: 8px; 
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.2s;
            outline: none;
          }
          button:hover { 
            background: #2563eb; 
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          button:active { 
            transform: translateY(0);
          }
          .secondary-btn {
            background: #6b7280;
          }
          .secondary-btn:hover {
            background: #4b5563;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
          }
          .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #fef3c7;
            color: #92400e;
            border-radius: 6px;
            font-size: 0.875rem;
            margin-top: 1rem;
          }
          .offline-dot {
            width: 8px;
            height: 8px;
            background: #dc2626;
            border-radius: 50%;
            animation: blink 1.5s infinite;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
          @media (min-width: 640px) {
            .button-group {
              flex-direction: row;
            }
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">🌐</div>
          <h1>Sistema FEI</h1>
          <p>Trabajando sin conexión. Los datos se sincronizarán automáticamente cuando vuelva la conexión a internet.</p>
          
          <div class="status-indicator">
            <div class="offline-dot"></div>
            <span>Modo Offline Activo</span>
          </div>
          
          <div class="button-group">
            <button onclick="window.location.reload()">
              🔄 Verificar Conexión
            </button>
            <button class="secondary-btn" onclick="window.history.back()">
              ← Volver Atrás
            </button>
          </div>
        </div>
        
        <script>
          // Auto-verificar conexión cada 10 segundos
          setInterval(() => {
            if (navigator.onLine) {
              window.location.reload();
            }
          }, 10000);
          
          // Escuchar eventos de reconexión
          window.addEventListener('online', () => {
            window.location.reload();
          });
        </script>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'CACHE_COMPETITION':
      cacheCompetitionData(data.competitionId)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('[ServiceWorker] Error caching competition:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'CLEAR_CACHE':
      clearCache()
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('[ServiceWorker] Error clearing cache:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus()
        .then((status) => {
          event.ports[0].postMessage({ success: true, status });
        })
        .catch((error) => {
          console.error('[ServiceWorker] Error getting cache status:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    default:
      console.log('[ServiceWorker] Unknown message type:', data.type);
  }
});

// Cachear datos de competencia específica
async function cacheCompetitionData(competitionId) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const baseUrl = self.location.origin;
  
  // URLs de la API del backend (puerto 8000)
  const apiBaseUrl = 'http://localhost:8000';
  const urlsToCache = [
    `${apiBaseUrl}/api/competitions/${competitionId}/`,
    `${apiBaseUrl}/api/competitions/${competitionId}/categories/`,
    `${apiBaseUrl}/api/competitions/${competitionId}/participants/`,
    `${apiBaseUrl}/api/competitions/${competitionId}/judges/`,
    `${apiBaseUrl}/api/competitions/${competitionId}/rankings/`,
  ];
  
  let successCount = 0;
  
  for (const url of urlsToCache) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
        successCount++;
        console.log(`[ServiceWorker] Cached: ${url}`);
      } else {
        console.log(`[ServiceWorker] Failed to cache ${url}: ${response.status}`);
      }
    } catch (error) {
      console.log(`[ServiceWorker] Error caching ${url}:`, error);
    }
  }
  
  console.log(`[ServiceWorker] Cached ${successCount}/${urlsToCache.length} competition URLs`);
  return successCount > 0;
}

// Limpiar cache
async function clearCache() {
  const cacheNames = [CACHE_NAME, OFFLINE_CACHE_NAME, DATA_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    const deleted = await caches.delete(cacheName);
    console.log(`[ServiceWorker] Cache ${cacheName} deleted:`, deleted);
  }
  
  return true;
}

// Obtener estado del cache
async function getCacheStatus() {
  const allCaches = await caches.keys();
  let totalEntries = 0;
  const cachedUrls = [];
  
  for (const cacheName of allCaches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalEntries += keys.length;
    cachedUrls.push(...keys.map(request => request.url));
  }
  
  return {
    totalEntries,
    cachedUrls,
    lastUpdate: new Date().toISOString(),
    availableCaches: allCaches
  };
}

console.log('[ServiceWorker] Script loaded');