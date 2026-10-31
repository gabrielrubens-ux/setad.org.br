/* Planilha de notas por turma — disciplinas, média editável */

function renderizarPlanilhaNotasTurma(container, alunos, sessao, meta) {
  if (!container) return;
  meta = meta || {};
  alunos = (alunos || []).slice().sort(function (a, b) {
    return (a.nomeCompleto || "").localeCompare(b.nomeCompleto || "", "pt-BR");
  });

  var periodo = meta.periodo || obterPeriodoLetivoAtual();
  var podeEditar =
    meta.somenteLeitura !== true && usuarioPodeEditarNotasAcademicas(sessao);
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var disciplinas = meta.disciplinas || DISCIPLINAS_SETAD;

  if (!alunos.length) {
    container.innerHTML = '<p class="lista-vazia">Nenhum aluno nesta turma ou polo.</p>';
    return;
  }

  var cabDisc = disciplinas
    .map(function (d) {
      return "<th>" + esc(d) + "</th>";
    })
    .join("");

  var linhas = alunos
    .map(function (m) {
      var celulas = disciplinas
        .map(function (disc) {
          var nota = obterNotaLancamento(m.email, disc, periodo, "prova", "Prova 1");
          var valor = nota ? nota.valor : null;
          var badge = obterClasseNotaBadge(valor);
          var txt = formatarNotaValor(valor);
          if (!podeEditar) {
            return (
              '<td class="planilha-turma__cel planilha-notas__cel">' +
              '<span class="nota-badge ' + badge + '">' + esc(txt) + "</span></td>"
            );
          }
          return (
            '<td class="planilha-turma__cel planilha-notas__cel">' +
            '<span class="nota-badge ' + badge + '">' + esc(txt) + "</span> " +
            '<button type="button" class="btn btn--link btn--sm planilha-notas__btn" ' +
            'data-nota-matricula="' + esc(m.id) + '" data-nota-disciplina="' + esc(disc) + '" ' +
            'data-nota-tipo="prova">Editar</button></td>'
          );
        })
        .join("");

      var media = obterMediaExibicaoAluno(m.email, periodo);
      var badgeMedia = obterClasseNotaBadge(media);
      var celMedia =
        '<td class="planilha-turma__cel planilha-notas__cel planilha-notas__media">' +
        '<span class="nota-badge ' + badgeMedia + '">' + esc(formatarNotaValor(media)) + "</span>";
      if (podeEditar) {
        celMedia +=
          ' <button type="button" class="btn btn--link btn--sm planilha-notas__btn" ' +
          'data-nota-matricula="' + esc(m.id) + '" data-nota-tipo="media_manual">Média</button>';
      }
      celMedia += "</td>";

      return (
        "<tr>" +
        '<td class="planilha-turma__aluno"><strong>' + esc(m.nomeCompleto) + "</strong><br>" +
        "<small>" + esc(m.email || "—") + "</small></td>" +
        celulas +
        celMedia +
        "</tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<div class="planilha-turma planilha-notas">' +
    '<header class="planilha-turma__cabecalho">' +
    "<div><h3 class=\"planilha-turma__titulo\">" +
    esc(meta.titulo || "Notas e médias") +
    "</h3>" +
    '<p class="presencial-bloco__hint">' +
    esc(
      meta.subtitulo ||
        "Período " +
          periodo +
          ". Professores e secretaria lançam notas; aluno, coordenação e direção veem a mesma média."
    ) +
    "</p></div>" +
    (meta.mostrarAtualizar !== false
      ? '<button type="button" class="btn btn--secondary btn--sm" data-planilha-notas-atualizar="1">Atualizar</button>'
      : "") +
    "</header>" +
    '<div class="planilha-turma__scroll">' +
    '<table class="data-table data-table--compact planilha-turma__tabela">' +
    "<thead><tr><th>Aluno</th>" + cabDisc + "<th>Média</th></tr></thead><tbody>" +
    linhas +
    "</tbody></table></div>" +
    '<div id="planilhaNotasEditor" class="planilha-turma__editor" hidden>' +
    "<h4 id=\"planilhaNotasEditorTitulo\">Lançamento de nota</h4>" +
    '<input type="hidden" id="planilhaNotasEditorMatriculaId">' +
    '<input type="hidden" id="planilhaNotasEditorDisciplina">' +
    '<input type="hidden" id="planilhaNotasEditorTipo">' +
    '<div class="matricula-form__grid">' +
    '<div class="form-group"><label for="planilhaNotasEditorValor">Nota (0 a 10)</label>' +
    '<input type="number" id="planilhaNotasEditorValor" min="0" max="10" step="0.1"></div>' +
    '<div class="form-group"><label for="planilhaNotasEditorObs">Observações</label>' +
    '<textarea id="planilhaNotasEditorObs" rows="2"></textarea></div></div>' +
    '<button type="button" class="btn btn--primary btn--sm" id="planilhaNotasEditorSalvar">Salvar</button> ' +
    '<button type="button" class="btn btn--secondary btn--sm" id="planilhaNotasEditorLimpar">Limpar nota</button> ' +
    '<button type="button" class="btn btn--secondary btn--sm" id="planilhaNotasEditorCancelar">Cancelar</button>' +
    '<p id="planilhaNotasEditorMsg" class="form-mensagem" role="status"></p></div></div>';

  configurarEventosPlanilhaNotasTurma(container, alunos, sessao, meta, periodo);
}

function configurarEventosPlanilhaNotasTurma(container, alunos, sessao, meta, periodo) {
  function refresh() {
    if (typeof meta.onAtualizar === "function") meta.onAtualizar();
  }

  var btnAt = container.querySelector("[data-planilha-notas-atualizar]");
  if (btnAt) btnAt.addEventListener("click", refresh);

  container.querySelectorAll(".planilha-notas__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      abrirEditorNotasTurma(container, btn, alunos, periodo);
    });
  });

  var editor = container.querySelector("#planilhaNotasEditor");
  var cancel = container.querySelector("#planilhaNotasEditorCancelar");
  if (cancel && editor) {
    cancel.addEventListener("click", function () {
      editor.hidden = true;
    });
  }

  var salvar = container.querySelector("#planilhaNotasEditorSalvar");
  if (salvar) {
    salvar.addEventListener("click", function () {
      salvarFormularioNotasTurma(container, alunos, sessao, meta, periodo);
    });
  }

  var limpar = container.querySelector("#planilhaNotasEditorLimpar");
  if (limpar) {
    limpar.addEventListener("click", function () {
      var matId = container.querySelector("#planilhaNotasEditorMatriculaId").value;
      var mat = alunos.find(function (a) { return a.id === matId; });
      if (!mat) return;
      var tipo = container.querySelector("#planilhaNotasEditorTipo").value;
      var disc = container.querySelector("#planilhaNotasEditorDisciplina").value;
      salvarNotaAcademica(
        {
          alunoEmail: mat.email,
          alunoNome: mat.nomeCompleto,
          matriculaId: mat.id,
          turmaId: meta.turmaId || null,
          disciplina: disc,
          tipo: tipo,
          valor: null,
          periodo: periodo
        },
        sessao
      );
      editor.hidden = true;
      refresh();
    });
  }
}

function abrirEditorNotasTurma(container, btn, alunos, periodo) {
  var editor = container.querySelector("#planilhaNotasEditor");
  if (!editor) return;
  var matId = btn.getAttribute("data-nota-matricula");
  var mat = alunos.find(function (a) { return a.id === matId; });
  if (!mat) return;
  var tipo = btn.getAttribute("data-nota-tipo") || "prova";
  var disc = btn.getAttribute("data-nota-disciplina") || "";

  var existente =
    tipo === "media_manual"
      ? obterMediaManualAluno(mat.email, periodo)
      : obterNotaLancamento(mat.email, disc, periodo, "prova", "Prova 1");

  container.querySelector("#planilhaNotasEditorMatriculaId").value = matId;
  container.querySelector("#planilhaNotasEditorDisciplina").value = disc;
  container.querySelector("#planilhaNotasEditorTipo").value = tipo;
  container.querySelector("#planilhaNotasEditorValor").value =
    existente && existente.valor !== null && existente.valor !== undefined
      ? String(existente.valor)
      : tipo === "media_manual" && obterMediaExibicaoAluno(mat.email, periodo) !== null
        ? String(obterMediaExibicaoAluno(mat.email, periodo))
        : "";
  container.querySelector("#planilhaNotasEditorObs").value =
    (existente && existente.observacoes) || "";

  var titulo = container.querySelector("#planilhaNotasEditorTitulo");
  if (titulo) {
    titulo.textContent =
      mat.nomeCompleto +
      " — " +
      (tipo === "media_manual" ? "Média geral" : disc);
  }

  var msg = container.querySelector("#planilhaNotasEditorMsg");
  if (msg) {
    msg.className = "form-mensagem";
    msg.textContent = "";
  }
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function salvarFormularioNotasTurma(container, alunos, sessao, meta, periodo) {
  var msg = container.querySelector("#planilhaNotasEditorMsg");
  var matId = container.querySelector("#planilhaNotasEditorMatriculaId").value;
  var mat = alunos.find(function (a) { return a.id === matId; });
  if (!mat) return;
  var tipo = container.querySelector("#planilhaNotasEditorTipo").value;
  var disc = container.querySelector("#planilhaNotasEditorDisciplina").value;
  var valor = container.querySelector("#planilhaNotasEditorValor").value;
  var obs = container.querySelector("#planilhaNotasEditorObs").value;

  var resultado = salvarNotaAcademica(
    {
      alunoEmail: mat.email,
      alunoNome: mat.nomeCompleto,
      matriculaId: mat.id,
      turmaId: meta.turmaId || null,
      disciplina: disc,
      tipo: tipo,
      valor: valor,
      observacoes: obs,
      periodo: periodo
    },
    sessao
  );

  if (msg) {
    msg.className = resultado.ok
      ? "form-mensagem form-mensagem--sucesso visible"
      : "form-mensagem form-mensagem--erro visible";
    msg.textContent = resultado.ok
      ? "Nota salva. Visível em todas as áreas do sistema."
      : resultado.erro || "Erro ao salvar.";
  }
  if (resultado.ok) {
    container.querySelector("#planilhaNotasEditor").hidden = true;
    if (typeof meta.onAtualizar === "function") meta.onAtualizar();
  }
}
