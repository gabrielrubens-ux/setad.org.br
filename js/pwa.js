/**
 * Registro do Service Worker, prompt de instalação e aviso de atualização — SETAD PWA.
 */
(function () {
  "use strict";

  var SW_URL = "/sw.js";
  var INSTALL_DISMISS_KEY = "setad_pwa_install_dismissed";
  var INSTALL_DISMISS_DAYS = 14;
  var deferredInstallPrompt = null;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function wasInstallDismissed() {
    try {
      var raw = localStorage.getItem(INSTALL_DISMISS_KEY);
      if (!raw) return false;
      var dismissedAt = Number(raw);
      if (!dismissedAt) return false;
      var days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      return days < INSTALL_DISMISS_DAYS;
    } catch (_e) {
      return false;
    }
  }

  function dismissInstallPrompt() {
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
    } catch (_e) {}
  }

  function createInstallBanner() {
    if (isStandalone() || wasInstallDismissed() || !deferredInstallPrompt) return;
    if (document.querySelector(".pwa-install")) return;

    var banner = document.createElement("aside");
    banner.className = "pwa-install";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Instalar aplicativo SETAD");
    banner.innerHTML =
      '<div class="pwa-install__content">' +
        '<img src="/assets/images/favicon-setad-circle.png" alt="" class="pwa-install__icon" width="48" height="48">' +
        '<div class="pwa-install__text">' +
          '<strong class="pwa-install__title">Instalar app SETAD</strong>' +
          '<span class="pwa-install__desc">Acesso rápido na tela inicial, como um aplicativo.</span>' +
        "</div>" +
        '<div class="pwa-install__actions">' +
          '<button type="button" class="pwa-install__btn pwa-install__btn--primary" id="pwaInstallBtn">Instalar</button>' +
          '<button type="button" class="pwa-install__btn pwa-install__btn--ghost" id="pwaInstallDismiss" aria-label="Fechar">Agora não</button>' +
        "</div>" +
      "</div>";

    document.body.appendChild(banner);

    banner.querySelector("#pwaInstallBtn").addEventListener("click", function () {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function (choice) {
        if (choice.outcome === "accepted") {
          banner.remove();
        }
        deferredInstallPrompt = null;
      });
    });

    banner.querySelector("#pwaInstallDismiss").addEventListener("click", function () {
      dismissInstallPrompt();
      banner.remove();
    });
  }

  function createUpdateBanner(registration) {
    if (document.getElementById("pwaUpdateBanner")) return;

    var banner = document.createElement("aside");
    banner.id = "pwaUpdateBanner";
    banner.className = "pwa-update";
    banner.setAttribute("role", "status");
    banner.innerHTML =
      '<span class="pwa-update__text">Nova versão do app SETAD disponível.</span>' +
      '<button type="button" class="pwa-update__btn" id="pwaUpdateBtn">Atualizar</button>';

    document.body.appendChild(banner);

    banner.querySelector("#pwaUpdateBtn").addEventListener("click", function () {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", function () {
      navigator.serviceWorker.register(SW_URL, { scope: "/" })
        .then(function (registration) {
          if (registration.waiting) {
            createUpdateBanner(registration);
          }

          registration.addEventListener("updatefound", function () {
            var newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", function () {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                createUpdateBanner(registration);
              }
            });
          });
        })
        .catch(function (error) {
          console.warn("[SETAD PWA] Falha ao registrar service worker:", error);
        });

      var refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    createInstallBanner();
  });

  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    var banner = document.querySelector(".pwa-install");
    if (banner) banner.remove();
  });

  registerServiceWorker();

  window.SETADPWA = {
    isStandalone: isStandalone,
    promptInstall: function () {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        return deferredInstallPrompt.userChoice;
      }
      return Promise.resolve({ outcome: "dismissed" });
    }
  };
})();
