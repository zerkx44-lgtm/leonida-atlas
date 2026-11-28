/* Service worker: la app abre sin conexión (mapa y datos base). */
const VERSION = 'atlas-v12';
const BASE = ['./', 'index.html', 'admin.html', 'css/app.css', 'css/admin.css', 'js/config.js', 'js/data.js', 'js/moderation.js',
  'js/store.js', 'js/comun.js', 'js/app.js', 'js/admin.js', 'wiki.html', 'js/wiki.js', 'js/wiki-data.js', 'css/wiki.css', 'css/chat.css', 'js/chat.js', 'css/legal.css', 'privacidad.html', 'terminos.html', 'galeria.html', 'js/galeria.js', 'css/galeria.css', 'assets/leonida.svg', 'assets/icon.svg', 'manifest.webmanifest',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Nunca guardar en caché la API (aportes, login): siempre datos frescos.
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) return;
  // Fotos de la galería: que las maneje la caché normal del navegador (no llenar la de la app).
  if (url.pathname.startsWith('/fotos/') || url.pathname.includes('/storage/v1/')) return;
  // Propios: red primero (para ver cambios), caché si no hay conexión.
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  // Leaflet desde CDN: caché primero.
  if (url.hostname === 'unpkg.com') e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
