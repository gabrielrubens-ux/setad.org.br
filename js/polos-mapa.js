/* ============================================================
   polos-mapa.js — Mapa interativo dos polos (Leaflet + OSM)
   Lê automaticamente de POLOS_SETAD em polos.js
   ============================================================ */

const BELEM_COORDS = { lat: -1.4558, lng: -48.4902 };

function obterCoordenadasPolo(polo) {
  if (polo.lat != null && polo.lng != null) {
    return { lat: Number(polo.lat), lng: Number(polo.lng) };
  }

  if (!polo.mapsUrl) return null;

  const matchPreciso = polo.mapsUrl.match(/!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (matchPreciso) {
    return { lat: parseFloat(matchPreciso[1]), lng: parseFloat(matchPreciso[2]) };
  }

  const matchArroba = polo.mapsUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (matchArroba) {
    return { lat: parseFloat(matchArroba[1]), lng: parseFloat(matchArroba[2]) };
  }

  return null;
}

function montarEnderecoPolo(polo) {
  return [
    polo.endereco,
    polo.bairro,
    polo.cidade && polo.estado ? polo.cidade + "/" + polo.estado : polo.cidade
  ].filter(Boolean).join(" - ");
}

function criarIconePolo() {
  return L.divIcon({
    className: "polos-mapa__pin",
    html: '<span class="polos-mapa__pin-icone" aria-hidden="true"></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32]
  });
}

function renderizarMapaPolos(containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof L === "undefined" || !Array.isArray(POLOS_SETAD)) return;

  const polosComCoordenadas = POLOS_SETAD.map(function (polo) {
    const coords = obterCoordenadasPolo(polo);
    return coords ? { polo: polo, coords: coords } : null;
  }).filter(Boolean);

  if (polosComCoordenadas.length === 0) {
    container.innerHTML =
      '<p class="polos-mapa__vazio">O mapa será exibido quando os polos tiverem localização cadastrada.</p>';
    return;
  }

  const mapa = L.map(container, {
    scrollWheelZoom: true,
    zoomControl: true
  }).setView([BELEM_COORDS.lat, BELEM_COORDS.lng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);

  const grupoMarcadores = L.featureGroup();
  const icone = criarIconePolo();

  polosComCoordenadas.forEach(function (item) {
    const polo = item.polo;
    const endereco = montarEnderecoPolo(polo);
    const local = polo.local
      ? '<p class="polos-mapa__popup-local">' + escaparHtml(polo.local) + "</p>"
      : "";
    const linkMaps = polo.mapsUrl
      ? '<a href="' + escaparHtml(polo.mapsUrl) + '" class="polos-mapa__popup-link" target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a>'
      : "";
    const linkCard =
      '<a href="#polo-' + escaparHtml(polo.id) + '" class="polos-mapa__popup-link polos-mapa__popup-link--card">Ver card do polo</a>';

    const popupHtml =
      '<div class="polos-mapa__popup">' +
        '<strong class="polos-mapa__popup-titulo">' + escaparHtml(polo.nome) + "</strong>" +
        local +
        (endereco ? '<p class="polos-mapa__popup-endereco">' + escaparHtml(endereco) + "</p>" : "") +
        '<div class="polos-mapa__popup-acoes">' + linkCard + linkMaps + "</div>" +
      "</div>";

    L.marker([item.coords.lat, item.coords.lng], { icon: icone })
      .bindPopup(popupHtml, { maxWidth: 280, className: "polos-mapa__popup-wrap" })
      .addTo(grupoMarcadores);
  });

  grupoMarcadores.addTo(mapa);
  mapa.fitBounds(grupoMarcadores.getBounds().pad(0.12));

  window.setTimeout(function () {
    mapa.invalidateSize();
  }, 120);
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
