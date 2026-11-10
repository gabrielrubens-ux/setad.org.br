/**
 * Configuração do app SETAD — web, PWA e Capacitor.
 * Altere SETAD_API_BASE antes de gerar o APK para apontar ao servidor em produção.
 */
(function () {
  "use strict";

  window.SETAD_CONFIG = {
    /**
     * API do app nativo (Capacitor) — usada só no Android/iOS.
     * Web/PWA no navegador continua usando /api relativo ao mesmo servidor.
     * Teste local no celular: "http://192.168.0.10:3456/api"
     */
    API_BASE: "https://setad.org.br/api",

    SITE_URL: "https://setad.org.br",
    APP_NAME: "SETAD",
    THEME_COLOR: "#23406b"
  };

  if (document.documentElement.dataset.setadMobileViewportInit === "1") {
    /* viewport já inicializado no <head> */
  } else if (!document.querySelector('script[src*="setad-viewport-boot"]')) {
    var boot = document.createElement("script");
    boot.src = "/js/setad-viewport-boot.js";
    boot.async = false;
    document.head.appendChild(boot);
  }

  if (!document.querySelector('script[src*="setad-acessibilidade.js"]')) {
    var a11y = document.createElement("script");
    a11y.src = "/js/setad-acessibilidade.js";
    a11y.defer = true;
    document.head.appendChild(a11y);
  }
})();
