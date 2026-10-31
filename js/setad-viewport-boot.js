/**
 * Carrega cedo o ajuste de layout por resolução (site, PWA e app).
 * Navegadores não expõem placa-mãe ou hardware interno — usamos viewport e capacidades da tela.
 */
(function (d) {
  if (!d || d.documentElement.dataset.setadMobileViewportInit === "1") return;
  var s = d.createElement("script");
  s.src = "/js/mobile-viewport.js";
  s.async = false;
  (d.head || d.documentElement).appendChild(s);
})(document);
