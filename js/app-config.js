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
})();
