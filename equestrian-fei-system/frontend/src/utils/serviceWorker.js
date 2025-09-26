/**
 * Utilidades para registro y manejo del Service Worker
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'Esta aplicación web está siendo servida desde cache por un service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      console.log('Service Worker registrado exitosamente');

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible. Se aplicará al recargar.');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Contenido cacheado para uso offline.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };

      // Configurar listener para mensajes del SW
      setupMessageListener();

      // Registrar para background sync
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        console.log('Background sync soportado');
      }

      // Configurar notificaciones push si están disponibles
      if ('PushManager' in window) {
        console.log('Push notifications soportadas');
      }
    })
    .catch(error => {
      console.error('Error registrando Service Worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then(response => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Sin conexión a internet. App ejecutándose en modo offline.');
    });
}

function setupMessageListener() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Mensaje del Service Worker:', event.data);

      if (event.data.type === 'BACKGROUND_SYNC_REQUEST') {
        // Disparar sincronización offline
        window.dispatchEvent(new CustomEvent('sw-sync-request', {
          detail: { timestamp: event.data.timestamp }
        }));
      }
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

/**
 * Solicitar background sync
 */
export function requestBackgroundSync(tag = 'background-sync') {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register(tag);
    }).catch(error => {
      console.error('Error registrando background sync:', error);
    });
  }
}

/**
 * Limpiar todos los caches
 */
export function clearAllCaches() {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error('Error limpiando caches'));
          }
        };

        if (registration.active) {
          registration.active.postMessage(
            { type: 'CACHE_CLEAR' },
            [messageChannel.port2]
          );
        }
      });
    } else {
      reject(new Error('Service Worker no disponible'));
    }
  });
}

/**
 * Obtener estado de los caches
 */
export function getCacheStatus() {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };

        if (registration.active) {
          registration.active.postMessage(
            { type: 'CACHE_STATUS' },
            [messageChannel.port2]
          );
        }
      });
    } else {
      reject(new Error('Service Worker no disponible'));
    }
  });
}

/**
 * Forzar actualización del Service Worker
 */
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      } else {
        registration.update();
      }
    });
  }
}