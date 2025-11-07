const CACHE_NAME = 'kopi-makmur-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/demo-data.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Pemberitahuan baru dari Kopi Toko Makmur',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Buka Aplikasi',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kopi Toko Makmur', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync attendance data when online
async function syncAttendanceData() {
  try {
    // This would sync offline data to server when connection is available
    // For now, just update local storage
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      console.log('Syncing offline data:', offlineData);
      // Process offline data here
      clearOfflineData();
    }
  } catch (error) {
    console.error('Error syncing attendance data:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData() {
  return new Promise((resolve) => {
    // Get data from IndexedDB or localStorage
    const data = localStorage.getItem('offline_attendance_data');
    resolve(data ? JSON.parse(data) : []);
  });
}

async function clearOfflineData() {
  return new Promise((resolve) => {
    localStorage.removeItem('offline_attendance_data');
    resolve();
  });
}

// Periodic background sync (for push notifications)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'attendance-reminder') {
    event.waitUntil(
      sendAttendanceReminders()
    );
  }
});

async function sendAttendanceReminders() {
  // Send push notification for attendance reminders
  const now = new Date();
  const currentHour = now.getHours();
  
  // Send reminder at 8 AM and 5 PM
  if (currentHour === 8 || currentHour === 17) {
    const registration = await self.registration;
    await registration.showNotification('Pengingat Absen', {
      body: 'Waktu absen telah tiba! Buka aplikasi untuk mencatat kehadiran.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'clock-in',
          title: 'Absen Sekarang',
          icon: '/icons/clockin-96x96.png'
        }
      ]
    });
  }
}