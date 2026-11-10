/**
 * Landing SETAD — rolagem da abertura (fachada SETADE + SETAD Teen).
 */
(function () {
  "use strict";

  var intro = document.querySelector("[data-landing-intro]");
  if (!intro || !document.body.classList.contains("pagina-inicial")) return;

  var camadaSetad = document.querySelector('[data-landing-camada="setad"]');
  var camadaTeen = document.querySelector('[data-landing-camada="teen"]');
  var poster = document.querySelector("[data-landing-teen-poster]");
  var cartao = document.querySelector("[data-landing-teen-cartao]");
  var passos = document.querySelectorAll("[data-landing-passo]");
  var paineis = intro.querySelectorAll("[data-landing-painel]");
  var reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function limitar(valor, min, max) {
    return Math.min(max, Math.max(min, valor));
  }

  function suavizar(inicio, fim, t) {
    if (t <= inicio) return 0;
    if (t >= fim) return 1;
    return (t - inicio) / (fim - inicio);
  }

  function atualizarFundo() {
    if (!camadaSetad || !camadaTeen) return;

    var rect = intro.getBoundingClientRect();
    var alturaIntro = intro.offsetHeight;
    var viewport = window.innerHeight || 1;
    var rolavel = Math.max(1, alturaIntro - viewport);
    var progresso = limitar(-rect.top / rolavel, 0, 1);
    var misturaTeen = suavizar(0.28, 0.72, progresso);

    camadaTeen.style.opacity = String(misturaTeen);
    camadaSetad.style.opacity = String(1 - misturaTeen * 0.92);

    var parallaxY = progresso * 28;
    camadaSetad.style.transform = "scale(1.08) translate3d(0, " + parallaxY * 0.35 + "px, 0)";
    camadaTeen.style.transform =
      "scale(1.12) translate3d(0, " + (parallaxY * -0.2 + 12) + "px, 0)";

    var passoAtivo = progresso < 0.42 ? 0 : 1;
    passos.forEach(function (btn, indice) {
      var ativo = indice === passoAtivo;
      btn.classList.toggle("is-ativo", ativo);
      btn.setAttribute("aria-current", ativo ? "step" : "false");
    });

    if (rect.bottom < viewport * 0.15) {
      document.body.classList.add("landing-intro--encerrado");
    } else {
      document.body.classList.remove("landing-intro--encerrado");
    }
  }

  function rolarParaPainel(indice) {
    var alvo = paineis[indice];
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });
  }

  passos.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var indice = Number(btn.getAttribute("data-landing-passo")) || 0;
      rolarParaPainel(indice);
    });
  });

  var tickAgendado = false;
  function agendarAtualizacao() {
    if (tickAgendado) return;
    tickAgendado = true;
    window.requestAnimationFrame(function () {
      tickAgendado = false;
      atualizarFundo();
    });
  }

  window.addEventListener("scroll", agendarAtualizacao, { passive: true });
  window.addEventListener("resize", agendarAtualizacao);
  atualizarFundo();

  if (poster && cartao && !reduzirMovimento) {
    var rotX = 0;
    var rotY = 0;

    function aplicarTilt(e) {
      var rect = poster.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      rotY = x * 14;
      rotX = y * -12;
      cartao.style.setProperty("--teen-rot-x", rotX.toFixed(2) + "deg");
      cartao.style.setProperty("--teen-rot-y", rotY.toFixed(2) + "deg");
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
      alternarPulso();
    });
    poster.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
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
})();
