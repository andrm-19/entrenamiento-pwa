/* ============================================================
   Entreno V — Service Worker (offline-first, con actualización fiable)
   ------------------------------------------------------------
   Estrategia por tipo de recurso:
     · Código de la app (navegación, .html, .js, .css) -> NETWORK-FIRST:
       siempre intenta la red; si responde OK, actualiza la caché y la
       sirve. Sin conexión, cae a la copia cacheada. Esto garantiza que
       cada despliegue nuevo LLEGUE al dispositivo (antes, con cache-first,
       una versión rota podía quedar fijada para siempre).
     · Estáticos inmutables (icono, manifest, imágenes) -> CACHE-FIRST
       (stale-while-revalidate): respuesta instantánea + refresco en 2º plano.

   Reglas de oro:
     · NUNCA se cachea una respuesta que no sea 200/OK (evita fijar 404/500).
     · Para actualizar la app basta con subir CACHE_VERSION (y ?v= en index.html).
   ============================================================ */

const CACHE_VERSION = 'entrenoV-v38';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css?v=38',
  './js/data.js?v=38',
  './js/store.js?v=38',
  './js/engine.js?v=38',
  './js/ui.js?v=38',
  './js/boot.js?v=38',
  './manifest.json',
  './assets/icon.svg'
];

// Instalación: precachea el App Shell (tolerante a fallos individuales).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Activación: limpia versiones anteriores de la caché, toma control y —clave para
// romper una caché "envenenada"— recarga las pestañas abiertas UNA vez, de modo que
// una versión rota fijada por el SW antiguo se reemplace sola al abrir la app.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => { try { c.navigate(c.url); } catch (e) { /* algunos clientes no permiten navigate */ } }))
  );
});

/** ¿Es una petición de "código de la app" (debe ir por red primero)? */
function isAppCode(request, url) {
  if (request.mode === 'navigate') return true;
  return /\.(?:html|js|css)$/i.test(url.pathname);
}

/** Guarda en caché solo respuestas válidas (200/OK, básicas o CORS válidas). */
function cachePut(request, response) {
  if (response && response.ok && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);

  if (isAppCode(req, url)) {
    // NETWORK-FIRST: la red manda; la caché es la red de seguridad offline.
    event.respondWith(
      fetch(req)
        .then((res) => cachePut(req, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // CACHE-FIRST (stale-while-revalidate) para estáticos.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => cachePut(req, res)).catch(() => cached);
      return cached || network;
    })
  );
});
