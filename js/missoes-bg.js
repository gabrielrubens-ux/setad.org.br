/* ============================================================
   missoes-bg.js — Fundo dividido por parceiro (extensível)
   Cada .missoes__card com data-missao-parceiro recebe um painel.
   ============================================================ */

(function () {
  "use strict";

  var INTERVALO_SLIDE_MS = 9000;
  var CACHE_PREFIX = "setad_missoes_bg_";
  var CACHE_MAX_IDADE_MS = 24 * 60 * 60 * 1000;

  /**
   * Novo parceiro: inclua aqui + card no HTML com o mesmo id em data-missao-parceiro.
   */
  var PARCEIROS = {
    "boas-novas": {
      siteUrl: "https://boasnovas.net/",
      imagensLocal: [
        "assets/images/parceiros/boas-novas-bg/insta1.jpg",
        "assets/images/parceiros/boas-novas-bg/insta2.jpg",
        "assets/images/parceiros/boas-novas-bg/insta3.jpg",
        "assets/images/parceiros/boas-novas-bg/insta4.jpg",
        "assets/images/parceiros/boas-novas-bg/heronovo-bg.png",
        "assets/images/parceiros/boas-novas-bg/cabeca.jpg",
        "assets/images/parceiros/boas-novas-bg/jornal.jpg",
        "assets/images/parceiros/boas-novas-bg/voz-ad.jpg"
      ],
      extrairImagens: function (html) {
        var urls = [];
        var padrao =
          /https?:\/\/boasnovas\.net\/(?:novo\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)|wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|webp))/gi;
        var match;
        while ((match = padrao.exec(html)) !== null) {
          var url = match[0].replace(/^http:/, "https:");
          if (urls.indexOf(url) === -1) urls.push(url);
        }
        return urls.slice(0, 6);
      }
    },
    pecc: {
      siteUrl: "https://educacaocristacontinuada.com.br/",
      imagensLocal: [
        "assets/images/parceiros/pecc-bg/banner-1.jpg",
        "assets/images/parceiros/pecc-bg/banner-2.jpg",
        "assets/images/parceiros/pecc-bg/banner-3.jpg",
        "assets/images/parceiros/pecc-bg/banner-4.jpg",
        "assets/images/parceiros/pecc-bg/banner-5.jpg",
        "assets/images/parceiros/pecc-bg/banner-6.jpg"
      ],
      extrairImagens: function (html) {
        var urls = [];
        var padrao =
          /https?:\/\/educacaocristacontinuada\.com\.br\/(?:img-render\/[^"'\s]+\.(?:jpg|jpeg|png|webp)|img\/site\/[^"'\s]+\.(?:jpg|jpeg|png|webp))/gi;
        var match;
        while ((match = padrao.exec(html)) !== null) {
          var url = match[0].replace(/^http:/, "https:");
          if (urls.indexOf(url) === -1) urls.push(url);
        }
        return urls.slice(0, 6);
      }
    },
    fbnovas: {
      siteUrl: "https://fbnovas.edu.br/site/",
      imagensLocal: [
        "assets/images/parceiros/fbnovas-bg/img-1.jpg",
        "assets/images/parceiros/fbnovas-bg/img-2.jpeg",
        "assets/images/parceiros/fbnovas-bg/img-3.jpg",
        "assets/images/parceiros/fbnovas-bg/img-4.jpg",
        "assets/images/parceiros/fbnovas-bg/img-5.png"
      ],
      extrairImagens: function (html) {
        var urls = [];
        var padrao =
          /https?:\/\/fbnovas\.edu\.br\/site\/wp-content\/uploads\/[^"'\s)]+\.(?:jpg|jpeg|png|webp)/gi;
        var match;
        while ((match = padrao.exec(html)) !== null) {
          var url = match[0].replace(/^http:/, "https:");
          if (urls.indexOf(url) === -1 && !/logo|icon|qrcode|cropped-20-ANOS/i.test(url)) {
            urls.push(url);
          }
        }
        return urls.slice(0, 6);
      }
    }
  };

  var estado = {
    timers: {},
    indices: {},
    parceirosAtivos: []
  };

  function lerCache(id) {
    try {
      var dados = localStorage.getItem(CACHE_PREFIX + id);
      if (!dados) return null;
      var cache = JSON.parse(dados);
      if (!cache || !cache.imagens || !cache.atualizadoEm) return null;
      if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;
      return cache.imagens;
    } catch (erro) {
      return null;
    }
  }

  function salvarCache(id, imagens) {
    try {
      localStorage.setItem(
        CACHE_PREFIX + id,
        JSON.stringify({ atualizadoEm: Date.now(), imagens: imagens })
      );
    } catch (erro) {
      /* ignora */
    }
  }

  function buscarHtml(url) {
    var proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    return fetch(proxy, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("proxy");
      return res.text();
    });
  }

  function mesclarImagens(locais, remotas) {
    var vistos = {};
    var lista = [];
    (locais || []).forEach(function (src) {
      vistos[src] = true;
      lista.push(src);
    });
    (remotas || []).forEach(function (src) {
      if (!vistos[src] && lista.length < 10) {
        vistos[src] = true;
        lista.push(src);
      }
    });
    return lista.length ? lista : locais.slice();
  }

  function carregarImagensParceiro(id, config) {
    return buscarHtml(config.siteUrl)
      .then(function (html) {
        var remotas = config.extrairImagens(html);
        var imagens = mesclarImagens(config.imagensLocal, remotas);
        if (remotas.length) salvarCache(id, imagens);
        return imagens;
      })
      .catch(function () {
        var cache = lerCache(id);
        return cache && cache.length ? cache : config.imagensLocal.slice();
      });
  }

  function renderizarSlides(slideshow, imagens, id) {
    slideshow.innerHTML = "";
    imagens.forEach(function (src, indice) {
      var slide = document.createElement("div");
      slide.className = "missoes__slide" + (indice === 0 ? " is-active" : "");

      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = indice < 1 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;

      slide.appendChild(img);
      slideshow.appendChild(slide);
    });
    estado.indices[id] = 0;
  }

  function avancarSlide(slideshow, id) {
    var slides = slideshow.querySelectorAll(".missoes__slide");
    if (slides.length < 2) return;

    var indice = estado.indices[id] || 0;
    slides[indice].classList.remove("is-active");
    indice = (indice + 1) % slides.length;
    slides[indice].classList.add("is-active");
    estado.indices[id] = indice;
  }

  function iniciarSlideshow(slideshow, id) {
    if (estado.timers[id]) clearInterval(estado.timers[id]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    estado.timers[id] = setInterval(function () {
      if (!document.hidden) avancarSlide(slideshow, id);
    }, INTERVALO_SLIDE_MS);
  }

  function criarPainel(id) {
    var config = PARCEIROS[id];
    if (!config) return null;

    var pane = document.createElement("div");
    pane.className = "missoes__pane missoes__pane--" + id;
    pane.setAttribute("data-missao-pane", id);

    var slideshow = document.createElement("div");
    slideshow.className = "missoes__slideshow";
    slideshow.setAttribute("data-missao-slideshow", id);

    var tint = document.createElement("div");
    tint.className = "missoes__pane-tint";
    tint.setAttribute("aria-hidden", "true");

    pane.appendChild(slideshow);
    pane.appendChild(tint);
    return { pane: pane, slideshow: slideshow };
  }

  function obterIdsDaPagina(section) {
    var cards = section.querySelectorAll(".missoes__card[data-missao-parceiro]");
    var ids = [];
    cards.forEach(function (card) {
      var id = card.getAttribute("data-missao-parceiro");
      if (id && PARCEIROS[id] && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function montarPaineis(section, container, ids) {
    container.innerHTML = "";
    estado.parceirosAtivos = ids;

    ids.forEach(function (id) {
      var partes = criarPainel(id);
      if (!partes) return;

      container.appendChild(partes.pane);

      var cache = lerCache(id);
      var iniciais =
        cache && cache.length ? cache : PARCEIROS[id].imagensLocal.slice();
      renderizarSlides(partes.slideshow, iniciais, id);
      iniciarSlideshow(partes.slideshow, id);

      carregarImagensParceiro(id, PARCEIROS[id]).then(function (imagens) {
        renderizarSlides(partes.slideshow, imagens, id);
        iniciarSlideshow(partes.slideshow, id);
      });
    });

    container.style.setProperty("--missoes-pane-count", String(ids.length));
  }

  function definirFoco(section, id) {
    if (!id) {
      section.removeAttribute("data-missao-focus");
      return;
    }
    section.setAttribute("data-missao-focus", id);
  }

  function configurarFocoCards(section) {
    var cards = section.querySelectorAll(".missoes__card[data-missao-parceiro]");

    cards.forEach(function (card) {
      var id = card.getAttribute("data-missao-parceiro");

      card.addEventListener("mouseenter", function () {
        definirFoco(section, id);
      });
      card.addEventListener("focus", function () {
        definirFoco(section, id);
      });
    });

    section.addEventListener("mouseleave", function () {
      definirFoco(section, null);
    });
  }

  function configurarParallax(section, container) {
    if (section.dataset.parallaxBound === "1") return;
    section.dataset.parallaxBound = "1";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var aurora = section.querySelector(".missoes__bg-aurora");
    var alvoX = 50;
    var alvoY = 50;
    var atualX = 50;
    var atualY = 50;

    function animarAurora() {
      atualX += (alvoX - atualX) * 0.07;
      atualY += (alvoY - atualY) * 0.07;
      if (aurora) {
        aurora.style.setProperty("--missoes-aurora-x", atualX + "%");
        aurora.style.setProperty("--missoes-aurora-y", atualY + "%");
      }
      requestAnimationFrame(animarAurora);
    }

    requestAnimationFrame(animarAurora);

    section.addEventListener("mousemove", function (evento) {
      var rect = section.getBoundingClientRect();
      var relX = (evento.clientX - rect.left) / rect.width - 0.5;
      var relY = (evento.clientY - rect.top) / rect.height - 0.5;

      alvoX = 30 + (relX + 0.5) * 40;
      alvoY = 25 + (relY + 0.5) * 50;

      container.style.transform =
        "translate3d(" + (relX * 10) + "px, " + (relY * 8) + "px, 0)";
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 50;
      container.style.transform = "";
    });
  }

  function configurarTiltCards(section) {
    var cards = section.querySelectorAll(".missoes__card");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (evento) {
        var rect = card.getBoundingClientRect();
        var x = (evento.clientX - rect.left) / rect.width - 0.5;
        var y = (evento.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--missoes-tilt-x", String(y * -10));
        card.style.setProperty("--missoes-tilt-y", String(x * 12));
      });

      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--missoes-tilt-x", "0");
        card.style.setProperty("--missoes-tilt-y", "0");
      });
    });
  }

  function inicializar() {
    var section = document.getElementById("parceiros");
    var container = document.getElementById("missoesBgPanes");
    if (!section || !container) return;

    var ids = obterIdsDaPagina(section);
    if (!ids.length) return;

    montarPaineis(section, container, ids);
    configurarFocoCards(section);
    configurarParallax(section, container);
    configurarTiltCards(section);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
