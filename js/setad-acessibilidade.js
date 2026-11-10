/**
 * SETAD — barra de acessibilidade (lateral esquerda), persistência e VLibras sob demanda.
 */
(function (g) {
  "use strict";

  var STORAGE_KEY = "setad_a11y_prefs";
  var CLASSE_FONTE_PREFIX = "setad-a11y-fonte-";
  var ESCALAS = [100, 105, 110, 115, 120, 125];

  function lerPrefs() {
    try {
      var raw = g.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function salvarPrefs(prefs) {
    try {
      g.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      /* armazenamento indisponível */
    }
  }

  function normalizarPrefs(prefs) {
    prefs = prefs || {};
    var pct = Number(prefs.fontePct);
    if (!pct || ESCALAS.indexOf(pct) === -1) {
      prefs.fontePct = 100;
    }
    return prefs;
  }

  function injetarCss(doc) {
    if (doc.getElementById("setad-a11y-styles")) return;
    var link = doc.createElement("link");
    link.id = "setad-a11y-styles";
    link.rel = "stylesheet";
    link.href = "/css/acessibilidade.css";
    (doc.head || doc.documentElement).appendChild(link);
  }

  function aplicarEscalaFonte(doc, pct) {
    var html = doc.documentElement;
    ESCALAS.forEach(function (n) {
      html.classList.remove(CLASSE_FONTE_PREFIX + n);
    });
    if (pct && pct !== 100) {
      html.classList.add(CLASSE_FONTE_PREFIX + pct);
    }
  }

  function aplicarContraste(doc, ativo) {
    doc.documentElement.classList.toggle("setad-a11y-contraste", !!ativo);
  }

  function aplicarFocoReforcado(doc, ativo) {
    doc.documentElement.classList.toggle("setad-a11y-foco-reforcado", !!ativo);
  }

  function garantirAlvoConteudo(doc) {
    var main = doc.querySelector("main");
    if (main && !main.id) main.id = "conteudo-principal";
    if (!main) {
      var painel = doc.querySelector(
        ".painel__conteudo, .painel-page, [role='main'], article.login-card, .painel"
      );
      if (painel && !painel.id) {
        painel.id = "conteudo-principal";
        if (!painel.getAttribute("role") && painel.tagName !== "MAIN") {
          painel.setAttribute("role", "main");
        }
      }
    }
  }

  function carregarVLibras(doc, cb) {
    if (g.__setadVLibrasAtivo) {
      if (cb) cb();
      return;
    }
    var existente = doc.querySelector('script[src*="vlibras-plugin"]');
    if (existente) {
      g.__setadVLibrasAtivo = true;
      if (cb) cb();
      return;
    }

    var slot = doc.getElementById("setad-a11y-vlibras-slot");
    if (!slot) {
      slot = doc.createElement("div");
      slot.id = "setad-a11y-vlibras-slot";
      slot.className = "setad-a11y-vlibras-slot";
      slot.innerHTML =
        '<div vw class="enabled"><div vw-access-button class="active"></div>' +
        '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div></div>';
      doc.body.appendChild(slot);
    }

    var s = doc.createElement("script");
    s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    s.onload = function () {
      try {
        if (g.VLibras && g.VLibras.Widget) {
          new g.VLibras.Widget("https://vlibras.gov.br/app");
          g.__setadVLibrasAtivo = true;
          var btn = doc.querySelector("[vw-access-button]");
          if (btn && typeof btn.click === "function") {
            setTimeout(function () {
              btn.click();
            }, 400);
          }
        }
      } catch (err) {
        console.warn("[SETAD a11y] VLibras não iniciou:", err);
      }
      if (cb) cb();
    };
    s.onerror = function () {
      console.warn("[SETAD a11y] Falha ao carregar VLibras.");
      if (cb) cb();
    };
    doc.body.appendChild(s);
  }

  function injetarUi(doc, prefs) {
    if (doc.getElementById("setad-a11y-barra")) return;

    garantirAlvoConteudo(doc);

    var skip = doc.createElement("a");
    skip.className = "setad-a11y-skip";
    skip.href = "#conteudo-principal";
    skip.textContent = "Ir para o conteúdo";
    doc.body.insertBefore(skip, doc.body.firstChild);

    var root = doc.createElement("aside");
    root.id = "setad-a11y-barra";
    root.className = "setad-a11y";
    root.setAttribute("aria-label", "Ferramentas de acessibilidade");
    root.innerHTML =
      '<div class="setad-a11y__aba">' +
      '<button type="button" class="setad-a11y__abrir" id="setad-a11y-toggle" aria-expanded="false" aria-controls="setad-a11y-painel" aria-label="Abrir ferramentas de acessibilidade">' +
      '<span class="setad-a11y__abrir-icone" aria-hidden="true">♿</span>' +
      '<span class="setad-a11y__abrir-texto">Acess.</span>' +
      "</button></div>" +
      '<div id="setad-a11y-painel" class="setad-a11y__painel" role="region" aria-labelledby="setad-a11y-titulo">' +
      '<h2 id="setad-a11y-titulo" class="setad-a11y__titulo">Acessibilidade</h2>' +
      '<p class="setad-a11y__intro">Ajustes rápidos inspirados em portais públicos (e-MAG). Suas preferências ficam salvas neste dispositivo.</p>' +
      '<div class="setad-a11y__grupo">' +
      '<p class="setad-a11y__grupo-titulo">Tamanho do texto</p>' +
      '<ul class="setad-a11y__lista">' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="fonte-menos" aria-label="Diminuir tamanho do texto">A− menor</button></li>' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="fonte-mais" aria-label="Aumentar tamanho do texto">A+ maior</button></li>' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="fonte-padrao">Tamanho padrão</button></li>' +
      "</ul></div>" +
      '<div class="setad-a11y__grupo">' +
      '<p class="setad-a11y__grupo-titulo">Visual</p>' +
      '<ul class="setad-a11y__lista">' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="contraste" id="setad-a11y-contraste" aria-pressed="false">Alto contraste</button></li>' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="foco" id="setad-a11y-foco" aria-pressed="false">Destaque de foco</button></li>' +
      "</ul></div>" +
      '<div class="setad-a11y__grupo">' +
      '<p class="setad-a11y__grupo-titulo">Libras</p>' +
      '<ul class="setad-a11y__lista">' +
      '<li><button type="button" class="setad-a11y__btn" data-acao="vlibras">Tradutor em Libras (VLibras)</button></li>' +
      "</ul></div>" +
      '<div class="setad-a11y__grupo">' +
      '<p class="setad-a11y__grupo-titulo">Informações</p>' +
      '<ul class="setad-a11y__lista">' +
      '<li><a class="setad-a11y__btn" href="/acessibilidade.html">Declaração e contato</a></li>' +
      "</ul></div>" +
      '<p class="setad-a11y__rodape">Tecla <kbd>Esc</kbd> fecha o painel. Dúvidas: use a página de acessibilidade.</p>' +
      "</div>";

    doc.body.appendChild(root);

    var toggle = doc.getElementById("setad-a11y-toggle");
    var painel = doc.getElementById("setad-a11y-painel");
    var btnContraste = doc.getElementById("setad-a11y-contraste");
    var btnFoco = doc.getElementById("setad-a11y-foco");

    function abrirPainel(abrir) {
      root.classList.toggle("setad-a11y--aberto", abrir);
      toggle.setAttribute("aria-expanded", abrir ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        abrir ? "Fechar ferramentas de acessibilidade" : "Abrir ferramentas de acessibilidade"
      );
    }

    toggle.addEventListener("click", function () {
      abrirPainel(!root.classList.contains("setad-a11y--aberto"));
    });

    doc.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && root.classList.contains("setad-a11y--aberto")) {
        abrirPainel(false);
        toggle.focus();
      }
    });

    root.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-acao]");
      if (!btn) return;
      var acao = btn.getAttribute("data-acao");
      prefs = normalizarPrefs(lerPrefs());

      if (acao === "fonte-mais") {
        var atual = prefs.fontePct;
        var idx = ESCALAS.indexOf(atual);
        if (idx < 0) idx = 0;
        if (idx < ESCALAS.length - 1) {
          prefs.fontePct = ESCALAS[idx + 1];
          aplicarEscalaFonte(doc, prefs.fontePct);
          salvarPrefs(prefs);
        }
      } else if (acao === "fonte-menos") {
        atual = prefs.fontePct;
        idx = ESCALAS.indexOf(atual);
        if (idx < 0) idx = 0;
        if (idx > 0) {
          prefs.fontePct = ESCALAS[idx - 1];
          aplicarEscalaFonte(doc, prefs.fontePct);
          salvarPrefs(prefs);
        }
      } else if (acao === "fonte-padrao") {
        prefs.fontePct = 100;
        aplicarEscalaFonte(doc, 100);
        salvarPrefs(prefs);
      } else if (acao === "contraste") {
        prefs.contraste = !prefs.contraste;
        aplicarContraste(doc, prefs.contraste);
        btnContraste.setAttribute("aria-pressed", prefs.contraste ? "true" : "false");
        salvarPrefs(prefs);
      } else if (acao === "foco") {
        prefs.focoReforcado = !prefs.focoReforcado;
        aplicarFocoReforcado(doc, prefs.focoReforcado);
        btnFoco.setAttribute("aria-pressed", prefs.focoReforcado ? "true" : "false");
        salvarPrefs(prefs);
      } else if (acao === "vlibras") {
        carregarVLibras(doc);
      }
    });

    prefs = normalizarPrefs(prefs);
    aplicarEscalaFonte(doc, prefs.fontePct);
    aplicarContraste(doc, !!prefs.contraste);
    aplicarFocoReforcado(doc, !!prefs.focoReforcado);
    if (btnContraste) btnContraste.setAttribute("aria-pressed", prefs.contraste ? "true" : "false");
    if (btnFoco) btnFoco.setAttribute("aria-pressed", prefs.focoReforcado ? "true" : "false");

    if (prefs.vlibrasPreload) {
      carregarVLibras(doc);
    }
  }

  function init() {
    var doc = g.document;
    if (!doc || !doc.body) return;
    injetarCss(doc);
    injetarUi(doc, normalizarPrefs(lerPrefs()));
  }

  injetarCss(g.document);

  if (g.document.readyState === "loading") {
    g.document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  g.__setadCarregarAcessibilidade = init;
})(typeof window !== "undefined" ? window : globalThis);
