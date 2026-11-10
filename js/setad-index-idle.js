/**
 * Landing SETAD — scripts decorativos fora do caminho crítico (melhor TTI no celular).
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("pagina-inicial")) return;

  var recursos = [
    "js/midias-bg.js",
    "js/matricula-cta-bg.js",
    "js/missoes-fita.js",
    "js/missoes-bg.js",
    "/js/setad-webmcp.js"
  ];

  function carregarProximo(indice) {
    if (indice >= recursos.length) return;
    var src = recursos[indice];
    if (document.querySelector('script[src*="' + src + '"]')) {
      carregarProximo(indice + 1);
      return;
    }
    var tag = document.createElement("script");
    tag.src = src;
    tag.defer = true;
    tag.onload = function () {
      carregarProximo(indice + 1);
    };
    tag.onerror = function () {
      carregarProximo(indice + 1);
    };
    document.body.appendChild(tag);
  }

  function iniciar() {
    carregarProximo(0);
  }

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(iniciar, { timeout: 6000 });
  } else {
    window.setTimeout(iniciar, 3500);
  }
})();
