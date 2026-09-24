/* ============================================================
   campus-mapa-bg.js — Fundo interativo “Onde estudar” (mapa + polos)
   Atualiza automaticamente quando POLOS_SETAD em polos.js mudar
   ============================================================ */

(function () {
  "use strict";

  var INTERVALO_SINCRONIA_MS = 4000;
  var estado = {
    mapa: null,
    grupoMarcadores: null,
    marcadoresPorId: {},
    assinatura: "",
    timer: null,
    visivel: false,
    inicializado: false
  };

  function coord() {
    return window.SETADPolosCoord || null;
  }

  function polosFonte() {
    return typeof POLOS_SETAD !== "undefined" && Array.isArray(POLOS_SETAD) ? POLOS_SETAD : [];
  }

  function criarIconeCampus() {
    return L.divIcon({
      className: "campus-info__map-pin",
      html: '<span class="campus-info__map-pin-icone" aria-hidden="true"></span>',
      iconSize: [26, 34],
      iconAnchor: [13, 34]
    });
  }

  function atualizarConteudoUi(polos) {
    var countEl = document.getElementById("campusPolosCount");
    var labelEl = document.getElementById("campusPolosCountLabel");
    var regioesEl = document.getElementById("campusPolosRegioes");
    var total = polos.length;

    if (countEl) countEl.textContent = total > 0 ? String(total) : "—";

    if (labelEl) {
      labelEl.textContent =
        total === 1 ? "polo em Belém" : total > 1 ? "polos em Belém" : "polos em Belém";
    }

    if (regioesEl && coord()) {
      regioesEl.innerHTML = "";
      polos.forEach(function (polo) {
        var item = document.createElement("li");
        item.setAttribute("data-polo-id", polo.id);
        item.textContent = coord().rotuloCurtoPolo(polo);
        regioesEl.appendChild(item);
      });
    }
  }

  function destacarPoloNoMapa(poloId) {
    if (!coord()) return;
    coord().destacarMarcadoresLeaflet(estado.marcadoresPorId, poloId || null);
  }

  function montarChip(polo) {
    var chip = document.createElement("span");
    chip.className = "campus-info__chip";
    chip.setAttribute("data-polo-id", polo.id);
    chip.textContent = coord() ? coord().rotuloCurtoPolo(polo) : polo.bairro || "";
    return chip;
  }

  function renderizarTrilhaLocais(container, polos) {
    if (!container || !coord()) return;

    container.innerHTML = "";

    if (polos.length === 0) return;

    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var linhas = reduzir ? [polos] : [polos, polos.slice().reverse()];

    linhas.forEach(function (lista, indiceLinha) {
      var linha = document.createElement("div");
      linha.className =
        "campus-info__trilha-linha campus-info__trilha-linha--" + (indiceLinha % 2 === 0 ? "a" : "b");
      linha.setAttribute("data-parallax", indiceLinha === 0 ? "10" : "6");

      var trilha = document.createElement("div");
      trilha.className = "campus-info__trilha";

      var sequencia = lista.concat(lista);
      sequencia.forEach(function (polo) {
        trilha.appendChild(montarChip(polo));
      });

      linha.appendChild(trilha);
      container.appendChild(linha);
    });
  }

  function configurarHoverPolos(section) {
    if (section.dataset.campusHoverPolosBound === "1") return;
    section.dataset.campusHoverPolosBound = "1";

    section.addEventListener("mouseover", function (evento) {
      var alvo = evento.target.closest("[data-polo-id]");
      if (!alvo || !section.contains(alvo)) return;
      destacarPoloNoMapa(alvo.getAttribute("data-polo-id"));
    });

    section.addEventListener("mouseout", function (evento) {
      var alvo = evento.target.closest("[data-polo-id]");
      if (!alvo || !section.contains(alvo)) return;

      var destino = evento.relatedTarget;
      if (destino && alvo.contains(destino)) return;
      if (destino && destino.closest && destino.closest("[data-polo-id]") && section.contains(destino)) {
        return;
      }

      destacarPoloNoMapa(null);
    });
  }

  function atualizarMarcadores(polosComCoordenadas) {
    if (!estado.mapa || !estado.grupoMarcadores) return;

    var c = coord();
    estado.grupoMarcadores.clearLayers();
    estado.marcadoresPorId = {};
    var icone = criarIconeCampus();

    polosComCoordenadas.forEach(function (item) {
      var polo = item.polo;
      var marker = L.marker([item.coords.lat, item.coords.lng], { icon: icone }).addTo(
        estado.grupoMarcadores
      );

      if (polo && c) {
        var popupHtml = c.montarHtmlPopupPolo(polo, { urlPaginaPolos: "polos/" });
        marker.bindPopup(popupHtml, {
          maxWidth: 300,
          className: c.classePopupPolo(polo)
        });
      }

      if (polo && polo.id) {
        estado.marcadoresPorId[polo.id] = marker;
      }
    });

    if (polosComCoordenadas.length > 0) {
      estado.mapa.fitBounds(estado.grupoMarcadores.getBounds().pad(0.14), { animate: false });
    } else {
      var belem = coord().BELEM_COORDS;
      estado.mapa.setView([belem.lat, belem.lng], 11, { animate: false });
    }

    window.setTimeout(function () {
      if (estado.mapa) estado.mapa.invalidateSize();
    }, 80);
  }

  function inicializarMapa(container) {
    if (estado.mapa || typeof L === "undefined" || !coord()) return;

    var belem = coord().BELEM_COORDS;

    estado.mapa = L.map(container, {
      center: [belem.lat, belem.lng],
      zoom: 11,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(estado.mapa);

    estado.grupoMarcadores = L.featureGroup().addTo(estado.mapa);
    estado.inicializado = true;
    coord().configurarFecharPopupForaDoMapa(estado.mapa);
  }

  function sincronizarCampus(forcar) {
    var section = document.getElementById("campus");
    var mapaEl = document.getElementById("campusMapaBg");
    var trilhaEl = document.getElementById("campusLocaisTrilha");
    var c = coord();

    if (!section || !mapaEl || !c) return;

    var polos = polosFonte();
    var assinatura = c.criarAssinaturaPolos(polos);

    if (!forcar && assinatura === estado.assinatura) return;

    estado.assinatura = assinatura;
    atualizarConteudoUi(polos);

    if (!estado.inicializado && estado.visivel) {
      inicializarMapa(mapaEl);
    }

    if (estado.inicializado) {
      atualizarMarcadores(c.listarPolosComCoordenadas(polos));
    }

    renderizarTrilhaLocais(trilhaEl, polos);
    configurarParallax(section);
    configurarHoverPolos(section);
  }

  function configurarParallax(section) {
    if (section.dataset.campusParallaxBound === "1") return;
    section.dataset.campusParallaxBound = "1";

    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) return;

    var bg = section.querySelector(".campus-info__bg");
    var layers = section.querySelectorAll("[data-parallax]");
    var alvoX = 48;
    var alvoY = 40;
    var atualX = 48;
    var atualY = 40;

    function animarGlow() {
      atualX += (alvoX - atualX) * 0.06;
      atualY += (alvoY - atualY) * 0.06;
      if (bg) {
        bg.style.setProperty("--campus-glow-x", atualX + "%");
        bg.style.setProperty("--campus-glow-y", atualY + "%");
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

      alvoX = 18 + relX * 64;
      alvoY = 16 + relY * 62;

      layers.forEach(function (layer) {
        var profundidade = parseFloat(layer.getAttribute("data-parallax")) || 8;
        layer.style.transform =
          "translate3d(" +
          offsetX * profundidade +
          "px, " +
          offsetY * profundidade * 0.55 +
          "px, 0)";
      });
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 48;
      alvoY = 40;
      layers.forEach(function (layer) {
        layer.style.transform = "";
      });
    });
  }

  function observarVisibilidade(section) {
    if (!window.IntersectionObserver) {
      estado.visivel = true;
      sincronizarCampus(true);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          estado.visivel = entry.isIntersecting;
          if (entry.isIntersecting) {
            sincronizarCampus(true);
            if (estado.mapa) estado.mapa.invalidateSize();
          }
        });
      },
      { root: null, threshold: 0.12 }
    );

    observer.observe(section);
  }

  function iniciarSincroniaPeriodica() {
    if (estado.timer) clearInterval(estado.timer);

    estado.timer = setInterval(function () {
      if (!estado.visivel || document.hidden) return;
      sincronizarCampus(false);
    }, INTERVALO_SINCRONIA_MS);
  }

  function inicializarCampusMapaBg() {
    var section = document.getElementById("campus");
    if (!section || !coord()) return;

    sincronizarCampus(true);
    observarVisibilidade(section);
    iniciarSincroniaPeriodica();

    window.addEventListener("setad:polos-atualizado", function () {
      sincronizarCampus(true);
    });
  }

  window.SETADAtualizarCampusMapaBg = function () {
    sincronizarCampus(true);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCampusMapaBg);
  } else {
    inicializarCampusMapaBg();
  }
})();
