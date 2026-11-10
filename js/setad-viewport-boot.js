/**
 * Carrega cedo o ajuste de layout por resolução (site, PWA e app).
 * Navegadores não expõem placa-mãe ou hardware interno — usamos viewport e capacidades da tela.
 */
(function (d) {
  if (!d) return;

  if (d.documentElement.dataset.setadMobileViewportInit !== "1") {
    var s = d.createElement("script");
    s.src = "/js/mobile-viewport.js";
    s.defer = true;
    (d.head || d.documentElement).appendChild(s);
  }

  if (!d.querySelector('script[src*="setad-acessibilidade.js"]')) {
    var a11y = d.createElement("script");
    a11y.src = "/js/setad-acessibilidade.js";
    a11y.defer = true;
    (d.head || d.documentElement).appendChild(a11y);
  }

  if (!d.querySelector('script[src*="setad-contato-institucional.js"]')) {
    var contatoInst = d.createElement("script");
    contatoInst.src = "/js/setad-contato-institucional.js";
    contatoInst.defer = true;
    (d.head || d.documentElement).appendChild(contatoInst);
  }
})(document);
