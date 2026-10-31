/* Planilha de mensalidades no cadastro presencial + aluno de demonstração */

var SETAD_EMAIL_ALUNO_DEMONSTRACAO = "demonstracao.aluno@setad.org.br";
var SETAD_ID_MATRICULA_DEMONSTRACAO = "mat-demonstracao-setad";

function obterMesReferenciaPagamentoPresencial() {
  var el = document.getElementById("secMesReferenciaPagamento");
  if (!el || !el.value) {
    return typeof obterReferenciaMensalidadeAtual === "function"
      ? obterReferenciaMensalidadeAtual()
      : null;
  }
  return typeof referenciaMensalidadeDoInputMonth === "function"
    ? referenciaMensalidadeDoInputMonth(el.value)
    : null;
}

function obterMatriculaAtivaNoCadastroPresencial() {
  var id = document.getElementById("secMatriculaId");
  if (id && id.value.trim()) {
    var porId = obterMatriculas().find(function (m) {
      return m.id === id.value.trim();
    });
    if (porId) return porId;
  }
  var emailEl = document.getElementById("secEmail");
  var email = emailEl ? emailEl.value.trim().toLowerCase() : "";
  if (email && typeof obterMatriculaPorEmail === "function") {
    return obterMatriculaPorEmail(email);
  }
  return null;
}

function sincronizarExtratoCadastroAluno(matricula) {
  if (!matricula || !matricula.email) return;
  if (
    matricula.origem === "demonstracao" ||
    matricula.email.toLowerCase() === SETAD_EMAIL_ALUNO_DEMONSTRACAO
  ) {
    garantirPagamentosDemonstracaoSetad(matricula);
    return;
  }
  if (typeof garantirExtratoAluno === "function") {
    garantirExtratoAluno({
      email: matricula.email,
      nome: matricula.nomeCompleto,
      modulo: matricula.modulo || "basico"
    });
  } else if (typeof criarPagamentoDeMatricula === "function") {
    criarPagamentoDeMatricula(matricula);
  }
}

function extrairMesAnoDaReferencia(referencia) {
  if (!referencia) return "";
  var match = String(referencia).match(/(\d{2})\/(\d{4})/);
  if (!match) return referencia;
  return match[1] + "/" + match[2];
}

function renderizarPlanilhaMensalidadesCadastroAluno(matricula) {
  var container = document.getElementById("secPlanilhaMensalidades");
  if (!container) return;

  matricula = matricula || obterMatriculaAtivaNoCadastroPresencial();

  if (!matricula || !matricula.email) {
    container.innerHTML =
      '<p class="cadastro-mensalidades__vazio presencial-bloco__hint">' +
      "Salve ou busque um aluno para ver a planilha de mensalidades. " +
      "Use o botão <strong>Carregar aluno de demonstração</strong> para testar." +
      "</p>";
    return;
  }

  sincronizarExtratoCadastroAluno(matricula);

  var parcelas =
    typeof obterPagamentosPorAluno === "function"
      ? obterPagamentosPorAluno(matricula.email)
      : [];
  var resumo =
    typeof resumoExtratoAluno === "function"
      ? resumoExtratoAluno(matricula.email)
      : { valorPago: 0, valorPendente: 0, valorAgendado: 0 };

  var emAberto = (resumo.valorPendente || 0) + (resumo.valorAgendado || 0);
  var formatar = typeof formatarMoeda === "function" ? formatarMoeda : String;
  var formatarDataFn = typeof formatarData === "function" ? formatarData : String;
  var esc = typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var labelStatus =
    typeof obterLabelPagamentoStatus === "function"
      ? obterLabelPagamentoStatus
      : function (s) { return s; };
  var classeStatus =
    typeof obterClassePagamentoStatus === "function"
      ? obterClassePagamentoStatus
      : function () { return ""; };

  var linhas = parcelas
    .map(function (p) {
      var mesRef = extrairMesAnoDaReferencia(p.referencia);
      var dataPg = p.dataPagamento ? formatarDataFn(p.dataPagamento) : "—";
      var venc = p.vencimento ? formatarDataFn(p.vencimento) : "—";
      return (
        "<tr>" +
        "<td>" + esc(mesRef || "—") + "</td>" +
        "<td>" + esc(p.referencia || "—") + "</td>" +
        "<td>" + venc + "</td>" +
        "<td>" + formatar(p.valor) + "</td>" +
        '<td><span class="status-badge ' + classeStatus(p.status) + '">' +
        esc(labelStatus(p.status)) + "</span></td>" +
        "<td>" + dataPg + "</td>" +
        "<td>" + esc(p.formaPagamento || "—") + "</td>" +
        "</tr>"
      );
    })
    .join("");

  if (!linhas) {
    linhas =
      '<tr><td colspan="7" class="cadastro-mensalidades__vazio">' +
      "Nenhum lançamento ainda. Registre pagamentos no bloco acima." +
      "</td></tr>";
  }

  container.innerHTML =
    '<div class="cadastro-mensalidades__cabecalho">' +
    "<div>" +
    "<h3 class=\"cadastro-mensalidades__titulo\">Planilha de mensalidades — " +
    esc(matricula.nomeCompleto) +
    "</h3>" +
    '<p class="presencial-bloco__hint">Os lançamentos abaixo aparecem no painel do contador e na visão financeira do diretor.</p>' +
    "</div>" +
    '<button type="button" class="btn btn--secondary btn--sm" id="secBtnAtualizarPlanilha">Atualizar</button>' +
    "</div>" +
    '<div class="cadastro-mensalidades__resumo modulos-resumo">' +
    '<article class="modulo-card-resumo modulo-card-resumo--avancado">' +
    '<span class="modulo-card-resumo__numero">' + formatar(resumo.valorPago || 0) + "</span>" +
    '<span class="modulo-card-resumo__nome">Total pago</span></article>' +
    '<article class="modulo-card-resumo modulo-card-resumo--basico">' +
    '<span class="modulo-card-resumo__numero cadastro-mensalidades__debito">' +
    formatar(emAberto) +
    "</span>" +
    '<span class="modulo-card-resumo__nome">Saldo em aberto (déficit do aluno)</span></article>' +
    "</div>" +
    '<div class="cadastro-mensalidades-planilha">' +
    '<table class="data-table data-table--compact cadastro-mensalidades-table">' +
    "<thead><tr>" +
    "<th>Mês ref.</th><th>Referência</th><th>Vencimento</th><th>Valor</th>" +
    "<th>Situação</th><th>Data pagamento</th><th>Forma</th>" +
    "</tr></thead><tbody>" +
    linhas +
    "</tbody></table></div>";

  var btnAtualizar = document.getElementById("secBtnAtualizarPlanilha");
  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", function () {
      renderizarPlanilhaMensalidadesCadastroAluno(obterMatriculaAtivaNoCadastroPresencial());
    });
  }
}

function atualizarVisibilidadeMesReferenciaPresencial() {
  var tipo = document.getElementById("secTipoCobranca");
  var grupo = document.getElementById("secGrupoMesReferencia");
  if (!tipo || !grupo) return;
  grupo.hidden = tipo.value !== "mensalidade";
}

function configurarPlanilhaMensalidadesCadastro() {
  var mesEl = document.getElementById("secMesReferenciaPagamento");
  if (mesEl && !mesEl.value) {
    var agora = new Date();
    mesEl.value =
      agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, "0");
  }

  var tipo = document.getElementById("secTipoCobranca");
  if (tipo && !tipo.dataset.planilhaBound) {
    tipo.dataset.planilhaBound = "1";
    tipo.addEventListener("change", atualizarVisibilidadeMesReferenciaPresencial);
  }
  atualizarVisibilidadeMesReferenciaPresencial();

  ["secEmail", "secNome"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.planilhaBound) return;
    el.dataset.planilhaBound = "1";
    var timer = null;
    el.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        renderizarPlanilhaMensalidadesCadastroAluno();
      }, 400);
    });
  });

  renderizarPlanilhaMensalidadesCadastroAluno();
}

function dadosMatriculaDemonstracaoSetad() {
  return {
    id: SETAD_ID_MATRICULA_DEMONSTRACAO,
    nomeCompleto: "Ana Demonstração Silva",
    email: SETAD_EMAIL_ALUNO_DEMONSTRACAO,
    telefone: "(91) 99100-0020",
    cpf: "529.982.247-25",
    dataNascimento: "1995-06-15",
    cidade: "Belém",
    estado: "PA",
    modulo: "basico",
    igreja: "Assembleia de Deus — cadastro fictício",
    dataMatricula: "2026-01-15T12:00:00.000Z",
    status: "ativo",
    origem: "demonstracao",
    observacoes:
      "Aluno fictício para treinar mensalidades, planilha e painéis do contador/diretor.",
    cadastradoPor: "sistema@setad.org.br"
  };
}

function garantirPagamentosDemonstracaoSetad(matricula) {
  if (typeof inicializarDadosFinanceiros === "function") {
    inicializarDadosFinanceiros();
  }
  if (typeof obterPagamentosAlunos !== "function" || typeof salvarPagamentosAlunos !== "function") {
    return;
  }

  var pagamentos = obterPagamentosAlunos();
  var doAluno = pagamentos.filter(function (p) {
    return (p.alunoEmail || "").toLowerCase() === matricula.email.toLowerCase();
  });

  var taxa =
    typeof obterTaxaMatriculaModulo === "function"
      ? obterTaxaMatriculaModulo(matricula.modulo)
      : 50;
  var mensalidade =
    typeof obterMensalidadeModulo === "function"
      ? obterMensalidadeModulo(matricula.modulo)
      : 80;
  var moduloNome =
    MODULOS_CURSO[matricula.modulo] && MODULOS_CURSO[matricula.modulo].nome
      ? MODULOS_CURSO[matricula.modulo].nome
      : matricula.modulo;

  if (
    !doAluno.some(function (p) {
      return !p.tipo || p.tipo === "matricula";
    })
  ) {
    pagamentos.push({
      id: "pag-demo-matricula",
      matriculaId: matricula.id,
      alunoNome: matricula.nomeCompleto,
      alunoEmail: matricula.email,
      modulo: matricula.modulo,
      tipo: "matricula",
      valor: taxa,
      referencia: "Taxa de matrícula — " + moduloNome,
      vencimento: "2026-01-15T12:00:00.000Z",
      status: "pago",
      formaPagamento: "PIX",
      instituicaoId: "banco-003",
      dataPagamento: "2026-01-16T10:30:00.000Z",
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial",
      pagoPor: "secretaria"
    });
  }

  var mesesDemo = [
    { ref: "Mensalidade 01/2026", status: "pago", data: "2026-02-05T11:00:00.000Z" },
    { ref: "Mensalidade 02/2026", status: "pago", data: "2026-03-08T09:15:00.000Z" },
    { ref: "Mensalidade 03/2026", status: "pago", data: "2026-04-02T16:40:00.000Z" },
    { ref: "Mensalidade 04/2026", status: "pendente", data: null },
    { ref: "Mensalidade 05/2026", status: "pendente", data: null },
    { ref: "Mensalidade 06/2026", status: "agendado", data: null }
  ];

  mesesDemo.forEach(function (item, idx) {
    if (
      doAluno.some(function (p) {
        return p.referencia === item.ref;
      })
    ) {
      return;
    }
    var partes = item.ref.match(/(\d{2})\/(\d{4})/);
    var venc =
      partes && partes.length >= 3
        ? new Date(Number(partes[2]), Number(partes[1]) - 1, 10).toISOString()
        : new Date().toISOString();
    pagamentos.push({
      id: "pag-demo-mens-" + idx,
      matriculaId: matricula.id,
      alunoNome: matricula.nomeCompleto,
      alunoEmail: matricula.email,
      modulo: matricula.modulo,
      tipo: "mensalidade",
      parcela: idx + 1,
      valor: mensalidade,
      referencia: item.ref,
      vencimento: venc,
      status: item.status,
      formaPagamento: item.status === "pago" ? "PIX" : null,
      instituicaoId: item.status === "pago" ? "banco-003" : null,
      dataPagamento: item.data,
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    });
  });

  salvarPagamentosAlunos(pagamentos);
}

function garantirMatriculaDemonstracaoSetad() {
  var existente =
    typeof obterMatriculaPorEmail === "function"
      ? obterMatriculaPorEmail(SETAD_EMAIL_ALUNO_DEMONSTRACAO)
      : null;
  if (!existente) {
    existente = obterMatriculas().find(function (m) {
      return m.id === SETAD_ID_MATRICULA_DEMONSTRACAO;
    });
  }

  if (existente) {
    garantirPagamentosDemonstracaoSetad(existente);
    return existente;
  }

  var dados = dadosMatriculaDemonstracaoSetad();
  var matriculas = obterMatriculas();
  matriculas.push(dados);
  salvarMatriculas(matriculas);
  garantirPagamentosDemonstracaoSetad(dados);
  return dados;
}

function abrirCadastroComAlunoDemonstracao() {
  var matricula = garantirMatriculaDemonstracaoSetad();
  var tab = document.querySelector('[data-tab="tab-cadastro"]');
  if (tab) tab.click();

  document.getElementById("secTipoAlunoNovo").checked = true;
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }
  if (typeof preencherFormularioComMatricula === "function") {
    preencherFormularioComMatricula(matricula);
  }
  renderizarPlanilhaMensalidadesCadastroAluno(matricula);

  var obs = document.getElementById("secObservacoes");
  if (obs && !obs.value.trim()) {
    obs.value = matricula.observacoes || "";
  }
}

function configurarDemonstracaoCadastroAluno() {
  var btn = document.getElementById("btnCarregarAlunoDemonstracao");
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "1";
    btn.addEventListener("click", abrirCadastroComAlunoDemonstracao);
  }
}

function abrirCadastroPresencialComMatricula(matriculaId) {
  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var tab = document.querySelector('[data-tab="tab-cadastro"]');
  if (tab) tab.click();
  document.getElementById("secTipoAlunoNovo").checked = true;
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }
  if (typeof preencherFormularioComMatricula === "function") {
    preencherFormularioComMatricula(matricula);
  }
  renderizarPlanilhaMensalidadesCadastroAluno(matricula);
}
