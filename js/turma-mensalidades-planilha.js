/* Planilha de mensalidades por turma / polo — alunos × meses, edição rápida */

/** Ano letivo nos polos — grade em 2 semestres (6 meses cada). */
var PLANILHA_POLO_MES_INICIO = 1;
var PLANILHA_POLO_ANO_INICIO = 2026;
var PLANILHA_POLO_MES_FIM = 12;
var PLANILHA_POLO_ANO_FIM = 2026;
var PLANILHA_POLO_SEMESTRE_1 = { mesInicio: 1, mesFim: 6, rotulo: "jan–jun" };
var PLANILHA_POLO_SEMESTRE_2 = { mesInicio: 7, mesFim: 12, rotulo: "jul–dez" };
var PLANILHA_REFERENCIA_TAXA_MATRICULA = "__taxa_matricula__";

/** Mantém o editor aberto ao re-renderizar a planilha (sync institucional). */
var PLANILHA_MENSALIDADES_EDITOR_ABERTO = null;

function planilhaMensalidadesEditorEstaAberto() {
  var editor = document.getElementById("planilhaTurmaEditor");
  return !!(editor && !editor.hidden);
}

function fecharEditorPlanilhaTurma(container) {
  var editor = container
    ? container.querySelector("#planilhaTurmaEditor")
    : document.getElementById("planilhaTurmaEditor");
  if (editor) editor.hidden = true;
  PLANILHA_MENSALIDADES_EDITOR_ABERTO = null;
}

function planilhaPoloSemValorPadrao(matricula, meta) {
  if (meta && meta.planilhaSemValorPadrao) return true;
  if (!matricula) return false;
  if (matricula.poloId === "setade-sede") return true;
  if (typeof ehPoloSetade === "function" && ehPoloSetade(matricula.poloId)) return true;
  return false;
}

function situacaoExtraContabPolo(status) {
  if (status === "pago" || status === "pago_presencial") return "em_dia";
  if (status === "agendado") return "pendente";
  if (status === "pendente") return "pendente";
  return "pendente";
}

function preencherEditorPlanilhaTurma(container, matriculaId, referencia, pagamentoId, meta) {
  var editor = container.querySelector("#planilhaTurmaEditor");
  if (!editor) return false;

  var matricula =
    typeof obterMatriculaPorId === "function"
      ? obterMatriculaPorId(matriculaId)
      : obterMatriculas().find(function (m) {
          return m.id === matriculaId;
        });
  if (!matricula) return false;

  var pag = pagamentoId
    ? obterPagamentosAlunos().find(function (p) {
        return p.id === pagamentoId;
      })
    : null;
  if (!pag && referencia === PLANILHA_REFERENCIA_TAXA_MATRICULA) {
    pag = obterPagamentoMatriculaMatricula(matricula);
  }
  if (!meta && container._planilhaTurmaMeta) meta = container._planilhaTurmaMeta;
  var semPadrao = planilhaPoloSemValorPadrao(matricula, meta);
  var valorDefault = "";
  if (pag && pag.valor != null && Number(pag.valor) > 0) {
    valorDefault = pag.valor;
  } else if (!semPadrao) {
    if (typeof obterValorMensalidadeMatricula === "function") {
      var vMat = obterValorMensalidadeMatricula(matricula);
      if (vMat > 0) valorDefault = vMat;
    }
    if (!valorDefault && typeof obterMensalidadeModulo === "function") {
      var vMod = obterMensalidadeModulo(matricula.modulo);
      if (vMod > 0) valorDefault = vMod;
    }
  }

  container.querySelector("#planilhaTurmaEditorMatriculaId").value = matriculaId;
  container.querySelector("#planilhaTurmaEditorReferencia").value = referencia;
  container.querySelector("#planilhaTurmaEditorPagamentoId").value = pagamentoId || "";
  container.querySelector("#planilhaTurmaEditorValor").value =
    valorDefault === "" ? "" : String(valorDefault);
  container.querySelector("#planilhaTurmaEditorStatus").value =
    pag && pag.status ? pag.status : "pago";
  container.querySelector("#planilhaTurmaEditorForma").value =
    (pag && pag.formaPagamento) || "";
  container.querySelector("#planilhaTurmaEditorObs").value =
    (pag && pag.observacoes) || "";

  var inputTipo = container.querySelector("#planilhaTurmaEditorTipo");
  var tipoLanc =
    referencia === PLANILHA_REFERENCIA_TAXA_MATRICULA ? "matricula" : "mensalidade";
  if (inputTipo) inputTipo.value = tipoLanc;

  var titulo = container.querySelector("#planilhaTurmaEditorTitulo");
  if (titulo) {
    titulo.textContent =
      referencia === PLANILHA_REFERENCIA_TAXA_MATRICULA
        ? matricula.nomeCompleto + " — taxa de matrícula"
        : matricula.nomeCompleto + " — " + referencia.replace(/^Mensalidade\s*/, "");
  }

  var msg = container.querySelector("#planilhaTurmaEditorMsg");
  if (msg) {
    msg.className = "form-mensagem";
    msg.textContent = "";
  }

  editor.hidden = false;
  return true;
}

function restaurarEditorPlanilhaTurmaSeAberto(container) {
  if (!PLANILHA_MENSALIDADES_EDITOR_ABERTO || !container) return;
  var st = PLANILHA_MENSALIDADES_EDITOR_ABERTO;
  if (
    !preencherEditorPlanilhaTurma(
      container,
      st.matriculaId,
      st.referencia,
      st.pagamentoId,
      container._planilhaTurmaMeta
    )
  ) {
    PLANILHA_MENSALIDADES_EDITOR_ABERTO = null;
    return;
  }
  requestAnimationFrame(function () {
    var editor = container.querySelector("#planilhaTurmaEditor");
    var campo = editor && editor.querySelector("#planilhaTurmaEditorValor");
    if (campo && typeof campo.focus === "function") {
      campo.focus({ preventScroll: true });
    }
  });
}

function obterLimitesSemestrePlanilhaPolo(semestre) {
  var s = Number(semestre) === 2 ? 2 : 1;
  return s === 2 ? PLANILHA_POLO_SEMESTRE_2 : PLANILHA_POLO_SEMESTRE_1;
}

function colunaMesNoSemestrePolo(coluna, semestre) {
  if (!semestre) return true;
  var p = String(coluna || "").split("/");
  if (p.length !== 2) return false;
  var mes = Number(p[0]);
  if (!mes) return false;
  var lim = obterLimitesSemestrePlanilhaPolo(semestre);
  return mes >= lim.mesInicio && mes <= lim.mesFim;
}

function colunaMesDentroPeriodoPolo(coluna) {
  var p = String(coluna || "").split("/");
  if (p.length !== 2) return false;
  var mes = Number(p[0]);
  var ano = Number(p[1]);
  if (!mes || !ano) return false;
  if (ano < PLANILHA_POLO_ANO_INICIO) return false;
  if (ano > PLANILHA_POLO_ANO_FIM) return false;
  if (ano === PLANILHA_POLO_ANO_INICIO && mes < PLANILHA_POLO_MES_INICIO) return false;
  if (ano === PLANILHA_POLO_ANO_FIM && mes > PLANILHA_POLO_MES_FIM) return false;
  return true;
}

function rotuloSemestrePlanilhaPolo(semestre) {
  var lim = obterLimitesSemestrePlanilhaPolo(semestre);
  return (
    (Number(semestre) === 2 ? "2º" : "1º") +
    " semestre (" +
    lim.rotulo +
    "/" +
    PLANILHA_POLO_ANO_INICIO +
    ")"
  );
}

function gerarColunasMensalidadePlanilhaTurma(opcoes) {
  opcoes = opcoes || {};
  var mapa = {};

  function incluirMes(coluna, referencia) {
    if (!coluna || !colunaMesDentroPeriodoPolo(coluna)) return;
    if (opcoes.semestre && !colunaMesNoSemestrePolo(coluna, opcoes.semestre)) return;
    if (!mapa[coluna]) {
      mapa[coluna] = { coluna: coluna, referencia: referencia || "Mensalidade " + coluna };
    }
  }

  function incluirDeReferencia(ref) {
    if (!ref) return;
    var m = String(ref).match(/(\d{2})\/(\d{4})/);
    if (m) incluirMes(m[1] + "/" + m[2], ref);
  }

  var mesLoopIni = PLANILHA_POLO_MES_INICIO;
  var mesLoopFim = PLANILHA_POLO_MES_FIM;
  if (opcoes.semestre) {
    var limSem = obterLimitesSemestrePlanilhaPolo(opcoes.semestre);
    mesLoopIni = Math.max(mesLoopIni, limSem.mesInicio);
    mesLoopFim = Math.min(mesLoopFim, limSem.mesFim);
  }

  var ano = PLANILHA_POLO_ANO_INICIO;
  var mes = mesLoopIni;
  while (ano < PLANILHA_POLO_ANO_FIM || (ano === PLANILHA_POLO_ANO_FIM && mes <= mesLoopFim)) {
    if (mes < PLANILHA_POLO_MES_INICIO && ano === PLANILHA_POLO_ANO_INICIO) {
      mes = PLANILHA_POLO_MES_INICIO;
    }
    incluirMes(String(mes).padStart(2, "0") + "/" + ano);
    mes += 1;
    if (mes > mesLoopFim && ano === PLANILHA_POLO_ANO_FIM) break;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
    if (ano > PLANILHA_POLO_ANO_FIM) break;
  }

  if (opcoes.colunasExtras && opcoes.colunasExtras.length) {
    opcoes.colunasExtras.forEach(function (col) {
      incluirMes(col);
    });
  }

  if (opcoes.incluirMesesComPagamento !== false) {
    var alunos = opcoes.alunos || [];
    if (alunos.length && typeof obterPagamentosAlunos === "function") {
      var ids = {};
      var emails = {};
      alunos.forEach(function (m) {
        if (m && m.id) ids[m.id] = true;
        if (m && m.email) emails[String(m.email).toLowerCase()] = true;
      });
      obterPagamentosAlunos().forEach(function (p) {
        if (!p || p.tipo !== "mensalidade") return;
        var doAluno =
          (p.matriculaId && ids[p.matriculaId]) ||
          (p.alunoEmail && emails[String(p.alunoEmail).toLowerCase()]);
        if (!doAluno) return;
        incluirDeReferencia(p.referencia);
      });
    }
  }

  return Object.keys(mapa)
    .sort(function (a, b) {
      var pa = a.split("/");
      var pb = b.split("/");
      return Number(pa[1] + pa[0]) - Number(pb[1] + pb[0]);
    })
    .map(function (chave) {
      return mapa[chave];
    });
}

function obterPagamentoMatriculaMatricula(matricula) {
  if (!matricula || !matricula.id || typeof obterPagamentosAlunos !== "function") return null;
  return (
    obterPagamentosAlunos().find(function (p) {
      return p.matriculaId === matricula.id && (!p.tipo || p.tipo === "matricula");
    }) || null
  );
}

function obterPagamentoMensalidadeReferencia(matriculaOuEmail, referencia) {
  if (typeof obterPagamentosAlunos !== "function") return null;
  var lista = obterPagamentosAlunos();
  if (matriculaOuEmail && typeof matriculaOuEmail === "object") {
    var mat = matriculaOuEmail;
    return (
      lista.find(function (p) {
        if (p.tipo !== "mensalidade" || p.referencia !== referencia) return false;
        if (mat.id && p.matriculaId === mat.id) return true;
        if (mat.email && p.alunoEmail) {
          return String(p.alunoEmail).toLowerCase() === String(mat.email).toLowerCase();
        }
        return false;
      }) || null
    );
  }
  if (typeof obterPagamentosPorAluno === "function" && matriculaOuEmail) {
    return (
      obterPagamentosPorAluno(matriculaOuEmail).find(function (p) {
        return p.tipo === "mensalidade" && p.referencia === referencia;
      }) || null
    );
  }
  return null;
}

function registrarOuAtualizarMensalidadeTurma(matricula, referencia, opcoes, sessao) {
  if (!matricula || !matricula.id) {
    return { ok: false, erro: "Matrícula inválida." };
  }
  if (typeof inicializarDadosFinanceiros === "function") {
    inicializarDadosFinanceiros();
  }

  var existente = obterPagamentoMensalidadeReferencia(matricula, referencia);
  var valor;
  if (opcoes.valor !== undefined && opcoes.valor !== null && opcoes.valor !== "") {
    valor = Number(opcoes.valor);
  } else if (existente && existente.valor != null) {
    valor = Number(existente.valor);
  } else if (planilhaPoloSemValorPadrao(matricula, null)) {
    valor = 0;
  } else if (typeof obterMensalidadeModulo === "function") {
    valor = obterMensalidadeModulo(matricula.modulo) || 0;
  } else {
    valor = 0;
  }

  if (existente && typeof atualizarPagamentoContador === "function") {
    var campos = {
      valor: valor,
      referencia: referencia,
      status: opcoes.status || "pago",
      formaPagamento: opcoes.formaPagamento || existente.formaPagamento,
      observacoes: opcoes.observacoes || existente.observacoes
    };
    if (campos.status === "pago" && !campos.formaPagamento) {
      campos.formaPagamento = "PIX";
    }
    var atualizado = atualizarPagamentoContador(existente.id, campos);
    if (atualizado.ok && typeof salvarExtraAlunoPolo === "function") {
      salvarExtraAlunoPolo(matricula.id, {
        situacao: situacaoExtraContabPolo(campos.status),
        formaPagamento: campos.formaPagamento || null,
        ultimoValor: valor
      });
    }
    return atualizado;
  }

  if (typeof registrarPagamentoPresencialSecretaria !== "function") {
    return { ok: false, erro: "Módulo financeiro indisponível." };
  }

  var situacao =
    opcoes.status === "pendente" || opcoes.status === "agendado"
      ? "pendente"
      : "pago_presencial";

  var registro = registrarPagamentoPresencialSecretaria(
    matricula,
    {
      tipoCobranca: "mensalidade",
      referenciaMensalidade: referencia,
      situacaoPagamento: situacao,
      formaPagamento: opcoes.formaPagamento || "PIX",
      valor: valor,
      observacoesPagamento: opcoes.observacoes || ""
    },
    sessao
  );

  if (registro.ok && typeof salvarExtraAlunoPolo === "function") {
    var statusUi =
      opcoes.status === "pendente" || opcoes.status === "agendado"
        ? opcoes.status
        : "pago";
    salvarExtraAlunoPolo(matricula.id, {
      situacao: situacaoExtraContabPolo(statusUi),
      formaPagamento: opcoes.formaPagamento || "PIX",
      ultimoValor: valor
    });
  }
  return registro;
}

function montarCelulaPlanilhaTurmaMatricula(matricula, sessao) {
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var formatar =
    typeof formatarMoeda === "function" ? formatarMoeda : String;
  var pag = obterPagamentoMatriculaMatricula(matricula);
  if (!pag) {
    return (
      '<td class="planilha-turma__cel planilha-turma__cel--vazia planilha-turma__cel--matricula">' +
      '<button type="button" class="btn btn--link btn--sm planilha-turma__btn-cel" ' +
      'data-planilha-matricula="' + esc(matricula.id) + '" ' +
      'data-planilha-ref="' + esc(PLANILHA_REFERENCIA_TAXA_MATRICULA) + '" ' +
      'data-planilha-tipo="matricula" data-planilha-acao="novo" title="Registrar taxa de matrícula">+</button></td>'
    );
  }
  var cls = pag.status === "pago" ? "pago" : pag.status === "pendente" ? "pendente" : "agendado";
  return (
    '<td class="planilha-turma__cel planilha-turma__cel--' + cls + ' planilha-turma__cel--matricula">' +
    "<span class=\"planilha-turma__valor\">" + formatar(pag.valor) + "</span>" +
    '<button type="button" class="btn btn--link btn--sm planilha-turma__btn-cel" ' +
    'data-planilha-pagamento="' + esc(pag.id) + '" ' +
    'data-planilha-matricula="' + esc(matricula.id) + '" ' +
    'data-planilha-ref="' + esc(PLANILHA_REFERENCIA_TAXA_MATRICULA) + '" ' +
    'data-planilha-tipo="matricula" data-planilha-acao="editar">Editar</button></td>'
  );
}

function montarCelulaPlanilhaTurmaMensalidade(matricula, coluna, sessao) {
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var pag = obterPagamentoMensalidadeReferencia(matricula, coluna.referencia);
  var formatar =
    typeof formatarMoeda === "function" ? formatarMoeda : String;
  var labelStatus =
    typeof obterLabelPagamentoStatus === "function"
      ? obterLabelPagamentoStatus
      : function (s) { return s; };

  if (!pag) {
    return (
      '<td class="planilha-turma__cel planilha-turma__cel--vazia">' +
      '<button type="button" class="btn btn--link btn--sm planilha-turma__btn-cel" ' +
      'data-planilha-matricula="' + esc(matricula.id) + '" ' +
      'data-planilha-ref="' + esc(coluna.referencia) + '" ' +
      'data-planilha-acao="novo" title="Registrar mensalidade">+</button></td>'
    );
  }

  var cls =
    pag.status === "pago"
      ? "pago"
      : pag.status === "pendente"
        ? "pendente"
        : "agendado";

  return (
    '<td class="planilha-turma__cel planilha-turma__cel--' + cls + '">' +
    "<span class=\"planilha-turma__valor\">" + formatar(pag.valor) + "</span>" +
    '<span class="planilha-turma__sit">' + esc(labelStatus(pag.status)) + "</span>" +
    '<button type="button" class="btn btn--link btn--sm planilha-turma__btn-cel" ' +
    'data-planilha-pagamento="' + esc(pag.id) + '" ' +
    'data-planilha-matricula="' + esc(matricula.id) + '" ' +
    'data-planilha-ref="' + esc(coluna.referencia) + '" ' +
    'data-planilha-acao="editar">Editar</button></td>'
  );
}

function renderizarPlanilhaMensalidadesPorSemestresPolo(container, alunos, sessao, meta) {
  if (!container) return;
  meta = meta || {};
  var semAtivo = container.dataset.semestreAtivo === "2" ? "2" : "1";
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return String(s || ""); };

  container.innerHTML =
    '<div class="planilha-turma planilha-turma--semestres">' +
    '<nav class="turma-painel-academico__abas polo-contab__semestres" role="tablist" aria-label="Semestre letivo">' +
    '<button type="button" class="turma-painel-academico__aba' +
    (semAtivo === "1" ? " turma-painel-academico__aba--ativa" : "") +
    '" data-polo-semestre="1" role="tab">' +
    esc(rotuloSemestrePlanilhaPolo(1)) +
    "</button>" +
    '<button type="button" class="turma-painel-academico__aba' +
    (semAtivo === "2" ? " turma-painel-academico__aba--ativa" : "") +
    '" data-polo-semestre="2" role="tab">' +
    esc(rotuloSemestrePlanilhaPolo(2)) +
    "</button>" +
    "</nav>" +
    '<div class="planilha-turma__semestre-host" id="planilhaPoloSemestreHost"></div>' +
    "</div>";

  var host = container.querySelector("#planilhaPoloSemestreHost");

  function pintarSemestre(sem) {
    sem = sem === 2 || sem === "2" ? 2 : 1;
    container.dataset.semestreAtivo = String(sem);
    container.querySelectorAll("[data-polo-semestre]").forEach(function (btn) {
      btn.classList.toggle(
        "turma-painel-academico__aba--ativa",
        btn.getAttribute("data-polo-semestre") === String(sem)
      );
    });
  var lim = obterLimitesSemestrePlanilhaPolo(sem);
    var childMeta = Object.assign({}, meta, {
      dividirSemestresPolo: false,
      semestre: sem,
      titulo:
        (meta.titulo || "Planilha") +
        " — " +
        (sem === 2 ? "2º" : "1º") +
        " semestre",
      subtitulo:
        "Mensalidades de " +
        lim.rotulo +
        "/" +
        PLANILHA_POLO_ANO_INICIO +
        ". Clique em + ou Editar para lançar valores.",
      onAtualizar: function () {
        if (typeof meta.onAtualizar === "function") meta.onAtualizar();
        pintarSemestre(sem);
      }
    });
    if (host) renderizarPlanilhaMensalidadesTurma(host, alunos, sessao, childMeta);
  }

  container.querySelectorAll("[data-polo-semestre]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      pintarSemestre(btn.getAttribute("data-polo-semestre"));
    });
  });

  pintarSemestre(semAtivo);
}

function renderizarPlanilhaMensalidadesTurma(container, alunos, sessao, meta) {
  if (!container) return;
  meta = meta || {};
  if (meta.dividirSemestresPolo) {
    renderizarPlanilhaMensalidadesPorSemestresPolo(container, alunos, sessao, meta);
    return;
  }
  if (
    typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
    coordenacaoPedagogicaSemFinanceiro(sessao)
  ) {
    container.innerHTML =
      '<p class="lista-vazia">Mensalidades e lançamentos financeiros não estão disponíveis para a coordenação pedagógica.</p>';
    return;
  }
  alunos = (alunos || []).slice().sort(function (a, b) {
    return (a.nomeCompleto || "").localeCompare(b.nomeCompleto || "", "pt-BR");
  });

  if (!alunos.length) {
    container.innerHTML =
      '<p class="lista-vazia">Nenhum aluno nesta turma ou polo.</p>';
    return;
  }

  if (typeof inicializarDadosFinanceiros === "function") {
    inicializarDadosFinanceiros();
  }

  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var formatar =
    typeof formatarMoeda === "function" ? formatarMoeda : String;
  var optsColunas = { alunos: alunos };
  if (meta.semestre) optsColunas.semestre = meta.semestre;
  if (meta.fixarGradeAnoLetivoPolo) {
    optsColunas.incluirMesesComPagamento = false;
  }
  var colunas = gerarColunasMensalidadePlanilhaTurma(optsColunas);
  var titulo = meta.titulo || "Planilha de mensalidades";
  var subtitulo =
    meta.subtitulo ||
    "Clique em + ou Editar para lançar pagamentos por semestre (" +
      PLANILHA_POLO_ANO_INICIO +
      "). Os dados vão para contador e direção.";

  var mostrarMatricula = meta.planilhaColunaMatricula !== false;
  var cabMeses =
    (mostrarMatricula ? "<th>Matrícula (R$)</th>" : "") +
    colunas
      .map(function (c) {
        return "<th>" + esc(c.coluna) + "</th>";
      })
      .join("");

  var linhas = alunos
    .map(function (m) {
      var resumo =
        typeof resumoExtratoMatricula === "function"
          ? resumoExtratoMatricula(m)
          : typeof resumoExtratoAluno === "function"
            ? resumoExtratoAluno(m.email)
            : { valorPago: 0, valorPendente: 0, valorAgendado: 0 };
      var emAberto = (resumo.valorPendente || 0) + (resumo.valorAgendado || 0);
      var celulaMat = mostrarMatricula ? montarCelulaPlanilhaTurmaMatricula(m, sessao) : "";
      var celulas = colunas
        .map(function (col) {
          return montarCelulaPlanilhaTurmaMensalidade(m, col, sessao);
        })
        .join("");
      return (
        "<tr data-matricula-id=\"" + esc(m.id) + "\">" +
        "<td class=\"planilha-turma__aluno\"><strong>" + esc(m.nomeCompleto) + "</strong><br>" +
        "<small>" + esc(m.email || "—") + "</small></td>" +
        celulaMat +
        celulas +
        "<td>" + formatar(resumo.valorPago || 0) + "</td>" +
        '<td class="planilha-turma__debito">' + formatar(emAberto) + "</td>" +
        "</tr>"
      );
    })
    .join("");

  var formas =
    typeof FORMAS_PAGAMENTO_PRESENCIAL !== "undefined"
      ? FORMAS_PAGAMENTO_PRESENCIAL
      : ["PIX", "Dinheiro"];

  container.innerHTML =
    '<div class="planilha-turma">' +
    "<header class=\"planilha-turma__cabecalho\">" +
    "<div><h3 class=\"planilha-turma__titulo\">" + esc(titulo) + "</h3>" +
    '<p class="presencial-bloco__hint">' + esc(subtitulo) + "</p></div>" +
    (meta.mostrarAtualizar !== false
      ? '<button type="button" class="btn btn--secondary btn--sm" data-planilha-atualizar="1">Atualizar planilha</button>'
      : "") +
    "</header>" +
    '<div class="planilha-turma__scroll">' +
    '<table class="data-table data-table--compact planilha-turma__tabela">' +
    "<thead><tr>" +
    "<th>Aluno</th>" + cabMeses + "<th>Total pago</th><th>Em aberto</th>" +
    "</tr></thead><tbody>" + linhas + "</tbody></table></div>" +
    '<div id="planilhaTurmaEditor" class="planilha-turma__editor" hidden>' +
    "<h4 id=\"planilhaTurmaEditorTitulo\">Lançamento</h4>" +
    '<input type="hidden" id="planilhaTurmaEditorMatriculaId">' +
    '<input type="hidden" id="planilhaTurmaEditorReferencia">' +
    '<input type="hidden" id="planilhaTurmaEditorTipo">' +
    '<input type="hidden" id="planilhaTurmaEditorPagamentoId">' +
    '<div class="matricula-form__grid">' +
    '<div class="form-group"><label for="planilhaTurmaEditorValor">Valor (R$)</label>' +
    '<input type="number" id="planilhaTurmaEditorValor" min="0" step="0.01"></div>' +
    '<div class="form-group"><label for="planilhaTurmaEditorStatus">Situação</label>' +
    '<select id="planilhaTurmaEditorStatus">' +
    '<option value="pago">Pago</option>' +
    '<option value="pendente">Pendente</option>' +
    '<option value="agendado">Agendado</option>' +
    "</select></div>" +
    '<div class="form-group"><label for="planilhaTurmaEditorForma">Forma (se pago)</label>' +
    '<select id="planilhaTurmaEditorForma"><option value="">—</option>' +
    formas
      .map(function (f) {
        return '<option value="' + esc(f) + '">' + esc(f) + "</option>";
      })
      .join("") +
    "</select></div>" +
    '<div class="form-group form-group--full"><label for="planilhaTurmaEditorObs">Observações</label>' +
    '<textarea id="planilhaTurmaEditorObs" rows="2"></textarea></div>' +
    '<div class="form-group form-group--full">' +
    '<label class="presencial-bloco__check">' +
    '<input type="checkbox" id="planilhaTurmaEditorEmitirRecibo" checked> ' +
    "Emitir recibo ao salvar como pago" +
    "</label></div></div>" +
    '<button type="button" class="btn btn--primary btn--sm" id="planilhaTurmaEditorSalvar">Salvar lançamento</button> ' +
    '<button type="button" class="btn btn--secondary btn--sm" id="planilhaTurmaEditorCancelar">Cancelar</button>' +
    '<p id="planilhaTurmaEditorMsg" class="form-mensagem" role="status"></p>' +
    "</div></div>";

  configurarEventosPlanilhaMensalidadesTurma(container, sessao, meta);
}

function configurarEventosPlanilhaMensalidadesTurma(container, sessao, meta) {
  meta = meta || {};
  container._planilhaTurmaMeta = meta;

  function refresh() {
    if (typeof meta.onAtualizar === "function") {
      meta.onAtualizar();
    }
  }

  var btnAtualizar = container.querySelector("[data-planilha-atualizar]");
  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", refresh);
  }

  container.querySelectorAll(".planilha-turma__btn-cel").forEach(function (btn) {
    btn.addEventListener("click", function (evento) {
      evento.preventDefault();
      evento.stopPropagation();
      abrirEditorPlanilhaTurma(container, btn, sessao);
    });
  });

  var editor = container.querySelector("#planilhaTurmaEditor");
  var btnSalvar = container.querySelector("#planilhaTurmaEditorSalvar");
  var btnCancelar = container.querySelector("#planilhaTurmaEditorCancelar");

  if (btnCancelar && editor) {
    btnCancelar.addEventListener("click", function () {
      fecharEditorPlanilhaTurma(container);
    });
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", function () {
      var msg = container.querySelector("#planilhaTurmaEditorMsg");
      var matriculaId = container.querySelector("#planilhaTurmaEditorMatriculaId").value;
      var referencia = container.querySelector("#planilhaTurmaEditorReferencia").value;
      var matricula =
        typeof obterMatriculaPorId === "function"
          ? obterMatriculaPorId(matriculaId)
          : obterMatriculas().find(function (m) { return m.id === matriculaId; });
      if (!matricula) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Aluno não encontrado.";
        }
        return;
      }
      var valor = Number(container.querySelector("#planilhaTurmaEditorValor").value);
      var status = container.querySelector("#planilhaTurmaEditorStatus").value;
      var forma = container.querySelector("#planilhaTurmaEditorForma").value;
      var obs = container.querySelector("#planilhaTurmaEditorObs").value.trim();

      if (status === "pago" && (!valor || valor <= 0)) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Informe um valor válido.";
        }
        return;
      }
      if (status !== "pago" && (valor === undefined || Number.isNaN(valor))) {
        valor = 0;
      }
      if (status === "pago" && !forma) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Selecione a forma de pagamento.";
        }
        return;
      }

      var tipoLancamento = (container.querySelector("#planilhaTurmaEditorTipo") || {}).value;
      var resultado;
      if (tipoLancamento === "matricula" && typeof aplicarPagamentoAlunoPolo === "function") {
        resultado = aplicarPagamentoAlunoPolo(
          matricula,
          {
            tipoCobranca: "matricula",
            situacaoPagamento: status === "pago" ? "pago_presencial" : "pendente",
            formaPagamento: forma || "PIX",
            valor: valor,
            observacoes: obs
          },
          sessao
        );
      } else {
        resultado = registrarOuAtualizarMensalidadeTurma(
          matricula,
          referencia,
          {
            valor: valor,
            status: status,
            formaPagamento: forma,
            observacoes: obs
          },
          sessao
        );
      }

      if (msg) {
        msg.className = resultado.ok
          ? "form-mensagem form-mensagem--sucesso visible"
          : "form-mensagem form-mensagem--erro visible";
        msg.textContent = resultado.ok
          ? "Lançamento salvo. Contador e diretor atualizados."
          : resultado.erro || "Não foi possível salvar.";
      }
      if (resultado.ok) {
        if (
          status === "pago" &&
          typeof SETADHistoricoRecibo !== "undefined"
        ) {
          var chkPlan = container.querySelector("#planilhaTurmaEditorEmitirRecibo");
          SETADHistoricoRecibo.aposPagamentoRealizado(matricula, resultado, sessao, {
            emitirRecibo: !chkPlan || chkPlan.checked,
            imprimirReciboSemConfirmar: true,
            poloNome: matricula.poloNome,
            delayMs: 500
          });
        }
        fecharEditorPlanilhaTurma(container);
        refresh();
      }
    });
  }

  restaurarEditorPlanilhaTurmaSeAberto(container);
}

function abrirEditorPlanilhaTurma(container, btn, sessao) {
  var editor = container.querySelector("#planilhaTurmaEditor");
  if (!editor) return;

  var matriculaId = btn.getAttribute("data-planilha-matricula");
  var referencia = btn.getAttribute("data-planilha-ref");
  var pagamentoId = btn.getAttribute("data-planilha-pagamento") || "";

  if (
    !preencherEditorPlanilhaTurma(
      container,
      matriculaId,
      referencia,
      pagamentoId || null,
      container._planilhaTurmaMeta
    )
  ) {
    return;
  }

  PLANILHA_MENSALIDADES_EDITOR_ABERTO = {
    matriculaId: matriculaId,
    referencia: referencia,
    pagamentoId: pagamentoId
  };

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      var campo = editor.querySelector("#planilhaTurmaEditorValor");
      if (campo && typeof campo.focus === "function") {
        campo.focus({ preventScroll: true });
      }
      editor.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

if (typeof global !== "undefined") {
  global.colunaMesDentroPeriodoPolo = colunaMesDentroPeriodoPolo;
  global.colunaMesNoSemestrePolo = colunaMesNoSemestrePolo;
  global.obterLimitesSemestrePlanilhaPolo = obterLimitesSemestrePlanilhaPolo;
  global.gerarColunasMensalidadePlanilhaTurma = gerarColunasMensalidadePlanilhaTurma;
  global.obterPagamentoMatriculaMatricula = obterPagamentoMatriculaMatricula;
}

function listarTurmasDoPoloContabilidade(poloId) {
  if (typeof listarTurmasCatalogoSetad !== "function") return [];
  return listarTurmasCatalogoSetad().filter(function (t) {
    if (t.tipo === "polo") return t.poloId === poloId;
    if (t.tipo === "setade" && typeof ehPoloSetade === "function") {
      return ehPoloSetade(poloId);
    }
    return false;
  });
}
