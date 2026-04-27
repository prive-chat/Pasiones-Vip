const CACHE_NAME = 'prive-chat-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // No interceptar peticiones a Supabase o cualquier API externa
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api')) {
    return;
  }

  // Manejo de navegación para PWA (SPA fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Estrategia Cache-First para assets estáticos, Network-Only para el resto
  const isStaticAsset = STATIC_ASSETS.some(asset => url.pathname === asset) || 
                        url.pathname.startsWith('/assets/') ||
                        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        });
      }).catch(() => fetch(event.request))
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Pasiones Vip', body: 'Nueva notificación' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientsList) => {
      const url = event.notification.data.url;
      for (const client of clientsList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
