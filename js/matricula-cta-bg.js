/* ============================================================
   matricula-cta-bg.js — Spotlight suave na seção de matrícula
   ============================================================ */

(function () {
  "use strict";

  function inicializar() {
    var section = document.getElementById("inscricao");
    if (!section || section.dataset.matriculaBgBound === "1") return;
    section.dataset.matriculaBgBound = "1";

    var aurora = section.querySelector("[data-matricula-aurora]");
    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var alvoX = 50;
    var alvoY = 45;
    var atualX = 50;
    var atualY = 45;

    function animarSpot() {
      atualX += (alvoX - atualX) * 0.07;
      atualY += (alvoY - atualY) * 0.07;
      section.style.setProperty("--matricula-spot-x", atualX + "%");
      section.style.setProperty("--matricula-spot-y", atualY + "%");
      requestAnimationFrame(animarSpot);
    }

    if (!reduzir) {
      requestAnimationFrame(animarSpot);
    }

    section.addEventListener("mousemove", function (evento) {
      if (reduzir) return;

      var rect = section.getBoundingClientRect();
      var relX = (evento.clientX - rect.left) / rect.width;
      var relY = (evento.clientY - rect.top) / rect.height;
      var offsetX = relX - 0.5;
      var offsetY = relY - 0.5;

      alvoX = 22 + relX * 56;
      alvoY = 18 + relY * 64;

      if (aurora) {
        aurora.style.transform =
          "translate3d(" + (offsetX * 14) + "px, " + (offsetY * 10) + "px, 0)";
      }
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 45;
      if (aurora) aurora.style.transform = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
