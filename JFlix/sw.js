const blockedDomains = [
  'isolatedcompliments.com',
  'antiadblocksystems.com',
  'd3cod80thn7qnd.cloudfront.net',
  'go.mobisla.com',
  'go.oclaserver.com',
  'onclickalgo.com',
  'pushtorm.com',
  'exdynsrv.com',
  'alclk.ru',
  'adsbid.com',
  'adbull.me',
  'clickadu.com',
  'clickaine.com',
  'fcdn.stream',
  'popads.net',
  'adsterra.com',
  'mixadvert.com',
  'static.vidsrc.pro'
];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (blockedDomains.some(domain => url.hostname.includes(domain))) {
    console.log(`Blocked request to ${url.hostname}`);
    event.respondWith(new Response(null, {
      status: 404,
      statusText: 'Blocked by JFlix Service Worker'
    }));
    return;
  }
});
