/* ============================================================
   radio-player.js — Rádio Boas Novas FM 24h no site SETAD
   Stream oficial: boasnovasaac.jmvstream.com (JMV Technology)
   ============================================================ */

(function () {
  "use strict";

  function deveOcultarRadioPlayer() {
    var body = document.body;
    if (!body) return true;

    if (body.classList.contains("login-page")) return true;

    if (
      body.classList.contains("painel-direcao") ||
      body.classList.contains("painel-contador") ||
      body.classList.contains("painel-secretaria")
    ) {
      return true;
    }

    return Boolean(document.querySelector(".painel"));
  }

  if (deveOcultarRadioPlayer() || document.getElementById("setadRadioPlayer")) {
    return;
  }

  var STREAM_URL = "https://boasnovasaac.jmvstream.com/live";
  var STORAGE_PLAYING = "setad_radio_playing";
  var STORAGE_VOLUME = "setad_radio_volume";
  var STORAGE_MUTED = "setad_radio_muted";

  var audio = new Audio(STREAM_URL);
  audio.preload = "none";
  audio.crossOrigin = "anonymous";

  var volumeSalva = parseFloat(sessionStorage.getItem(STORAGE_VOLUME));
  var mutedSalvo = sessionStorage.getItem(STORAGE_MUTED) === "1";

  audio.volume = Number.isFinite(volumeSalva) ? Math.min(1, Math.max(0, volumeSalva)) : 0.85;
  audio.muted = mutedSalvo;

  var barra = document.createElement("aside");
  barra.id = "setadRadioPlayer";
  barra.className = "radio-player";
  barra.setAttribute("aria-label", "Rádio Boas Novas FM ao vivo");
  barra.innerHTML =
    '<div class="radio-player__inner">' +
      '<div class="radio-player__info">' +
        '<span class="radio-player__badge" aria-hidden="true">AO VIVO</span>' +
        '<div class="radio-player__textos">' +
          '<strong class="radio-player__nome">Boas Novas FM 91.9</strong>' +
          '<span class="radio-player__status" data-radio-status>Transmitindo Jesus</span>' +
        '</div>' +
      '</div>' +
      '<div class="radio-player__controles">' +
        '<button type="button" class="radio-player__btn" data-radio-play aria-label="Pausar rádio">' +
          '<svg class="radio-player__icone radio-player__icone--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' +
          '<svg class="radio-player__icone radio-player__icone--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
        '</button>' +
        '<label class="radio-player__volume" title="Volume">' +
          '<span class="visually-hidden">Volume</span>' +
          '<input type="range" class="radio-player__slider" data-radio-volume min="0" max="100" value="' + Math.round(audio.volume * 100) + '" aria-label="Volume da rádio">' +
        '</label>' +
        '<button type="button" class="radio-player__btn radio-player__btn--mute" data-radio-mute aria-label="Silenciar rádio">' +
          '<svg class="radio-player__icone radio-player__icone--volume" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>' +
          '<svg class="radio-player__icone radio-player__icone--muted" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>' +
        '</button>' +
      '</div>' +
      '<button type="button" class="radio-player__aviso" data-radio-aviso hidden>' +
        'Toque para ouvir a rádio ao vivo' +
      '</button>' +
    '</div>';

  var ocultarUiRadio = document.body.classList.contains("pagina-culto-ao-vivo");

  if (!ocultarUiRadio) {
    document.body.appendChild(barra);
    document.body.classList.add("has-radio-player");
  }

  var btnPlayPause = barra.querySelector("[data-radio-play]");
  var btnMute = barra.querySelector("[data-radio-mute]");
  var sliderVolume = barra.querySelector("[data-radio-volume]");
  var aviso = barra.querySelector("[data-radio-aviso]");
  var statusEl = barra.querySelector("[data-radio-status]");

  function estaTocando() {
    return !audio.paused && !audio.ended;
  }

  function salvarEstado() {
    sessionStorage.setItem(STORAGE_PLAYING, estaTocando() ? "1" : "0");
    sessionStorage.setItem(STORAGE_VOLUME, String(audio.volume));
    sessionStorage.setItem(STORAGE_MUTED, audio.muted ? "1" : "0");
  }

  function atualizarInterface() {
    if (ocultarUiRadio) return;

    var tocando = estaTocando();
    barra.classList.toggle("radio-player--playing", tocando);
    barra.classList.toggle("radio-player--paused", !tocando);
    barra.classList.toggle("radio-player--muted", audio.muted || audio.volume === 0);
    btnPlayPause.setAttribute("aria-label", tocando ? "Pausar rádio" : "Tocar rádio");
    sliderVolume.value = String(Math.round(audio.volume * 100));
  }

  function mostrarAviso(mostrar) {
    if (ocultarUiRadio) return;

    aviso.hidden = !mostrar;
    barra.classList.toggle("radio-player--needs-interaction", mostrar);
  }

  function tocar(forcar) {
    if (!forcar && window.SETADAudio && window.SETADAudio.obterFonte() === "live") {
      return Promise.resolve();
    }

    if (statusEl) statusEl.textContent = "Conectando…";
    return audio.play().then(function () {
      if (window.SETADAudio && window.SETADAudio.obterFonte() !== "live") {
        sessionStorage.setItem("setad_audio_fonte", "radio");
      }
      mostrarAviso(false);
      if (statusEl) statusEl.textContent = "Transmitindo Jesus";
      atualizarInterface();
      salvarEstado();
    }).catch(function () {
      if (statusEl) statusEl.textContent = "Toque em play para ouvir";
      mostrarAviso(true);
      atualizarInterface();
    });
  }

  function pausar(programatico) {
    audio.pause();
    if (statusEl) statusEl.textContent = "Pausada";
    atualizarInterface();
    salvarEstado();

    if (!programatico && window.SETADAudio) {
      window.SETADAudio.aoPausarRadio();
    }
  }

  function alternar() {
    if (estaTocando()) {
      pausar(false);
    } else {
      if (window.SETADAudio) {
        window.SETADAudio.solicitarRadio(false);
      } else {
        tocar(true);
      }
    }
  }

  function sincronizarComSessao() {
    if (window.SETADCultoLive && window.SETADCultoLive.isLive()) {
      if (statusEl) statusEl.textContent = "Pausada";
      atualizarInterface();
      return;
    }

    if (window.SETADAudio && window.SETADAudio.obterFonte() === "live") {
      if (statusEl) statusEl.textContent = "Pausada";
      atualizarInterface();
      return;
    }

    if (sessionStorage.getItem(STORAGE_PLAYING) === "0") {
      if (statusEl) statusEl.textContent = "Pausada";
      atualizarInterface();
      return;
    }

    if (!ocultarUiRadio) {
      tocar(true);
    }
  }

  if (!ocultarUiRadio) {
    btnPlayPause.addEventListener("click", alternar);
    aviso.addEventListener("click", tocar);
  }

  if (!ocultarUiRadio) {
    btnMute.addEventListener("click", function () {
      audio.muted = !audio.muted;
      atualizarInterface();
      salvarEstado();
    });

    sliderVolume.addEventListener("input", function (evento) {
      var valor = Number(evento.target.value) / 100;
      audio.volume = valor;
      if (valor > 0) {
        audio.muted = false;
      }
      atualizarInterface();
      salvarEstado();
    });
  }

  audio.addEventListener("playing", function () {
    if (statusEl) statusEl.textContent = "Transmitindo Jesus";
    atualizarInterface();
    salvarEstado();
  });

  audio.addEventListener("waiting", function () {
    if (statusEl) statusEl.textContent = "Conectando…";
  });

  audio.addEventListener("error", function () {
    if (statusEl) statusEl.textContent = "Reconectando…";
    if (sessionStorage.getItem(STORAGE_PLAYING) === "1") {
      setTimeout(function () {
        audio.load();
        tocar(true);
      }, 3000);
    }
  });

  window.addEventListener("beforeunload", salvarEstado);

  if (!ocultarUiRadio) {
    document.addEventListener("click", function iniciarNaPrimeiraInteracao() {
      if (sessionStorage.getItem(STORAGE_PLAYING) !== "0" && !estaTocando()) {
        tocar(true);
      }
    }, { once: true });
  }

  window.addEventListener("pageshow", function (evento) {
    if (!evento.persisted) return;

    if (sessionStorage.getItem(STORAGE_PLAYING) === "0") {
      audio.pause();
      if (statusEl) statusEl.textContent = "Pausada";
      atualizarInterface();
      return;
    }

    if (!ocultarUiRadio && !estaTocando()) {
      tocar(true);
    }
  });

  if (!ocultarUiRadio) {
    document.querySelectorAll("[data-radio-toggle]").forEach(function (botao) {
    botao.addEventListener("click", function (evento) {
      evento.preventDefault();
      if (!estaTocando()) {
        tocar();
      }
      barra.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    });
  }

  atualizarInterface();
  sincronizarComSessao();

  window.SETADRadio = {
    play: tocar,
    pause: pausar,
    toggle: alternar,
    isPlaying: estaTocando
  };
})();
