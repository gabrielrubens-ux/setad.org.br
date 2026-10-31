/**
 * Nossa História — álbuns fotográficos na landing page (SETAD / igreja).
 * Cada item em ALBUNS gera um bloco com título + faixa horizontal de fotos.
 */
(function () {
  "use strict";

  function baseImagensAlbum(slug) {
    var pasta = "assets/images/historia/" + slug + "/";
    if (window.location.protocol === "file:") {
      return pasta;
    }
    return "/" + pasta;
  }

  /**
   * Novos álbuns: inclua objeto com id, titulo, descricao (opcional), slug da pasta e fotos.
   */
  function montarAlbunsData() {
    var slug = "posse-pr-samuel-camara";
    var base = baseImagensAlbum(slug);
    return [
      {
        id: slug,
        titulo: "Posse Pr. Samuel Câmara",
        descricao:
          "Registros da posse pastoral e momentos da celebração na Assembleia de Deus em Belém — memória compartilhada entre a igreja e a formação teológica do SETAD.",
        fotos: [
          { src: base + "01.jpg", legenda: "Multidão reunida em evento público ao ar livre." },
          { src: base + "02.jpg", legenda: "Momento solene com lideranças durante a celebração." },
          { src: base + "03.jpg", legenda: "Cumprimento e abraço no altar." },
          { src: base + "04.jpg", legenda: "Participação do coral no culto." },
          { src: base + "05.jpg", legenda: "Lideranças conduzindo o louvor no altar." },
          { src: base + "06.jpg", legenda: "Palco com lideranças e símbolo da missão." },
          { src: base + "07.jpg", legenda: "Mesa decorada e púlpito durante a cerimônia." },
          { src: base + "08.jpg", legenda: "Abraço fraterno entre pastores." },
          { src: base + "09.jpg", legenda: "Retrato de lideranças e família ministerial." },
          { src: base + "10.jpg", legenda: "Encontro oficial com bandeira e lideranças." },
        ],
      },
    ];
  }

  var ALBUNS = montarAlbunsData();

  var estado = {
    albumId: ALBUNS[0] ? ALBUNS[0].id : "",
    indiceLightbox: 0,
  };

  function albumPorId(id) {
    for (var i = 0; i < ALBUNS.length; i++) {
      if (ALBUNS[i].id === id) return ALBUNS[i];
    }
    return ALBUNS[0] || null;
  }

  function albumAtual() {
    return albumPorId(estado.albumId) || ALBUNS[0] || { fotos: [], titulo: "" };
  }

  function esc(texto) {
    var el = document.createElement("span");
    el.textContent = texto == null ? "" : String(texto);
    return el.innerHTML;
  }

  function abrirLightbox(albumId, indice) {
    var overlay = document.getElementById("historiaLightbox");
    if (!overlay) return;
    estado.albumId = albumId;
    estado.indiceLightbox = indice;
    atualizarLightbox();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("historia-lightbox-aberta");
    var fechar = document.getElementById("historiaLightboxFechar");
    if (fechar) fechar.focus();
  }

  function fecharLightbox() {
    var overlay = document.getElementById("historiaLightbox");
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("historia-lightbox-aberta");
  }

  function atualizarLightbox() {
    var album = albumAtual();
    var fotos = album.fotos || [];
    if (!fotos.length) return;

    var indice = estado.indiceLightbox;
    if (indice < 0) indice = 0;
    if (indice >= fotos.length) indice = fotos.length - 1;
    estado.indiceLightbox = indice;

    var foto = fotos[indice];
    var img = document.getElementById("historiaLightboxImg");
    var legenda = document.getElementById("historiaLightboxLegenda");
    var contador = document.getElementById("historiaLightboxContador");
    var titulo = document.getElementById("historiaLightboxTitulo");

    if (titulo) titulo.textContent = album.titulo;
    if (img) {
      img.src = foto.src;
      img.alt = album.titulo + " — " + foto.legenda;
    }
    if (legenda) legenda.textContent = foto.legenda;
    if (contador) contador.textContent = indice + 1 + " / " + fotos.length;
  }

  function navegarLightbox(delta) {
    var album = albumAtual();
    var total = (album.fotos || []).length;
    if (!total) return;
    estado.indiceLightbox = (estado.indiceLightbox + delta + total) % total;
    atualizarLightbox();
  }

  function montarAlbunsLista(root) {
    var lista = root.querySelector("[data-historia-albuns-lista]");
    if (!lista) return;
    lista.innerHTML = "";

    ALBUNS.forEach(function (album) {
      var bloco = document.createElement("article");
      bloco.className = "historia-album-block";
      bloco.setAttribute("aria-labelledby", "historia-album-" + album.id);

      var cabecalho = document.createElement("header");
      cabecalho.className = "historia-album-block__cabecalho";
      cabecalho.innerHTML =
        '<h3 class="historia-album-block__titulo" id="historia-album-' +
        esc(album.id) +
        '">' +
        esc(album.titulo) +
        "</h3>" +
        (album.descricao
          ? '<p class="historia-album-block__desc">' + esc(album.descricao) + "</p>"
          : "");

      var trilha = document.createElement("div");
      trilha.className = "historia-scroll";
      trilha.setAttribute("role", "list");
      trilha.setAttribute("aria-label", "Fotos — " + album.titulo);
      trilha.setAttribute("tabindex", "0");

      (album.fotos || []).forEach(function (foto, indice) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "historia-thumb";
        btn.setAttribute("role", "listitem");
        btn.setAttribute("aria-label", "Ampliar: " + foto.legenda);
        btn.innerHTML =
          '<span class="historia-thumb__frame">' +
          '<img src="' +
          esc(foto.src) +
          '" alt="' +
          esc(album.titulo + " — foto " + (indice + 1)) +
          '" width="320" height="240" loading="lazy" decoding="async" draggable="false">' +
          '<span class="historia-thumb__veil" aria-hidden="true"></span>' +
          '<span class="historia-thumb__zoom" aria-hidden="true">+</span>' +
          "</span>" +
          '<span class="historia-thumb__legenda">' +
          esc(foto.legenda) +
          "</span>";

        btn.addEventListener("click", function () {
          abrirLightbox(album.id, indice);
        });

        trilha.appendChild(btn);
      });

      bloco.appendChild(cabecalho);
      bloco.appendChild(trilha);
      lista.appendChild(bloco);
    });
  }

  function initLightboxUi() {
    var fecharBtn = document.getElementById("historiaLightboxFechar");
    var prevBtn = document.getElementById("historiaLightboxPrev");
    var nextBtn = document.getElementById("historiaLightboxNext");
    var backdrop = document.getElementById("historiaLightboxBackdrop");
    var dialog = document.querySelector("#historiaLightbox .historia-lightbox__dialog");

    if (fecharBtn) fecharBtn.addEventListener("click", fecharLightbox);
    if (backdrop) backdrop.addEventListener("click", fecharLightbox);
    if (prevBtn) {
      prevBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        navegarLightbox(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        navegarLightbox(1);
      });
    }
    if (dialog) {
      dialog.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    }

    document.addEventListener("keydown", function (ev) {
      var overlay = document.getElementById("historiaLightbox");
      if (!overlay || overlay.hidden) return;
      if (ev.key === "Escape") {
        ev.preventDefault();
        fecharLightbox();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        navegarLightbox(-1);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        navegarLightbox(1);
      }
    });
  }

  function initFundoInterativo() {
    var section = document.getElementById("historia");
    if (!section || section.dataset.historiaBgBound === "1") return;
    section.dataset.historiaBgBound = "1";

    montarFundoFilm(section);

    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) return;

    var aurora = section.querySelector("[data-historia-aurora]");
    var alvoX = 50;
    var alvoY = 42;
    var atualX = 50;
    var atualY = 42;

    function animarSpot() {
      atualX += (alvoX - atualX) * 0.06;
      atualY += (alvoY - atualY) * 0.06;
      section.style.setProperty("--historia-spot-x", atualX + "%");
      section.style.setProperty("--historia-spot-y", atualY + "%");
      requestAnimationFrame(animarSpot);
    }

    requestAnimationFrame(animarSpot);

    section.addEventListener("mousemove", function (evento) {
      var rect = section.getBoundingClientRect();
      var relX = (evento.clientX - rect.left) / rect.width;
      var relY = (evento.clientY - rect.top) / rect.height;
      alvoX = 18 + relX * 64;
      alvoY = 12 + relY * 72;
      if (aurora) {
        aurora.style.transform =
          "translate3d(" + ((relX - 0.5) * 18) + "px, " + ((relY - 0.5) * 12) + "px, 0)";
      }
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 42;
      if (aurora) aurora.style.transform = "";
    });
  }

  function montarFundoFilm(section) {
    var container = section.querySelector("[data-historia-bg-film]");
    if (!container) return;

    var fotos = [];
    ALBUNS.forEach(function (album) {
      (album.fotos || []).forEach(function (foto) {
        fotos.push(foto.src);
      });
    });
    if (!fotos.length) return;

    container.innerHTML = "";
    var colunas = 3;

    for (var c = 0; c < colunas; c++) {
      var col = document.createElement("div");
      col.className = "historia__bg-col historia__bg-col--" + c;

      var trilha = document.createElement("div");
      trilha.className = "historia__bg-trilha";

      var listaCol = [];
      for (var i = c; i < fotos.length; i += colunas) {
        listaCol.push(fotos[i]);
      }
      if (!listaCol.length) listaCol = fotos.slice();

      var repetidas = listaCol.concat(listaCol);
      repetidas.forEach(function (src, idx) {
        var frame = document.createElement("figure");
        frame.className = "historia__bg-frame";
        frame.style.setProperty("--historia-ken-dur", 16 + (idx % 4) * 5 + "s");
        frame.style.setProperty("--historia-ken-delay", idx * 0.35 + "s");
        frame.innerHTML =
          '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async" draggable="false">';
        trilha.appendChild(frame);
      });

      col.appendChild(trilha);
      container.appendChild(col);
    }
  }

  function init() {
    var root = document.querySelector("[data-historia-app]");
    if (!root) return;
    initFundoInterativo();
    montarAlbunsLista(root);
    initLightboxUi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
