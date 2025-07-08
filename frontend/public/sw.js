
const CACHE_NAME = 'equestrian-fei-v1';
const OFFLINE_CACHE_NAME = 'offline-v1';
const DATA_CACHE_NAME = 'data-v1';

// Archivos estáticos para cachear
const FILES_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  // Agregar más archivos según sea necesario
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
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
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
  
  // Manejar requests de API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Manejar requests de archivos estáticos
  if (request.destination === 'document') {
    event.respondWith(handlePageRequest(request));
    return;
  }
  
  // Manejar otros recursos
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Manejar requests de API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = getCacheKey(request);
  
  try {
    // Intentar request normal
    const response = await fetch(request);
    
    // Si es exitoso, cachear para uso offline
    if (response.status === 200) {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(cacheKey, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Fetch failed, serving from cache:', error);
    
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
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Manejar requests de páginas
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cachear páginas exitosas
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Page request failed, serving from cache');
    
    // Intentar servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, mostrar página offline
    return caches.match('/offline');
  }
}

// Generar clave de cache para requests
function getCacheKey(request) {
  const url = new URL(request.url);
  
  // Para GET requests, usar la URL completa
  if (request.method === 'GET') {
    return request.url;
  }
  
  // Para otros métodos, usar solo el pathname
  return url.pathname;
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
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'CLEAR_CACHE':
      clearCache()
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus()
        .then((status) => {
          event.ports[0].postMessage({ success: true, status });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
  }
});

// Cachear datos de competencia específica
async function cacheCompetitionData(competitionId) {
  const cache = await caches.open(DATA_CACHE_NAME);
  const urlsToCache = [
    `/api/competitions/${competitionId}/`,
    `/api/competitions/${competitionId}/categories/`,
    `/api/competitions/${competitionId}/participants/`,
    `/api/competitions/${competitionId}/judges/`,
    `/api/competitions/${competitionId}/rankings/`,
  ];
  
  for (const url of urlsToCache) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response.clone());
      }
    } catch (error) {
      console.log(`[ServiceWorker] Failed to cache ${url}:`, error);
    }
  }
}

// Limpiar cache
async function clearCache() {
  const cacheNames = [CACHE_NAME, OFFLINE_CACHE_NAME, DATA_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
  }
}

// Obtener estado del cache
async function getCacheStatus() {
  const cache = await caches.open(DATA_CACHE_NAME);
  const keys = await cache.keys();
  
  return {
    totalEntries: keys.length,
    cachedUrls: keys.map(request => request.url),
    lastUpdate: new Date().toISOString(),
  };
}