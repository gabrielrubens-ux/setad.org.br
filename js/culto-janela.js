/* Janela flutuante Culto ao Vivo — mini (45%), arrastável; clique expande */
(function () {
  "use strict";

  var janela = document.getElementById("cultoJanela");
  var painel = document.getElementById("cultoJanelaPainel");
  if (!janela || !painel) return;

  var cabecalho = painel.querySelector(".culto-janela__cabecalho");
  var corpo = painel.querySelector(".culto-janela__corpo");
  var btnExpandir = document.getElementById("cultoJanelaExpandir");
  var btnFechar = document.getElementById("cultoJanelaFechar");
  var btnPlayPause = document.getElementById("cultoJanelaPlayPause");
  var video = document.getElementById("cultoJanelaVideo");
  var iconePlay = btnPlayPause ? btnPlayPause.querySelector(".culto-janela__icone-play") : null;
  var iconePause = btnPlayPause ? btnPlayPause.querySelector(".culto-janela__icone-pause") : null;
  var linkTelaCheia = document.getElementById("cultoJanelaTelaCheia");
  var fechadaPeloUsuario = false;
  var arrastando = false;
  var offsetX = 0;
  var offsetY = 0;
  var inicioX = 0;
  var inicioY = 0;
  var moveuArrasto = false;
  var STORAGE_POS = "setad_culto_janela_pos";

  function obterAncoraDireita() {
    var rect = janela.getBoundingClientRect();
    return {
      right: rect.right,
      top: rect.top
    };
  }

  /** Mantém a borda direita fixa e cresce para a esquerda (evita corte na lateral direita). */
  function aplicarExpansaoParaEsquerda(ancora) {
    if (!ancora) ancora = obterAncoraDireita();

    var largura = janela.offsetWidth;
    var rightSeguro = Math.min(ancora.right, window.innerWidth - 8);
    var left = rightSeguro - largura;
    var pos = aplicarLimites(left, ancora.top);

    janela.style.right = "auto";
    janela.style.bottom = "auto";
    janela.style.left = pos.left + "px";
    janela.style.top = pos.top + "px";
    janela.classList.add("culto-janela--posicionada");
  }

  function expandir() {
    var ancora = obterAncoraDireita();

    janela.classList.remove("culto-janela--mini");
    janela.classList.add("culto-janela--expandida");
    janela.setAttribute("aria-expanded", "true");

    requestAnimationFrame(function () {
      aplicarExpansaoParaEsquerda(ancora);
      salvarPosicao();
    });
  }

  function recolher() {
    var ancora = obterAncoraDireita();

    janela.classList.remove("culto-janela--expandida");
    janela.classList.add("culto-janela--mini");
    janela.setAttribute("aria-expanded", "false");

    requestAnimationFrame(function () {
      aplicarExpansaoParaEsquerda(ancora);
      salvarPosicao();
    });
  }

  function fechar() {
    fechadaPeloUsuario = true;
    janela.hidden = true;

    if (window.SETADCultoPlayer) {
      window.SETADCultoPlayer.pausar(true);
    }

    if (window.SETADAudio) {
      window.SETADAudio.solicitarRadio(true);
    }
  }

  function garantirPosicaoAbsoluta() {
    var rect = janela.getBoundingClientRect();
    janela.style.left = rect.left + "px";
    janela.style.top = rect.top + "px";
    janela.style.right = "auto";
    janela.style.bottom = "auto";
    janela.classList.add("culto-janela--posicionada");
  }

  function aplicarLimites(left, top) {
    var largura = janela.offsetWidth;
    var altura = janela.offsetHeight;
    var maxLeft = Math.max(8, window.innerWidth - largura - 8);
    var maxTop = Math.max(8, window.innerHeight - altura - 8);

    return {
      left: Math.min(Math.max(8, left), maxLeft),
      top: Math.min(Math.max(8, top), maxTop)
    };
  }

  function salvarPosicao() {
    sessionStorage.setItem(STORAGE_POS, JSON.stringify({
      left: parseFloat(janela.style.left) || 0,
      top: parseFloat(janela.style.top) || 0
    }));
  }

  function restaurarPosicao() {
    var salvo = sessionStorage.getItem(STORAGE_POS);
    if (!salvo) return;

    try {
      var pos = JSON.parse(salvo);
      var ajustada = aplicarLimites(pos.left, pos.top);
      janela.style.left = ajustada.left + "px";
      janela.style.top = ajustada.top + "px";
      janela.style.right = "auto";
      janela.style.bottom = "auto";
      janela.classList.add("culto-janela--posicionada");
    } catch (erro) {
      sessionStorage.removeItem(STORAGE_POS);
    }
  }

  function iniciarArrasto(evento) {
    if (evento.target.closest("button, a, input")) return;

    if (janela.classList.contains("culto-janela--expandida") && evento.target.closest("video")) {
      return;
    }

    arrastando = true;
    moveuArrasto = false;
    inicioX = evento.clientX;
    inicioY = evento.clientY;

    garantirPosicaoAbsoluta();

    var rect = janela.getBoundingClientRect();
    offsetX = evento.clientX - rect.left;
    offsetY = evento.clientY - rect.top;

    janela.classList.add("culto-janela--arrastando");
    painel.setPointerCapture(evento.pointerId);
    evento.preventDefault();
  }

  function moverArrasto(evento) {
    if (!arrastando) return;

    if (Math.abs(evento.clientX - inicioX) > 4 || Math.abs(evento.clientY - inicioY) > 4) {
      moveuArrasto = true;
    }

    var pos = aplicarLimites(evento.clientX - offsetX, evento.clientY - offsetY);
    janela.style.left = pos.left + "px";
    janela.style.top = pos.top + "px";
  }

  function finalizarArrasto(evento) {
    if (!arrastando) return;

    arrastando = false;
    janela.classList.remove("culto-janela--arrastando");

    if (painel.hasPointerCapture(evento.pointerId)) {
      painel.releasePointerCapture(evento.pointerId);
    }

    if (moveuArrasto) {
      salvarPosicao();
      return;
    }

    if (janela.classList.contains("culto-janela--mini")) {
      expandir();
    }
  }

  function cultoEstaAtivo() {
    if (!window.SETADAudio) return false;
    return window.SETADAudio.obterPreferencia() === "live";
  }

  function atualizarBotaoPlayPause() {
    if (!btnPlayPause) return;

    var aoVivoAtivo = cultoEstaAtivo();

    btnPlayPause.classList.toggle("culto-janela__btn-play--ao-vivo", aoVivoAtivo);

    if (iconePause) iconePause.hidden = !aoVivoAtivo;
    if (iconePlay) iconePlay.hidden = aoVivoAtivo;

    btnPlayPause.setAttribute(
      "aria-label",
      aoVivoAtivo
        ? "Pausar culto ao vivo e ouvir a rádio"
        : "Retomar culto ao vivo"
    );
  }

  function alternarAudio() {
    if (!window.SETADAudio) return;

    if (cultoEstaAtivo()) {
      window.SETADAudio.solicitarRadio(false).then(atualizarBotaoPlayPause);
    } else {
      window.SETADAudio.solicitarLive(true).then(atualizarBotaoPlayPause);
    }
  }

  window.SETADCultoJanela = {
    podeAbrir: function () {
      return !fechadaPeloUsuario;
    },
    reabrirSeAoVivo: function () {
      fechadaPeloUsuario = false;
    },
    atualizarControles: atualizarBotaoPlayPause
  };

  restaurarPosicao();

  painel.addEventListener("transitionend", function (evento) {
    if (evento.propertyName !== "width" || evento.target !== painel) return;
    aplicarExpansaoParaEsquerda();
    salvarPosicao();
  });

  painel.addEventListener("pointerdown", iniciarArrasto);
  painel.addEventListener("pointermove", moverArrasto);
  painel.addEventListener("pointerup", finalizarArrasto);
  painel.addEventListener("pointercancel", finalizarArrasto);

  window.addEventListener("resize", function () {
    if (!janela.classList.contains("culto-janela--posicionada")) return;

    var pos = aplicarLimites(
      parseFloat(janela.style.left) || 0,
      parseFloat(janela.style.top) || 0
    );
    janela.style.left = pos.left + "px";
    janela.style.top = pos.top + "px";
    salvarPosicao();
  });

  if (btnExpandir) {
    btnExpandir.addEventListener("click", function (evento) {
      evento.stopPropagation();
      if (janela.classList.contains("culto-janela--expandida")) {
        recolher();
      } else {
        expandir();
      }
    });
  }

  if (btnFechar) {
    btnFechar.addEventListener("click", function (evento) {
      evento.stopPropagation();
      fechar();
    });
  }

  if (linkTelaCheia) {
    linkTelaCheia.addEventListener("click", function () {
      if (window.SETADRadio && window.SETADRadio.isPlaying()) {
        sessionStorage.setItem("setad_radio_antes_culto", "1");
        window.SETADRadio.pause(true);
      }
    });
  }

  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", function (evento) {
      evento.stopPropagation();
      alternarAudio();
    });
  }

  if (video) {
    video.addEventListener("play", atualizarBotaoPlayPause);
    video.addEventListener("pause", atualizarBotaoPlayPause);
  }

  document.addEventListener("visibilitychange", atualizarBotaoPlayPause);
  setInterval(atualizarBotaoPlayPause, 1500);

  atualizarBotaoPlayPause();

  if (cabecalho && corpo) {
    cabecalho.setAttribute("title", "Arraste para mover a janela");
    corpo.setAttribute("title", "Arraste para mover ou clique para expandir");
  }
})();
