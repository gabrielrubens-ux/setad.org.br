/**
 * Home SETAD — carrega JS de seções só quando o usuário se aproxima delas.
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("pagina-inicial")) return;

  var blocos = [
    {
      seletor: "#programa",
      scripts: ["js/grade-curriculo-setad.js", "js/programa-grade.js"]
    },
    {
      seletor: "#historia",
      scripts: ["js/nossa-historia.js"]
    }
  ];

  function carregarSequencia(scripts, indice) {
    if (indice >= scripts.length) return;
    var src = scripts[indice];
    if (document.querySelector('script[src*="' + src + '"]')) {
      carregarSequencia(scripts, indice + 1);
      return;
    }
    var tag = document.createElement("script");
    tag.src = src;
    tag.defer = true;
    tag.onload = function () {
      carregarSequencia(scripts, indice + 1);
    };
    tag.onerror = function () {
      carregarSequencia(scripts, indice + 1);
    };
    document.body.appendChild(tag);
  }

  function observarBloco(bloco) {
    var el = document.querySelector(bloco.seletor);
    if (!el) return;

    var carregado = false;
    function ativar() {
      if (carregado) return;
      carregado = true;
      carregarSequencia(bloco.scripts, 0);
    }

    if (!window.IntersectionObserver) {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(ativar, { timeout: 8000 });
      } else {
        window.setTimeout(ativar, 4000);
      }
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          ativar();
          observer.disconnect();
        });
      },
      { rootMargin: "240px 0px 120px", threshold: 0.01 }
    );

    observer.observe(el);
  }

  blocos.forEach(observarBloco);
})();
