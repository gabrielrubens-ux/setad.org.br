/**
 * Service Worker SETAD — cache offline para o app PWA.
 * Estratégia: precache do núcleo + stale-while-revalidate para estáticos + network-first para HTML.
 */
const CACHE_VERSION = "setad-pwa-v8";
const PRECACHE = "setad-precache-v8";
const RUNTIME = "setad-runtime-v1";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/css/portal.css",
  "/css/pwa.css",
  "/js/pwa.js",
  "/js/script.js",
  "/js/dados.js",
  "/js/auth.js",
  "/js/api-client.js",
  "/js/app-config.js",
  "/js/native-bridge.js",
  "/js/setad-sync.js",
  "/js/contato-setad.js",
  "/js/wpp-float.js",
  "/assets/icons/icon-16.png",
  "/assets/icons/icon-32.png",
  "/assets/icons/icon-72.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-maskable-512.png",
  "/assets/icons/apple-touch-icon.png",
  "/assets/images/app-icon-setad.png",
  "/assets/images/favicon-setad-circle.png",
  "/assets/images/marca-dagua-setad.png",
  "/login-aluno.html",
  "/login-professor.html",
  "/login-direcao.html",
  "/painel-aluno.html",
  "/painel-professor.html",
  "/painel-secretaria.html",
  "/painel-diretor.html",
  "/painel-contador.html",
  "/culto-ao-vivo.html",
  "/matricula/index.html",
  "/matricula/pagamento.html",
  "/matricula/teologia/index.html",
  "/polos/index.html"
];

const STATIC_DESTINATIONS = new Set(["style", "script", "font", "image"]);

function isNavigationRequest(request) {
  return request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isCacheableStatic(request, url) {
  if (!isSameOrigin(url)) return false;
  if (STATIC_DESTINATIONS.has(request.destination)) return true;
  return /\.(css|js|png|jpg|jpeg|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("setad-") && key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (!isSameOrigin(url)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isCacheableStatic(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.pathname.endsWith(".webmanifest")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(RUNTIME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    const offline = await caches.match("/offline.html");
    if (offline) return offline;

    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    fetchPromise.catch(() => {});
    return cached;
  }

  const response = await fetchPromise;
  if (response) return response;

  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable"
  });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
