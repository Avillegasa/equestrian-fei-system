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
        // Si es un CSS crítico y falla, retornar CSS básico
        if (request.url.includes('.css') || request.destination === 'style') {
          return new Response(`
            html { 
              background-color: #f8fafc !important; 
            }
            body { 
              background-color: #f8fafc !important; 
              color: #1e293b !important; 
              font-family: system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @media (prefers-color-scheme: dark) {
              html { 
                background-color: #0f172a !important; 
              }
              body { 
                background-color: #0f172a !important; 
                color: #f1f5f9 !important; 
              }
            }
            * { box-sizing: border-box !important; }
            .container { 
              max-width: 1200px !important; 
              margin: 0 auto !important; 
              padding: 1rem !important; 
            }
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