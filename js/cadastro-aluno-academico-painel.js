/* Abas Notas | Mensalidades no cadastro presencial do aluno */

function renderizarPainelCadastroAlunoAcademico(hostId, matricula, sessao, opcoes) {
  var host = document.getElementById(hostId);
  if (!host) return;
  opcoes = opcoes || {};

  var semFinanceiro =
    typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
    coordenacaoPedagogicaSemFinanceiro(sessao);

  var abaInicial = opcoes.abaInicial === "mensalidades" && !semFinanceiro ? "mensalidades" : "notas";

  var navHtml = semFinanceiro
    ? '<p class="presencial-bloco__hint">Coordenação pedagógica: lançamento de notas e médias.</p>'
    : '<nav class="turma-painel-academico__abas" role="tablist" aria-label="Aluno">' +
      '<button type="button" class="turma-painel-academico__aba' +
      (abaInicial === "notas" ? " turma-painel-academico__aba--ativa" : "") +
      '" data-cadastro-aba="notas" role="tab">Notas e médias</button>' +
      '<button type="button" class="turma-painel-academico__aba' +
      (abaInicial === "mensalidades" ? " turma-painel-academico__aba--ativa" : "") +
      '" data-cadastro-aba="mensalidades" role="tab">Mensalidades e pagamentos</button>' +
      "</nav>";

  host.innerHTML =
    '<div class="turma-painel-academico cadastro-aluno-academico">' +
    navHtml +
    '<div id="secCadastroAbaConteudo" class="turma-painel-academico__conteudo"></div>' +
    "</div>";

  function pintarAba(aba) {
    var alvo = document.getElementById("secCadastroAbaConteudo");
    if (!alvo) return;

    host.querySelectorAll("[data-cadastro-aba]").forEach(function (btn) {
      btn.classList.toggle(
        "turma-painel-academico__aba--ativa",
        btn.getAttribute("data-cadastro-aba") === aba
      );
    });

    if (aba === "mensalidades" && !semFinanceiro) {
      alvo.innerHTML = '<div id="secCadastroAbaMensalidades"></div>';
      if (typeof renderizarPlanilhaMensalidadesCadastroAluno === "function") {
        renderizarPlanilhaMensalidadesCadastroAluno(matricula, sessao);
      }
      return;
    }

    alvo.innerHTML = '<div id="secCadastroAbaNotas"></div>';
    if (typeof renderizarPlanilhaNotasCadastroAluno === "function") {
      renderizarPlanilhaNotasCadastroAluno(matricula, sessao);
    }
  }

  if (!semFinanceiro) {
    host.querySelectorAll("[data-cadastro-aba]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pintarAba(btn.getAttribute("data-cadastro-aba"));
      });
    });
  }

  pintarAba(abaInicial);
}

function abrirCadastroAlunoAcademicoAba(matriculaId, aba) {
  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var sessao =
    typeof obterSessaoOperacionalListaAlunos === "function"
      ? obterSessaoOperacionalListaAlunos()
      : null;

  var tab = document.querySelector('[data-tab="tab-cadastro"]');
  if (tab) tab.click();

  var tipoNovo = document.getElementById("secTipoAlunoNovo");
  if (tipoNovo) tipoNovo.checked = true;
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }
  if (typeof preencherFormularioComMatricula === "function") {
    preencherFormularioComMatricula(matricula, { omitirPainelAcademico: true });
  }

  renderizarPainelCadastroAlunoAcademico("secPainelAcademicoAluno", matricula, sessao, {
    abaInicial: aba === "mensalidades" ? "mensalidades" : "notas"
  });

  var bloco = document.getElementById("secBlocoAcademicoAluno");
  if (bloco) {
    bloco.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
