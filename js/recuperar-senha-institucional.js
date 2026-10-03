/* Recuperação de senha — área institucional SETAD */

(function () {
  "use strict";

  var emailAtual = "";

  function montarTextoEnvioCodigo(email, codigoDemo, meta) {
    var info = meta || {};
    var html =
      "Enviamos um código de <strong>6 dígitos</strong> para <strong>" +
      email +
      "</strong>.";
    if (info.emailEnviado) {
      html +=
        " No Gmail pode levar <strong>1 a 3 minutos</strong>; confira também <strong>Promoções</strong> e <strong>from:noreply@setad.org.br</strong>.";
    }
    if (info.avisoEmail) {
      html += " <span class=\"login-card__demo-codigo\">" + info.avisoEmail + "</span>";
    }
    if (codigoDemo) {
      html +=
        " <span class=\"login-card__demo-codigo\">Demonstração (sem SMTP): <strong>" +
        codigoDemo +
        "</strong></span>";
    }
    return html;
  }

  function mostrarPainelSenha(dados) {
    emailAtual = dados.email;
    document.getElementById("painelEmailRecuperacao").hidden = true;
    document.getElementById("painelSenhaRecuperacao").hidden = false;
    document.getElementById("painelVerificacaoRecuperacao").hidden = true;
    document.getElementById("emailSenhaRecuperacao").textContent = dados.email;
  }

  function mostrarPainelVerificacao(email, codigoDemo, meta) {
    emailAtual = email;
    document.getElementById("painelEmailRecuperacao").hidden = true;
    document.getElementById("painelSenhaRecuperacao").hidden = true;
    document.getElementById("painelVerificacaoRecuperacao").hidden = false;
    document.getElementById("emailVerificacaoRecuperacao").textContent = email;

    var demo = document.getElementById("codigoDemoRecuperacao");
    demo.innerHTML = montarTextoEnvioCodigo(email, codigoDemo, meta || {});
    demo.classList.add("visible");
  }

  function finalizarAposRecuperacao(resposta) {
    if (resposta.token && SETADApi.salvarToken) {
      SETADApi.salvarToken(resposta.token);
    }
    if (typeof aplicarSessaoApi === "function") {
      aplicarSessaoApi(resposta.user);
    }
    if (typeof redirecionarAposLoginInstitucional === "function" && resposta.user) {
      redirecionarAposLoginInstitucional(resposta.user, null);
      return;
    }
    window.location.href = "login-direcao.html";
  }

  document.getElementById("formEmailRecuperacao").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroEmailRecuperacao");
    erroEl.classList.remove("visible");
    erroEl.textContent = "";

    var email = document.getElementById("emailRecuperacao").value.trim().toLowerCase();

    SETADApi.post("/auth/staff/recuperar-senha/iniciar", { email: email }).then(function (resposta) {
      if (!resposta.ok) {
        if (resposta.precisaPrimeiroAcesso) {
          erroEl.innerHTML =
            (resposta.erro || "") +
            ' <a href="primeiro-acesso-institucional.html">Ir para o primeiro acesso</a>.';
        } else {
          erroEl.textContent = resposta.erro || "Não foi possível continuar.";
        }
        erroEl.classList.add("visible");
        return;
      }
      mostrarPainelSenha(resposta);
    }).catch(function () {
      erroEl.textContent = "Servidor indisponível. Tente novamente.";
      erroEl.classList.add("visible");
    });
  });

  document.getElementById("formSenhaRecuperacao").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroSenhaRecuperacao");
    erroEl.classList.remove("visible");
    erroEl.textContent = "";

    var senha = document.getElementById("senhaRecuperacao").value;
    var confirmar = document.getElementById("confirmarSenhaRecuperacao").value;

    SETADApi.post("/auth/staff/recuperar-senha/senha", {
      email: emailAtual,
      senha: senha,
      confirmarSenha: confirmar
    }).then(function (resposta) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Não foi possível salvar a nova senha.";
        erroEl.classList.add("visible");
        return;
      }
      mostrarPainelVerificacao(resposta.email || emailAtual, resposta.codigoDemo, {
        emailEnviado: resposta.emailEnviado,
        avisoEmail: resposta.avisoEmail
      });
    }).catch(function () {
      erroEl.textContent = "Servidor indisponível. Tente novamente.";
      erroEl.classList.add("visible");
    });
  });

  document.getElementById("formVerificacaoRecuperacao").addEventListener("submit", function (evento) {
    evento.preventDefault();
    var erroEl = document.getElementById("erroVerificacaoRecuperacao");
    var sucessoEl = document.getElementById("sucessoVerificacaoRecuperacao");
    erroEl.classList.remove("visible");
    sucessoEl.classList.remove("visible");

    var codigo = document.getElementById("codigoRecuperacao").value.trim();

    SETADApi.post("/auth/staff/recuperar-senha/verificar", { email: emailAtual, codigo: codigo }).then(
      function (resposta) {
        if (!resposta.ok) {
          erroEl.textContent = resposta.erro || "Código inválido.";
          erroEl.classList.add("visible");
          return;
        }
        sucessoEl.textContent = resposta.mensagem || "Senha atualizada! Entrando...";
        sucessoEl.classList.add("visible");
        finalizarAposRecuperacao(resposta);
      }
    );
  });

  document.getElementById("btnReenviarCodigoRecuperacao").addEventListener("click", function () {
    var erroEl = document.getElementById("erroVerificacaoRecuperacao");
    var sucessoEl = document.getElementById("sucessoVerificacaoRecuperacao");
    erroEl.classList.remove("visible");
    sucessoEl.classList.remove("visible");

    SETADApi.post("/auth/staff/recuperar-senha/reenviar-codigo", { email: emailAtual }).then(function (
      resposta
    ) {
      if (!resposta.ok) {
        erroEl.textContent = resposta.erro || "Não foi possível reenviar.";
        erroEl.classList.add("visible");
        return;
      }
      mostrarPainelVerificacao(resposta.email || emailAtual, resposta.codigoDemo, {
        emailEnviado: resposta.emailEnviado,
        avisoEmail: resposta.avisoEmail
      });
      sucessoEl.textContent = resposta.emailEnviado
        ? "Novo código enviado ao seu e-mail."
        : resposta.avisoEmail || "Tente novamente em instantes.";
      sucessoEl.classList.add("visible");
    });
  });
})();
