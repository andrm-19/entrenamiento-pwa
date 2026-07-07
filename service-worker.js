/* ============================================================
   Entreno V — Service Worker (offline-first)
   ------------------------------------------------------------
   Estrategia: "cache-first" sobre un App Shell precacheado.
   La primera visita guarda los archivos locales; a partir de ahí
   la app abre sin conexión. Para actualizar, sube CACHE_VERSION:
   el SW borra las cachés viejas en el evento 'activate'.

   Nota: los videos de YouTube NO se cachean (son externos y
   requieren internet); el resto de la app funciona offline.
   ============================================================ */

const CACHE_VERSION = 'entrenoV-v22';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css?v=22',
  './js/app.js?v=22',
  './manifest.json',
  './assets/icon.svg'
];

// Instalación: precachea el App Shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activación: limpia versiones anteriores de la caché.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: solo gestionamos GET de la misma app; el resto va a la red.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // Cachea en caliente las respuestas válidas de la propia app.
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html')); // fallback offline
    })
  );
});
