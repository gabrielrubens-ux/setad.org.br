/* ============================================================
   auth.js — Autenticação de demonstração (sem backend)
   Perfis com permissão para cadastrar livros:
   professor, diretor e autorizado (biblioteca).
   ============================================================ */

/*
  PERFIS_AUTORIZADOS_LIVROS — quem pode cadastrar na biblioteca.
  Alunos NÃO estão nesta lista.
*/
const PERFIS_AUTORIZADOS_LIVROS = ["professor", "diretor", "autorizado"];

const CREDENCIAIS = {
  aluno: {
    email: "aluno@setad.org.br",
    senha: "aluno123",
    redirect: "painel-aluno.html",
    storageKey: "setad_sessao_aluno",
    perfil: "aluno",
    nome: "Aluno SETAD"
  },
  professor: {
    email: "professor@setad.org.br",
    senha: "prof123",
    redirect: "painel-professor.html",
    storageKey: "setad_sessao_professor",
    perfil: "professor",
    nome: "Prof. SETAD"
  },
  diretor: {
    email: "diretor@setad.org.br",
    senha: "dir123",
    redirect: "painel-diretor.html",
    storageKey: "setad_sessao_direcao",
    perfil: "diretor",
    nome: "Dir. SETAD"
  },
  contador: {
    email: "contador@setad.org.br",
    senha: "cont456",
    redirect: "painel-contador.html",
    storageKey: "setad_sessao_direcao",
    perfil: "contador",
    nome: "Contador SETAD"
  },
  secretaria: {
    email: "secretaria@setad.org.br",
    senha: "sec123",
    redirect: "painel-secretaria.html",
    storageKey: "setad_sessao_secretaria",
    perfil: "secretaria",
    nome: "Secretaria SETAD"
  },
  autorizado: {
    email: "biblioteca@setad.org.br",
    senha: "bib123",
    redirect: "painel-professor.html",
    storageKey: "setad_sessao_professor",
    perfil: "autorizado",
    nome: "Biblioteca SETAD"
  }
};

/* Lista usada no login do professor — professor e biblioteca */
const CONTAS_STAFF = [
  CREDENCIAIS.professor,
  CREDENCIAIS.autorizado
];

/* Área da direção — login único: diretor e contador */
const CONTAS_DIRECAO = [
  CREDENCIAIS.diretor,
  CREDENCIAIS.contador
];

const STORAGE_SESSAO_DIRECAO = "setad_sessao_direcao";
const STORAGE_SESSAO_SECRETARIA = "setad_sessao_secretaria";

function authApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function aplicarSessaoApi(user) {
  if (!user || !window.SETAD) return;
  window.SETAD.setSession(user);
}

function finalizarLoginApi(resposta, redirect) {
  if (resposta && resposta.token) {
    SETADApi.salvarToken(resposta.token);
  }
  aplicarSessaoApi(resposta.user);
  return SETADApi.snapshot().then(function (snap) {
    if (snap.ok && window.SETAD.hydrate) {
      window.SETAD.hydrate(snap.snapshot);
    }
    window.location.href = redirect;
  });
}

function salvarSessao(conta) {
  localStorage.setItem(conta.storageKey, JSON.stringify({
    tipo: conta.perfil === "aluno" ? "aluno" : "professor",
    perfil: conta.perfil,
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function salvarSessaoAluno(conta) {
  localStorage.setItem(CREDENCIAIS.aluno.storageKey, JSON.stringify({
    tipo: "aluno",
    perfil: "aluno",
    nome: conta.nome,
    email: conta.email,
    modulo: conta.modulo || null,
    loginEm: new Date().toISOString()
  }));
}

function obterSessao(tipo) {
  if (authApiAtivo() && window.SETAD.session) {
    const sessao = window.SETAD.session;
    if (tipo === "aluno" && sessao.perfil === "aluno") return sessao;
    if (tipo === "professor" && (sessao.perfil === "professor" || sessao.perfil === "autorizado")) {
      return sessao;
    }
  }

  const config = CREDENCIAIS[tipo];
  const dados = localStorage.getItem(config.storageKey);
  return dados ? JSON.parse(dados) : null;
}

function obterSessaoStaff() {
  return obterSessao("professor");
}

function salvarSessaoDirecao(conta) {
  localStorage.setItem(STORAGE_SESSAO_DIRECAO, JSON.stringify({
    tipo: "direcao",
    perfil: conta.perfil,
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function obterSessaoDirecao() {
  if (authApiAtivo() && window.SETAD.session) {
    const sessao = window.SETAD.session;
    if (sessao.perfil === "diretor" || sessao.perfil === "contador") return sessao;
  }

  const dados = localStorage.getItem(STORAGE_SESSAO_DIRECAO);
  return dados ? JSON.parse(dados) : null;
}

function encerrarSessaoDirecao() {
  if (authApiAtivo()) {
    SETADApi.logout().finally(function () {
      if (window.SETAD) window.SETAD.clearSession();
    });
  }
  localStorage.removeItem(STORAGE_SESSAO_DIRECAO);
}

/**
 * Protege painéis da direção — só diretor ou contador autenticado.
 * perfilRequerido: "diretor" | "contador" | null (qualquer um da direção)
 */
function protegerPainelDirecao(perfilRequerido) {
  const sessao = obterSessaoDirecao();
  if (!sessao || (sessao.perfil !== "diretor" && sessao.perfil !== "contador")) {
    window.location.href = "login-direcao.html";
    return null;
  }
  if (perfilRequerido && sessao.perfil !== perfilRequerido) {
    window.location.href = sessao.perfil === "contador"
      ? "painel-contador.html"
      : "painel-diretor.html";
    return null;
  }
  return sessao;
}

function salvarSessaoSecretaria(conta) {
  localStorage.setItem(STORAGE_SESSAO_SECRETARIA, JSON.stringify({
    tipo: "secretaria",
    perfil: conta.perfil,
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function obterSessaoSecretaria() {
  if (authApiAtivo() && window.SETAD.session && window.SETAD.session.perfil === "secretaria") {
    return window.SETAD.session;
  }

  const dados = localStorage.getItem(STORAGE_SESSAO_SECRETARIA);
  return dados ? JSON.parse(dados) : null;
}

function encerrarSessaoSecretaria() {
  if (authApiAtivo()) {
    SETADApi.logout().finally(function () {
      if (window.SETAD) window.SETAD.clearSession();
    });
  }
  localStorage.removeItem(STORAGE_SESSAO_SECRETARIA);
}

function protegerPainelSecretaria() {
  const sessao = obterSessaoSecretaria();
  if (!sessao || sessao.perfil !== "secretaria") {
    window.location.href = "login-direcao.html#secretaria";
    return null;
  }
  return sessao;
}

function buscarContaDirecao(email, senha) {
  return CONTAS_DIRECAO.find(function (c) {
    return email === c.email && senha === c.senha;
  });
}

function finalizarLoginDirecaoLocal(conta) {
  salvarSessaoDirecao(conta);
  window.location.href = conta.redirect;
}

function configurarLoginDirecao() {
  const formDirecao = document.getElementById("loginFormDirecao");
  const formSecretaria = document.getElementById("loginFormSecretaria");
  const erroDirecao = document.getElementById("loginErroDirecao");
  const erroSecretaria = document.getElementById("loginErroSecretaria");
  const abaDirecao = document.getElementById("abaDirecao");
  const abaSecretaria = document.getElementById("abaSecretaria");
  const painelDirecao = document.getElementById("painelLoginDirecao");
  const painelSecretaria = document.getElementById("painelLoginSecretaria");

  if (formDirecao && formDirecao.dataset.loginBound === "1") {
    return;
  }

  function alternarAba(modo) {
    if (painelDirecao) painelDirecao.hidden = modo !== "direcao";
    if (painelSecretaria) painelSecretaria.hidden = modo !== "secretaria";

    if (abaDirecao) {
      abaDirecao.classList.toggle("login-card__tab--ativa", modo === "direcao");
      abaDirecao.setAttribute("aria-selected", modo === "direcao" ? "true" : "false");
    }
    if (abaSecretaria) {
      abaSecretaria.classList.toggle("login-card__tab--ativa", modo === "secretaria");
      abaSecretaria.setAttribute("aria-selected", modo === "secretaria" ? "true" : "false");
    }
  }

  if (abaDirecao) {
    abaDirecao.addEventListener("click", function () { alternarAba("direcao"); });
  }
  if (abaSecretaria) {
    abaSecretaria.addEventListener("click", function () { alternarAba("secretaria"); });
  }

  if (window.location.hash === "#secretaria") {
    alternarAba("secretaria");
  } else {
    alternarAba("direcao");
  }

  if (formDirecao) {
    formDirecao.dataset.loginBound = "1";
    formDirecao.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const email = document.getElementById("emailDirecao").value.trim().toLowerCase();
      const senha = document.getElementById("senhaDirecao").value;

      function falhaLogin() {
        if (!erroDirecao) return;
        erroDirecao.classList.add("visible");
        erroDirecao.textContent = "Acesso negado. E-mail ou senha incorretos para direção/contabilidade.";
      }

      function tentarLoginLocal() {
        const conta = buscarContaDirecao(email, senha);
        if (conta) {
          finalizarLoginDirecaoLocal(conta);
          return true;
        }
        return false;
      }

      if (authApiAtivo() && typeof SETADApi !== "undefined") {
        SETADApi.login(email, senha).then(function (resposta) {
          if (resposta && resposta.ok && resposta.user) {
            if (resposta.user.perfil === "diretor") {
              finalizarLoginApi(resposta, CREDENCIAIS.diretor.redirect);
              return;
            }
            if (resposta.user.perfil === "contador") {
              finalizarLoginApi(resposta, CREDENCIAIS.contador.redirect);
              return;
            }
          }
          if (tentarLoginLocal()) return;
          falhaLogin();
        }).catch(function () {
          if (tentarLoginLocal()) return;
          falhaLogin();
        });
        return;
      }

      if (tentarLoginLocal()) return;
      falhaLogin();
    });
  }

  if (formSecretaria && formSecretaria.dataset.loginBound !== "1") {
    formSecretaria.dataset.loginBound = "1";
    formSecretaria.addEventListener("submit", function (evento) {
      evento.preventDefault();

      const email = document.getElementById("emailSecretaria").value.trim().toLowerCase();
      const senha = document.getElementById("senhaSecretaria").value;
      const conta = CREDENCIAIS.secretaria;

      function falhaLogin() {
        erroSecretaria.classList.add("visible");
        erroSecretaria.textContent = "Acesso negado. E-mail ou senha incorretos para a secretaria.";
      }

      if (authApiAtivo()) {
        SETADApi.login(email, senha).then(function (resposta) {
          if (resposta.ok && resposta.user && resposta.user.perfil === "secretaria") {
            finalizarLoginApi(resposta, conta.redirect);
            return;
          }
          falhaLogin();
        }).catch(falhaLogin);
        return;
      }

      if (email === conta.email && senha === conta.senha) {
        salvarSessaoSecretaria(conta);
        window.location.href = conta.redirect;
        return;
      }

      falhaLogin();
    });
  }

}

function encerrarSessao(tipo) {
  if (authApiAtivo()) {
    SETADApi.logout().finally(function () {
      if (window.SETAD) window.SETAD.clearSession();
    });
  }
  const config = CREDENCIAIS[tipo];
  localStorage.removeItem(config.storageKey);
}

function protegerPainel(tipo) {
  const sessao = obterSessao(tipo);
  if (!sessao) {
    window.location.href = tipo === "aluno" ? "login-aluno.html" : "login-professor.html";
    return null;
  }
  return sessao;
}

/**
 * Verifica se o usuário pode cadastrar, editar ou excluir livros.
 */
function podeGerenciarLivros(sessao) {
  return sessao && PERFIS_AUTORIZADOS_LIVROS.includes(sessao.perfil);
}

function podeCadastrarLivros(sessao) {
  return podeGerenciarLivros(sessao);
}

function configurarLogin(tipo) {
  const form = document.getElementById("loginForm");
  const erroEl = document.getElementById("loginErro");

  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const senha = document.getElementById("senha").value;

    function falhaLogin() {
      erroEl.classList.add("visible");
      erroEl.textContent = "E-mail ou senha incorretos. Verifique e tente novamente.";
    }

    if (authApiAtivo()) {
      if (tipo === "aluno") {
        SETADApi.verificacaoPendente(email).then(function (pend) {
          if (pend.pendente) {
            erroEl.classList.add("visible");
            erroEl.textContent = "Sua conta ainda não foi verificada. Informe o código de 6 dígitos enviado ao seu e-mail.";
            mostrarPainelVerificacao(email);
            return null;
          }
          return SETADApi.login(email, senha);
        }).then(function (resposta) {
          if (!resposta) return;
          if (resposta.ok && resposta.user && resposta.user.perfil === "aluno") {
            finalizarLoginApi(resposta, CREDENCIAIS.aluno.redirect);
            return;
          }
          falhaLogin();
        }).catch(falhaLogin);
        return;
      }

      SETADApi.login(email, senha).then(function (resposta) {
        if (resposta.ok && resposta.user &&
            (resposta.user.perfil === "professor" || resposta.user.perfil === "autorizado")) {
          finalizarLoginApi(resposta, CREDENCIAIS.professor.redirect);
          return;
        }
        falhaLogin();
      }).catch(falhaLogin);
      return;
    }

    if (tipo === "aluno") {
      if (emailTemVerificacaoPendente(email)) {
        erroEl.classList.add("visible");
        erroEl.textContent = "Sua conta ainda não foi verificada. Informe o código de 6 dígitos enviado ao seu e-mail.";
        mostrarPainelVerificacao(email);
        return;
      }

      const contaMatriculada = autenticarAluno(email, senha);
      if (contaMatriculada) {
        salvarSessaoAluno(contaMatriculada);
        window.location.href = CREDENCIAIS.aluno.redirect;
        return;
      }

      const config = CREDENCIAIS.aluno;
      if (email === config.email && senha === config.senha) {
        salvarSessao(config);
        window.location.href = config.redirect;
        return;
      }
    } else {
      const conta = CONTAS_STAFF.find(function (c) {
        return email === c.email && senha === c.senha;
      });

      if (conta) {
        salvarSessao(conta);
        window.location.href = conta.redirect;
        return;
      }
    }

    falhaLogin();
  });
}

/**
 * Configura o formulário de primeiro acesso do aluno.
 * Só permite cadastro com e-mail já usado na matrícula online.
 */
function configurarCadastroAluno() {
  const form = document.getElementById("cadastroForm");
  const erroEl = document.getElementById("cadastroErro");

  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    erroEl.classList.remove("visible");
    erroEl.textContent = "";

    const email = document.getElementById("cadastroEmail").value.trim().toLowerCase();
    const senha = document.getElementById("cadastroSenha").value;
    const confirmarSenha = document.getElementById("cadastroConfirmarSenha").value;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      erroEl.textContent = "Informe um e-mail válido.";
      erroEl.classList.add("visible");
      return;
    }

    if (senha.length < 6) {
      erroEl.textContent = "A senha deve ter no mínimo 6 caracteres.";
      erroEl.classList.add("visible");
      return;
    }

    if (senha !== confirmarSenha) {
      erroEl.textContent = "As senhas não coincidem.";
      erroEl.classList.add("visible");
      return;
    }

    if (authApiAtivo()) {
      SETADApi.registerAluno(email, senha).then(function (resultado) {
        if (!resultado.ok) {
          erroEl.textContent = resultado.erro;
          erroEl.classList.add("visible");
          return;
        }
        form.reset();
        mostrarPainelVerificacao(resultado.email, resultado.codigoDemo);
      }).catch(function () {
        erroEl.textContent = "Não foi possível iniciar o cadastro. Tente novamente.";
        erroEl.classList.add("visible");
      });
      return;
    }

    const resultado = solicitarVerificacaoCadastro(email, senha);

    if (!resultado.ok) {
      erroEl.textContent = resultado.erro;
      erroEl.classList.add("visible");
      return;
    }

    form.reset();
    mostrarPainelVerificacao(resultado.email, resultado.codigo);
  });
}

/**
 * Simula o envio do código por e-mail (sem backend).
 * Em produção, um servidor enviaria o código ao endereço do aluno.
 */
function simularEnvioCodigoEmail(email, codigo) {
  const demoEl = document.getElementById("codigoDemonstracao");
  if (!demoEl) return;

  demoEl.innerHTML =
    "Enviamos um código de <strong>6 dígitos</strong> para <strong>" +
    escaparHtml(email) + "</strong>.<br>" +
    "<span class=\"login-card__demo-codigo\">Demonstração (sem servidor de e-mail): <strong>" +
    escaparHtml(codigo) + "</strong></span>";
  demoEl.classList.add("visible");
}

/**
 * Exibe o painel de verificação de e-mail com código de 6 dígitos.
 */
function mostrarPainelVerificacao(email, codigoDemo) {
  const painelLogin = document.getElementById("painelLogin");
  const painelCadastro = document.getElementById("painelCadastro");
  const painelVerificacao = document.getElementById("painelVerificacao");
  const tabs = document.querySelector(".login-card__tabs");
  const emailVerificacao = document.getElementById("verificacaoEmail");
  const codigoInput = document.getElementById("codigoVerificacao");
  const demoEl = document.getElementById("codigoDemonstracao");

  if (!painelVerificacao) return;

  if (painelLogin) painelLogin.hidden = true;
  if (painelCadastro) painelCadastro.hidden = true;
  if (tabs) tabs.hidden = true;

  painelVerificacao.hidden = false;

  if (emailVerificacao) {
    emailVerificacao.textContent = email;
  }

  if (codigoInput) {
    codigoInput.value = "";
    codigoInput.focus();
  }

  if (demoEl) {
    demoEl.classList.remove("visible");
    demoEl.textContent = "";
  }

  if (codigoDemo) {
    simularEnvioCodigoEmail(email, codigoDemo);
  } else {
    const pendente = obterVerificacaoPendente(email);
    if (pendente) {
      simularEnvioCodigoEmail(email, pendente.codigo);
    }
  }
}

/**
 * Configura a verificação do código de 6 dígitos.
 */
function configurarVerificacaoAluno() {
  const form = document.getElementById("verificacaoForm");
  const erroEl = document.getElementById("verificacaoErro");
  const sucessoEl = document.getElementById("verificacaoSucesso");
  const btnReenviar = document.getElementById("btnReenviarCodigo");

  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    erroEl.classList.remove("visible");
    sucessoEl.classList.remove("visible");
    erroEl.textContent = "";
    sucessoEl.textContent = "";

    const email = (document.getElementById("verificacaoEmail") || {}).textContent || "";
    const codigo = document.getElementById("codigoVerificacao").value.trim();

    if (!/^\d{6}$/.test(codigo)) {
      erroEl.textContent = "Informe o código completo com 6 números.";
      erroEl.classList.add("visible");
      return;
    }

    if (authApiAtivo()) {
      SETADApi.verifyAluno(email, codigo).then(function (resultado) {
        if (!resultado.ok) {
          erroEl.textContent = resultado.erro;
          erroEl.classList.add("visible");
          return;
        }

        sucessoEl.innerHTML = "<strong>Conta verificada com sucesso!</strong> Entrando na área do aluno...";
        sucessoEl.classList.add("visible", "login-card__success");
        finalizarLoginApi(resultado, CREDENCIAIS.aluno.redirect);
      }).catch(function () {
        erroEl.textContent = "Não foi possível verificar o código. Tente novamente.";
        erroEl.classList.add("visible");
      });
      return;
    }

    const resultado = confirmarVerificacaoCadastro(email, codigo);

    if (!resultado.ok) {
      erroEl.textContent = resultado.erro;
      erroEl.classList.add("visible");
      return;
    }

    sucessoEl.innerHTML = "<strong>Conta verificada com sucesso!</strong> Entrando na área do aluno...";
    sucessoEl.classList.add("visible", "login-card__success");

    salvarSessaoAluno(resultado.conta);

    setTimeout(function () {
      window.location.href = CREDENCIAIS.aluno.redirect;
    }, 1500);
  });

  if (btnReenviar) {
    btnReenviar.addEventListener("click", function () {
      const email = (document.getElementById("verificacaoEmail") || {}).textContent || "";
      if (authApiAtivo()) {
        SETADApi.resendCodeAluno(email).then(function (resultado) {
          if (!resultado.ok) {
            erroEl.textContent = resultado.erro;
            erroEl.classList.add("visible");
            return;
          }
          simularEnvioCodigoEmail(resultado.email, resultado.codigoDemo);
          erroEl.classList.remove("visible");
          sucessoEl.textContent = "Novo código enviado ao seu e-mail.";
          sucessoEl.classList.add("visible", "login-card__success");
        });
        return;
      }

      const resultado = reenviarCodigoVerificacao(email);

      if (!resultado.ok) {
        erroEl.textContent = resultado.erro;
        erroEl.classList.add("visible");
        return;
      }

      simularEnvioCodigoEmail(resultado.email, resultado.codigo);
      erroEl.classList.remove("visible");
      sucessoEl.textContent = "Novo código enviado ao seu e-mail.";
      sucessoEl.classList.add("visible", "login-card__success");
    });
  }
}

/**
 * Inicializa a página de login após matrícula (e-mail na URL).
 */
function inicializarLoginAposMatricula() {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const cadastro = params.get("cadastro");

  if (!email) return;

  const emailNormalizado = email.trim().toLowerCase();

  if (emailTemVerificacaoPendente(emailNormalizado)) {
    mostrarPainelVerificacao(emailNormalizado);
    return;
  }

  if (cadastro === "1") {
    alternarFormularioAluno("cadastro");

    const emailInput = document.getElementById("cadastroEmail");
    if (emailInput) {
      emailInput.value = emailNormalizado;
      emailInput.readOnly = true;
    }

    const subtitulo = document.querySelector(".login-card__subtitle");
    if (subtitulo) {
      subtitulo.textContent =
        "Matrícula confirmada! Crie sua senha de acesso com o mesmo e-mail da inscrição.";
    }

    const senhaInput = document.getElementById("cadastroSenha");
    if (senhaInput) senhaInput.focus();
  }
}

/**
 * Alterna entre os formulários de login e cadastro na área do aluno.
 */
function alternarFormularioAluno(modo) {
  const painelLogin = document.getElementById("painelLogin");
  const painelCadastro = document.getElementById("painelCadastro");
  const painelVerificacao = document.getElementById("painelVerificacao");
  const abaLogin = document.getElementById("abaLogin");
  const abaCadastro = document.getElementById("abaCadastro");
  const tabs = document.querySelector(".login-card__tabs");

  if (!painelLogin || !painelCadastro) return;

  if (painelVerificacao) painelVerificacao.hidden = true;
  if (tabs) tabs.hidden = false;

  const mostrarLogin = modo === "login";

  painelLogin.hidden = !mostrarLogin;
  painelCadastro.hidden = mostrarLogin;

  if (abaLogin) {
    abaLogin.classList.toggle("login-card__tab--ativa", mostrarLogin);
    abaLogin.setAttribute("aria-selected", mostrarLogin ? "true" : "false");
  }
  if (abaCadastro) {
    abaCadastro.classList.toggle("login-card__tab--ativa", !mostrarLogin);
    abaCadastro.setAttribute("aria-selected", !mostrarLogin ? "true" : "false");
  }
}

function obterLabelPerfil(perfil) {
  const labels = {
    professor: "Professor",
    diretor: "Diretor",
    contador: "Contabilidade",
    secretaria: "Secretaria",
    autorizado: "Biblioteca (Autorizado)",
    aluno: "Aluno"
  };
  return labels[perfil] || perfil;
}

function configurarLogoutPainelInstitucional(redirectUrl) {
  const btnLogout = document.getElementById("btnLogout");
  if (!btnLogout || btnLogout.dataset.logoutBound === "1") return;

  const body = document.body;
  let encerrar = encerrarSessaoDirecao;
  let destino = redirectUrl || "login-direcao.html";

  if (body.classList.contains("painel-secretaria")) {
    encerrar = encerrarSessaoSecretaria;
    destino = redirectUrl || "login-direcao.html#secretaria";
  }

  btnLogout.type = "button";
  btnLogout.dataset.logoutBound = "1";
  btnLogout.addEventListener("click", function (evento) {
    evento.preventDefault();
    evento.stopPropagation();
    encerrar();
    window.location.href = destino;
  });
}

function inicializarLogoutPainelInstitucional() {
  const body = document.body;
  if (!body) return;

  if (
    body.classList.contains("painel-direcao") ||
    body.classList.contains("painel-secretaria") ||
    body.classList.contains("painel-contador")
  ) {
    configurarLogoutPainelInstitucional();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarLogoutPainelInstitucional);
} else {
  inicializarLogoutPainelInstitucional();
}
