const CACHE_NAME = 'jflix-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo.svg',
  '/images/logo/logo-192x192.png',
  '/images/logo/logo-512x512.png',
  '/css/account.css',
  '/css/auth.css',
  '/css/card-fix.css',
  '/css/common.css',
  '/css/details.css',
  '/css/donation-modal.css',
  '/css/home.css',
  '/css/homepage.css',
  '/css/install-modal.css',
  '/css/legal.css',
  '/css/loading.css',
  '/css/movie-categories.css',
  '/css/original-style.css',
  '/css/player.css',
  '/css/popup-trailer.css',
  '/css/premium-banner.css',
  '/css/responsive.css',
  '/css/search-results.css',
  '/js/anime.js',
  '/js/auth.js',
  '/js/cartoon.js',
  '/js/common.js',
  '/js/details.js',
  '/js/home.js',
  '/js/homepage.js',
  '/js/install-modal.js',
  '/js/korean.js',
  '/js/movies.js',
  '/js/navbar.js',
  '/js/player.js',
  '/js/premium-banner.js',
  '/js/tvshows.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

const adBlockList = [
  'antiadblocksystems.com',
  'd3cod80thn7qnd.cloudfront.net',
  'doubleclick.net',
  'googlesyndication.com',
  'google-analytics.com',
  'adnxs.com',
  'adzerk.net',
  'criteo.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net'
];

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (adBlockList.some(domain => requestUrl.hostname.includes(domain))) {
    console.log('Blocked ad request to:', requestUrl.hostname);
    event.respondWith(new Response(null, {
      status: 204,
      statusText: 'No Content'
    }));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});

// Push Notification Event Listener
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'images/logo/logo-192x192.png'
  });
});

// Notification Click Event Listener
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://jflix.pages.dev')
  );
});

// Background Sync Event Listener
self.addEventListener('sync', event => {
  if (event.tag === 'my-sync-tag') {
    event.waitUntil(console.log('Background sync successful!'));
  }
});

// Periodic Sync Event Listener
self.addEventListener('periodicsync', event => {
  if (event.tag === 'my-periodic-sync-tag') {
    event.waitUntil(console.log('Periodic sync successful!'));
  }
});
