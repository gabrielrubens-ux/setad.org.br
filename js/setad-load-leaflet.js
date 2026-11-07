/**
 * Carrega Leaflet (CSS + JS) uma vez, sob demanda — reduz payload na abertura no celular.
 */
(function (global) {
  "use strict";

  var CSS_HREF = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  var CSS_INTEGRITY = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
  var JS_SRC = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  var JS_INTEGRITY = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

  function loadLeaflet() {
    if (global.L) return Promise.resolve(global.L);
    if (global.__setadLeafletPromise) return global.__setadLeafletPromise;

    global.__setadLeafletPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[data-setad-leaflet-css="1"]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CSS_HREF;
        link.integrity = CSS_INTEGRITY;
        link.crossOrigin = "";
        link.setAttribute("data-setad-leaflet-css", "1");
        document.head.appendChild(link);
      }

      var existing = document.querySelector('script[data-setad-leaflet-js="1"]');
      if (existing && global.L) {
        resolve(global.L);
        return;
      }

      var script = document.createElement("script");
      script.src = JS_SRC;
      script.integrity = JS_INTEGRITY;
      script.crossOrigin = "";
      script.setAttribute("data-setad-leaflet-js", "1");
      script.onload = function () {
        resolve(global.L);
      };
      script.onerror = function () {
        global.__setadLeafletPromise = null;
        reject(new Error("Falha ao carregar Leaflet"));
      };
      document.head.appendChild(script);
    });

    return global.__setadLeafletPromise;
  }

  global.SETADLoadLeaflet = loadLeaflet;
})(window);
