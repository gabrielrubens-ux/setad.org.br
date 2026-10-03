/* ============================================================
   missoes-bg.js — Fundo em crossfade + parallax (área Missões)
   ============================================================ */

(function () {
  "use strict";

  var SITE_URL = "https://boasnovas.net/";
  var CACHE_KEY = "setad_missoes_bn_bg_v2";
  var CACHE_MAX_IDADE_MS = 24 * 60 * 60 * 1000;
  var INTERVALO_SLIDE_MS = 7000;

  var IMAGENS_LOCAL = [
    "assets/images/parceiros/boas-novas-bg/insta1.jpg",
    "assets/images/parceiros/boas-novas-bg/insta2.jpg",
    "assets/images/parceiros/boas-novas-bg/insta3.jpg",
    "assets/images/parceiros/boas-novas-bg/insta4.jpg",
    "assets/images/parceiros/boas-novas-bg/heronovo-bg.png",
    "assets/images/parceiros/boas-novas-bg/cabeca.jpg",
    "assets/images/parceiros/boas-novas-bg/jornal.jpg",
    "assets/images/parceiros/boas-novas-bg/voz-ad.jpg",
    "assets/images/parceiros/boas-novas-bg/culto17.jpg"
  ];

  var estado = { indice: 0, timer: null, imagens: [] };

  function lerCache() {
    try {
      var dados = localStorage.getItem(CACHE_KEY);
      if (!dados) return null;
      var cache = JSON.parse(dados);
      if (!cache || !cache.imagens || !cache.atualizadoEm) return null;
      if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;
      return cache.imagens;
    } catch (erro) {
      return null;
    }
  }

  function salvarCache(imagens) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ atualizadoEm: Date.now(), imagens: imagens })
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
    return urls.slice(0, 8);
  }

  function mesclarImagens(remotas) {
    var vistos = {};
    var lista = [];
    IMAGENS_LOCAL.forEach(function (src) {
      vistos[src] = true;
      lista.push(src);
    });
    (remotas || []).forEach(function (src) {
      if (!vistos[src] && lista.length < 12) {
        vistos[src] = true;
        lista.push(src);
      }
    });
    return lista;
  }

  function carregarImagens() {
    return buscarHtmlSite()
      .then(function (html) {
        var remotas = extrairImagensDoHtml(html);
        var imagens = mesclarImagens(remotas);
        if (remotas.length) salvarCache(imagens);
        return imagens;
      })
      .catch(function () {
        var cache = lerCache();
        return cache && cache.length ? cache : IMAGENS_LOCAL.slice();
      });
  }

  function renderizarSlides(slideshow, imagens) {
    slideshow.innerHTML = "";
    imagens.forEach(function (src, indice) {
      var slide = document.createElement("div");
      slide.className = "missoes__slide" + (indice === 0 ? " is-active" : "");
      slide.setAttribute("data-slide-index", String(indice));

      var img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = indice < 2 ? "eager" : "lazy";
      img.decoding = "async";
      img.draggable = false;

      slide.appendChild(img);
      slideshow.appendChild(slide);
    });
    estado.imagens = imagens;
    estado.indice = 0;
  }

  function avancarSlide(slideshow) {
    var slides = slideshow.querySelectorAll(".missoes__slide");
    if (slides.length < 2) return;

    slides[estado.indice].classList.remove("is-active");
    estado.indice = (estado.indice + 1) % slides.length;
    slides[estado.indice].classList.add("is-active");
  }

  function iniciarSlideshow(slideshow) {
    if (estado.timer) clearInterval(estado.timer);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    estado.timer = setInterval(function () {
      if (!document.hidden) avancarSlide(slideshow);
    }, INTERVALO_SLIDE_MS);
  }

  function configurarParallax(section, slideshow) {
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

      slideshow.style.transform =
        "translate3d(" + (relX * 18) + "px, " + (relY * 12) + "px, 0) scale(1.04)";
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 50;
      slideshow.style.transform = "";
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
    var section = document.getElementById("missoes");
    var slideshow = document.getElementById("missoesBgSlideshow");
    if (!section || !slideshow) return;

    var cache = lerCache();
    var iniciais = cache && cache.length ? cache : IMAGENS_LOCAL;
    renderizarSlides(slideshow, iniciais);
    iniciarSlideshow(slideshow);
    configurarParallax(section, slideshow);
    configurarTiltCards(section);

    carregarImagens().then(function (imagens) {
      renderizarSlides(slideshow, imagens);
      iniciarSlideshow(slideshow);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
