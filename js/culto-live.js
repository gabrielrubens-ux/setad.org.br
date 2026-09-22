/* ============================================================
   culto-live.js — Transmissão ao vivo (Brascast) + balão flutuante
   Player: https://live.brascast.com/player/3672d32d
   ============================================================ */

(function () {
  "use strict";

  var PLAYER_ID = "3672d32d";
  var BRASCAST_PLAYER = "https://live.brascast.com/player/" + PLAYER_ID + "?autoplay=1";
  var HLS_BASE = "https://video01.brascast.com";
  var HLS_MASTER = HLS_BASE + "/" + PLAYER_ID + "/" + PLAYER_ID + "/playlist.m3u8";
  var STORAGE_SEQ = "setad_culto_seq";
  var STORAGE_LIVE = "setad_culto_ao_vivo";
  var POLL_MS = 45000;
  var INTERVALO_CONFIRMACAO_MS = 4000;

  var estado = {
    aoVivo: false,
    verificando: false,
    hls: null,
    janelaStreamPronto: false
  };

  function obterBaseCulto() {
    var path = window.location.pathname.replace(/\\/g, "/").toLowerCase();
    if (path.indexOf("/matricula/teologia") !== -1) return "../../";
    if (path.indexOf("/matricula/") !== -1 || path.indexOf("/polos/") !== -1) return "../";
    return "";
  }

  function analisarPlaylist(texto) {
    if (!texto) {
      return {
        sequence: null,
        hasSegments: false,
        isVod: false,
        lastSegment: null
      };
    }

    var linhas = texto.split("\n");
    var lastSegment = null;

    for (var i = linhas.length - 1; i >= 0; i--) {
      var linha = linhas[i].trim();
      if (linha && linha.charAt(0) !== "#") {
        lastSegment = linha;
        break;
      }
    }

    return {
      sequence: (texto.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/) || [])[1],
      hasSegments: /#EXTINF:/.test(texto) && /\.ts/.test(texto),
      isVod: /#EXT-X-ENDLIST/.test(texto),
      lastSegment: lastSegment
    };
  }

  function montarUrlPlaylist(caminho) {
    if (!caminho) return null;

    if (caminho.indexOf("http") === 0) {
      return caminho;
    }

    return HLS_BASE + (caminho.charAt(0) === "/" ? caminho : "/" + caminho);
  }

  async function obterPlaylistMedia() {
    var respostaMaster = await fetch(HLS_MASTER, { cache: "no-store" });
    if (!respostaMaster.ok) return null;

    var master = await respostaMaster.text();
    var linhaPlaylist = master.split("\n").find(function (linha) {
      return linha.indexOf("playlist.m3u8") !== -1;
    });

    if (!linhaPlaylist) return null;

    var urlMedia = montarUrlPlaylist(linhaPlaylist.trim());
    if (!urlMedia) return null;

    var respostaMedia = await fetch(urlMedia, { cache: "no-store" });
    if (!respostaMedia.ok) return null;

    return respostaMedia.text();
  }

  function playlistIndicaAoVivo(info1, info2) {
    if (!info1.hasSegments || info1.sequence === null || info1.isVod) {
      return false;
    }

    if (!info2.hasSegments || info2.sequence === null || info2.isVod) {
      return false;
    }

    var seq1 = parseInt(info1.sequence, 10);
    var seq2 = parseInt(info2.sequence, 10);

    if (seq2 > seq1) {
      return true;
    }

    return seq2 === seq1 && info1.lastSegment !== info2.lastSegment;
  }

  async function verificarTransmissaoAtiva() {
    if (estado.verificando) {
      return estado.aoVivo;
    }

    estado.verificando = true;

    try {
      var primeira = await obterPlaylistMedia();
      if (!primeira) {
        estado.aoVivo = false;
        sessionStorage.setItem(STORAGE_LIVE, "0");
        return false;
      }

      var info1 = analisarPlaylist(primeira);

      if (!info1.hasSegments || info1.sequence === null || info1.isVod) {
        estado.aoVivo = false;
        sessionStorage.setItem(STORAGE_LIVE, "0");
        return false;
      }

      var seq1 = parseInt(info1.sequence, 10);
      var seqAnterior = sessionStorage.getItem(STORAGE_SEQ);
      var seqAntNum = seqAnterior ? parseInt(seqAnterior, 10) : null;

      if (seqAntNum !== null && seq1 > seqAntNum) {
        sessionStorage.setItem(STORAGE_SEQ, String(seq1));
        estado.aoVivo = true;
        sessionStorage.setItem(STORAGE_LIVE, "1");
        return true;
      }

      await new Promise(function (resolve) {
        setTimeout(resolve, INTERVALO_CONFIRMACAO_MS);
      });

      var segunda = await obterPlaylistMedia();
      if (!segunda) {
        sessionStorage.setItem(STORAGE_SEQ, String(seq1));
        estado.aoVivo = false;
        sessionStorage.setItem(STORAGE_LIVE, "0");
        return false;
      }

      var info2 = analisarPlaylist(segunda);
      var seq2 = info2.sequence ? parseInt(info2.sequence, 10) : seq1;
      sessionStorage.setItem(STORAGE_SEQ, String(seq2));

      estado.aoVivo = playlistIndicaAoVivo(info1, info2);
      sessionStorage.setItem(STORAGE_LIVE, estado.aoVivo ? "1" : "0");
      return estado.aoVivo;
    } catch (erro) {
      estado.aoVivo = sessionStorage.getItem(STORAGE_LIVE) === "1";
      return estado.aoVivo;
    } finally {
      estado.verificando = false;
    }
  }

  function atualizarJanelaAoVivo(aoVivo, forcarReabertura) {
    var janela = document.getElementById("cultoJanela");
    var video = document.getElementById("cultoJanelaVideo");
    if (!janela || !video) return;

    if (!aoVivo) {
      janela.hidden = true;

      if (window.SETADCultoPlayer && video.dataset.setadPlayerRegistrado === "1") {
        window.SETADCultoPlayer.pausar(true);
      }

      if (window.SETADAudio && window.SETADAudio.obterFonte() === "live") {
        window.SETADAudio.solicitarRadio(true);
      }

      return;
    }

    if (forcarReabertura && window.SETADCultoJanela) {
      window.SETADCultoJanela.reabrirSeAoVivo();
    }

    if (window.SETADCultoJanela && !window.SETADCultoJanela.podeAbrir()) {
      return;
    }

    janela.hidden = false;

    if (!janela.classList.contains("culto-janela--expandida")) {
      janela.classList.add("culto-janela--mini");
    }

    function atualizarControlesJanela() {
      if (window.SETADCultoJanela && window.SETADCultoJanela.atualizarControles) {
        window.SETADCultoJanela.atualizarControles();
      }
    }

    function iniciarEtocar() {
      return iniciarStreamNoVideo(video).then(function () {
        if (!window.SETADAudio) {
          return tentarAutoplayCulto();
        }

        if (window.SETADAudio.obterPreferencia() === "radio") {
          return Promise.resolve();
        }

        return window.SETADAudio.solicitarLive(true);
      }).then(atualizarControlesJanela);
    }

    if (!estado.janelaStreamPronto) {
      estado.janelaStreamPronto = true;
      iniciarEtocar();
      return;
    }

    if (window.SETADAudio) {
      if (window.SETADAudio.obterPreferencia() !== "radio") {
        window.SETADAudio.solicitarLive(true);
      }
    } else {
      tentarAutoplayCulto();
    }

    atualizarControlesJanela();
  }

  function iniciarMonitoramentoPublico() {
    var cacheAoVivo = sessionStorage.getItem(STORAGE_LIVE) === "1";
    var estavaAoVivo = cacheAoVivo;

    if (cacheAoVivo) {
      atualizarJanelaAoVivo(true);
    }

    verificarTransmissaoAtiva().then(function (aoVivo) {
      atualizarJanelaAoVivo(aoVivo, aoVivo && !estavaAoVivo);
      estavaAoVivo = aoVivo;
    });

    setInterval(function () {
      verificarTransmissaoAtiva().then(function (aoVivo) {
        var entrouAoVivo = aoVivo && !estavaAoVivo;
        atualizarJanelaAoVivo(aoVivo, entrouAoVivo);
        estavaAoVivo = aoVivo;
      });
    }, POLL_MS);
  }

  function carregarHlsJs() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }

      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js";
      script.onload = function () { resolve(window.Hls); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function tentarAutoplayCulto() {
    if (!window.SETADCultoPlayer) return Promise.resolve();
    return window.SETADCultoPlayer.tocar(true);
  }

  function registrarPlayerCulto(video) {
    if (!video) return null;

    if (video.dataset.setadPlayerRegistrado === "1") {
      return window.SETADCultoPlayer;
    }

    video.dataset.setadPlayerRegistrado = "1";

    var player = {
      tocar: function (programatico) {
        if (!video || video.hidden) {
          return Promise.resolve();
        }

        video.muted = false;

        return video.play().then(function () {
          if (!programatico && window.SETADAudio) {
            window.SETADAudio.solicitarLive(true);
          }
        }).catch(function () {
          video.muted = true;
          return video.play().catch(function () {
            return Promise.resolve();
          });
        });
      },

      pausar: function (programatico) {
        if (!video) return;
        video.pause();

        if (!programatico && window.SETADAudio) {
          window.SETADAudio.aoPausarLive();
        }
      },

      isPlaying: function () {
        return video && !video.paused && !video.ended;
      }
    };

    video.addEventListener("play", function () {
      if (!window.SETADAudio) return;

      if (window.SETADAudio.obterPreferencia() === "radio") {
        video.pause();
        return;
      }

      if (window.SETADAudio.obterFonte() !== "live") {
        window.SETADAudio.solicitarLive(true);
      }
    });

    video.addEventListener("pause", function () {
      if (video.seeking) return;

      if (window.SETADAudio && window.SETADAudio.obterFonte() === "live") {
        window.SETADAudio.aoPausarLive();
      }
    });

    window.SETADCultoPlayer = player;
    return player;
  }

  function usarIframeBrascast(video, iframe) {
    if (!iframe) return;

    if (video) {
      video.hidden = true;
      video.pause();
    }

    iframe.hidden = false;
    iframe.src = BRASCAST_PLAYER;
  }

  function iniciarStreamNoVideo(video) {
    if (!video) return Promise.resolve();

    registrarPlayerCulto(video);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_MASTER;
      video.addEventListener("loadedmetadata", tentarAutoplayCulto, { once: true });
      return Promise.resolve();
    }

    return carregarHlsJs().then(function (Hls) {
      if (Hls.isSupported()) {
        estado.hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        estado.hls.loadSource(HLS_MASTER);
        estado.hls.attachMedia(video);
        estado.hls.on(Hls.Events.MANIFEST_PARSED, tentarAutoplayCulto);
        return;
      }

      usarIframeBrascast(video, document.getElementById("cultoPlayerIframe"));
    }).catch(function () {
      usarIframeBrascast(video, document.getElementById("cultoPlayerIframe"));
    });
  }

  function mostrarPlayerCulto() {
    var video = document.getElementById("cultoVideo");
    var iframe = document.getElementById("cultoPlayerIframe");
    var offAirEl = document.getElementById("cultoOffAir");

    if (offAirEl) offAirEl.hidden = true;
    if (video && !video.hidden) return;
    if (iframe && !iframe.hidden) return;
    if (video) video.hidden = false;
    if (iframe) iframe.hidden = true;
  }

  function atualizarStatusCulto(aoVivo, retomarSeAoVivo) {
    var statusEl = document.getElementById("cultoStatus");
    var offAirEl = document.getElementById("cultoOffAir");
    var liveTag = document.getElementById("cultoLiveTag");

    if (aoVivo) {
      if (offAirEl) offAirEl.hidden = true;
      if (liveTag) liveTag.hidden = false;
      if (statusEl) statusEl.textContent = "Transmissão ao vivo";

      if (retomarSeAoVivo && window.SETADAudio) {
        window.SETADAudio.solicitarLive(true);
      }
      return;
    }

    if (liveTag) liveTag.hidden = true;
    if (statusEl) statusEl.textContent = "Aguardando transmissão";
    if (offAirEl) offAirEl.hidden = true;
  }

  function iniciarPaginaCulto() {
    var container = document.getElementById("cultoPlayer");
    if (!container) return;

    var video = document.getElementById("cultoVideo");
    var estavaAoVivo = false;

    mostrarPlayerCulto();

    iniciarStreamNoVideo(video).then(function () {
      if (window.SETADAudio) {
        window.SETADAudio.entrarPaginaCulto();
      } else {
        tentarAutoplayCulto();
      }

      document.addEventListener("click", function retomarAposBloqueioAutoplay() {
        if (window.SETADAudio) {
          window.SETADAudio.solicitarLive(true);
        } else {
          tentarAutoplayCulto();
        }
      }, { once: true });

      return verificarTransmissaoAtiva();
    }).then(function (aoVivo) {
      atualizarStatusCulto(aoVivo, false);
      estavaAoVivo = aoVivo;
    });

    setInterval(function () {
      verificarTransmissaoAtiva().then(function (aoVivo) {
        var entrouAoVivo = aoVivo && !estavaAoVivo;
        atualizarStatusCulto(aoVivo, entrouAoVivo);
        estavaAoVivo = aoVivo;
      });
    }, POLL_MS);
  }

  iniciarMonitoramentoPublico();
  iniciarPaginaCulto();

  window.SETADCultoLive = {
    verificar: verificarTransmissaoAtiva,
    isLive: function () { return estado.aoVivo; },
    obterUrlPagina: function () { return obterBaseCulto() + "culto-ao-vivo.html"; }
  };
})();
