// Imported into the Workbox-generated service worker (see vite.config.js
// `workbox.importScripts`) purely to add push notification support -
// left as plain JS so it works regardless of the PWA build strategy.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'SastiTripsWale', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'SastiTripsWale';
  const options = {
    body: data.body || data.message || '',
    icon: '/pwa/icon-192.png',
    badge: '/pwa/icon-192.png',
    data: data.meta || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow('/') : undefined;
    })
  );
});
