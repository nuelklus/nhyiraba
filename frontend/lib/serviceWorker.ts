export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service worker is not supported in this browser');
    return;
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  if (process.env.NODE_ENV !== 'production' || isLocalhost) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      return Promise.all(registrations.map((registration) => registration.unregister()));
    }).catch((error) => {
      console.error('[SW] Failed to unregister service worker during local development:', error);
    });
    console.log('[SW] Skipping service worker registration in local development');
    return;
  }

  console.log('[SW] Service worker is supported');

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    console.log('[SW] Attempting to register service worker at:', swUrl);

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] Service worker registered successfully:', registration.scope);
        console.log('[SW] Registration:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New service worker available');
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Update Available', {
                    body: 'A new version is available. Refresh to update.',
                    icon: '/images/ASDLogo.png'
                  });
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error);
        console.error('[SW] Error details:', error.message, error.stack);
      });
  });
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('[SW] Service worker unregistered');
      })
      .catch((error) => {
        console.error('[SW] Service worker unregistration failed:', error);
      });
  }
}

export async function clearCache() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      registration.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }
  
  return { success: false };
}

export async function getCacheSize() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        const sizeInBytes = event.data.size;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        resolve({ size: sizeInBytes, sizeInMB });
      };
      
      registration.active?.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }
  
  return { size: 0, sizeInMB: '0.00' };
}

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('[SW] Notification permission granted');
      }
    });
  }
}
