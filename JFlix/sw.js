const CACHE_NAME = 'jflix-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/animations.css',
  '/css/home.css?v=1.1',
  '/css/card-fix.css?v=1.1',
  '/css/common.css?v=1.2',
  '/css/loading.css?v=1.1',
  '/css/homepage.css?v=1.1',
  '/css/popup-trailer.css?v=1.1',
  '/css/donation-modal.css?v=1.1',
  '/css/search-results.css?v=1.1',
  '/css/auth.css?v=1.1',
  '/css/premium-banner.css?v=1.1',
  '/css/install-modal.css',
  '/css/anime-section.css?v=1.1',
  '/js/homepage.js?v=1.1',
  '/js/navbar.js?v=1.1',
  '/js/auth.js?v=1.1',
  '/js/install-modal.js?v=1.3',
  '/js/premium-banner.js?v=1.8',
  '/js/anime-section.js?v=1.1',
  '/js/nav-search.js?v=1.2',
  '/images/logo.svg',
  '/manifest.json'
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

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
