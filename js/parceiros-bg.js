/* ============================================================
   parceiros-bg.js — Fundo interativo (estilo mídias sociais)
   Imagens do site Boas Novas Belém (boasnovas.net)
   ============================================================ */

(function () {
  "use strict";

  var SITE_URL = "https://boasnovas.net/";
  var CACHE_KEY = "setad_parceiros_bn_bg_v1";
  var CACHE_MAX_IDADE_MS = 24 * 60 * 60 * 1000;

  var IMAGENS_LOCAL = [
    { src: "assets/images/parceiros/boas-novas-bg/insta1.jpg", titulo: "Boas Novas Belém", tipo: "redes" },
    { src: "assets/images/parceiros/boas-novas-bg/insta2.jpg", titulo: "Boas Novas Belém", tipo: "redes" },
    { src: "assets/images/parceiros/boas-novas-bg/insta3.jpg", titulo: "Boas Novas Belém", tipo: "redes" },
    { src: "assets/images/parceiros/boas-novas-bg/insta4.jpg", titulo: "Boas Novas Belém", tipo: "redes" },
    { src: "assets/images/parceiros/boas-novas-bg/heronovo-bg.png", titulo: "TV Boas Novas", tipo: "tv" },
    { src: "assets/images/parceiros/boas-novas-bg/cabeca.jpg", titulo: "Programação", tipo: "tv" },
    { src: "assets/images/parceiros/boas-novas-bg/jornal.jpg", titulo: "Jornal do Dia", tipo: "tv" },
    { src: "assets/images/parceiros/boas-novas-bg/voz-ad.jpg", titulo: "Voz AD", tipo: "radio" },
    { src: "assets/images/parceiros/boas-novas-bg/culto17.jpg", titulo: "Ao vivo", tipo: "tv" }
  ];

  var BADGES = { tv: "TV", radio: "Rádio", redes: "Redes" };

  function lerCache() {
    try {
      var dados = localStorage.getItem(CACHE_KEY);
      if (!dados) return null;
      var cache = JSON.parse(dados);
      if (!cache || !cache.itens || !cache.atualizadoEm) return null;
      if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;
      return cache.itens;
    } catch (erro) {
      return null;
    }
  }

  function salvarCache(itens) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ atualizadoEm: Date.now(), itens: itens })
      );
    } catch (erro) {
      /* ignora */
    }
  }

  function buscarHtmlSite() {
    var proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(SITE_URL);
    return fetch(proxy, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("proxy");
      return res.text();
    });
  }

  function extrairImagensDoHtml(html) {
    var urls = [];
    var padrao =
      /https?:\/\/boasnovas\.net\/(?:novo\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)|wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|webp))/gi;
    var match;
    while ((match = padrao.exec(html)) !== null) {
      var url = match[0].replace(/^http:/, "https:");
      if (urls.indexOf(url) === -1) urls.push(url);
    }
    return urls.slice(0, 12).map(function (src, indice) {
      return {
        src: src,
        titulo: "Boas Novas",
        tipo: indice % 3 === 0 ? "tv" : indice % 3 === 1 ? "radio" : "redes"
      };
    });
  }

  function mesclarComLocal(remotas) {
    if (!remotas || !remotas.length) return IMAGENS_LOCAL.slice();
    var vistos = {};
    var resultado = [];

    IMAGENS_LOCAL.forEach(function (item) {
      vistos[item.src] = true;
      resultado.push(item);
    });

    remotas.forEach(function (item) {
      if (!vistos[item.src] && resultado.length < 15) {
        vistos[item.src] = true;
        resultado.push(item);
      }
    });

    return resultado;
  }

  function carregarImagens() {
    return buscarHtmlSite()
      .then(function (html) {
        var remotas = extrairImagensDoHtml(html);
        var itens = mesclarComLocal(remotas);
        if (remotas.length) salvarCache(itens);
        return itens;
      })
      .catch(function () {
        var cache = lerCache();
        return cache && cache.length ? cache : IMAGENS_LOCAL.slice();
      });
  }

  function criarItem(item, indice) {
    var el = document.createElement("figure");
    el.className =
      "midias__bg-item midias__bg-item--parceiro midias__bg-item--" + item.tipo;
    el.style.setProperty("--midias-item-delay", (indice * 0.35) + "s");
    el.style.setProperty("--midias-item-duracao", (18 + (indice % 5) * 2) + "s");

    var img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    var badge = document.createElement("span");
    badge.className = "midias__bg-badge";
    badge.textContent = BADGES[item.tipo] || "BN";

    el.appendChild(img);
    el.appendChild(badge);
    return el;
  }

  function montarColuna(itens, indiceColuna) {
    var coluna = document.createElement("div");
    coluna.className = "midias__bg-coluna midias__bg-coluna--" + indiceColuna;
    coluna.setAttribute("data-parallax", String(8 + indiceColuna * 4));

    var trilha = document.createElement("div");
    trilha.className = "midias__bg-trilha";

    itens.forEach(function (item, indice) {
      trilha.appendChild(criarItem(item, indice + indiceColuna * 3));
    });
    itens.forEach(function (item, indice) {
      trilha.appendChild(criarItem(item, indice + indiceColuna * 3 + 0.5));
    });

    coluna.appendChild(trilha);
    return coluna;
  }

  function distribuirColunas(itens) {
    var colunas = [[], [], []];
    itens.forEach(function (item, indice) {
      colunas[indice % 3].push(item);
    });
    return colunas;
  }

  function renderizarGaleria(gallery, itens) {
    var colunas = distribuirColunas(itens);
    gallery.innerHTML = "";
    colunas.forEach(function (lista, indice) {
      if (lista.length) gallery.appendChild(montarColuna(lista, indice));
    });
  }

  function configurarParallax(section) {
    if (section.dataset.parallaxBound === "1") return;
    section.dataset.parallaxBound = "1";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var bg = section.querySelector(".midias__bg");
    var layers = section.querySelectorAll("[data-parallax]");
    var alvoX = 50;
    var alvoY = 42;
    var atualX = 50;
    var atualY = 42;

    function animarGlow() {
      atualX += (alvoX - atualX) * 0.06;
      atualY += (alvoY - atualY) * 0.06;
      if (bg) {
        bg.style.setProperty("--midias-glow-x", atualX + "%");
        bg.style.setProperty("--midias-glow-y", atualY + "%");
      }
      requestAnimationFrame(animarGlow);
    }

    requestAnimationFrame(animarGlow);

    section.addEventListener("mousemove", function (evento) {
      var rect = section.getBoundingClientRect();
      var relX = (evento.clientX - rect.left) / rect.width;
      var relY = (evento.clientY - rect.top) / rect.height;
      var offsetX = relX - 0.5;
      var offsetY = relY - 0.5;

      alvoX = 24 + relX * 52;
      alvoY = 20 + relY * 56;

      layers.forEach(function (layer) {
        var profundidade = parseFloat(layer.getAttribute("data-parallax")) || 8;
        layer.style.transform =
          "translate3d(" + (offsetX * profundidade) + "px, " +
          (offsetY * profundidade * 0.6) + "px, 0)";
      });
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 42;
      layers.forEach(function (layer) {
        layer.style.transform = "";
      });
    });
  }

  function inicializar() {
    var section = document.getElementById("parceiros");
    var gallery = document.getElementById("parceirosBgGallery");
    if (!section || !gallery) return;

    var cache = lerCache();
    if (cache && cache.length) {
      renderizarGaleria(gallery, cache);
      configurarParallax(section);
    } else {
      renderizarGaleria(gallery, IMAGENS_LOCAL);
      configurarParallax(section);
    }

    carregarImagens().then(function (itens) {
      renderizarGaleria(gallery, itens);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
