/* ============================================================

   painel.js — Interatividade dos painéis (aluno e professor)

   Controla: abas, logout, upload de trabalhos e biblioteca.

   ============================================================ */



function inicializarPainel(tipo) {

  const sessao = protegerPainel(tipo);

  if (!sessao) return;



  inicializarDadosPadrao();



  const nomeEl = document.getElementById("usuarioNome");

  const perfilEl = document.getElementById("usuarioPerfil");



  if (nomeEl) nomeEl.textContent = sessao.nome;

  if (perfilEl) perfilEl.textContent = obterLabelPerfil(sessao.perfil || tipo);



  const navLinks = document.querySelectorAll("[data-tab]");

  const tabs = document.querySelectorAll(".painel__tab");



  navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

      const tabId = link.getAttribute("data-tab");



      navLinks.forEach(function (l) { l.classList.remove("active"); });

      tabs.forEach(function (t) { t.classList.remove("active"); });



      link.classList.add("active");

      const tabAtiva = document.getElementById(tabId);

      if (tabAtiva) tabAtiva.classList.add("active");



      atualizarTituloPainel(tabId, tipo);

    });

  });



  const btnLogout = document.getElementById("btnLogout");

  if (btnLogout) {

    btnLogout.addEventListener("click", function () {

      encerrarSessao(tipo);

      window.location.href = tipo === "aluno" ? "login-aluno.html" : "login-professor.html";

    });

  }



  /* Carrega conteúdo dinâmico */

  if (tipo === "aluno") {

    renderizarTrabalhosAluno(sessao);

    renderizarBiblioteca("bibliotecaGrid", sessao, "aluno");

    renderizarAreaPagamentosAluno(sessao);

    inicializarPerfilAluno(sessao);

  } else {

    renderizarTrabalhosProfessor();

    renderizarBiblioteca("bibliotecaGrid", sessao, "professor");

    renderizarFormularioLivro(sessao);

    renderizarMatriculasProfessor();

    inicializarPerfilProfessor(sessao);

  }

}



function atualizarTituloPainel(tabId, tipo) {

  const titulosAluno = {

    "tab-notas": {

      titulo: "Notas de Provas",

      subtitulo: "Acompanhe suas avaliações e desempenho acadêmico."

    },

    "tab-trabalhos": {

      titulo: "Trabalhos",

      subtitulo: "Envie arquivos e acompanhe prazos de entrega."

    },

    "tab-biblioteca": {

      titulo: "Biblioteca Teológica",

      subtitulo: "Consulte livros para estudo na tela. Download não é permitido."

    },

    "tab-pagamentos": {

      titulo: "Pagamentos",

      subtitulo: "Extrato do curso, mensalidades e formas de pagamento seguras."

    }

  };



  const titulosProfessor = {

    "tab-notas": {

      titulo: "Notas das Turmas",

      subtitulo: "Lance notas e acompanhe o desempenho dos alunos."

    },

    "tab-trabalhos": {

      titulo: "Trabalhos dos Alunos",

      subtitulo: "Visualize entregas recebidas dos alunos."

    },

    "tab-biblioteca": {

      titulo: "Biblioteca Teológica",

      subtitulo: "Gerencie o acervo: cadastrar, editar e excluir livros (acesso autorizado)."

    },

    "tab-matriculas": {

      titulo: "Matrículas",

      subtitulo: "Alunos cadastrados pelo site, organizados por módulo."

    }

  };



  const titulos = tipo === "professor" ? titulosProfessor : titulosAluno;

  const config = titulos[tabId];

  if (!config) return;



  const tituloEl = document.getElementById("painelTitulo");

  const subtituloEl = document.getElementById("painelSubtitulo");



  if (tituloEl) tituloEl.textContent = config.titulo;

  if (subtituloEl) subtituloEl.textContent = config.subtitulo;

}


