/**
 * SETAD — layout adaptativo por resolução, orientação e tipo de dispositivo.
 * Web, PWA e Capacitor: usa viewport, pointer e safe areas (não há acesso à placa-mãe no navegador).
 */
(function (global) {
  "use strict";

  var docEl = document.documentElement;
  if (docEl.dataset.setadMobileViewportInit === "1") return;
  docEl.dataset.setadMobileViewportInit = "1";

  var resizeTimer = null;

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

  function detectarMobile(largura) {
    var coarse = global.matchMedia("(pointer: coarse)").matches;
    var narrow = largura < 900;
    var touch = (global.navigator.maxTouchPoints || 0) > 0;
    return coarse || narrow || touch;
  }

  function detectarClasseDispositivo(largura, mobile) {
    if (largura < 600) return "phone";
    if (largura < 1024 && mobile) return "tablet";
    if (largura < 768) return "phone";
    if (largura < 1200 && mobile) return "tablet";
    return "desktop";
  }

  function bucketLargura(largura) {
    if (largura < 360) return "xs";
    if (largura < 480) return "sm";
    if (largura < 768) return "md";
    if (largura < 1024) return "lg";
    if (largura < 1280) return "xl";
    return "xxl";
  }

  function escalaUi(largura) {
    if (largura < 360) return 0.92;
    if (largura < 480) return 0.96;
    if (largura > 1600) return 1.05;
    if (largura > 1280) return 1;
    return Math.min(1.08, Math.max(0.94, largura / 390));
  }

  function atualizarMetricas() {
    var vv = global.visualViewport;
    var largura = Math.round((vv && vv.width) || docEl.clientWidth || global.innerWidth);
    var altura = Math.round((vv && vv.height) || docEl.clientHeight || global.innerHeight);
    var mobile = detectarMobile(largura);
    var dispositivo = detectarClasseDispositivo(largura, mobile);
    var bucket = bucketLargura(largura);
    var standalone =
      global.matchMedia("(display-mode: standalone)").matches ||
      global.matchMedia("(display-mode: fullscreen)").matches ||
      (global.navigator.standalone === true);

    docEl.style.setProperty("--setad-vw", largura + "px");
    docEl.style.setProperty("--setad-vh", altura + "px");
    docEl.style.setProperty("--setad-vh-full", global.innerHeight + "px");
    docEl.style.setProperty("--setad-ui-scale", escalaUi(largura).toFixed(3));
    docEl.style.setProperty(
      "--setad-content-max",
      dispositivo === "desktop" ? "min(96vw, 1400px)" : "100%"
    );

    docEl.classList.toggle("setad-mobile", mobile);
    docEl.classList.toggle("setad-desktop", !mobile);
    docEl.classList.toggle("setad-pwa-standalone", standalone);
    docEl.dataset.setadViewport = bucket;
    docEl.dataset.setadDevice = dispositivo;
    docEl.dataset.setadOrientacao = largura > altura ? "landscape" : "portrait";
    docEl.dataset.setadPointer = global.matchMedia("(pointer: coarse)").matches
      ? "coarse"
      : "fine";

    if (document.body) {
      document.body.classList.toggle("setad-mobile", mobile);
      document.body.classList.toggle("setad-desktop", !mobile);
      document.body.dataset.setadDevice = dispositivo;
    }
  }

  function agendarAtualizacao() {
    if (resizeTimer) global.clearTimeout(resizeTimer);
    resizeTimer = global.setTimeout(atualizarMetricas, 80);
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
    global.addEventListener("resize", agendarAtualizacao, { passive: true });
    global.addEventListener("orientationchange", function () {
      global.setTimeout(atualizarMetricas, 120);
    });
    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", agendarAtualizacao, { passive: true });
      global.visualViewport.addEventListener("scroll", agendarAtualizacao, { passive: true });
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
    ehMobile: function () {
      return detectarMobile(
        Math.round(global.innerWidth || docEl.clientWidth || 0)
      );
    }
  };
})(window);
