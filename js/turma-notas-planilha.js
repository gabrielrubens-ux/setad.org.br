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

function renderizarQuadroMateriaisNotasAluno(container, matricula, sessao, meta) {
  if (!container || !matricula) return;
  meta = meta || {};
  sessao = sessao || null;

  var periodo = meta.periodo || obterPeriodoLetivoAtual();
  var podeEditar =
    meta.somenteLeitura !== true && usuarioPodeEditarNotasAcademicas(sessao);
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var formatarNota =
    typeof formatarNotaValor === "function" ? formatarNotaValor : String;

  matricula =
    obterMatriculas().find(function (m) {
      return m.id === matricula.id;
    }) || matricula;

  var materiais = listarMateriaisQuadroAluno(matricula, periodo);

  var moduloNome =
    matricula.modulo &&
    typeof MODULOS_CURSO !== "undefined" &&
    MODULOS_CURSO[matricula.modulo]
      ? MODULOS_CURSO[matricula.modulo].nome
      : matricula.modulo || "—";

  var linhas = materiais
    .map(function (nomeMaterial) {
      var nota = nomeMaterial
        ? obterNotaLancamento(matricula.email, nomeMaterial, periodo, "prova", "Prova 1")
        : null;
      var valor =
        nota && nota.valor !== null && nota.valor !== undefined && nota.valor !== ""
          ? String(nota.valor)
          : "";
      var badge = obterClasseNotaBadge(nota ? nota.valor : null);

      if (podeEditar) {
        return (
          "<tr data-quadro-material-antigo=\"" +
          esc(nomeMaterial) +
          "\">" +
          '<td><input type="text" class="quadro-notas__material" value="' +
          esc(nomeMaterial) +
          '" placeholder="Nome do material / disciplina" maxlength="120"></td>' +
          '<td><input type="number" class="quadro-notas__valor" min="0" max="10" step="0.1" value="' +
          esc(valor) +
          '" placeholder="0,0"></td>' +
          "<td>" +
          '<button type="button" class="btn btn--primary btn--sm quadro-notas__salvar">Salvar</button> ' +
          '<button type="button" class="btn btn--link btn--sm quadro-notas__remover">Remover</button>' +
          "</td></tr>"
        );
      }

      return (
        "<tr>" +
        "<td>" +
        esc(nomeMaterial || "—") +
        "</td>" +
        '<td><span class="nota-badge ' +
        badge +
        '">' +
        esc(formatarNota(nota ? nota.valor : null)) +
        "</span></td>" +
        "<td>—</td></tr>"
      );
    })
    .join("");

  if (!linhas) {
    linhas =
      '<tr><td colspan="3" class="lista-vazia">Nenhum material cadastrado para este período.</td></tr>';
  }

  var media = obterMediaExibicaoAluno(matricula.email, periodo);
  var badgeMedia = obterClasseNotaBadge(media);
  var linhaMedia =
    "<tr class=\"quadro-notas__linha-media\">" +
    "<td><strong>Média geral do período</strong></td>" +
    '<td><span class="nota-badge ' +
    badgeMedia +
    '">' +
    esc(formatarNota(media)) +
    "</span>" +
    (podeEditar
      ? ' <button type="button" class="btn btn--link btn--sm quadro-notas__editar-media">Ajustar média</button>'
      : "") +
    "</td><td>—</td></tr>";

  container.innerHTML =
    '<div class="quadro-notas-materiais planilha-notas">' +
    '<header class="planilha-turma__cabecalho">' +
    "<div><h3 class=\"planilha-turma__titulo\">Quadro de notas por material</h3>" +
    '<p class="presencial-bloco__hint">Nível do curso: <strong>' +
    esc(moduloNome) +
    "</strong> · Período <strong>" +
    esc(periodo) +
    "</strong>. " +
    (podeEditar
      ? "Edite o nome de cada material e a nota (0 a 10)."
      : "Somente leitura.") +
    "</p></div>" +
    (meta.mostrarAtualizar !== false
      ? '<button type="button" class="btn btn--secondary btn--sm" data-quadro-notas-atualizar="1">Atualizar</button>'
      : "") +
    "</header>" +
    '<div class="planilha-turma__scroll">' +
    '<table class="data-table data-table--compact quadro-notas-materiais__tabela">' +
    "<thead><tr><th>Material / disciplina</th><th>Nota</th><th>Ações</th></tr></thead><tbody>" +
    linhas +
    linhaMedia +
    "</tbody></table></div>" +
    (podeEditar
      ? '<p class="quadro-notas-materiais__acoes">' +
        '<button type="button" class="btn btn--secondary btn--sm" id="quadroNotasBtnAddMaterial">+ Adicionar material</button>' +
        "</p>"
      : "") +
    '<div id="quadroNotasEditorMedia" class="planilha-turma__editor" hidden>' +
    "<h4>Média geral manual</h4>" +
    '<div class="form-group"><label for="quadroNotasMediaValor">Nota média (0 a 10)</label>' +
    '<input type="number" id="quadroNotasMediaValor" min="0" max="10" step="0.1"></div>' +
    '<button type="button" class="btn btn--primary btn--sm" id="quadroNotasMediaSalvar">Salvar média</button> ' +
    '<button type="button" class="btn btn--secondary btn--sm" id="quadroNotasMediaCancelar">Cancelar</button>' +
    '<p id="quadroNotasMediaMsg" class="form-mensagem" role="status"></p></div>' +
    '<p id="quadroNotasMsg" class="form-mensagem" role="status"></p></div>';

  configurarEventosQuadroMateriaisNotasAluno(container, matricula, sessao, meta, periodo);
}

function configurarEventosQuadroMateriaisNotasAluno(container, matricula, sessao, meta, periodo) {
  function refresh() {
    var atualizada =
      obterMatriculas().find(function (m) {
        return m.id === matricula.id;
      }) || matricula;
    if (typeof meta.onAtualizar === "function") {
      meta.onAtualizar();
    } else {
      renderizarQuadroMateriaisNotasAluno(container, atualizada, sessao, meta);
    }
  }

  function msg(texto, ok) {
    var el = container.querySelector("#quadroNotasMsg");
    if (!el) return;
    el.className = ok
      ? "form-mensagem form-mensagem--sucesso visible"
      : "form-mensagem form-mensagem--erro visible";
    el.textContent = texto || "";
  }

  var btnAt = container.querySelector("[data-quadro-notas-atualizar]");
  if (btnAt) btnAt.addEventListener("click", refresh);

  container.querySelectorAll(".quadro-notas__salvar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tr = btn.closest("tr");
      if (!tr) return;
      var nomeAntigo = tr.getAttribute("data-quadro-material-antigo") || "";
      var nomeNovo = (tr.querySelector(".quadro-notas__material") || {}).value || "";
      nomeNovo = nomeNovo.trim();
      if (!nomeNovo) {
        msg("Informe o nome do material.", false);
        return;
      }
      var valorRaw = (tr.querySelector(".quadro-notas__valor") || {}).value;
      if (nomeAntigo && nomeAntigo !== nomeNovo) {
        renomearDisciplinaNotasAluno(
          matricula.email,
          periodo,
          nomeAntigo,
          nomeNovo,
          sessao
        );
        var lista = listarMateriaisQuadroAluno(matricula, periodo).map(function (m) {
          return m === nomeAntigo ? nomeNovo : m;
        });
        if (lista.indexOf(nomeNovo) < 0) lista.push(nomeNovo);
        salvarListaMateriaisQuadro(matricula.id, periodo, lista, sessao);
      }
      var resultado = salvarNotaAcademica(
        {
          alunoEmail: matricula.email,
          alunoNome: matricula.nomeCompleto,
          matriculaId: matricula.id,
          disciplina: nomeNovo,
          tipo: "prova",
          valor: valorRaw,
          periodo: periodo
        },
        sessao
      );
      if (!resultado.ok) {
        msg(resultado.erro || "Não foi possível salvar.", false);
        return;
      }
      var listaFinal = listarMateriaisQuadroAluno(matricula, periodo);
      if (listaFinal.indexOf(nomeNovo) < 0) {
        listaFinal.push(nomeNovo);
      }
      salvarListaMateriaisQuadro(matricula.id, periodo, listaFinal, sessao);
      msg("Nota salva para " + nomeNovo + ".", true);
      refresh();
    });
  });

  container.querySelectorAll(".quadro-notas__remover").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tr = btn.closest("tr");
      if (!tr) return;
      var nome = tr.getAttribute("data-quadro-material-antigo") || "";
      if (!nome) {
        refresh();
        return;
      }
      if (
        !window.confirm(
          "Remover o material \"" + nome + "\" deste quadro? A nota lançada será apagada."
        )
      ) {
        return;
      }
      removerMaterialQuadroAluno(matricula, periodo, nome, sessao);
      msg("Material removido.", true);
      refresh();
    });
  });

  var btnAdd = container.querySelector("#quadroNotasBtnAddMaterial");
  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      var lista = listarMateriaisQuadroAluno(matricula, periodo);
      var base = "Material ";
      var n = lista.length + 1;
      var candidato = base + n;
      while (lista.indexOf(candidato) >= 0) {
        n += 1;
        candidato = base + n;
      }
      lista.push(candidato);
      salvarListaMateriaisQuadro(matricula.id, periodo, lista, sessao);
      refresh();
    });
  }

  var btnMedia = container.querySelector(".quadro-notas__editar-media");
  var editorMedia = container.querySelector("#quadroNotasEditorMedia");
  if (btnMedia && editorMedia) {
    btnMedia.addEventListener("click", function () {
      var manual = obterMediaManualAluno(matricula.email, periodo);
      var exib = obterMediaExibicaoAluno(matricula.email, periodo);
      var input = container.querySelector("#quadroNotasMediaValor");
      if (input) {
        input.value =
          manual && manual.valor !== null && manual.valor !== undefined
            ? String(manual.valor)
            : exib !== null && exib !== undefined
              ? String(exib)
              : "";
      }
      editorMedia.hidden = false;
    });
  }

  var cancelMedia = container.querySelector("#quadroNotasMediaCancelar");
  if (cancelMedia && editorMedia) {
    cancelMedia.addEventListener("click", function () {
      editorMedia.hidden = true;
    });
  }

  var salvarMedia = container.querySelector("#quadroNotasMediaSalvar");
  if (salvarMedia) {
    salvarMedia.addEventListener("click", function () {
      var valor = container.querySelector("#quadroNotasMediaValor").value;
      var resultado = salvarNotaAcademica(
        {
          alunoEmail: matricula.email,
          alunoNome: matricula.nomeCompleto,
          matriculaId: matricula.id,
          tipo: "media_manual",
          valor: valor,
          periodo: periodo
        },
        sessao
      );
      var msgMedia = container.querySelector("#quadroNotasMediaMsg");
      if (msgMedia) {
        msgMedia.className = resultado.ok
          ? "form-mensagem form-mensagem--sucesso visible"
          : "form-mensagem form-mensagem--erro visible";
        msgMedia.textContent = resultado.ok
          ? "Média salva."
          : resultado.erro || "Erro ao salvar.";
      }
      if (resultado.ok) {
        editorMedia.hidden = true;
        refresh();
      }
    });
  }
}
