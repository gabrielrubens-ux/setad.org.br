/* ============================================================
   painel-direcao.js — Painéis do diretor e do contador
   ============================================================ */

function configurarAbasPainel(titulosMap, perfilLogout, aoTrocarAba) {
  const nav = document.querySelector(".painel__nav");
  if (!nav || nav.dataset.tabsBound === "true") return;
  nav.dataset.tabsBound = "true";

  const navLinks = nav.querySelectorAll("[data-tab]");
  const tabs = document.querySelectorAll(".painel__tab");

  navLinks.forEach(function (link) {
    if (!link.type) link.type = "button";
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const tabId = link.getAttribute("data-tab");

      navLinks.forEach(function (l) { l.classList.remove("active"); });
      tabs.forEach(function (t) { t.classList.remove("active"); });

      link.classList.add("active");
      const tabAtiva = document.getElementById(tabId);
      if (tabAtiva) tabAtiva.classList.add("active");

      const config = titulosMap[tabId];
      if (config) {
        const tituloEl = document.getElementById("painelTitulo");
        const subtituloEl = document.getElementById("painelSubtitulo");
        if (tituloEl) tituloEl.textContent = config.titulo;
        if (subtituloEl) subtituloEl.textContent = config.subtitulo;
      }

      if (typeof aoTrocarAba === "function") {
        aoTrocarAba(tabId);
      }
    });
  });

  configurarLogoutPainelInstitucional("login-direcao.html");
}

function inicializarPainelDiretor() {
  configurarLogoutPainelInstitucional("login-direcao.html");

  const sessao = protegerPainelDirecao("diretor");
  if (!sessao) return;

  document.getElementById("usuarioNome").textContent = sessao.nome;
  document.getElementById("usuarioPerfil").textContent = obterLabelPerfil(sessao.perfil);

  const titulos = {
    "tab-visao": {
      titulo: "Visão Geral",
      subtitulo: "Indicadores acadêmicos e financeiros do seminário."
    },
    "tab-notas": {
      titulo: "Notas dos Alunos",
      subtitulo: "Acompanhamento de avaliações e desempenho das turmas."
    },
    "tab-trabalhos": {
      titulo: "Trabalhos Enviados",
      subtitulo: "Arquivos entregues pelos alunos no portal."
    },
    "tab-matriculas": {
      titulo: "Matrículas",
      subtitulo: "Alunos inscritos pelo site, solicitações de exclusão e auditoria institucional."
    },
    "tab-biblioteca": {
      titulo: "Biblioteca Teológica",
      subtitulo: "Acervo digital e cadastro de livros."
    },
    "tab-financeiro": {
      titulo: "Financeiro",
      subtitulo: "Resumo executivo — detalhes na área do contador."
    },
    "tab-colaboradores": {
      titulo: "Colaboradores",
      subtitulo: "Cadastro de professores e funcionários — salário, ajuda de custo e benefícios."
    },
    "tab-equipe": {
      titulo: "Equipe e Cadastros",
      subtitulo: "Professores, funcionários e perfis institucionais."
    }
  };

  configurarAbasPainel(titulos, undefined, function (tabId) {
    if (tabId === "tab-colaboradores") {
      renderizarCadastroColaboradores("colaboradoresDiretorContainer", sessao);
    }
  });

  inicializarDadosPadrao();
  inicializarDadosFinanceiros();

  renderizarVisaoDiretor("visaoDiretorContainer");
  renderizarCadastroColaboradores("colaboradoresDiretorContainer", sessao);
  renderizarTrabalhosProfessor();
  renderizarBiblioteca("bibliotecaGrid", sessao, "professor");
  renderizarFormularioLivro(sessao);
  renderizarMatriculasProfessor();
  renderizarFinanceiroDiretor("financeiroDiretorContainer");
  if (typeof renderizarContabilidadeDiretor === "function") {
    renderizarContabilidadeDiretor("documentosContabeisDiretorContainer", sessao);
  }
  renderizarEquipeDiretor("equipeDiretorContainer");
  inicializarPerfilProfessor(sessao);
}

function inicializarPainelContador() {
  configurarLogoutPainelInstitucional("login-direcao.html");

  const sessao = protegerPainelDirecao("contador");
  if (!sessao) return;

  document.getElementById("usuarioNome").textContent = sessao.nome;
  document.getElementById("usuarioPerfil").textContent = obterLabelPerfil(sessao.perfil);

  const titulos = {
    "tab-dashboard": {
      titulo: "Painel Financeiro",
      subtitulo: "Visão geral de receitas, despesas e instituições conectadas."
    },
    "tab-pagamentos-alunos": {
      titulo: "Pagamentos dos Alunos",
      subtitulo: "Todos os pagamentos realizados e pendentes no site."
    },
    "tab-folha": {
      titulo: "Folha de Pagamento",
      subtitulo: "Pagamento de funcionários e agendamentos."
    },
    "tab-funcionarios": {
      titulo: "Cadastro de Funcionários",
      subtitulo: "Equipe administrativa e dados de RH."
    },
    "tab-instituicoes": {
      titulo: "Instituições Financeiras",
      subtitulo: "Contas e convênios bancários da instituição."
    },
    "tab-relatorios": {
      titulo: "Relatórios e DRE",
      subtitulo: "Envio de documentos Office, DRE automático e liberação de acesso à diretoria."
    }
  };

  configurarAbasPainel(titulos, "contador");

  inicializarDadosFinanceiros();

  renderizarDashboardContador("dashboardContadorContainer");
  renderizarPagamentosAlunosContador("pagamentosAlunosContainer");
  renderizarFolhaContador("folhaContainer");
  renderizarFuncionariosContador("funcionariosContainer");
  renderizarInstituicoesContador("instituicoesContainer");
  renderizarRelatoriosContador("relatoriosContainer");
  inicializarPerfilProfessor(sessao);
}
