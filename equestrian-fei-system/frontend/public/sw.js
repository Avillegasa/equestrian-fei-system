/**
 * Service Worker para funcionalidad offline
 * Maneja cache de recursos y sincronización en background
 */

const CACHE_NAME = 'fei-system-v2';
const API_CACHE_NAME = 'fei-api-v2';

// Recursos críticos que siempre deben estar en cache
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// APIs que se pueden cachear
const CACHEABLE_APIs = [
  '/api/competitions/',
  '/api/scoring/parameters/',
  '/api/users/profile/',
  '/api/scoring/evaluations/'
];

// Tiempo de vida del cache (en milisegundos)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto, agregando recursos críticos');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activando...');

  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediato de todas las páginas
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET - dejar que el navegador las maneje normalmente
  if (request.method !== 'GET') {
    // NO interceptar POST, PUT, DELETE, etc. - dejar pasar al navegador
    return;
  }

  // Manejar requests de API (solo GET)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Manejar recursos estáticos (solo GET)
  event.respondWith(handleStaticRequest(request));
});

/**
 * Manejar requests de API con estrategia cache-first para datos no críticos
 * y network-first para datos críticos
 */
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_APIs.some(api => url.pathname.startsWith(api));

  if (!isCacheable) {
    // Para APIs no cacheables, intentar red primero
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch (error) {
      console.log('Error en red para API no cacheable:', error);
      // Retornar respuesta offline básica
      return new Response(JSON.stringify({
        error: 'Sin conexión',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Para APIs cacheables, usar estrategia stale-while-revalidate
  const cache = await caches.open(API_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Intentar obtener respuesta fresca de la red
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      // Cachear respuesta exitosa con timestamp
      const responseToCache = networkResponse.clone();
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          'sw-cached-at': Date.now().toString()
        }
      });

      cache.put(request, responseWithTimestamp);
      return networkResponse;
    }
    throw new Error('Network response not ok');
  }).catch((error) => {
    console.log('Error de red para API:', error);
    return null;
  });

  // Si hay respuesta en cache y no está expirada, usarla
  if (cachedResponse) {
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    const isExpired = cachedAt && (Date.now() - parseInt(cachedAt)) > CACHE_EXPIRY;

    if (!isExpired) {
      // Retornar cache y actualizar en background
      networkPromise.catch(() => {}); // Ignorar errores del background update
      return cachedResponse;
    }
  }

  // Intentar red primero, fallback a cache
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Fallback a cache aunque esté expirado
  if (cachedResponse) {
    console.log('Usando cache expirado como fallback');
    return cachedResponse;
  }

  // Sin cache ni red disponible
  return new Response(JSON.stringify({
    error: 'No hay datos disponibles offline',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Manejar requests de recursos estáticos con estrategia cache-first
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cachear recursos exitosos
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Error obteniendo recurso:', error);

    // Para navegación, retornar página principal
    if (request.mode === 'navigate') {
      const mainPage = await cache.match('/');
      if (mainPage) {
        return mainPage;
      }
    }

    // Respuesta offline básica
    return new Response('Recurso no disponible offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Manejar sincronización en background
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

/**
 * Realizar sincronización en background
 */
async function performBackgroundSync() {
  try {
    console.log('Iniciando sincronización en background...');

    // Enviar mensaje a todas las ventanas abiertas para que inicien sync
    const clients = await self.clients.matchAll();

    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_REQUEST',
        timestamp: Date.now()
      });
    });

    console.log('Sincronización en background completada');
  } catch (error) {
    console.error('Error en sincronización en background:', error);
  }
}

/**
 * Manejar notificaciones push
 */
self.addEventListener('push', (event) => {
  console.log('Push event recibido');

  let notificationData = {
    title: 'Equestrian FEI System',
    body: 'Nueva actualización disponible',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'fei-notification'
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.log('Error parseando datos push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir aplicación'
        },
        {
          action: 'dismiss',
          title: 'Descartar'
        }
      ]
    })
  );
});

/**
 * Manejar clicks en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

/**
 * Manejar mensajes desde la aplicación
 */
self.addEventListener('message', (event) => {
  console.log('SW recibió mensaje:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_CLEAR') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'CACHE_STATUS') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        const promises = cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          return {
            name: cacheName,
            size: keys.length
          };
        });

        return Promise.all(promises);
      }).then((cacheInfo) => {
        event.ports[0].postMessage({
          caches: cacheInfo,
          isOnline: navigator.onLine
        });
      })
    );
  }
});

console.log('Service Worker cargado correctamente');