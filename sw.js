/**
 * Service Worker SETAD — cache offline para o app PWA.
 * Estratégia: precache do núcleo + stale-while-revalidate para estáticos + network-first para HTML.
 */
const CACHE_VERSION = "setad-pwa-v16";
const PRECACHE = "setad-precache-v16";
const RUNTIME = "setad-runtime-v2";
const RUNTIME_MAX_ENTRIES = 96;

/* Núcleo leve no install — painéis e rotas secundárias entram via runtime ao visitar */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/css/styles.css",
  "/css/pwa.css",
  "/css/mobile-viewport.css",
  "/js/pwa.js",
  "/js/script.js",
  "/js/setad-viewport-boot.js",
  "/js/setad-acessibilidade.js",
  "/css/acessibilidade.css",
  "/js/mobile-viewport.js",
  "/js/app-config.js",
  "/js/native-bridge.js",
  "/js/api-client.js",
  "/js/contato-setad.js",
  "/js/wpp-float.js",
  "/js/grade-curriculo-setad.js",
  "/js/programa-grade.js",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/images/marca-dagua-setad.png",
  "/login-aluno.html",
  "/login-professor.html",
  "/login-direcao.html",
  "/escolher-area-institucional.html",
  "/recuperar-senha-institucional.html",
  "/privacidade.html",
  "/acessibilidade.html"
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
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                (key.startsWith("setad-precache-") && key !== PRECACHE) ||
                (key.startsWith("setad-pwa-") && key !== CACHE_VERSION) ||
                (key.startsWith("setad-runtime-") && key !== RUNTIME)
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
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

async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= RUNTIME_MAX_ENTRIES) return;
  const excess = keys.length - RUNTIME_MAX_ENTRIES;
  for (let i = 0; i < excess; i += 1) {
    await cache.delete(keys[i]);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimRuntimeCache(cache);
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
