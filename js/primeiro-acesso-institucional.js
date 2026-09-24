/* ============================================================
   primeiro-acesso-institucional.js — Direção, contabilidade e secretaria
   ============================================================ */

(function () {
  "use strict";

  var emailAtual = "";
  var redirectDestino = "login-direcao.html";

  var LABEL_PERFIL = {
    diretor: "Direção",
    contador: "Contabilidade",
    secretaria: "Secretaria"
  };

  function mostrarPainelEmail() {
    document.getElementById("painelEmail").hidden = false;
    document.getElementById("painelSenhaInstitucional").hidden = true;
    document.getElementById("painelVerificacaoInstitucional").hidden = true;
  }

  function mostrarPainelSenha(dados) {
    emailAtual = dados.email;
    redirectDestino = dados.redirect || redirectDestino;
    document.getElementById("painelEmail").hidden = true;
    document.getElementById("painelSenhaInstitucional").hidden = false;
    document.getElementById("painelVerificacaoInstitucional").hidden = true;
    document.getElementById("emailSenhaInstitucional").textContent = dados.email;
    document.getElementById("perfilSenhaInstitucional").textContent =
      dados.perfil ? " · " + (LABEL_PERFIL[dados.perfil] || dados.perfil) : "";
  }

  function mostrarPainelVerificacao(email, codigoDemo) {
    emailAtual = email;
    document.getElementById("painelEmail").hidden = true;
    document.getElementById("painelSenhaInstitucional").hidden = true;
    document.getElementById("painelVerificacaoInstitucional").hidden = false;
    document.getElementById("emailVerificacaoInstitucional").textContent = email;

    var demo = document.getElementById("codigoDemoInstitucional");
    demo.classList.remove("visible");
    demo.textContent = "";

    if (codigoDemo) {
      demo.innerHTML =
        "Código enviado ao e-mail. <span class=\"login-card__demo-codigo\">Demonstração (sem SMTP): <strong>" +
        codigoDemo +
        "</strong></span>";
      demo.classList.add("visible");
    }
  }

  function finalizarLoginApi(resultado) {
    if (resultado.token && window.SETADNative && typeof SETADNative.setToken === "function") {
      SETADNative.setToken(resultado.token);
    }
    if (window.SETAD) {
      window.SETAD.session = resultado.user;
    }
    var chave =
      resultado.user && resultado.user.perfil === "secretaria"
        ? "setad_sessao_secretaria"
        : "setad_sessao_direcao";
    try {
      localStorage.setItem(chave, JSON.stringify(resultado.user));
    } catch (_e) {}

    window.location.href = resultado.redirect || redirectDestino;
  }

  document.getElementById("formEmailInstitucional").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroEmailInstitucional");
    erroEl.classList.remove("visible");
    erroEl.textContent = "";

    var email = document.getElementById("emailInstitucional").value.trim().toLowerCase();

    SETADApi.post("/auth/staff/ativacao/iniciar", { email: email }).then(function (resposta) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Não foi possível continuar.";
        erroEl.classList.add("visible");
        return;
      }

      if (resposta.etapa === "verificacao") {
        mostrarPainelVerificacao(resposta.email);
      } else {
        mostrarPainelSenha(resposta);
      }
    }).catch(function () {
      erroEl.textContent = "Servidor indisponível. Tente novamente.";
      erroEl.classList.add("visible");
    });
  });

  document.getElementById("formSenhaInstitucional").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroSenhaInstitucional");
    erroEl.classList.remove("visible");
    erroEl.textContent = "";

    var senha = document.getElementById("senhaInstitucional").value;
    var confirmar = document.getElementById("confirmarSenhaInstitucional").value;

    SETADApi.post("/auth/staff/ativacao/senha", {
      email: emailAtual,
      senha: senha,
      confirmarSenha: confirmar
    }).then(function (resposta) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Não foi possível salvar a senha.";
        erroEl.classList.add("visible");
        return;
      }
      if (resposta.redirect) redirectDestino = resposta.redirect;
      mostrarPainelVerificacao(resposta.email, resposta.codigoDemo);
    });
  });

  document.getElementById("formVerificacaoInstitucional").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroVerificacaoInstitucional");
    var sucessoEl = document.getElementById("sucessoVerificacaoInstitucional");
    erroEl.classList.remove("visible");
    sucessoEl.classList.remove("visible");

    var codigo = document.getElementById("codigoInstitucional").value.trim();

    SETADApi.post("/auth/staff/ativacao/verificar", { email: emailAtual, codigo: codigo }).then(function (resposta) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Código inválido.";
        erroEl.classList.add("visible");
        return;
      }

      sucessoEl.textContent = "Conta ativada! Entrando na área institucional...";
      sucessoEl.classList.add("visible");
      finalizarLoginApi(resposta);
    });
  });

  document.getElementById("btnReenviarCodigoInstitucional").addEventListener("click", function () {
    SETADApi.post("/auth/staff/ativacao/reenviar-codigo", { email: emailAtual }).then(function (resposta) {
      if (!resposta.ok) return;
      mostrarPainelVerificacao(resposta.email || emailAtual, resposta.codigoDemo);
    });
  });
})();
