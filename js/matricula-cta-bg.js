/* ============================================================
   matricula-cta-bg.js — Fundo interativo da seção Faça parte do SETAD
   ============================================================ */

(function () {
  "use strict";

  function inicializar() {
    var section = document.getElementById("inscricao");
    if (!section || section.dataset.matriculaBgBound === "1") return;
    section.dataset.matriculaBgBound = "1";

    var bg = section.querySelector(".matricula-cta__bg");
    var layers = section.querySelectorAll("[data-parallax-layer]");
    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var alvoX = 50;
    var alvoY = 50;
    var atualX = 50;
    var atualY = 50;

    function animarSpot() {
      atualX += (alvoX - atualX) * 0.08;
      atualY += (alvoY - atualY) * 0.08;
      if (bg) {
        bg.style.setProperty("--matricula-spot-x", atualX + "%");
        bg.style.setProperty("--matricula-spot-y", atualY + "%");
      }
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

      alvoX = 18 + relX * 64;
      alvoY = 12 + relY * 76;

      if (bg) {
        bg.style.setProperty("--matricula-parallax-x", String(offsetX * 28));
        bg.style.setProperty("--matricula-parallax-y", String(offsetY * 18));
      }

      layers.forEach(function (layer) {
        var profundidade = parseFloat(layer.getAttribute("data-parallax-layer")) || 6;
        layer.style.transform =
          "translate3d(" + (offsetX * profundidade) + "px, " +
          (offsetY * profundidade * 0.7) + "px, 0)";
      });
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 50;
      if (bg) {
        bg.style.setProperty("--matricula-parallax-x", "0");
        bg.style.setProperty("--matricula-parallax-y", "0");
      }
      layers.forEach(function (layer) {
        layer.style.transform = "";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
