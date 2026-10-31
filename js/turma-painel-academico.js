/* Abas Mensalidades | Notas no detalhe da turma / polo */

function renderizarPainelTurmaMensalidadesENotas(container, alunos, sessao, meta) {
  if (!container) return;
  meta = meta || {};
  var somenteNotas =
    typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
    coordenacaoPedagogicaSemFinanceiro(sessao);
  var abaInicial = somenteNotas
    ? "notas"
    : meta.abaInicial === "notas"
      ? "notas"
      : "mensalidades";

  var abasNavHtml = somenteNotas
    ? ""
    : '<nav class="turma-painel-academico__abas" role="tablist" aria-label="Turma">' +
      '<button type="button" class="turma-painel-academico__aba' +
      (abaInicial === "mensalidades" ? " turma-painel-academico__aba--ativa" : "") +
      '" data-turma-aba="mensalidades" role="tab">Mensalidades</button>' +
      '<button type="button" class="turma-painel-academico__aba' +
      (abaInicial === "notas" ? " turma-painel-academico__aba--ativa" : "") +
      '" data-turma-aba="notas" role="tab">Notas e médias</button>' +
      "</nav>";

  container.innerHTML =
    '<div class="turma-painel-academico">' +
    abasNavHtml +
    (somenteNotas
      ? '<p class="presencial-bloco__hint">Coordenação pedagógica: lançamento de notas e médias. Pagamentos são da secretaria.</p>'
      : "") +
    '<div id="turmaPainelAcademicoConteudo" class="turma-painel-academico__conteudo"></div>' +
    "</div>";

  function pintarAba(aba) {
    var alvo = document.getElementById("turmaPainelAcademicoConteudo");
    if (!alvo) return;
    container.querySelectorAll(".turma-painel-academico__aba").forEach(function (btn) {
      btn.classList.toggle(
        "turma-painel-academico__aba--ativa",
        btn.getAttribute("data-turma-aba") === aba
      );
    });

    var baseMeta = Object.assign({}, meta, {
      onAtualizar: function () {
        if (typeof meta.onAtualizar === "function") meta.onAtualizar();
        pintarAba(aba);
      }
    });

    if (aba === "notas") {
      if (typeof renderizarPlanilhaNotasTurma === "function") {
        renderizarPlanilhaNotasTurma(alvo, alunos, sessao, baseMeta);
      } else {
        alvo.innerHTML = '<p class="lista-vazia">Módulo de notas indisponível.</p>';
      }
      return;
    }

    if (
      typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
      coordenacaoPedagogicaSemFinanceiro(sessao)
    ) {
      alvo.innerHTML =
        '<p class="lista-vazia">Mensalidades e pagamentos são restritos à secretaria e contabilidade.</p>';
      return;
    }

    if (typeof renderizarPlanilhaMensalidadesTurma === "function") {
      renderizarPlanilhaMensalidadesTurma(alvo, alunos, sessao, baseMeta);
    } else {
      alvo.innerHTML = '<p class="lista-vazia">Módulo financeiro indisponível.</p>';
    }
  }

  if (!somenteNotas) {
    container.querySelectorAll("[data-turma-aba]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pintarAba(btn.getAttribute("data-turma-aba"));
      });
    });
  }

  pintarAba(abaInicial);
}

function renderizarHubNotasInstitucional(containerId, sessao, opcoes) {
  var container = document.getElementById(containerId);
  if (!container || typeof listarTurmasCatalogoSetad !== "function") return;
  opcoes = opcoes || {};

  container.innerHTML =
    '<p class="section__text">Selecione uma turma ou polo para lançar notas e médias (mesma planilha da aba Turmas).</p>' +
    '<div id="hubNotasTurmasGrid"></div>' +
    '<div id="hubNotasTurmasDetalhe" class="turmas-detalhe" hidden></div>';

  renderizarPainelTurmasInstitucional("hubNotasTurmasGrid", {
    intro: "",
    mostrarFiltro: true,
    mostrarAlunosAoClicar: false,
    sessao: sessao,
    onTurmaClick: function (turmaId) {
      var detalhe = document.getElementById("hubNotasTurmasDetalhe");
      var turma = obterTurmaCatalogoPorId(turmaId);
      if (!detalhe || !turma) return;
      var alunos = listarAlunosNaTurma(turma);
      detalhe.hidden = false;
      detalhe.innerHTML = '<div id="hubNotasPainelAcademico"></div>';
      var alvo = document.getElementById("hubNotasPainelAcademico");
      renderizarPainelTurmaMensalidadesENotas(alvo, alunos, sessao, {
        titulo: turma.nome,
        turmaId: turma.id,
        abaInicial: opcoes.abaInicial || "notas",
        subtitulo:
          "Notas lançadas aqui aparecem para o aluno, coordenação, direção e secretaria."
      });
      detalhe.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
}
