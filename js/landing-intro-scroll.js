/**
 * Abertura da home — controla fundo fixo e visibilidade do WhatsApp flutuante ao rolar.
 */
(function () {
  "use strict";

  var intro = document.querySelector("[data-landing-intro]");
  if (!intro || !document.body.classList.contains("pagina-inicial")) return;

  function atualizarEncerrado() {
    var rect = intro.getBoundingClientRect();
    var viewport = window.innerHeight || 1;
    if (rect.bottom < viewport * 0.12) {
      document.body.classList.add("landing-intro--encerrado");
    } else {
      document.body.classList.remove("landing-intro--encerrado");
    }
  }

  window.addEventListener("scroll", atualizarEncerrado, { passive: true });
  window.addEventListener("resize", atualizarEncerrado);
  atualizarEncerrado();
})();
