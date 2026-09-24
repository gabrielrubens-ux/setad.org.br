/* ============================================================
   polos-mapa.js — Mapa interativo dos polos (Leaflet + OSM)
   Lê automaticamente de POLOS_SETAD em polos.js
   ============================================================ */

const BELEM_COORDS = window.SETADPolosCoord.BELEM_COORDS;

const marcadoresPolosPorId = {};
let mapaPolosInstancia = null;

function criarIconePolo() {
  return L.divIcon({
    className: "polos-mapa__pin",
    html: '<span class="polos-mapa__pin-icone" aria-hidden="true"></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32]
  });
}

function destacarPoloNoMapaPolos(poloId) {
  window.SETADPolosCoord.destacarMarcadoresLeaflet(marcadoresPolosPorId, poloId || null);
}

function marcarPoloAtivoNaLista(poloId) {
  document.querySelectorAll(".polo-card--ativo").forEach(function (card) {
    card.classList.remove("polo-card--ativo");
  });

  if (!poloId) return;

  const card = document.getElementById("polo-" + poloId);
  if (!card) return;

  card.classList.add("polo-card--ativo");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function focarPoloNoMapa(poloId, abrirPopup) {
  const marker = marcadoresPolosPorId[poloId];
  const mapa = mapaPolosInstancia;
  if (!marker || !mapa) return;

  const alvo = marker.getLatLng();
  const zoom = Math.max(mapa.getZoom(), 14);
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduzir) {
    mapa.setView(alvo, zoom);
  } else {
    mapa.flyTo(alvo, zoom, { duration: 0.65 });
  }

  if (abrirPopup) {
    window.setTimeout(function () {
      marker.openPopup();
    }, 420);
  }

  destacarPoloNoMapaPolos(poloId);
  marcarPoloAtivoNaLista(poloId);
}

function vincularHoverCardsAoMapa() {
  document.querySelectorAll(".polo-card[id^='polo-']").forEach(function (card) {
    if (card.dataset.mapaHoverBound === "1") return;
    card.dataset.mapaHoverBound = "1";

    const poloId = card.id.replace(/^polo-/, "");

    card.addEventListener("mouseenter", function () {
      destacarPoloNoMapaPolos(poloId);
    });

    card.addEventListener("mouseleave", function () {
      if (!card.classList.contains("polo-card--ativo")) {
        destacarPoloNoMapaPolos(null);
      }
    });

    card.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) return;
      focarPoloNoMapa(poloId, true);
    });

    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("keydown", function (evento) {
      if (evento.key !== "Enter" && evento.key !== " ") return;
      evento.preventDefault();
      focarPoloNoMapa(poloId, true);
    });
  });
}

function renderizarMapaPolos(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof L === "undefined" || !Array.isArray(POLOS_SETAD)) return;

  const polosComCoordenadas = window.SETADPolosCoord.listarPolosComCoordenadas(POLOS_SETAD);

  if (polosComCoordenadas.length === 0) {
    container.innerHTML =
      '<p class="polos-mapa__vazio">O mapa será exibido quando os polos tiverem localização cadastrada.</p>';
    return;
  }

  const mapa = L.map(container, {
    scrollWheelZoom: true,
    zoomControl: true
  }).setView([BELEM_COORDS.lat, BELEM_COORDS.lng], 12);

  mapaPolosInstancia = mapa;

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  const grupoMarcadores = L.featureGroup();
  const icone = criarIconePolo();

  Object.keys(marcadoresPolosPorId).forEach(function (chave) {
    delete marcadoresPolosPorId[chave];
  });

  polosComCoordenadas.forEach(function (item) {
    const polo = item.polo;
    const popupHtml = window.SETADPolosCoord.montarHtmlPopupPolo(polo, { incluirLinkCard: true });
    const popupClass = window.SETADPolosCoord.classePopupPolo(polo);

    const marker = L.marker([item.coords.lat, item.coords.lng], { icon: icone })
      .bindPopup(popupHtml, { maxWidth: 300, className: popupClass })
      .addTo(grupoMarcadores);

    if (polo.id) {
      marcadoresPolosPorId[polo.id] = marker;
      marker.on("click", function () {
        focarPoloNoMapa(polo.id, false);
      });
    }
  });

  grupoMarcadores.addTo(mapa);
  mapa.fitBounds(grupoMarcadores.getBounds().pad(0.12));
  window.SETADPolosCoord.configurarFecharPopupForaDoMapa(mapa);

  window.setTimeout(function () {
    mapa.invalidateSize();
    vincularHoverCardsAoMapa();
  }, 120);

  window.addEventListener("resize", function () {
    mapa.invalidateSize();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  renderizarMapaPolos("polosMapa");

  document.addEventListener("click", function (evento) {
    const link = evento.target.closest(".polos-mapa__popup-link--card");
    if (!link) return;

    const id = link.getAttribute("href").replace("#polo-", "");
    const card = document.getElementById("polo-" + id);
    if (!card) return;

    evento.preventDefault();
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("polo-card--destaque-mapa");
    window.setTimeout(function () {
      card.classList.remove("polo-card--destaque-mapa");
    }, 2200);
  });
});
