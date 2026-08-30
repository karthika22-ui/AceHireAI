// HasHire AI Web App - Service Worker for Mobile Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_TITLE = "HasHire AI — Today's Preparation";
const DEFAULT_BODY = "Complete your Today Goal and today's scheduled session in HasHire AI.";

// Handle incoming Web Push notifications from push service or scheduled service worker triggers
self.addEventListener('push', (event) => {
  let data = {
    title: DEFAULT_TITLE,
    body: DEFAULT_BODY
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: DEFAULT_TITLE,
        body: event.data.text()
      };
    }
  }

  const options = {
    body: data.body || DEFAULT_BODY,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: 'hashire-ai-test-reminder',
    renotify: true,
    data: {
      url: self.location.origin,
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || DEFAULT_TITLE,
      options
    )
  );
});

// Handle user tapping the notification in the mobile phone notification tray
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' || client.url.includes(self.location.origin)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Handle background message postMessage triggers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_TEST_PUSH') {
    const delayMs = event.data.delayMs || 3000;
    setTimeout(() => {
      self.registration.showNotification(
        event.data.title || DEFAULT_TITLE,
        {
          body: event.data.body || DEFAULT_BODY,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: 'hashire-ai-test-reminder',
          renotify: true,
          data: { url: self.location.origin }
        }
      );
    }, delayMs);
  }
});

