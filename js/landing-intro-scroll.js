/**
 * Landing SETAD — rolagem horizontal (SETADE principal + SETAD Teen).
 */
(function () {
  "use strict";

  var INTERVALO_AUTO_MS = 5000;

  var intro = document.querySelector("[data-landing-intro]");
  if (!intro || !document.body.classList.contains("pagina-inicial")) return;

  var trilha = intro.querySelector("[data-landing-trilha]");
  var camadaSetad = document.querySelector('[data-landing-camada="setad"]');
  var camadaTeen = document.querySelector('[data-landing-camada="teen"]');
  var poster = document.querySelector("[data-landing-teen-poster]");
  var cartao = document.querySelector("[data-landing-teen-cartao]");
  var passos = document.querySelectorAll("[data-landing-passo]");
  var btnSetaAnt = document.getElementById("landingIntroSetaAnt");
  var btnSetaProx = document.getElementById("landingIntroSetaProx");
  var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!trilha) return;

  var timerAuto = null;
  var pausaAutoAte = 0;
  var ponteiroEmIntro = false;

  function limitar(valor, min, max) {
    return Math.min(max, Math.max(min, valor));
  }

  function progressoHorizontal() {
    var largura = trilha.clientWidth || 1;
    var maxScroll = Math.max(1, trilha.scrollWidth - largura);
    return limitar(trilha.scrollLeft / maxScroll, 0, 1);
  }

  function painelAtualIndice() {
    return progressoHorizontal() < 0.45 ? 0 : 1;
  }

  function introVisivelParaAuto() {
    if (document.body.classList.contains("landing-intro--encerrado")) return false;
    if (document.hidden) return false;
    var rect = intro.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.25;
  }

  function cancelarTimerAuto() {
    if (timerAuto) {
      clearTimeout(timerAuto);
      timerAuto = null;
    }
  }

  function pausarAuto(duracaoMs) {
    pausaAutoAte = Date.now() + (duracaoMs || INTERVALO_AUTO_MS * 2);
    cancelarTimerAuto();
    agendarRolagemAutomatica();
  }

  function agendarRolagemAutomatica() {
    cancelarTimerAuto();
    if (reduzirMovimento) return;

    timerAuto = window.setTimeout(function executarAuto() {
      timerAuto = null;

      if (Date.now() < pausaAutoAte) {
        agendarRolagemAutomatica();
        return;
      }

      if (ponteiroEmIntro) {
        agendarRolagemAutomatica();
        return;
      }

      if (!introVisivelParaAuto()) {
        agendarRolagemAutomatica();
        return;
      }

      var atual = painelAtualIndice();
      rolarParaPainel(atual === 0 ? 1 : 0, { origemAuto: true });
      agendarRolagemAutomatica();
    }, INTERVALO_AUTO_MS);
  }

  function atualizarFundo() {
    if (!camadaSetad || !camadaTeen) return;

    var progresso = progressoHorizontal();
    var misturaTeen = progresso;

    camadaTeen.style.opacity = String(misturaTeen);
    camadaSetad.style.opacity = String(1 - misturaTeen * 0.92);

    var parallaxX = progresso * 24;
    camadaSetad.style.transform =
      "scale(1.08) translate3d(" + parallaxX * -0.35 + "px, 0, 0)";
    camadaTeen.style.transform =
      "scale(1.12) translate3d(" + (parallaxX * 0.25 + 8) + "px, 0, 0)";

    var passoAtivo = progresso < 0.45 ? 0 : 1;
    passos.forEach(function (btn, indice) {
      var ativo = indice === passoAtivo;
      btn.classList.toggle("is-ativo", ativo);
      btn.setAttribute("aria-current", ativo ? "step" : "false");
    });

    if (btnSetaAnt) {
      btnSetaAnt.disabled = progresso < 0.08;
    }
    if (btnSetaProx) {
      btnSetaProx.disabled = progresso > 0.92;
    }

    var rect = intro.getBoundingClientRect();
    var viewport = window.innerHeight || 1;
    if (rect.bottom < viewport * 0.12) {
      document.body.classList.add("landing-intro--encerrado");
      cancelarTimerAuto();
    } else {
      document.body.classList.remove("landing-intro--encerrado");
      if (!timerAuto && !reduzirMovimento) {
        agendarRolagemAutomatica();
      }
    }
  }

  function rolarParaPainel(indice, opcoes) {
    opcoes = opcoes || {};
    var largura = trilha.clientWidth;
    if (!largura) return;
    if (!opcoes.origemAuto) {
      pausarAuto(INTERVALO_AUTO_MS * 2);
    }
    trilha.scrollTo({
      left: largura * indice,
      behavior: reduzirMovimento ? "auto" : "smooth"
    });
  }

  passos.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var indice = Number(btn.getAttribute("data-landing-passo")) || 0;
      rolarParaPainel(indice);
    });
  });

  if (btnSetaAnt) {
    btnSetaAnt.addEventListener("click", function () {
      rolarParaPainel(0);
    });
  }
  if (btnSetaProx) {
    btnSetaProx.addEventListener("click", function () {
      rolarParaPainel(1);
    });
  }

  intro.addEventListener("mouseenter", function () {
    ponteiroEmIntro = true;
    pausarAuto(INTERVALO_AUTO_MS * 3);
  });
  intro.addEventListener("mouseleave", function () {
    ponteiroEmIntro = false;
    agendarRolagemAutomatica();
  });
  intro.addEventListener(
    "focusin",
    function () {
      pausarAuto(INTERVALO_AUTO_MS * 2);
    },
    true
  );

  trilha.addEventListener(
    "touchstart",
    function () {
      pausarAuto(INTERVALO_AUTO_MS * 2);
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      cancelarTimerAuto();
    } else {
      agendarRolagemAutomatica();
    }
  });

  trilha.addEventListener(
    "scroll",
    function () {
      window.requestAnimationFrame(atualizarFundo);
    },
    { passive: true }
  );

  window.addEventListener("scroll", atualizarFundo, { passive: true });
  window.addEventListener("resize", function () {
    atualizarFundo();
  });
  atualizarFundo();
  agendarRolagemAutomatica();

  if (!reduzirMovimento) {
    trilha.addEventListener(
      "wheel",
      function (e) {
        pausarAuto(INTERVALO_AUTO_MS * 2);

        var noTopoPagina = window.scrollY < 8;
        var podeRolarH = trilha.scrollWidth > trilha.clientWidth + 2;
        if (!noTopoPagina || !podeRolarH) return;

        var delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 2) return;

        var naPrimeira = trilha.scrollLeft < trilha.clientWidth * 0.15;
        var naUltima =
          trilha.scrollLeft >
          trilha.scrollWidth - trilha.clientWidth * 1.15;

        if (delta > 0 && naUltima) return;
        if (delta < 0 && naPrimeira) return;

        e.preventDefault();
        trilha.scrollLeft += delta;
      },
      { passive: false }
    );
  }

  if (poster && cartao && !reduzirMovimento) {
    function aplicarTilt(e) {
      var rect = poster.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      cartao.style.setProperty("--teen-rot-x", (y * -12).toFixed(2) + "deg");
      cartao.style.setProperty("--teen-rot-y", (x * 14).toFixed(2) + "deg");
      cartao.style.setProperty("--teen-brilho-x", (50 + x * 40).toFixed(1) + "%");
      cartao.style.setProperty("--teen-brilho-y", (30 + y * 35).toFixed(1) + "%");
    }

    function resetarTilt() {
      cartao.style.setProperty("--teen-rot-x", "0deg");
      cartao.style.setProperty("--teen-rot-y", "0deg");
      cartao.style.setProperty("--teen-brilho-x", "50%");
      cartao.style.setProperty("--teen-brilho-y", "30%");
    }

    poster.addEventListener("mousemove", aplicarTilt);
    poster.addEventListener("mouseleave", resetarTilt);

    function alternarPulso() {
      var pressionado = poster.getAttribute("aria-pressed") === "true";
      poster.setAttribute("aria-pressed", pressionado ? "false" : "true");
      poster.classList.toggle("is-pulsando", !pressionado);
    }

    poster.addEventListener("click", function () {
      pausarAuto(INTERVALO_AUTO_MS * 2);
      alternarPulso();
    });
    poster.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pausarAuto(INTERVALO_AUTO_MS * 2);
        alternarPulso();
      }
    });
  }

  var linkRolar = document.getElementById("landingIntroRolar");
  if (linkRolar) {
    linkRolar.addEventListener("click", function (e) {
      e.preventDefault();
      rolarParaPainel(1);
    });
  }

  function irParaHash(hash) {
    if (hash === "#setad-teen") {
      rolarParaPainel(1);
      return true;
    }
    if (hash === "#inicio") {
      rolarParaPainel(0);
      return true;
    }
    return false;
  }

  if (window.location.hash) {
    window.setTimeout(function () {
      irParaHash(window.location.hash);
    }, 120);
  }

  document.querySelectorAll('a[href="#setad-teen"], a[href="#inicio"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      if (!document.getElementById(href.slice(1))) return;
      e.preventDefault();
      irParaHash(href);
      if (history.replaceState) {
        history.replaceState(null, "", href);
      }
    });
  });
})();
