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

  function montarTextoEnvioCodigo(email, codigoDemo, meta) {
    var info = meta || {};
    var html =
      "Enviamos um código de <strong>6 dígitos</strong> para <strong>" +
      email +
      "</strong>.";
    if (info.emailEnviado) {
      html +=
        " O envio foi aceito pelo servidor. No Gmail pode levar <strong>1 a 3 minutos</strong>; confira também <strong>Promoções</strong> e pesquise <strong>from:noreply@setad.org.br</strong>.";
    }
    if (info.avisoEmail) {
      html +=
        " <span class=\"login-card__demo-codigo\">" + info.avisoEmail + "</span>";
    }
    if (codigoDemo) {
      html +=
        " <span class=\"login-card__demo-codigo\">Demonstração (sem SMTP): <strong>" +
        codigoDemo +
        "</strong></span>";
    }
    return html;
  }

  function mostrarPainelVerificacao(email, codigoDemo, meta) {
    emailAtual = email;
    document.getElementById("painelEmail").hidden = true;
    document.getElementById("painelSenhaInstitucional").hidden = true;
    document.getElementById("painelVerificacaoInstitucional").hidden = false;
    document.getElementById("emailVerificacaoInstitucional").textContent = email;

    var demo = document.getElementById("codigoDemoInstitucional");
    demo.classList.remove("visible");
    demo.textContent = "";

    demo.innerHTML = montarTextoEnvioCodigo(email, codigoDemo, meta || {});
    demo.classList.add("visible");
  }

  function finalizarLoginApi(resultado) {
    if (resultado.token && typeof SETADApi !== "undefined" && SETADApi.salvarToken) {
      SETADApi.salvarToken(resultado.token);
    }
    if (typeof aplicarSessaoApi === "function") {
      aplicarSessaoApi(resultado.user);
    } else if (window.SETAD) {
      window.SETAD.session = resultado.user;
    }
    if (typeof redirecionarAposLoginInstitucional === "function" && resultado.user) {
      redirecionarAposLoginInstitucional(resultado.user, null);
      return;
    }
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
        if (resposta.jaAtivo) {
          erroEl.innerHTML =
            (resposta.erro || "Conta já ativa.") +
            ' <a href="recuperar-senha-institucional.html">Esqueci minha senha</a>.';
        } else {
          erroEl.textContent = resposta.erro || "Não foi possível continuar.";
        }
        erroEl.classList.add("visible");
        return;
      }

      if (resposta.etapa === "verificacao") {
        mostrarPainelVerificacao(resposta.email, resposta.codigoDemo, {
          emailEnviado: resposta.emailEnviado,
          avisoEmail: resposta.avisoEmail
        });
      } else {
        mostrarPainelSenha(resposta);
        if (resposta.avisoEtapa) {
          var avisoSenha = document.getElementById("erroSenhaInstitucional");
          avisoSenha.textContent = resposta.avisoEtapa;
          avisoSenha.classList.add("visible", "login-card__success");
        }
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
      mostrarPainelVerificacao(resposta.email, resposta.codigoDemo, {
        emailEnviado: resposta.emailEnviado,
        avisoEmail: resposta.avisoEmail
      });
    }).catch(function () {
      erroEl.textContent = "Servidor indisponível. Tente novamente.";
      erroEl.classList.add("visible");
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
    var erroEl = document.getElementById("erroVerificacaoInstitucional");
    var sucessoEl = document.getElementById("sucessoVerificacaoInstitucional");
    erroEl.classList.remove("visible");
    sucessoEl.classList.remove("visible");
    erroEl.textContent = "";
    sucessoEl.textContent = "";

    SETADApi.post("/auth/staff/ativacao/reenviar-codigo", { email: emailAtual }).then(function (resposta) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Não foi possível reenviar o código.";
        erroEl.classList.add("visible");
        return;
      }
      mostrarPainelVerificacao(resposta.email || emailAtual, resposta.codigoDemo, {
        emailEnviado: resposta.emailEnviado,
        avisoEmail: resposta.avisoEmail
      });
      sucessoEl.textContent = resposta.emailEnviado
        ? "Novo código enviado ao seu e-mail."
        : (resposta.avisoEmail || "Tente novamente em instantes.");
      sucessoEl.classList.add("visible");
    }).catch(function () {
      erroEl.textContent = "Servidor indisponível. Tente novamente.";
      erroEl.classList.add("visible");
    });
  });
})();
