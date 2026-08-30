// HasHire AI Web App - Service Worker for Mobile Web Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications from push service or scheduled service worker triggers
self.addEventListener('push', (event) => {
  let data = {
    title: "🔔 HasHire AI — Today's Learning Reminder",
    body: "🎯 Complete your Today's Goal and today's session."
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "🔔 HasHire AI — Today's Learning Reminder",
        body: event.data.text()
      };
    }
  }

  const options = {
    body: data.body || "🎯 Complete your Today's Goal and today's session.",
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
      data.title || "🔔 HasHire AI — Today's Learning Reminder",
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
    const delayMs = event.data.delayMs || 4000;
    setTimeout(() => {
      self.registration.showNotification(
        event.data.title || "🔔 HasHire AI — Today's Learning Reminder",
        {
          body: event.data.body || "🎯 Complete your Today's Goal and today's session.",
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
