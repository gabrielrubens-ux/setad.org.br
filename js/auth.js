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
const STORAGE_SESSAO_COORDENACAO = "setad_sessao_coordenacao";

function ambientePermiteDemonstracao() {
  if (typeof window === "undefined" || !window.location) return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local") ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

function aplicarPoliticaDemonstracaoUi() {
  if (ambientePermiteDemonstracao()) return;
  document.querySelectorAll("[data-setad-demo]").forEach(function (el) {
    el.remove();
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", aplicarPoliticaDemonstracaoUi);
}

function authApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function aplicarSessaoApi(user) {
  if (!user || !window.SETAD) return;
  window.SETAD.setSession(user);
  if (
    sessaoTemPerfilInstitucional(user, "diretor") ||
    sessaoTemPerfilInstitucional(user, "contador")
  ) {
    salvarSessaoDirecao(user);
  }
  if (sessaoTemPerfilInstitucional(user, "secretaria")) {
    salvarSessaoSecretaria(user);
  }
  if (sessaoTemPerfilInstitucional(user, "coordenacao")) {
    salvarSessaoCoordenacao(user);
  }
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

function finalizarLoginInstitucionalApi(resposta, areaPreferida) {
  if (resposta && resposta.token) {
    SETADApi.salvarToken(resposta.token);
  }
  aplicarSessaoApi(resposta.user);
  return SETADApi.snapshot().then(function (snap) {
    if (snap.ok && window.SETAD.hydrate) {
      window.SETAD.hydrate(snap.snapshot);
    }
    if (typeof redirecionarAposLoginInstitucional === "function") {
      redirecionarAposLoginInstitucional(resposta.user, areaPreferida);
    }
  });
}

function processarLoginInstitucionalApi(email, senha, areaPreferida, erroEl, mensagemFalha, tentarDemo) {
  function falhaLogin(msg) {
    if (!erroEl) return;
    erroEl.classList.add("visible");
    erroEl.textContent = msg || mensagemFalha;
  }

  if (authApiAtivo() && typeof SETADApi !== "undefined") {
    return SETADApi.login(email, senha).then(function (resposta) {
      if (resposta && resposta.precisaAtivacao) {
        falhaLogin(
          resposta.erro || "Conta pendente. Use Primeiro acesso institucional para criar sua senha."
        );
        return;
      }
      if (resposta && resposta.ok && resposta.user) {
        const areas =
          typeof listarAreasInstitucionaisPermitidas === "function"
            ? listarAreasInstitucionaisPermitidas(resposta.user)
            : [];
        if (areas.length) {
          if (!sessaoTemPerfilInstitucional(resposta.user, areaPreferida)) {
            falhaLogin(
              "Este e-mail não tem acesso a esta área. Você será direcionado às áreas disponíveis."
            );
            return finalizarLoginInstitucionalApi(resposta, null);
          }
          return finalizarLoginInstitucionalApi(resposta, areaPreferida);
        }
      }
      if (typeof tentarDemo === "function" && tentarDemo()) return;
      falhaLogin();
    }).catch(function () {
      if (typeof tentarDemo === "function" && tentarDemo()) return;
      falhaLogin();
    });
  }

  if (typeof tentarDemo === "function" && tentarDemo()) return Promise.resolve();
  falhaLogin();
  return Promise.resolve();
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
    perfisInstitucionais: conta.perfisInstitucionais || perfisInstitucionaisDaSessao(conta),
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function perfisInstitucionaisDaSessao(sessao) {
  if (!sessao) return [];
  if (sessao.perfisInstitucionais && sessao.perfisInstitucionais.length) {
    return sessao.perfisInstitucionais;
  }
  if (sessao.perfil) return [sessao.perfil];
  return [];
}

function sessaoTemPerfilInstitucional(sessao, perfil) {
  return perfisInstitucionaisDaSessao(sessao).indexOf(perfil) !== -1;
}

function obterSessaoDirecao() {
  if (authApiAtivo() && window.SETAD.session) {
    const sessao = window.SETAD.session;
    if (sessaoTemPerfilInstitucional(sessao, "diretor") || sessaoTemPerfilInstitucional(sessao, "contador")) {
      return sessao;
    }
  }

  const dados = localStorage.getItem(STORAGE_SESSAO_DIRECAO);
  const sessaoLocal = dados ? JSON.parse(dados) : null;
  if (
    sessaoLocal &&
    (sessaoTemPerfilInstitucional(sessaoLocal, "diretor") ||
      sessaoTemPerfilInstitucional(sessaoLocal, "contador"))
  ) {
    return sessaoLocal;
  }
  return null;
}

function encerrarSessaoDirecao() {
  if (typeof limparAreaInstitucionalAtiva === "function") {
    limparAreaInstitucionalAtiva();
  }
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
  if (
    !sessao ||
    (!sessaoTemPerfilInstitucional(sessao, "diretor") &&
      !sessaoTemPerfilInstitucional(sessao, "contador"))
  ) {
    window.location.href = "login-direcao.html";
    return null;
  }
  if (perfilRequerido && !sessaoTemPerfilInstitucional(sessao, perfilRequerido)) {
    if (typeof redirecionarAposLoginInstitucional === "function") {
      redirecionarAposLoginInstitucional(sessao, null);
    } else {
      window.location.href = "escolher-area-institucional.html";
    }
    return null;
  }
  if (
    perfilRequerido &&
    typeof exigirAreaInstitucionalAtiva === "function" &&
    !exigirAreaInstitucionalAtiva(perfilRequerido)
  ) {
    return null;
  }
  return sessao;
}

function salvarSessaoSecretaria(conta) {
  localStorage.setItem(STORAGE_SESSAO_SECRETARIA, JSON.stringify({
    tipo: "secretaria",
    perfil: conta.perfil,
    perfisInstitucionais: conta.perfisInstitucionais || perfisInstitucionaisDaSessao(conta),
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function obterSessaoSecretaria() {
  if (authApiAtivo() && window.SETAD.session && sessaoTemPerfilInstitucional(window.SETAD.session, "secretaria")) {
    return window.SETAD.session;
  }

  const dados = localStorage.getItem(STORAGE_SESSAO_SECRETARIA);
  const sessaoLocal = dados ? JSON.parse(dados) : null;
  if (sessaoLocal && sessaoTemPerfilInstitucional(sessaoLocal, "secretaria")) {
    return sessaoLocal;
  }
  return null;
}

function encerrarSessaoSecretaria() {
  if (typeof limparAreaInstitucionalAtiva === "function") {
    limparAreaInstitucionalAtiva();
  }
  if (authApiAtivo()) {
    SETADApi.logout().finally(function () {
      if (window.SETAD) window.SETAD.clearSession();
    });
  }
  localStorage.removeItem(STORAGE_SESSAO_SECRETARIA);
}

function protegerPainelSecretaria() {
  const sessao = obterSessaoSecretaria();
  if (!sessao || !sessaoTemPerfilInstitucional(sessao, "secretaria")) {
    window.location.href = "login-direcao.html#secretaria";
    return null;
  }
  if (typeof exigirAreaInstitucionalAtiva === "function" && !exigirAreaInstitucionalAtiva("secretaria")) {
    return null;
  }
  return sessao;
}

function salvarSessaoCoordenacao(conta) {
  localStorage.setItem(STORAGE_SESSAO_COORDENACAO, JSON.stringify({
    tipo: "coordenacao",
    perfil: conta.perfil,
    perfisInstitucionais: conta.perfisInstitucionais || perfisInstitucionaisDaSessao(conta),
    nome: conta.nome,
    email: conta.email,
    loginEm: new Date().toISOString()
  }));
}

function obterSessaoCoordenacao() {
  if (authApiAtivo() && window.SETAD.session && sessaoTemPerfilInstitucional(window.SETAD.session, "coordenacao")) {
    return window.SETAD.session;
  }
  const dados = localStorage.getItem(STORAGE_SESSAO_COORDENACAO);
  const sessaoLocal = dados ? JSON.parse(dados) : null;
  if (sessaoLocal && sessaoTemPerfilInstitucional(sessaoLocal, "coordenacao")) {
    return sessaoLocal;
  }
  return null;
}

function encerrarSessaoCoordenacao() {
  if (typeof limparAreaInstitucionalAtiva === "function") {
    limparAreaInstitucionalAtiva();
  }
  if (authApiAtivo()) {
    SETADApi.logout().finally(function () {
      if (window.SETAD) window.SETAD.clearSession();
    });
  }
  localStorage.removeItem(STORAGE_SESSAO_COORDENACAO);
}

function protegerPainelCoordenacao() {
  const sessao = obterSessaoCoordenacao();
  if (!sessao || !sessaoTemPerfilInstitucional(sessao, "coordenacao")) {
    window.location.href = "login-direcao.html#coordenacao";
    return null;
  }
  if (typeof exigirAreaInstitucionalAtiva === "function" && !exigirAreaInstitucionalAtiva("coordenacao")) {
    return null;
  }
  return sessao;
}

function buscarContaDirecao(email, senha) {
  return CONTAS_DIRECAO.find(function (c) {
    return email === c.email && senha === c.senha;
  });
}

function finalizarLoginDirecaoLocal(conta, areaPreferida) {
  salvarSessaoDirecao(conta);
  if (typeof redirecionarAposLoginInstitucional === "function") {
    redirecionarAposLoginInstitucional(conta, areaPreferida || conta.perfil);
    return;
  }
  window.location.href = conta.redirect;
}

function configurarLoginDirecao() {
  const abas = [
    { id: "abaDirecao", painel: "painelLoginDirecao", modo: "direcao" },
    { id: "abaContabilidade", painel: "painelLoginContabilidade", modo: "contabilidade" },
    { id: "abaSecretaria", painel: "painelLoginSecretaria", modo: "secretaria" },
    { id: "abaCoordenacao", painel: "painelLoginCoordenacao", modo: "coordenacao" }
  ];

  if (document.getElementById("loginFormDirecao") && document.getElementById("loginFormDirecao").dataset.loginBound === "1") {
    return;
  }

  function alternarAba(modo) {
    abas.forEach(function (aba) {
      const painel = document.getElementById(aba.painel);
      const btn = document.getElementById(aba.id);
      if (painel) painel.hidden = aba.modo !== modo;
      if (btn) {
        btn.classList.toggle("login-card__tab--ativa", aba.modo === modo);
        btn.setAttribute("aria-selected", aba.modo === modo ? "true" : "false");
      }
    });
  }

  abas.forEach(function (aba) {
    const btn = document.getElementById(aba.id);
    if (btn) {
      btn.addEventListener("click", function () {
        alternarAba(aba.modo);
      });
    }
  });

  const hash = (window.location.hash || "").replace(/^#/, "");
  const hashMap = {
    secretaria: "secretaria",
    contabilidade: "contabilidade",
    coordenacao: "coordenacao",
    direcao: "direcao"
  };
  alternarAba(hashMap[hash] || "direcao");

  function bindFormInstitucional(formId, emailId, senhaId, erroId, areaPreferida, mensagemFalha, demoConta) {
    const form = document.getElementById(formId);
    if (!form || form.dataset.loginBound === "1") return;
    form.dataset.loginBound = "1";
    const erroEl = document.getElementById(erroId);

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (erroEl) erroEl.classList.remove("visible");

      const email = document.getElementById(emailId).value.trim().toLowerCase();
      const senha = document.getElementById(senhaId).value;

      function tentarDemo() {
        if (!ambientePermiteDemonstracao() || !demoConta) return false;
        if (email === demoConta.email && senha === demoConta.senha) {
          if (areaPreferida === "secretaria") {
            salvarSessaoSecretaria(demoConta);
          } else if (areaPreferida === "coordenacao") {
            salvarSessaoCoordenacao(demoConta);
          } else {
            salvarSessaoDirecao(demoConta);
          }
          if (typeof redirecionarAposLoginInstitucional === "function") {
            redirecionarAposLoginInstitucional(demoConta, areaPreferida);
          } else {
            window.location.href = demoConta.redirect;
          }
          return true;
        }
        return false;
      }

      processarLoginInstitucionalApi(email, senha, areaPreferida, erroEl, mensagemFalha, tentarDemo);
    });
  }

  bindFormInstitucional(
    "loginFormDirecao",
    "emailDirecao",
    "senhaDirecao",
    "loginErroDirecao",
    "diretor",
    "Acesso negado. E-mail ou senha incorretos para a direção.",
    CREDENCIAIS.diretor
  );
  bindFormInstitucional(
    "loginFormContabilidade",
    "emailContabilidade",
    "senhaContabilidade",
    "loginErroContabilidade",
    "contador",
    "Acesso negado. E-mail ou senha incorretos para a contabilidade.",
    CREDENCIAIS.contador
  );
  bindFormInstitucional(
    "loginFormSecretaria",
    "emailSecretaria",
    "senhaSecretaria",
    "loginErroSecretaria",
    "secretaria",
    "Acesso negado. E-mail ou senha incorretos para a secretaria.",
    CREDENCIAIS.secretaria
  );
  bindFormInstitucional(
    "loginFormCoordenacao",
    "emailCoordenacao",
    "senhaCoordenacao",
    "loginErroCoordenacao",
    "coordenacao",
    "Acesso negado. E-mail ou senha incorretos para a coordenação pedagógica.",
    null
  );
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

    if (!ambientePermiteDemonstracao()) {
      falhaLogin();
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
        mostrarPainelVerificacao(resultado.email, resultado.codigoDemo, {
          emailEnviado: resultado.emailEnviado,
          avisoEmail: resultado.avisoEmail
        });
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
 * Mensagem após solicitar o código (API com SMTP ou demonstração local).
 */
function simularEnvioCodigoEmail(email, codigo, meta) {
  const demoEl = document.getElementById("codigoDemonstracao");
  if (!demoEl) return;

  const info = meta || {};
  let html =
    "Enviamos um código de <strong>6 dígitos</strong> para <strong>" +
    escaparHtml(email) + "</strong>.";

  if (info.emailEnviado) {
    html +=
      " Envio aceito pelo servidor. No Gmail pode levar <strong>1 a 3 minutos</strong>; veja <strong>Promoções</strong> ou busque <strong>from:noreply@setad.org.br</strong>.";
  }

  if (info.avisoEmail) {
    html +=
      "<br><span class=\"login-card__demo-codigo\">" +
      escaparHtml(info.avisoEmail) +
      "</span>";
  }

  if (ambientePermiteDemonstracao() && codigo) {
    html +=
      "<br><span class=\"login-card__demo-codigo\">Demonstração (sem SMTP ou falha de envio): <strong>" +
      escaparHtml(codigo) + "</strong></span>";
  }

  demoEl.innerHTML = html;
  demoEl.classList.add("visible");
}

/**
 * Exibe o painel de verificação de e-mail com código de 6 dígitos.
 */
function mostrarPainelVerificacao(email, codigoDemo, metaEnvio) {
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

  const meta = metaEnvio || {};
  if (codigoDemo || meta.emailEnviado || meta.avisoEmail) {
    simularEnvioCodigoEmail(email, codigoDemo, meta);
  } else {
    const pendente = obterVerificacaoPendente(email);
    if (pendente) {
      simularEnvioCodigoEmail(email, pendente.codigo, meta);
    } else {
      simularEnvioCodigoEmail(email, null, meta);
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
          simularEnvioCodigoEmail(resultado.email, resultado.codigoDemo, {
            emailEnviado: resultado.emailEnviado,
            avisoEmail: resultado.avisoEmail
          });
          erroEl.classList.remove("visible");
          sucessoEl.textContent = resultado.emailEnviado
            ? "Novo código enviado ao seu e-mail."
            : (resultado.avisoEmail || "Solicitação registrada. Tente reenviar em instantes.");
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
    coordenacao: "Coordenação pedagógica",
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
  if (body.classList.contains("painel-coordenacao")) {
    encerrar = encerrarSessaoCoordenacao;
    destino = redirectUrl || "login-direcao.html#coordenacao";
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
    body.classList.contains("painel-contador") ||
    body.classList.contains("painel-coordenacao")
  ) {
    configurarLogoutPainelInstitucional();
  }
}

function configurarLinkTrocarAreaInstitucional() {
  const link = document.getElementById("linkTrocarAreaInstitucional");
  if (!link || link.dataset.bound === "1") return;
  link.dataset.bound = "1";
  link.addEventListener("click", function (evento) {
    evento.preventDefault();
    if (typeof limparAreaInstitucionalAtiva === "function") {
      limparAreaInstitucionalAtiva();
    }
    window.location.href = "escolher-area-institucional.html";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarLogoutPainelInstitucional);
} else {
  inicializarLogoutPainelInstitucional();
}
