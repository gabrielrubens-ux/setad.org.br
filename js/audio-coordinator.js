/* ============================================================
   audio-coordinator.js — Rádio e culto ao vivo sem conflito de áudio
   Ao vivo prevalece quando ativo. Ao pausar um, o outro retoma.
   ============================================================ */

(function () {
  "use strict";

  var STORAGE_FONTE = "setad_audio_fonte";
  var STORAGE_RADIO_ANTES_CULTO = "setad_radio_antes_culto";
  var STORAGE_PREFERENCIA = "setad_culto_preferencia_audio";

  function obterFonte() {
    return sessionStorage.getItem(STORAGE_FONTE) || "radio";
  }

  function definirFonte(fonte) {
    sessionStorage.setItem(STORAGE_FONTE, fonte);
  }

  function estaNaPaginaCulto() {
    return document.body.classList.contains("pagina-culto-ao-vivo");
  }

  function playerCultoDisponivel() {
    return Boolean(window.SETADCultoPlayer);
  }

  function cultoAoVivoAtivo() {
    return window.SETADCultoLive && window.SETADCultoLive.isLive();
  }

  function definirPreferencia(preferencia) {
    sessionStorage.setItem(STORAGE_PREFERENCIA, preferencia);
  }

  function obterPreferencia() {
    return sessionStorage.getItem(STORAGE_PREFERENCIA) || "live";
  }

  window.SETADAudio = {
    obterFonte: obterFonte,
    obterPreferencia: obterPreferencia,

    solicitarRadio: function (automatico) {
      definirPreferencia("radio");
      definirFonte("radio");

      if (window.SETADCultoPlayer) {
        window.SETADCultoPlayer.pausar(true);
      }

      if (window.SETADRadio) {
        return window.SETADRadio.play(automatico === true);
      }

      return Promise.resolve();
    },

    solicitarLive: function (automatico) {
      if (!playerCultoDisponivel()) {
        return Promise.resolve();
      }

      definirPreferencia("live");
      definirFonte("live");

      if (window.SETADRadio) {
        window.SETADRadio.pause(true);
      }

      return window.SETADCultoPlayer.tocar(automatico === true);
    },

    pausarTudo: function () {
      definirFonte("none");

      if (window.SETADRadio) {
        window.SETADRadio.pause(true);
      }

      if (window.SETADCultoPlayer) {
        window.SETADCultoPlayer.pausar(true);
      }
    },

    aoPausarRadio: function () {
      if (obterFonte() !== "radio") return;

      definirFonte("none");

      if (cultoAoVivoAtivo() && playerCultoDisponivel()) {
        window.SETADAudio.solicitarLive(true);
      }
    },

    aoPausarLive: function () {
      if (obterFonte() !== "live") return;

      window.SETADAudio.solicitarRadio(true);
    },

    entrarPaginaCulto: function () {
      var radioTocando = window.SETADRadio && window.SETADRadio.isPlaying();
      sessionStorage.setItem(STORAGE_RADIO_ANTES_CULTO, radioTocando ? "1" : "0");
      window.SETADAudio.solicitarLive(true);
    },

    sairPaginaCulto: function () {
      if (window.SETADCultoPlayer) {
        window.SETADCultoPlayer.pausar(true);
      }

      if (sessionStorage.getItem(STORAGE_RADIO_ANTES_CULTO) === "1") {
        window.SETADAudio.solicitarRadio(true);
      } else {
        definirFonte("none");
      }
    }
  };

  window.addEventListener("pagehide", function () {
    if (estaNaPaginaCulto()) {
      window.SETADAudio.sairPaginaCulto();
    }
  });
})();
