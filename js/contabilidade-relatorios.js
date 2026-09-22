/* ============================================================
   contabilidade-relatorios.js — Relatórios, DRE e documentos Office
   Área do contador: upload, liberação de acesso e DRE automático.
   ============================================================ */

const CONTAB_KEYS = {
  relatorios: "setad_relatorios_contabeis",
  lancamentos: "setad_lancamentos_contabeis",
  contabInicializado: "setad_contab_inicializado"
};

const TAMANHO_MAX_ARQUIVO_CONTAB = 5 * 1024 * 1024;

const FORMATOS_OFFICE_CONTAB = [
  { ext: ".pdf", mime: "application/pdf", label: "PDF" },
  { ext: ".doc", mime: "application/msword", label: "DOC" },
  { ext: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
  { ext: ".xls", mime: "application/vnd.ms-excel", label: "XLS" },
  { ext: ".xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "XLSX" },
  { ext: ".ppt", mime: "application/vnd.ms-powerpoint", label: "PPT" },
  { ext: ".pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "PPTX" },
  { ext: ".odt", mime: "application/vnd.oasis.opendocument.text", label: "ODT" },
  { ext: ".ods", mime: "application/vnd.oasis.opendocument.spreadsheet", label: "ODS" },
  { ext: ".odp", mime: "application/vnd.oasis.opendocument.presentation", label: "ODP" },
  { ext: ".csv", mime: "text/csv", label: "CSV" }
];

const PUBLICOS_LIBERACAO_CONTAB = [
  { id: "diretoria", label: "Diretoria SETAD", perfis: ["diretor"] }
];

function usuarioPodeAcessarContabilidade(sessao) {
  return sessao && (sessao.perfil === "diretor" || sessao.perfil === "contador");
}

function contabApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function obterRelatoriosContabeis() {
  if (contabApiAtivo() && window.SETAD.cache.relatoriosContabeis) {
    return window.SETAD.cache.relatoriosContabeis.slice();
  }
  const dados = localStorage.getItem(CONTAB_KEYS.relatorios);
  return dados ? JSON.parse(dados) : [];
}

function salvarRelatoriosContabeis(lista) {
  if (contabApiAtivo()) {
    window.SETAD.setCache("relatoriosContabeis", lista, "contabilidade/relatorios");
    return;
  }
  localStorage.setItem(CONTAB_KEYS.relatorios, JSON.stringify(lista));
}

function obterLancamentosContabeis() {
  if (contabApiAtivo() && window.SETAD.cache.lancamentosContabeis) {
    return window.SETAD.cache.lancamentosContabeis.slice();
  }
  const dados = localStorage.getItem(CONTAB_KEYS.lancamentos);
  return dados ? JSON.parse(dados) : [];
}

function salvarLancamentosContabeis(lista) {
  if (contabApiAtivo()) {
    window.SETAD.setCache("lancamentosContabeis", lista, "contabilidade/lancamentos");
    return;
  }
  localStorage.setItem(CONTAB_KEYS.lancamentos, JSON.stringify(lista));
}

function inicializarDadosContabilidade() {
  if (contabApiAtivo() || localStorage.getItem(CONTAB_KEYS.contabInicializado)) {
    return;
  }
  localStorage.setItem(CONTAB_KEYS.relatorios, JSON.stringify([]));
  localStorage.setItem(CONTAB_KEYS.lancamentos, JSON.stringify([]));
  localStorage.setItem(CONTAB_KEYS.contabInicializado, "true");
}

function obterLabelPublicoContab(id) {
  const pub = PUBLICOS_LIBERACAO_CONTAB.find(function (p) { return p.id === id; });
  return pub ? pub.label : id;
}

function perfilPodeVerPublicoContab(perfil, publicoId) {
  const pub = PUBLICOS_LIBERACAO_CONTAB.find(function (p) { return p.id === publicoId; });
  if (!pub) return false;
  return pub.perfis.indexOf(perfil) !== -1;
}

function usuarioPodeVerRelatorioContab(relatorio, sessao) {
  if (!relatorio || !sessao) return false;
  return usuarioPodeAcessarContabilidade(sessao);
}

function obterRelatoriosParaUsuario(sessao) {
  if (!usuarioPodeAcessarContabilidade(sessao)) return [];
  return obterRelatoriosContabeis();
}

function validarArquivoOfficeContab(arquivo) {
  if (!arquivo) return { ok: false, erro: "Selecione um arquivo." };
  if (arquivo.size > TAMANHO_MAX_ARQUIVO_CONTAB) {
    return { ok: false, erro: "Arquivo muito grande. Limite: 5 MB." };
  }
  const nome = (arquivo.name || "").toLowerCase();
  const formato = FORMATOS_OFFICE_CONTAB.find(function (f) {
    return nome.endsWith(f.ext);
  });
  if (!formato) {
    return {
      ok: false,
      erro: "Formato não permitido. Use PDF, Word, Excel, PowerPoint ou OpenDocument."
    };
  }
  return { ok: true, formato: formato };
}

function lerArquivoContabComoDataUrl(arquivo) {
  return new Promise(function (resolver, rejeitar) {
    const leitor = new FileReader();
    leitor.onload = function () { resolver(leitor.result); };
    leitor.onerror = function () { rejeitar(new Error("Não foi possível ler o arquivo.")); };
    leitor.readAsDataURL(arquivo);
  });
}

function cadastrarRelatorioContabil(dados, sessao) {
  const lista = obterRelatoriosContabeis();
  const relatorio = {
    id: gerarId("rel"),
    titulo: dados.titulo.trim(),
    tipo: dados.tipo || "relatorio",
    periodicidade: dados.periodicidade || "mensal",
    referencia: dados.referencia,
    descricao: dados.descricao || "",
    arquivo: dados.arquivo,
    liberadoPara: dados.liberadoPara || [],
    enviadoPor: {
      email: sessao.email,
      nome: sessao.nome,
      perfil: sessao.perfil
    },
    criadoEm: new Date().toISOString()
  };
  lista.unshift(relatorio);
  salvarRelatoriosContabeis(lista);
  return { ok: true, relatorio: relatorio };
}

function excluirRelatorioContabil(id) {
  const lista = obterRelatoriosContabeis().filter(function (r) { return r.id !== id; });
  salvarRelatoriosContabeis(lista);
}

function adicionarLancamentoContabil(dados, sessao) {
  const lista = obterLancamentosContabeis();
  const lancamento = {
    id: gerarId("lanc"),
    codigo: dados.codigo.trim(),
    tipo: dados.tipo,
    titulo: dados.titulo.trim(),
    valor: Number(dados.valor) || 0,
    referente: (dados.referente || "").trim(),
    periodicidade: dados.periodicidade || "mensal",
    referencia: dados.referencia,
    origem: dados.origem || "manual",
    vinculoId: dados.vinculoId || null,
    criadoPor: { email: sessao.email, nome: sessao.nome },
    criadoEm: new Date().toISOString()
  };
  lista.push(lancamento);
  salvarLancamentosContabeis(lista);
  return { ok: true, lancamento: lancamento };
}

function removerLancamentosAutomaticosPeriodo(referencia, periodicidade) {
  const lista = obterLancamentosContabeis().filter(function (l) {
    return !(l.origem === "automatico" && l.referencia === referencia && l.periodicidade === periodicidade);
  });
  salvarLancamentosContabeis(lista);
}

function dataNoPeriodo(isoData, referencia, periodicidade) {
  if (!isoData) return false;
  const data = new Date(isoData);
  if (isNaN(data.getTime())) return false;
  if (periodicidade === "anual") {
    return String(data.getFullYear()) === referencia;
  }
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return data.getFullYear() + "-" + mes === referencia;
}

function gerarLancamentosAutomaticosContabeis(referencia, periodicidade, sessao) {
  inicializarDadosFinanceiros();
  removerLancamentosAutomaticosPeriodo(referencia, periodicidade);

  const pagamentos = obterPagamentosAlunos().filter(function (p) {
    if (p.status !== "pago") return false;
    return dataNoPeriodo(p.dataPagamento || p.vencimento || p.criadoEm, referencia, periodicidade);
  });

  const folha = obterFolhaPagamento().filter(function (f) {
    if (f.status !== "pago") return false;
    if (periodicidade === "mensal") {
      return f.referencia === referencia;
    }
    return f.referencia && f.referencia.startsWith(referencia);
  });

  const novos = [];

  let totalReceita = 0;
  pagamentos.forEach(function (p) {
    totalReceita += p.valor || 0;
  });

  novos.push({
    id: gerarId("lanc"),
    codigo: "1",
    tipo: "receita",
    titulo: "Receitas",
    valor: totalReceita,
    referente: "",
    periodicidade: periodicidade,
    referencia: referencia,
    origem: "automatico",
    criadoPor: { email: sessao.email, nome: sessao.nome },
    criadoEm: new Date().toISOString()
  });

  novos.push({
    id: gerarId("lanc"),
    codigo: "1.1",
    tipo: "receita",
    titulo: "Receitas operacionais",
    valor: totalReceita,
    referente: "Referente",
    periodicidade: periodicidade,
    referencia: referencia,
    origem: "automatico",
    criadoPor: { email: sessao.email, nome: sessao.nome },
    criadoEm: new Date().toISOString()
  });

  let indiceReceita = 1;
  pagamentos.forEach(function (p) {
    const subtipo = p.tipo === "matricula" ? "Taxa de matrícula" : "Mensalidade";
    novos.push({
      id: gerarId("lanc"),
      codigo: "1.1." + indiceReceita,
      tipo: "receita",
      titulo: subtipo + " — " + (p.alunoNome || p.alunoEmail || "Aluno"),
      valor: p.valor || 0,
      referente: p.referencia || subtipo,
      periodicidade: periodicidade,
      referencia: referencia,
      origem: "automatico",
      vinculoId: p.id,
      criadoPor: { email: sessao.email, nome: sessao.nome },
      criadoEm: new Date().toISOString()
    });
    indiceReceita++;
  });

  let totalDespesa = 0;
  folha.forEach(function (f) {
    totalDespesa += f.valor || 0;
  });

  novos.push({
    id: gerarId("lanc"),
    codigo: "2",
    tipo: "despesa",
    titulo: "Despesas",
    valor: totalDespesa,
    referente: "",
    periodicidade: periodicidade,
    referencia: referencia,
    origem: "automatico",
    criadoPor: { email: sessao.email, nome: sessao.nome },
    criadoEm: new Date().toISOString()
  });

  novos.push({
    id: gerarId("lanc"),
    codigo: "2.1",
    tipo: "despesa",
    titulo: "Despesas operacionais",
    valor: totalDespesa,
    referente: "Referente",
    periodicidade: periodicidade,
    referencia: referencia,
    origem: "automatico",
    criadoPor: { email: sessao.email, nome: sessao.nome },
    criadoEm: new Date().toISOString()
  });

  let indiceDespesa = 1;
  folha.forEach(function (f) {
    novos.push({
      id: gerarId("lanc"),
      codigo: "2.1." + indiceDespesa,
      tipo: "despesa",
      titulo: "Folha — " + (f.funcionarioNome || "Colaborador"),
      valor: f.valor || 0,
      referente: "Folha " + (f.referencia || ""),
      periodicidade: periodicidade,
      referencia: referencia,
      origem: "automatico",
      vinculoId: f.id,
      criadoPor: { email: sessao.email, nome: sessao.nome },
      criadoEm: new Date().toISOString()
    });
    indiceDespesa++;
  });

  const lista = obterLancamentosContabeis().concat(novos);
  salvarLancamentosContabeis(lista);
  return { ok: true, total: novos.length };
}

function obterLancamentosDoPeriodo(referencia, periodicidade) {
  return obterLancamentosContabeis()
    .filter(function (l) {
      return l.referencia === referencia && l.periodicidade === periodicidade;
    })
    .sort(function (a, b) {
      return compararCodigoContabil(a.codigo, b.codigo);
    });
}

function compararCodigoContabil(codA, codB) {
  const partesA = codA.split(".").map(Number);
  const partesB = codB.split(".").map(Number);
  const len = Math.max(partesA.length, partesB.length);
  for (let i = 0; i < len; i++) {
    const va = partesA[i] || 0;
    const vb = partesB[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function calcularDREContabil(referencia, periodicidade) {
  const lancamentos = obterLancamentosDoPeriodo(referencia, periodicidade);
  let totalReceitas = 0;
  let totalDespesas = 0;

  lancamentos.forEach(function (l) {
    if (l.tipo === "receita" && l.codigo.indexOf(".") === -1) {
      totalReceitas += l.valor;
    }
    if (l.tipo === "despesa" && l.codigo.indexOf(".") === -1) {
      totalDespesas += l.valor;
    }
  });

  if (!lancamentos.some(function (l) { return l.codigo === "1" || l.codigo === "2"; })) {
    lancamentos.forEach(function (l) {
      const profundidade = l.codigo.split(".").length;
      if (profundidade >= 3) {
        if (l.tipo === "receita") totalReceitas += l.valor;
        if (l.tipo === "despesa") totalDespesas += l.valor;
      }
    });
  }

  return {
    referencia: referencia,
    periodicidade: periodicidade,
    lancamentos: lancamentos,
    totalReceitas: totalReceitas,
    totalDespesas: totalDespesas,
    resultado: totalReceitas - totalDespesas
  };
}

function formatarReferenciaContab(referencia, periodicidade) {
  if (periodicidade === "anual") return "Ano " + referencia;
  const partes = referencia.split("-");
  if (partes.length !== 2) return referencia;
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mes = parseInt(partes[1], 10) - 1;
  return meses[mes] + "/" + partes[0];
}

function renderizarArvoreLancamentosContabeis(lancamentos) {
  if (!lancamentos.length) {
    return '<p class="painel-vazio">Nenhum lançamento neste período. Gere o DRE automático ou adicione manualmente.</p>';
  }

  return (
    '<ul class="contab-arvore">' +
      lancamentos.map(function (l) {
        const nivel = l.codigo.split(".").length;
        const classeTipo = l.tipo === "receita" ? "contab-arvore__item--receita" : "contab-arvore__item--despesa";
        const referente = l.referente
          ? ' <span class="contab-arvore__ref">/ ' + escaparHtml(l.referente) + "</span>"
          : "";
        const origem = l.origem === "automatico"
          ? ' <span class="contab-arvore__auto">automático</span>'
          : "";

        return (
          '<li class="contab-arvore__item ' + classeTipo + " contab-arvore__item--n" + nivel + '">' +
            '<span class="contab-arvore__codigo">' + escaparHtml(l.codigo) + "</span>" +
            '<span class="contab-arvore__titulo">' + escaparHtml(l.titulo) + referente + origem + "</span>" +
            '<span class="contab-arvore__valor">' + formatarMoeda(l.valor) + "</span>" +
          "</li>"
        );
      }).join("") +
    "</ul>"
  );
}

function renderizarResumoDREContabil(dre) {
  const saldo = classificarSaldoInstitucional(dre.resultado);
  return (
    '<div class="contab-dre-resumo">' +
      '<article class="financeiro-card"><p class="financeiro-card__label">Total receitas</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(dre.totalReceitas) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Total despesas</p>' +
        '<p class="financeiro-card__valor financeiro-card__valor--alerta">' + formatarMoeda(dre.totalDespesas) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">' + escaparHtml(saldo.label) + " (DRE)</p>" +
        '<p class="financeiro-card__valor ' + saldo.classe + '">' + formatarMoeda(saldo.valorExibicao) + "</p></article>" +
    "</div>"
  );
}

function renderizarAreaContabilidade(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container) return;

  inicializarDadosContabilidade();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const anoAtual = String(new Date().getFullYear());

  container.innerHTML =
    '<div class="contab-area">' +
      '<nav class="contab-subnav" role="tablist">' +
        '<button type="button" class="contab-subnav__btn contab-subnav__btn--ativa" data-contab-panel="upload">Documentos Office</button>' +
        '<button type="button" class="contab-subnav__btn" data-contab-panel="dre">DRE automático</button>' +
        '<button type="button" class="contab-subnav__btn" data-contab-panel="lancamentos">Lançamentos</button>' +
      "</nav>" +

      '<div id="contab-panel-upload" class="contab-panel contab-panel--ativa">' +
        renderizarFormularioUploadContab(sessao) +
        renderizarListaRelatoriosContabeis(sessao, true) +
      "</div>" +

      '<div id="contab-panel-dre" class="contab-panel">' +
        '<div class="contab-bloco">' +
          "<h3>Gerar DRE (Demonstrativo de Resultado)</h3>" +
          '<p class="contab-dica">Gera automaticamente receitas (pagamentos de alunos) e despesas (folha) no formato hierárquico.</p>' +
          '<form id="formGerarDRE" class="financeiro-form-grid">' +
            '<div class="form-group"><label>Periodicidade</label>' +
              '<select id="drePeriodicidade" required>' +
                '<option value="mensal">Mensal</option>' +
                '<option value="anual">Anual</option>' +
              "</select></div>" +
            '<div class="form-group" id="dreCampoMes"><label>Referência (mês)</label>' +
              '<input type="month" id="dreReferenciaMes" value="' + mesAtual + '"></div>' +
            '<div class="form-group" id="dreCampoAno" hidden><label>Referência (ano)</label>' +
              '<input type="number" id="dreReferenciaAno" min="2020" max="2099" value="' + anoAtual + '"></div>' +
            '<div class="form-group contab-form-acao">' +
              '<button type="submit" class="btn btn--primary">Gerar DRE automático</button>' +
            "</div>" +
          "</form>" +
          '<div id="dreResultadoContainer"></div>' +
        "</div>" +
      "</div>" +

      '<div id="contab-panel-lancamentos" class="contab-panel">' +
        '<div class="contab-bloco">' +
          "<h3>Lançamento manual</h3>" +
          '<form id="formLancamentoManual" class="financeiro-form-grid">' +
            '<div class="form-group"><label>Código</label><input type="text" id="lancCodigo" placeholder="Ex.: 1.2.1" required></div>' +
            '<div class="form-group"><label>Tipo</label>' +
              '<select id="lancTipo" required>' +
                '<option value="receita">Receita</option>' +
                '<option value="despesa">Despesa</option>' +
              "</select></div>" +
            '<div class="form-group"><label>Título</label><input type="text" id="lancTitulo" placeholder="Ex.: Apostila" required></div>' +
            '<div class="form-group"><label>Referente (opcional)</label><input type="text" id="lancReferente" placeholder="Ex.: Material didático"></div>' +
            '<div class="form-group"><label>Valor (R$)</label><input type="number" id="lancValor" min="0" step="0.01" required></div>' +
            '<div class="form-group"><label>Periodicidade</label>' +
              '<select id="lancPeriodicidade">' +
                '<option value="mensal">Mensal</option>' +
                '<option value="anual">Anual</option>' +
              "</select></div>" +
            '<div class="form-group" id="lancCampoMes"><label>Período</label>' +
              '<input type="month" id="lancReferenciaMes" value="' + mesAtual + '"></div>' +
            '<div class="form-group contab-form-acao">' +
              '<button type="submit" class="btn btn--primary">Adicionar lançamento</button>' +
            "</div>" +
          "</form>" +
        "</div>" +
        '<div id="lancamentosListaContainer"></div>' +
      "</div>" +
    "</div>";

  configurarSubnavContabilidade(container, sessao);
  configurarFormularioUploadContab(sessao);
  configurarFormularioDRE(sessao);
  configurarFormularioLancamentoManual(sessao);
  atualizarVisualizacaoDRE(sessao, mesAtual, "mensal");
  atualizarListaLancamentosManual(sessao, mesAtual, "mensal");
}

function renderizarFormularioUploadContab(sessao) {
  const checkboxes = PUBLICOS_LIBERACAO_CONTAB.map(function (p) {
    return (
      '<label class="contab-check">' +
        '<input type="checkbox" name="liberadoPara" value="' + escaparHtml(p.id) + '" checked> ' +
        escaparHtml(p.label) +
      "</label>"
    );
  }).join("");

  return (
    '<div class="contab-bloco">' +
      "<h3>Enviar relatório / documento Office</h3>" +
      '<p class="contab-dica">PDF, Word, Excel, PowerPoint e formatos OpenDocument (máx. 5 MB).</p>' +
      '<form id="formUploadContab" class="contab-form-upload">' +
        '<div class="financeiro-form-grid">' +
          '<div class="form-group"><label>Título</label>' +
            '<input type="text" id="contabTitulo" placeholder="Ex.: DRE março/2026" required></div>' +
          '<div class="form-group"><label>Tipo</label>' +
            '<select id="contabTipo">' +
              '<option value="dre">DRE</option>' +
              '<option value="relatorio">Relatório</option>' +
              '<option value="balancete">Balancete</option>' +
              '<option value="outro">Outro</option>' +
            "</select></div>" +
          '<div class="form-group"><label>Periodicidade</label>' +
            '<select id="contabPeriodicidade">' +
              '<option value="mensal">Mensal</option>' +
              '<option value="anual">Anual</option>' +
            "</select></div>" +
          '<div class="form-group" id="contabCampoMes"><label>Referência</label>' +
            '<input type="month" id="contabReferenciaMes" required></div>' +
          '<div class="form-group" id="contabCampoAno" hidden><label>Referência (ano)</label>' +
            '<input type="number" id="contabReferenciaAno" min="2020" max="2099"></div>' +
          '<div class="form-group form-group--full"><label>Descrição (opcional)</label>' +
            '<textarea id="contabDescricao" rows="2" placeholder="Observações sobre o documento"></textarea></div>' +
          '<div class="form-group form-group--full"><label>Arquivo</label>' +
            '<input type="file" id="contabArquivo" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.csv" required></div>' +
          '<div class="form-group form-group--full">' +
            "<label>Liberar acesso para a diretoria</label>" +
            '<div class="contab-checks">' + checkboxes + "</div>" +
            '<p class="contab-dica">Somente diretor e contador visualizam estes documentos.</p>' +
          "</div>" +
        "</div>" +
        '<p id="contabUploadErro" class="form-mensagem form-mensagem--erro" role="alert"></p>' +
        '<p id="contabUploadOk" class="form-mensagem form-mensagem--sucesso" role="status"></p>' +
        '<button type="submit" class="btn btn--primary">Enviar e liberar documento</button>' +
      "</form>" +
    "</div>"
  );
}

function renderizarListaRelatoriosContabeis(sessao, modoContador) {
  const lista = modoContador
    ? obterRelatoriosContabeis()
    : obterRelatoriosParaUsuario(sessao);

  if (!lista.length) {
    return '<div class="contab-bloco"><h3>Documentos enviados</h3><p class="painel-vazio">Nenhum documento cadastrado.</p></div>';
  }

  return (
    '<div class="contab-bloco">' +
      "<h3>Documentos " + (modoContador ? "enviados" : "liberados para você") + "</h3>" +
      renderizarTabelaDocumentosContabeis(sessao, modoContador) +
    "</div>"
  );
}

function configurarSubnavContabilidade(container, sessao) {
  const botoes = container.querySelectorAll(".contab-subnav__btn");
  botoes.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const panelId = btn.getAttribute("data-contab-panel");
      botoes.forEach(function (b) { b.classList.remove("contab-subnav__btn--ativa"); });
      btn.classList.add("contab-subnav__btn--ativa");
      container.querySelectorAll(".contab-panel").forEach(function (p) {
        p.classList.remove("contab-panel--ativa");
      });
      const panel = document.getElementById("contab-panel-" + panelId);
      if (panel) panel.classList.add("contab-panel--ativa");
    });
  });

  container.querySelectorAll(".contab-btn-excluir").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!confirm("Excluir este documento?")) return;
      excluirRelatorioContabil(btn.getAttribute("data-id"));
      renderizarAreaContabilidade(container.id, sessao);
    });
  });
}

function obterReferenciaFormContab(periodicidade, campoMes, campoAno) {
  if (periodicidade === "anual") {
    return String(campoAno.value || new Date().getFullYear());
  }
  return campoMes.value || new Date().toISOString().slice(0, 7);
}

function alternarCamposPeriodoContab(periodicidade, campoMesEl, campoAnoEl) {
  if (!campoMesEl || !campoAnoEl) return;
  const mostrarAno = periodicidade === "anual";
  campoMesEl.hidden = mostrarAno;
  campoAnoEl.hidden = !mostrarAno;
}

function configurarFormularioUploadContab(sessao) {
  const form = document.getElementById("formUploadContab");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const periodicidadeEl = document.getElementById("contabPeriodicidade");
  const campoMes = document.getElementById("contabCampoMes");
  const campoAno = document.getElementById("contabCampoAno");
  const mesInput = document.getElementById("contabReferenciaMes");
  const anoInput = document.getElementById("contabReferenciaAno");

  if (mesInput) mesInput.value = new Date().toISOString().slice(0, 7);
  if (anoInput) anoInput.value = new Date().getFullYear();

  periodicidadeEl.addEventListener("change", function () {
    alternarCamposPeriodoContab(periodicidadeEl.value, campoMes, campoAno);
  });

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const erroEl = document.getElementById("contabUploadErro");
    const okEl = document.getElementById("contabUploadOk");
    erroEl.textContent = "";
    okEl.textContent = "";

    const arquivo = document.getElementById("contabArquivo").files[0];
    const validacao = validarArquivoOfficeContab(arquivo);
    if (!validacao.ok) {
      erroEl.textContent = validacao.erro;
      erroEl.classList.add("visible");
      return;
    }

    const liberadoPara = [];
    form.querySelectorAll('input[name="liberadoPara"]:checked').forEach(function (cb) {
      liberadoPara.push(cb.value);
    });

    if (!liberadoPara.length) {
      erroEl.textContent = "Selecione pelo menos um público para liberar o documento.";
      erroEl.classList.add("visible");
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    lerArquivoContabComoDataUrl(arquivo).then(function (dataUrl) {
      const referencia = obterReferenciaFormContab(
        periodicidadeEl.value,
        mesInput,
        anoInput
      );

      cadastrarRelatorioContabil({
        titulo: document.getElementById("contabTitulo").value,
        tipo: document.getElementById("contabTipo").value,
        periodicidade: periodicidadeEl.value,
        referencia: referencia,
        descricao: document.getElementById("contabDescricao").value,
        liberadoPara: liberadoPara,
        arquivo: {
          nome: arquivo.name,
          tipo: arquivo.type || validacao.formato.mime,
          label: validacao.formato.label,
          tamanho: arquivo.size,
          dataUrl: dataUrl,
          enviadoEm: new Date().toISOString()
        }
      }, sessao);

      okEl.textContent = "Documento enviado e liberado com sucesso.";
      okEl.classList.add("visible");
      form.reset();
      if (mesInput) mesInput.value = new Date().toISOString().slice(0, 7);
      renderizarAreaContabilidade("relatoriosContainer", sessao);
    }).catch(function () {
      erroEl.textContent = "Erro ao ler o arquivo.";
      erroEl.classList.add("visible");
    }).finally(function () {
      btn.disabled = false;
    });
  });
}

function configurarFormularioDRE(sessao) {
  const form = document.getElementById("formGerarDRE");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const periodicidadeEl = document.getElementById("drePeriodicidade");
  const campoMes = document.getElementById("dreCampoMes");
  const campoAno = document.getElementById("dreCampoAno");

  periodicidadeEl.addEventListener("change", function () {
    alternarCamposPeriodoContab(periodicidadeEl.value, campoMes, campoAno);
  });

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const referencia = obterReferenciaFormContab(
      periodicidadeEl.value,
      document.getElementById("dreReferenciaMes"),
      document.getElementById("dreReferenciaAno")
    );
    gerarLancamentosAutomaticosContabeis(referencia, periodicidadeEl.value, sessao);
    atualizarVisualizacaoDRE(sessao, referencia, periodicidadeEl.value);
    atualizarListaLancamentosManual(sessao, referencia, periodicidadeEl.value);
  });
}

function configurarFormularioLancamentoManual(sessao) {
  const form = document.getElementById("formLancamentoManual");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const periodicidadeEl = document.getElementById("lancPeriodicidade");
  const campoMes = document.getElementById("lancCampoMes");
  const campoAno = document.createElement("div");

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const referencia = document.getElementById("lancReferenciaMes").value;
    const periodicidade = periodicidadeEl.value;

    adicionarLancamentoContabil({
      codigo: document.getElementById("lancCodigo").value,
      tipo: document.getElementById("lancTipo").value,
      titulo: document.getElementById("lancTitulo").value,
      referente: document.getElementById("lancReferente").value,
      valor: document.getElementById("lancValor").value,
      periodicidade: periodicidade,
      referencia: periodicidade === "anual" ? referencia.slice(0, 4) : referencia,
      origem: "manual"
    }, sessao);

    form.reset();
    document.getElementById("lancReferenciaMes").value = referencia;
    atualizarListaLancamentosManual(sessao, referencia, periodicidade);
    atualizarVisualizacaoDRE(sessao, referencia, periodicidade);
  });
}

function atualizarVisualizacaoDRE(sessao, referencia, periodicidade) {
  const container = document.getElementById("dreResultadoContainer");
  if (!container) return;

  const dre = calcularDREContabil(referencia, periodicidade);
  const tituloPeriodo = formatarReferenciaContab(referencia, periodicidade);

  container.innerHTML =
    "<h3>DRE — " + escaparHtml(tituloPeriodo) + " (" + (periodicidade === "anual" ? "anual" : "mensal") + ")</h3>" +
    renderizarResumoDREContabil(dre) +
    '<div class="contab-bloco contab-bloco--arvore">' +
      "<h4>Estrutura hierárquica</h4>" +
      '<p class="contab-dica">Ex.: <code>1</code> Receitas → <code>1.1</code> Referente → <code>1.1.1</code> Apostila</p>' +
      renderizarArvoreLancamentosContabeis(dre.lancamentos) +
    "</div>";
}

function atualizarListaLancamentosManual(sessao, referencia, periodicidade) {
  const container = document.getElementById("lancamentosListaContainer");
  if (!container) return;
  const lancamentos = obterLancamentosDoPeriodo(referencia, periodicidade);
  container.innerHTML =
    '<div class="contab-bloco">' +
      "<h3>Lançamentos do período</h3>" +
      renderizarArvoreLancamentosContabeis(lancamentos) +
    "</div>";
}

function renderizarTabelaDocumentosContabeis(sessao, modoContador) {
  const lista = modoContador
    ? obterRelatoriosContabeis()
    : obterRelatoriosParaUsuario(sessao);

  if (!lista.length) {
    return '<p class="painel-vazio">Nenhum documento cadastrado.</p>';
  }

  return (
    '<table class="data-table contab-tabela-docs">' +
      "<thead><tr><th>Título</th><th>Tipo</th><th>Período</th><th>Liberado para</th><th>Arquivo</th>" +
        (modoContador ? "<th>Ação</th>" : "") +
      "</tr></thead><tbody>" +
      lista.map(function (r) {
        const publicos = (r.liberadoPara || []).map(obterLabelPublicoContab).join(", ") || "—";
        const periodo = formatarReferenciaContab(r.referencia, r.periodicidade);
        const link = r.arquivo && r.arquivo.dataUrl
          ? '<a href="' + escaparHtml(r.arquivo.dataUrl) + '" download="' + escaparHtml(r.arquivo.nome) + '" class="btn btn--small btn--secondary">Baixar</a>'
          : "—";
        const excluir = modoContador
          ? '<button type="button" class="btn btn--small btn--danger contab-btn-excluir" data-id="' + escaparHtml(r.id) + '">Excluir</button>'
          : "";

        return (
          "<tr>" +
            "<td><strong>" + escaparHtml(r.titulo) + "</strong>" +
              (r.descricao ? "<br><small>" + escaparHtml(r.descricao) + "</small>" : "") + "</td>" +
            "<td>" + escaparHtml(r.tipo) + "</td>" +
            "<td>" + escaparHtml(periodo) + "</td>" +
            "<td>" + escaparHtml(publicos) + "</td>" +
            "<td>" + link + "</td>" +
            (modoContador ? "<td>" + excluir + "</td>" : "") +
          "</tr>"
        );
      }).join("") +
    "</tbody></table>"
  );
}

function renderizarContabilidadeDiretor(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container || !usuarioPodeAcessarContabilidade(sessao)) return;

  inicializarDadosContabilidade();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const dre = calcularDREContabil(mesAtual, "mensal");
  const tituloPeriodo = formatarReferenciaContab(mesAtual, "mensal");
  const docs = obterRelatoriosParaUsuario(sessao);

  container.innerHTML =
    '<div class="contab-bloco contab-bloco--diretor">' +
      "<h3 class=\"financeiro-subtitulo\">Contabilidade — DRE e documentos</h3>" +
      "<p class=\"contab-dica\">Acesso exclusivo da direção e contabilidade. A secretaria não visualiza estes dados.</p>" +
      "<h4>DRE — " + escaparHtml(tituloPeriodo) + " (mensal)</h4>" +
      renderizarResumoDREContabil(dre) +
      '<div class="contab-bloco contab-bloco--arvore">' +
        renderizarArvoreLancamentosContabeis(dre.lancamentos) +
      "</div>" +
      "<h4 class=\"financeiro-subtitulo\">Documentos da contabilidade</h4>" +
      (docs.length
        ? renderizarTabelaDocumentosContabeis(sessao, false)
        : '<p class="painel-vazio">Nenhum documento enviado pela contabilidade.</p>') +
    "</div>";
}

function renderizarDocumentosContabeisLiberados(containerId, sessao) {
  renderizarContabilidadeDiretor(containerId, sessao);
}

function renderizarRelatoriosContador(containerId) {
  const sessao = typeof obterSessaoDirecao === "function" ? obterSessaoDirecao() : null;
  if (!sessao) return;
  renderizarAreaContabilidade(containerId, sessao);
}
