/* Planilha de mensalidades por turma / polo — alunos × meses, edição rápida */

var PLANILHA_TURMA_QTD_MESES = 8;

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

function preencherEditorPlanilhaTurma(container, matriculaId, referencia, pagamentoId) {
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
  var valorDefault =
    pag && pag.valor
      ? pag.valor
      : typeof obterValorMensalidadeMatricula === "function"
        ? obterValorMensalidadeMatricula(matricula)
        : typeof obterMensalidadeModulo === "function"
          ? obterMensalidadeModulo(matricula.modulo)
          : 0;

  container.querySelector("#planilhaTurmaEditorMatriculaId").value = matriculaId;
  container.querySelector("#planilhaTurmaEditorReferencia").value = referencia;
  container.querySelector("#planilhaTurmaEditorPagamentoId").value = pagamentoId || "";
  container.querySelector("#planilhaTurmaEditorValor").value = String(valorDefault);
  container.querySelector("#planilhaTurmaEditorStatus").value =
    pag && pag.status ? pag.status : "pago";
  container.querySelector("#planilhaTurmaEditorForma").value =
    (pag && pag.formaPagamento) || "";
  container.querySelector("#planilhaTurmaEditorObs").value =
    (pag && pag.observacoes) || "";

  var titulo = container.querySelector("#planilhaTurmaEditorTitulo");
  if (titulo) {
    titulo.textContent =
      matricula.nomeCompleto + " — " + referencia.replace(/^Mensalidade\s*/, "");
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
  if (!preencherEditorPlanilhaTurma(container, st.matriculaId, st.referencia, st.pagamentoId)) {
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

function gerarColunasMensalidadePlanilhaTurma(opcoes) {
  opcoes = opcoes || {};
  var mapa = {};

  function incluirMes(coluna, referencia) {
    if (!coluna) return;
    if (!mapa[coluna]) {
      mapa[coluna] = { coluna: coluna, referencia: referencia || "Mensalidade " + coluna };
    }
  }

  function incluirDeReferencia(ref) {
    if (!ref) return;
    var m = String(ref).match(/(\d{2})\/(\d{4})/);
    if (m) incluirMes(m[1] + "/" + m[2], ref);
  }

  var base = new Date();
  base.setDate(1);
  var inicio = -2;
  for (var i = 0; i < PLANILHA_TURMA_QTD_MESES; i++) {
    var d = new Date(base.getFullYear(), base.getMonth() + inicio + i, 1);
    var mes = String(d.getMonth() + 1).padStart(2, "0");
    var ano = d.getFullYear();
    incluirMes(mes + "/" + ano);
  }

  if (opcoes.colunasExtras && opcoes.colunasExtras.length) {
    opcoes.colunasExtras.forEach(function (col) {
      incluirMes(col);
    });
  }

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
  var valor =
    opcoes.valor !== undefined && opcoes.valor !== null
      ? Number(opcoes.valor)
      : typeof obterMensalidadeModulo === "function"
        ? obterMensalidadeModulo(matricula.modulo)
        : 0;

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
        situacao: campos.status === "pago" ? "em_dia" : "atraso",
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
    salvarExtraAlunoPolo(matricula.id, {
      situacao: situacao === "pago_presencial" ? "em_dia" : "atraso",
      formaPagamento: opcoes.formaPagamento || "PIX",
      ultimoValor: valor
    });
  }
  return registro;
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

function renderizarPlanilhaMensalidadesTurma(container, alunos, sessao, meta) {
  if (!container) return;
  meta = meta || {};
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
  var colunas = gerarColunasMensalidadePlanilhaTurma({ alunos: alunos });
  var titulo = meta.titulo || "Planilha de mensalidades";
  var subtitulo =
    meta.subtitulo ||
    "Clique em + ou Editar para lançar pagamentos. Os dados vão para contador e direção.";

  var cabMeses = colunas
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
      var celulas = colunas
        .map(function (col) {
          return montarCelulaPlanilhaTurmaMensalidade(m, col, sessao);
        })
        .join("");
      return (
        "<tr data-matricula-id=\"" + esc(m.id) + "\">" +
        "<td class=\"planilha-turma__aluno\"><strong>" + esc(m.nomeCompleto) + "</strong><br>" +
        "<small>" + esc(m.email || "—") + "</small></td>" +
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
    '<textarea id="planilhaTurmaEditorObs" rows="2"></textarea></div></div>' +
    '<button type="button" class="btn btn--primary btn--sm" id="planilhaTurmaEditorSalvar">Salvar lançamento</button> ' +
    '<button type="button" class="btn btn--secondary btn--sm" id="planilhaTurmaEditorCancelar">Cancelar</button>' +
    '<p id="planilhaTurmaEditorMsg" class="form-mensagem" role="status"></p>' +
    "</div></div>";

  configurarEventosPlanilhaMensalidadesTurma(container, sessao, meta);
}

function configurarEventosPlanilhaMensalidadesTurma(container, sessao, meta) {
  meta = meta || {};

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

      if (!valor || valor <= 0) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Informe um valor válido.";
        }
        return;
      }
      if (status === "pago" && !forma) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Selecione a forma de pagamento.";
        }
        return;
      }

      var resultado = registrarOuAtualizarMensalidadeTurma(
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

      if (msg) {
        msg.className = resultado.ok
          ? "form-mensagem form-mensagem--sucesso visible"
          : "form-mensagem form-mensagem--erro visible";
        msg.textContent = resultado.ok
          ? "Lançamento salvo. Contador e diretor atualizados."
          : resultado.erro || "Não foi possível salvar.";
      }
      if (resultado.ok) {
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
    !preencherEditorPlanilhaTurma(container, matriculaId, referencia, pagamentoId || null)
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
