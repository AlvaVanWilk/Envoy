// Service worker: lets the app open without a connection.
// Network first, so a new version on the server is used right away;
// if the network does not answer in time, the stored copy is used.

// The real app and its test copy can lie side by side on one web space.
// Each keeps its own store, named after its folder, and only clears its own.
const FOLDER = new URL(self.registration.scope).pathname;
const CACHE = `envoy-v66 ${FOLDER}`;
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // own older stores, and the ones from before stores were named per folder
    const old = keys.filter((k) => k.startsWith('envoy-') && k !== CACHE && (k.endsWith(` ${FOLDER}`) || !k.includes(' ')));
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sync.php')) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  // Always ask the server whether a file has changed (it answers briefly if
  // not), so a new drawing under an old name shows up at once.
  const fresh = request.mode === 'navigate' ? request : new Request(request, { cache: 'no-cache' });
  const network = fetch(fresh).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => null); // handled below; avoids an unhandled rejection
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, null));
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached || await network;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw new Error('offline');
  }
}
