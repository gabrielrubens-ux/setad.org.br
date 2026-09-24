/* ============================================================
   polos-coordenadas.js — Coordenadas e utilitários dos polos
   Compartilhado entre polos-mapa.js e campus-mapa-bg.js
   ============================================================ */

(function (global) {
  "use strict";

  var BELEM_COORDS = { lat: -1.4558, lng: -48.4902 };

  function obterCoordenadasPolo(polo) {
    if (!polo) return null;

    if (polo.lat != null && polo.lng != null) {
      return { lat: Number(polo.lat), lng: Number(polo.lng) };
    }

    if (!polo.mapsUrl) return null;

    var matchPreciso = polo.mapsUrl.match(/!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (matchPreciso) {
      return { lat: parseFloat(matchPreciso[1]), lng: parseFloat(matchPreciso[2]) };
    }

    var matchArroba = polo.mapsUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
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
    ]
      .filter(Boolean)
      .join(" - ");
  }

  function listarPolosComCoordenadas(polos) {
    if (!Array.isArray(polos)) return [];

    return polos
      .map(function (polo) {
        var coords = obterCoordenadasPolo(polo);
        return coords ? { polo: polo, coords: coords } : null;
      })
      .filter(Boolean);
  }

  function criarAssinaturaPolos(polos) {
    if (!Array.isArray(polos)) return "";

    return polos
      .map(function (polo) {
        var coords = obterCoordenadasPolo(polo);
        var parteCoords = coords ? coords.lat + "," + coords.lng : "";
        return [polo.id || "", polo.bairro || "", polo.nome || "", parteCoords].join(";");
      })
      .join("|");
  }

  function listarBairrosUnicos(polos) {
    if (!Array.isArray(polos)) return [];
    var vistos = {};
    var lista = [];

    polos.forEach(function (polo) {
      var bairro = (polo.bairro || "").trim();
      if (!bairro || vistos[bairro]) return;
      vistos[bairro] = true;
      lista.push(bairro);
    });

    return lista;
  }

  function rotuloCurtoPolo(polo) {
    if (!polo) return "";
    if (polo.nome) {
      return String(polo.nome).replace(/^Polo\s+/i, "");
    }
    return polo.bairro || "";
  }

  function escaparTextoHtml(texto) {
    if (texto == null) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function urlImagemPolo(polo) {
    if (!polo || !polo.imagem) return "";

    var src = String(polo.imagem);
    if (/^https?:\/\//i.test(src)) return src;
    if (src.indexOf("../") === 0) return "/" + src.replace(/^\.\.\//, "");
    if (src.charAt(0) !== "/") return "/" + src;
    return src;
  }

  /**
   * @param {object} opcoes
   * @param {boolean} [opcoes.incluirLinkCard] — link âncora para o card na mesma página
   * @param {string} [opcoes.urlPaginaPolos] — ex.: "polos/" na home
   */
  function montarHtmlPopupPolo(polo, opcoes) {
    opcoes = opcoes || {};
    var endereco = montarEnderecoPolo(polo);
    var imagemUrl = urlImagemPolo(polo);
    var nome = escaparTextoHtml(polo.nome || "");
    var local = polo.local
      ? '<p class="polos-mapa__popup-local">' + escaparTextoHtml(polo.local) + "</p>"
      : "";
    var enderecoHtml = endereco
      ? '<p class="polos-mapa__popup-endereco">' + escaparTextoHtml(endereco) + "</p>"
      : "";

    var links = [];
    if (opcoes.incluirLinkCard && polo.id) {
      links.push(
        '<a href="#polo-' +
          escaparTextoHtml(polo.id) +
          '" class="polos-mapa__popup-link polos-mapa__popup-link--card">Ver card do polo</a>'
      );
    }
    if (opcoes.urlPaginaPolos && polo.id) {
      var base = opcoes.urlPaginaPolos.replace(/\/?$/, "/");
      links.push(
        '<a href="' +
          escaparTextoHtml(base + "#polo-" + polo.id) +
          '" class="polos-mapa__popup-link">Ver na página de polos</a>'
      );
    }
    if (polo.mapsUrl) {
      links.push(
        '<a href="' +
          escaparTextoHtml(polo.mapsUrl) +
          '" class="polos-mapa__popup-link" target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a>'
      );
    }

    var acoes =
      links.length > 0
        ? '<div class="polos-mapa__popup-acoes">' + links.join("") + "</div>"
        : "";

    var fotoHtml = "";
    if (imagemUrl) {
      fotoHtml =
        '<div class="polos-mapa__popup-foto-wrap">' +
          '<div class="polos-mapa__popup-foto" style="background-image:url(&quot;' +
          escaparTextoHtml(imagemUrl) +
          '&quot;)" role="img" aria-label="' +
          nome +
          '"></div>' +
          '<div class="polos-mapa__popup-foto-overlay" aria-hidden="true"></div>' +
          '<strong class="polos-mapa__popup-titulo polos-mapa__popup-titulo--foto">' +
          nome +
          "</strong>" +
        "</div>";
    }

    var tituloCorpo = imagemUrl
      ? ""
      : '<strong class="polos-mapa__popup-titulo">' + nome + "</strong>";

    return (
      '<div class="polos-mapa__popup' +
      (imagemUrl ? " polos-mapa__popup--com-foto" : "") +
      '">' +
      fotoHtml +
      '<div class="polos-mapa__popup-corpo">' +
      tituloCorpo +
      local +
      enderecoHtml +
      acoes +
      "</div></div>"
    );
  }

  function classePopupPolo(polo) {
    return urlImagemPolo(polo)
      ? "polos-mapa__popup-wrap polos-mapa__popup-wrap--com-foto"
      : "polos-mapa__popup-wrap";
  }

  var mapasFecharPopupFora = [];

  function configurarFecharPopupForaDoMapa(mapa) {
    if (!mapa || mapa._setadFecharPopupFora) return;
    mapa._setadFecharPopupFora = true;
    mapasFecharPopupFora.push(mapa);

    if (mapasFecharPopupFora._documentoVinculado) return;
    mapasFecharPopupFora._documentoVinculado = true;

    document.addEventListener("click", function (evento) {
      mapasFecharPopupFora.forEach(function (instancia) {
        if (!instancia || typeof instancia.getContainer !== "function") return;
        var container = instancia.getContainer();
        if (!container) return;
        if (!container.contains(evento.target)) {
          instancia.closePopup();
        }
      });
    });
  }

  function destacarMarcadoresLeaflet(marcadoresPorId, poloId) {
    if (!marcadoresPorId) return;

    Object.keys(marcadoresPorId).forEach(function (id) {
      var marker = marcadoresPorId[id];
      if (!marker || typeof marker.getElement !== "function") return;

      var el = marker.getElement();
      if (!el) return;

      el.classList.remove("setad-mapa-pin--destaque", "setad-mapa-pin--dim");

      if (poloId && id === poloId) {
        el.classList.add("setad-mapa-pin--destaque");
        marker.setZIndexOffset(1000);
      } else if (poloId) {
        el.classList.add("setad-mapa-pin--dim");
        marker.setZIndexOffset(0);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }

  global.SETADPolosCoord = {
    BELEM_COORDS: BELEM_COORDS,
    obterCoordenadasPolo: obterCoordenadasPolo,
    montarEnderecoPolo: montarEnderecoPolo,
    listarPolosComCoordenadas: listarPolosComCoordenadas,
    criarAssinaturaPolos: criarAssinaturaPolos,
    listarBairrosUnicos: listarBairrosUnicos,
    rotuloCurtoPolo: rotuloCurtoPolo,
    destacarMarcadoresLeaflet: destacarMarcadoresLeaflet,
    urlImagemPolo: urlImagemPolo,
    montarHtmlPopupPolo: montarHtmlPopupPolo,
    classePopupPolo: classePopupPolo,
    configurarFecharPopupForaDoMapa: configurarFecharPopupForaDoMapa
  };
})(typeof window !== "undefined" ? window : globalThis);
