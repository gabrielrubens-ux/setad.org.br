/**
 * SETAD — adaptação dinâmica ao celular (viewport, safe areas, orientação).
 * Carregado automaticamente via app-config.js ou contato-setad.js.
 */
(function (global) {
  "use strict";

  var docEl = document.documentElement;
  if (docEl.dataset.setadMobileViewportInit === "1") return;
  docEl.dataset.setadMobileViewportInit = "1";

  function resolverBaseDoScript() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("mobile-viewport.js") !== -1) {
        var idx = src.lastIndexOf("/");
        return idx >= 0 ? src.slice(0, idx + 1) : "";
      }
    }
    return "/js/";
  }

  function injetarCss() {
    if (document.getElementById("setad-mobile-viewport-css")) return;
    var base = resolverBaseDoScript().replace(/js\/$/, "css/");
    if (base.indexOf("/") !== 0 && base.indexOf("http") !== 0) {
      base = "/" + base.replace(/^\//, "");
    }
    var link = document.createElement("link");
    link.id = "setad-mobile-viewport-css";
    link.rel = "stylesheet";
    link.href = base + "mobile-viewport.css";
    document.head.appendChild(link);
  }

  function detectarMobile() {
    var coarse = global.matchMedia("(pointer: coarse)").matches;
    var narrow = global.matchMedia("(max-width: 900px)").matches;
    var touch = (global.navigator.maxTouchPoints || 0) > 0;
    return coarse || narrow || touch;
  }

  function bucketLargura(largura) {
    if (largura < 360) return "xs";
    if (largura < 480) return "sm";
    if (largura < 768) return "md";
    return "lg";
  }

  function atualizarMetricas() {
    var vv = global.visualViewport;
    var largura = Math.round((vv && vv.width) || docEl.clientWidth || global.innerWidth);
    var altura = Math.round((vv && vv.height) || docEl.clientHeight || global.innerHeight);
    var mobile = detectarMobile();

    docEl.style.setProperty("--setad-vw", largura + "px");
    docEl.style.setProperty("--setad-vh", altura + "px");
    docEl.style.setProperty("--setad-vh-full", global.innerHeight + "px");

    docEl.classList.toggle("setad-mobile", mobile);
    docEl.classList.toggle("setad-desktop", !mobile);
    docEl.dataset.setadViewport = bucketLargura(largura);
    docEl.dataset.setadOrientacao =
      largura > altura ? "landscape" : "portrait";

    if (document.body) {
      document.body.classList.toggle("setad-mobile", mobile);
    }
  }

  function garantirMetaViewport() {
    var meta = document.querySelector('meta[name="viewport"]');
    var conteudo =
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5";
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = conteudo;
      document.head.appendChild(meta);
      return;
    }
    if (meta.content.indexOf("viewport-fit") === -1) {
      meta.content = conteudo;
    }
  }

  function registrarEventos() {
    global.addEventListener("resize", atualizarMetricas, { passive: true });
    global.addEventListener("orientationchange", function () {
      global.setTimeout(atualizarMetricas, 100);
    });
    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", atualizarMetricas, { passive: true });
      global.visualViewport.addEventListener("scroll", atualizarMetricas, { passive: true });
    }
  }

  injetarCss();
  garantirMetaViewport();
  atualizarMetricas();
  registrarEventos();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", atualizarMetricas);
  }

  global.SETAD_MOBILE_VIEWPORT = {
    atualizar: atualizarMetricas,
    ehMobile: detectarMobile
  };
})(window);
