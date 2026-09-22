/* ============================================================
   financeiro.js — Módulo financeiro (demonstração local)
   Contador: pagamentos, folha, funcionários, instituições.
   Em produção: API segura, HTTPS, 2FA e integração bancária real.
   ============================================================ */

const FINANCEIRO_KEYS = {
  pagamentosAlunos: "setad_pagamentos_alunos",
  funcionarios: "setad_funcionarios",
  folhaPagamento: "setad_folha_pagamento",
  instituicoes: "setad_instituicoes_financeiras",
  financeiroInicializado: "setad_financeiro_inicializado"
};

const VALOR_MENSALIDADE = 180;
const MESES_CURSO_TOTAL = 36;
const INICIO_CURSO = { ano: 2026, mes: 3 };
const CHAVE_PIX_SETAD = "21175313000150";

const CONTA_BANCARIA_SETAD = {
  banco: "290",
  bancoNome: "Banco 290 (PagBank)",
  agencia: "0001",
  conta: "86532518-7",
  tipo: "Conta de pagamento",
  cnpj: "21.175.313/0001-50",
  cnpjNumeros: "21175313000150",
  titular: "SEMINARIO TEOLOGICO DA ASSEMBLEIA DE DEUS EM BELEM",
  pixChave: "21175313000150"
};

const TIPOS_COLABORADOR = {
  professor: "Professor",
  administrativo: "Colaborador administrativo",
  apoio: "Colaborador de apoio"
};

const VINCULOS_COLABORADOR = {
  clt: "CLT",
  pj: "PJ",
  voluntario: "Voluntário",
  bolsista: "Bolsista"
};

const FUNCIONARIOS_INICIAIS = [
  {
    id: "func-001",
    nome: "Prof. SETAD",
    email: "professor@setad.org.br",
    telefone: "(91) 98000-0001",
    tipo: "professor",
    cargo: "Professor de Teologia",
    setor: "Acadêmico",
    vinculo: "clt",
    salario: 3200,
    ajudaCusto: 450,
    valeTransporte: 220,
    outrosBeneficios: "Auxílio material didático",
    dataAdmissao: "2024-02-01",
    ativo: true
  },
  {
    id: "func-002",
    nome: "Biblioteca SETAD",
    email: "biblioteca@setad.org.br",
    telefone: "(91) 98000-0002",
    tipo: "administrativo",
    cargo: "Bibliotecário(a)",
    setor: "Biblioteca",
    vinculo: "clt",
    salario: 2400,
    ajudaCusto: 300,
    valeTransporte: 180,
    outrosBeneficios: "",
    dataAdmissao: "2023-08-15",
    ativo: true
  },
  {
    id: "func-003",
    nome: "Recepção SETAD",
    email: "recepcao@setad.org.br",
    telefone: "(91) 98000-0003",
    tipo: "apoio",
    cargo: "Recepcionista",
    setor: "Administrativo",
    vinculo: "clt",
    salario: 1900,
    ajudaCusto: 250,
    valeTransporte: 150,
    outrosBeneficios: "",
    dataAdmissao: "2025-01-10",
    ativo: true
  }
];

const INSTITUICOES_INICIAIS = [
  {
    id: "banco-001",
    nome: "Banco do Brasil",
    tipo: "Conta corrente institucional",
    agencia: "3421-X",
    conta: "*****-12",
    status: "conectado",
    ultimaSync: "2026-09-10T12:00:00.000Z"
  },
  {
    id: "banco-002",
    nome: "Caixa Econômica Federal",
    tipo: "Convênio boleto / PIX",
    agencia: "0187",
    conta: "*****-45",
    status: "conectado",
    ultimaSync: "2026-09-09T18:30:00.000Z"
  },
  {
    id: "banco-003",
    nome: "PIX Institucional SETAD",
    tipo: "Chave PIX (CNPJ)",
    agencia: "—",
    conta: "setad@setad.org.br",
    status: "ativo",
    ultimaSync: "2026-09-10T08:15:00.000Z"
  }
];

function financeiroApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function inicializarDadosFinanceiros() {
  if (financeiroApiAtivo()) {
    return;
  }

  if (localStorage.getItem(FINANCEIRO_KEYS.financeiroInicializado)) {
    return;
  }

  localStorage.setItem(FINANCEIRO_KEYS.funcionarios, JSON.stringify(FUNCIONARIOS_INICIAIS));
  localStorage.setItem(FINANCEIRO_KEYS.instituicoes, JSON.stringify(INSTITUICOES_INICIAIS));
  localStorage.setItem(FINANCEIRO_KEYS.folhaPagamento, JSON.stringify([
    {
      id: "folha-001",
      funcionarioId: "func-001",
      funcionarioNome: "Prof. SETAD",
      referencia: "2026-09",
      valor: 3200,
      status: "pago",
      dataPagamento: "2026-09-05T10:00:00.000Z",
      instituicaoId: "banco-001"
    },
    {
      id: "folha-002",
      funcionarioId: "func-002",
      funcionarioNome: "Biblioteca SETAD",
      referencia: "2026-09",
      valor: 2400,
      status: "pago",
      dataPagamento: "2026-09-05T10:05:00.000Z",
      instituicaoId: "banco-001"
    },
    {
      id: "folha-003",
      funcionarioId: "func-003",
      funcionarioNome: "Recepção SETAD",
      referencia: "2026-09",
      valor: 1900,
      status: "agendado",
      dataPagamento: null,
      instituicaoId: "banco-002"
    }
  ]));

  localStorage.setItem(FINANCEIRO_KEYS.pagamentosAlunos, JSON.stringify([]));
  localStorage.setItem(FINANCEIRO_KEYS.financeiroInicializado, "true");
  sincronizarPagamentosDeMatriculas();
}

function sincronizarPagamentosDeMatriculas() {
  inicializarDadosFinanceiros();
  const matriculas = obterMatriculas();
  const dadosPagamentos = localStorage.getItem(FINANCEIRO_KEYS.pagamentosAlunos);
  const pagamentos = dadosPagamentos ? JSON.parse(dadosPagamentos) : [];
  let alterou = false;

  matriculas.forEach(function (mat) {
    const existe = pagamentos.some(function (p) {
      return p.matriculaId === mat.id;
    });
    if (!existe) {
      pagamentos.push(criarRegistroPagamentoMatricula(mat));
      alterou = true;
    }
  });

  if (alterou) salvarPagamentosAlunos(pagamentos);
}

function criarRegistroPagamentoMatricula(matricula) {
  const moduloNome = MODULOS_CURSO[matricula.modulo]
    ? MODULOS_CURSO[matricula.modulo].nome
    : matricula.modulo;

  return {
    id: gerarId("pag"),
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: matricula.email,
    modulo: matricula.modulo,
    tipo: "matricula",
    valor: obterTaxaMatriculaModulo(matricula.modulo),
    referencia: "Taxa de matrícula — " + moduloNome,
    vencimento: new Date().toISOString(),
    status: "pendente",
    formaPagamento: null,
    dataPagamento: null,
    criadoEm: matricula.dataMatricula || new Date().toISOString()
  };
}

function criarPagamentoDeMatricula(matricula) {
  inicializarDadosFinanceiros();
  const pagamentos = obterPagamentosAlunos();
  const jaExiste = pagamentos.some(function (p) {
    return p.matriculaId === matricula.id && (!p.tipo || p.tipo === "matricula");
  });
  if (jaExiste) return;

  pagamentos.push(criarRegistroPagamentoMatricula(matricula));
  salvarPagamentosAlunos(pagamentos);
}

function obterPagamentoMatriculaPorMatriculaId(matriculaId) {
  return obterPagamentosAlunos().find(function (p) {
    return p.matriculaId === matriculaId && (!p.tipo || p.tipo === "matricula");
  }) || null;
}

function excluirPagamentosPorMatricula(matriculaId, email) {
  const emailNorm = email ? email.trim().toLowerCase() : "";
  const pagamentos = obterPagamentosAlunos().filter(function (p) {
    if (p.matriculaId === matriculaId) return false;
    if (emailNorm && p.alunoEmail && p.alunoEmail.toLowerCase() === emailNorm) return false;
    return true;
  });
  salvarPagamentosAlunos(pagamentos);
}

function obterPagamentosAlunos() {
  inicializarDadosFinanceiros();
  if (financeiroApiAtivo()) {
    return (window.SETAD.cache.pagamentos || []).slice();
  }
  const dados = localStorage.getItem(FINANCEIRO_KEYS.pagamentosAlunos);
  return dados ? JSON.parse(dados) : [];
}

function salvarPagamentosAlunos(lista) {
  if (financeiroApiAtivo()) {
    window.SETAD.setCache("pagamentos", lista, "pagamentos");
    return;
  }
  localStorage.setItem(FINANCEIRO_KEYS.pagamentosAlunos, JSON.stringify(lista));
}

function registrarPagamentoAluno(pagamentoId, formaPagamento, instituicaoId) {
  const pagamentos = obterPagamentosAlunos();
  const indice = pagamentos.findIndex(function (p) { return p.id === pagamentoId; });
  if (indice === -1) return { ok: false, erro: "Pagamento não encontrado." };

  pagamentos[indice].status = "pago";
  pagamentos[indice].formaPagamento = formaPagamento;
  pagamentos[indice].instituicaoId = instituicaoId;
  pagamentos[indice].dataPagamento = new Date().toISOString();
  pagamentos[indice].pagoPor = pagamentos[indice].pagoPor || "contador";
  salvarPagamentosAlunos(pagamentos);
  return { ok: true };
}

function obterPagamentosPorAluno(email) {
  const emailNorm = email.trim().toLowerCase();
  return obterPagamentosAlunos()
    .filter(function (p) { return p.alunoEmail.toLowerCase() === emailNorm; })
    .sort(function (a, b) {
      const va = a.vencimento || a.criadoEm || "";
      const vb = b.vencimento || b.criadoEm || "";
      return va.localeCompare(vb);
    });
}

function garantirExtratoAluno(sessao) {
  inicializarDadosFinanceiros();
  const email = sessao.email.trim().toLowerCase();
  const matricula = obterMatriculaPorEmail(email);
  const nome = matricula ? matricula.nomeCompleto : sessao.nome;
  const modulo = matricula ? matricula.modulo : (sessao.modulo || "basico");
  const pagamentos = obterPagamentosAlunos();
  const doAluno = pagamentos.filter(function (p) {
    return p.alunoEmail.toLowerCase() === email;
  });

  for (let i = 0; i < MESES_CURSO_TOTAL; i++) {
    const mesTotal = INICIO_CURSO.mes - 1 + i;
    const ano = INICIO_CURSO.ano + Math.floor(mesTotal / 12);
    const mes = (mesTotal % 12) + 1;
    const refLabel =
      "Mensalidade " + String(mes).padStart(2, "0") + "/" + ano;
    const existe = doAluno.some(function (p) { return p.referencia === refLabel; });

    if (!existe) {
      const vencimento = new Date(ano, mes - 1, 10);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      let status = "agendado";
      if (vencimento <= hoje) status = "pendente";

      pagamentos.push({
        id: gerarId("pag"),
        matriculaId: matricula ? matricula.id : null,
        alunoNome: nome,
        alunoEmail: email,
        modulo: modulo,
        tipo: "mensalidade",
        parcela: i + 1,
        valor: obterMensalidadeModulo(modulo),
        referencia: refLabel,
        vencimento: vencimento.toISOString(),
        status: status,
        formaPagamento: null,
        dataPagamento: null,
        criadoEm: new Date().toISOString()
      });
    }
  }

  if (email === CREDENCIAIS.aluno.email) {
    pagamentos
      .filter(function (p) {
        return p.alunoEmail.toLowerCase() === email && p.referencia.indexOf("Mensalidade") === 0;
      })
      .slice(0, 2)
      .forEach(function (p) {
        if (p.status !== "pago") {
          p.status = "pago";
          p.formaPagamento = "PIX";
          p.instituicaoId = "banco-003";
          p.dataPagamento = "2026-03-10T14:00:00.000Z";
          p.pagoPor = "aluno";
        }
      });
  }

  salvarPagamentosAlunos(pagamentos);
}

function obterProximaParcelaPendente(email) {
  const parcelas = obterPagamentosPorAluno(email).filter(function (p) {
    return p.status === "pendente" || p.status === "agendado";
  });
  return parcelas.sort(function (a, b) {
    return (a.vencimento || "").localeCompare(b.vencimento || "");
  })[0] || null;
}

function resumoExtratoAluno(email) {
  const parcelas = obterPagamentosPorAluno(email);
  let pago = 0;
  let pendente = 0;
  let agendado = 0;
  let qtdPagas = 0;

  parcelas.forEach(function (p) {
    if (p.status === "pago") {
      pago += p.valor;
      qtdPagas++;
    } else if (p.status === "pendente") {
      pendente += p.valor;
    } else if (p.status === "agendado") {
      agendado += p.valor;
    }
  });

  return {
    totalParcelas: parcelas.length,
    qtdPagas: qtdPagas,
    valorPago: pago,
    valorPendente: pendente,
    valorAgendado: agendado,
    valorCurso: parcelas.reduce(function (s, p) { return s + p.valor; }, 0)
  };
}

function alunoConfirmarPagamento(pagamentoId, email, formaPagamento) {
  const emailNorm = email.trim().toLowerCase();
  const pagamentos = obterPagamentosAlunos();
  const indice = pagamentos.findIndex(function (p) {
    return p.id === pagamentoId && p.alunoEmail.toLowerCase() === emailNorm;
  });

  if (indice === -1) {
    return { ok: false, erro: "Parcela não encontrada para sua conta." };
  }

  const parcela = pagamentos[indice];
  if (parcela.status === "pago") {
    return { ok: false, erro: "Esta parcela já foi quitada." };
  }

  if (parcela.tipo !== "matricula") {
    const proxima = obterProximaParcelaPendente(emailNorm);
    if (proxima && proxima.id !== pagamentoId) {
      return {
        ok: false,
        erro: "Quite primeiro a parcela mais antiga em aberto: " + proxima.referencia + "."
      };
    }
  }

  const instituicaoId =
    formaPagamento === "PIX" ? "banco-003" :
    formaPagamento === "Boleto" ? "banco-002" : "banco-001";

  pagamentos[indice].status = "pago";
  pagamentos[indice].formaPagamento = formaPagamento;
  pagamentos[indice].instituicaoId = instituicaoId;
  pagamentos[indice].dataPagamento = new Date().toISOString();
  pagamentos[indice].pagoPor = "aluno";
  pagamentos[indice].protocolo = gerarId("proto");
  salvarPagamentosAlunos(pagamentos);

  return {
    ok: true,
    protocolo: pagamentos[indice].protocolo,
    valor: pagamentos[indice].valor,
    referencia: pagamentos[indice].referencia
  };
}

function gerarCodigoPixDemo(valor, referencia) {
  return "00020126580014BR.GOV.BCB.PIX0136" + CHAVE_PIX_SETAD +
    "52040000530398654" + String(Math.round(valor * 100)).padStart(10, "0") +
    "5802BR5925SETAD SEMINARIO6009BELEM62070503***6304" +
    referencia.replace(/\W/g, "").slice(0, 8).toUpperCase();
}

function gerarLinkPixDemonstracao(valor, referencia) {
  const codigo = gerarCodigoPixDemo(valor, referencia);
  return "https://pix.setad.org.br/pagar?valor=" + encodeURIComponent(valor) +
    "&ref=" + encodeURIComponent(referencia) +
    "&payload=" + encodeURIComponent(codigo.slice(0, 120));
}

function confirmarPagamentoMatriculaPublico(pagamentoId, email, formaPagamento, subtipoCartao) {
  const emailNorm = email.trim().toLowerCase();
  const pagamentos = obterPagamentosAlunos();
  const indice = pagamentos.findIndex(function (p) {
    return p.id === pagamentoId &&
      p.alunoEmail.toLowerCase() === emailNorm &&
      (!p.tipo || p.tipo === "matricula");
  });

  if (indice === -1) {
    return { ok: false, erro: "Pagamento de matrícula não encontrado para esta inscrição." };
  }

  const parcela = pagamentos[indice];
  if (parcela.status === "pago") {
    return { ok: false, erro: "A taxa de matrícula já foi quitada." };
  }

  const formaFinal = formaPagamento === "Cartão" && subtipoCartao
    ? "Cartão " + subtipoCartao
    : formaPagamento;

  const instituicaoId =
    formaPagamento === "PIX" ? "banco-setad-pix" :
    formaPagamento === "Transferência" ? "banco-setad-290" : "banco-setad-cartao";

  pagamentos[indice].status = "pago";
  pagamentos[indice].formaPagamento = formaFinal;
  pagamentos[indice].instituicaoId = instituicaoId;
  pagamentos[indice].dataPagamento = new Date().toISOString();
  pagamentos[indice].pagoPor = "aluno";
  pagamentos[indice].protocolo = gerarId("proto");
  salvarPagamentosAlunos(pagamentos);

  if (parcela.matriculaId) {
    atualizarStatusMatricula(parcela.matriculaId, "matricula_paga");
  }

  return {
    ok: true,
    protocolo: pagamentos[indice].protocolo,
    valor: pagamentos[indice].valor,
    referencia: pagamentos[indice].referencia
  };
}

function gerarLinhaBoletoDemo(pagamentoId) {
  return "23793.38128 60000.000003 00000.000400 1 " +
    String(84610000000 + (pagamentoId.length * 137)).slice(0, 10);
}

function obterFuncionarios() {
  inicializarDadosFinanceiros();
  if (financeiroApiAtivo() && window.SETAD.cache.funcionarios) {
    return window.SETAD.cache.funcionarios.slice();
  }
  const dados = localStorage.getItem(FINANCEIRO_KEYS.funcionarios);
  return dados ? JSON.parse(dados) : [];
}

function salvarFuncionarios(lista) {
  if (financeiroApiAtivo()) {
    window.SETAD.setCache("funcionarios", lista, "funcionarios");
    return;
  }
  localStorage.setItem(FINANCEIRO_KEYS.funcionarios, JSON.stringify(lista));
}

function normalizarColaborador(dados) {
  return {
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    telefone: dados.telefone ? dados.telefone.trim() : "",
    tipo: dados.tipo || "administrativo",
    cargo: dados.cargo.trim(),
    setor: dados.setor.trim(),
    vinculo: dados.vinculo || "clt",
    salario: Number(dados.salario) || 0,
    ajudaCusto: Number(dados.ajudaCusto) || 0,
    valeTransporte: Number(dados.valeTransporte) || 0,
    outrosBeneficios: dados.outrosBeneficios ? dados.outrosBeneficios.trim() : "",
    observacoes: dados.observacoes ? dados.observacoes.trim() : "",
    dataAdmissao: dados.dataAdmissao || new Date().toISOString().slice(0, 10),
    cadastradoPor: dados.cadastradoPor || null,
    dataCadastro: dados.dataCadastro || new Date().toISOString()
  };
}

function calcularRemuneracaoTotal(funcionario) {
  return (funcionario.salario || 0) +
    (funcionario.ajudaCusto || 0) +
    (funcionario.valeTransporte || 0);
}

function obterLabelTipoColaborador(tipo) {
  return TIPOS_COLABORADOR[tipo] || tipo || "Colaborador";
}

function obterLabelVinculoColaborador(vinculo) {
  return VINCULOS_COLABORADOR[vinculo] || vinculo || "—";
}

function emailFuncionarioJaCadastrado(email) {
  const emailNormalizado = email.trim().toLowerCase();
  return obterFuncionarios().some(function (f) {
    return f.email === emailNormalizado && f.ativo;
  });
}

function validarCadastroColaborador(dados) {
  if (!dados.nome || dados.nome.length < 3) {
    return "Informe o nome completo do colaborador.";
  }
  if (!dados.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    return "Informe um e-mail válido.";
  }
  if (!dados.cargo) return "Informe o cargo.";
  if (!dados.setor) return "Informe o setor.";
  if (!dados.tipo || !TIPOS_COLABORADOR[dados.tipo]) {
    return "Selecione o tipo de colaborador.";
  }
  if (dados.salario < 0 || dados.ajudaCusto < 0 || dados.valeTransporte < 0) {
    return "Valores financeiros não podem ser negativos.";
  }
  if (emailFuncionarioJaCadastrado(dados.email)) {
    return "Já existe um colaborador ativo com este e-mail.";
  }
  return null;
}

function cadastrarFuncionario(dados) {
  const funcionarios = obterFuncionarios();
  const novo = Object.assign({}, normalizarColaborador(dados), {
    id: gerarId("func"),
    ativo: true
  });
  funcionarios.push(novo);
  salvarFuncionarios(funcionarios);
  return novo;
}

function obterFolhaPagamento() {
  inicializarDadosFinanceiros();
  if (financeiroApiAtivo() && window.SETAD.cache.folha) {
    return window.SETAD.cache.folha.slice();
  }
  const dados = localStorage.getItem(FINANCEIRO_KEYS.folhaPagamento);
  return dados ? JSON.parse(dados) : [];
}

function salvarFolhaPagamento(lista) {
  if (financeiroApiAtivo()) {
    window.SETAD.setCache("folha", lista, "folha");
    return;
  }
  localStorage.setItem(FINANCEIRO_KEYS.folhaPagamento, JSON.stringify(lista));
}

function registrarPagamentoFuncionario(folhaId, instituicaoId) {
  const folha = obterFolhaPagamento();
  const indice = folha.findIndex(function (f) { return f.id === folhaId; });
  if (indice === -1) return { ok: false, erro: "Registro não encontrado." };

  folha[indice].status = "pago";
  folha[indice].instituicaoId = instituicaoId;
  folha[indice].dataPagamento = new Date().toISOString();
  salvarFolhaPagamento(folha);
  return { ok: true };
}

function agendarFolhaFuncionario(funcionarioId, referencia) {
  const funcionario = obterFuncionarios().find(function (f) { return f.id === funcionarioId; });
  if (!funcionario) return { ok: false, erro: "Funcionário não encontrado." };

  const folha = obterFolhaPagamento();
  folha.push({
    id: gerarId("folha"),
    funcionarioId: funcionario.id,
    funcionarioNome: funcionario.nome,
    referencia: referencia,
    valor: calcularRemuneracaoTotal(funcionario),
    salarioBase: funcionario.salario,
    ajudaCusto: funcionario.ajudaCusto || 0,
    valeTransporte: funcionario.valeTransporte || 0,
    status: "agendado",
    dataPagamento: null,
    instituicaoId: null
  });
  salvarFolhaPagamento(folha);
  return { ok: true };
}

function obterInstituicoesFinanceiras() {
  inicializarDadosFinanceiros();
  if (financeiroApiAtivo() && window.SETAD.cache.instituicoes) {
    return window.SETAD.cache.instituicoes.slice();
  }
  const dados = localStorage.getItem(FINANCEIRO_KEYS.instituicoes);
  return dados ? JSON.parse(dados) : [];
}

function resumoFinanceiro() {
  const pagamentos = obterPagamentosAlunos();
  const folha = obterFolhaPagamento();

  let recebidoAlunos = 0;
  let pendenteAlunos = 0;
  pagamentos.forEach(function (p) {
    if (p.status === "pago") recebidoAlunos += p.valor;
    else pendenteAlunos += p.valor;
  });

  let pagoFolha = 0;
  let agendadoFolha = 0;
  folha.forEach(function (f) {
    if (f.status === "pago") pagoFolha += f.valor;
    else agendadoFolha += f.valor;
  });

  return {
    recebidoAlunos: recebidoAlunos,
    pendenteAlunos: pendenteAlunos,
    totalAlunos: pagamentos.length,
    pagoFolha: pagoFolha,
    agendadoFolha: agendadoFolha,
    totalFuncionarios: obterFuncionarios().filter(function (f) { return f.ativo; }).length
  };
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function obterLabelPagamentoStatus(status) {
  const labels = {
    pago: "Pago",
    pendente: "Pendente",
    agendado: "Agendado",
    cancelado: "Cancelado"
  };
  return labels[status] || status;
}

function obterClassePagamentoStatus(status) {
  if (status === "pago") return "status--entregue";
  if (status === "agendado") return "status--avaliando";
  return "status--pendente";
}

/* --- Renderização: painel do contador --- */

function renderizarDashboardContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const resumo = resumoFinanceiro();
  const instituicoes = obterInstituicoesFinanceiras();

  container.innerHTML =
    '<div class="financeiro-cards">' +
      '<article class="financeiro-card">' +
        '<p class="financeiro-card__label">Recebido (alunos)</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.recebidoAlunos) + "</p>" +
      "</article>" +
      '<article class="financeiro-card">' +
        '<p class="financeiro-card__label">Pendente (alunos)</p>' +
        '<p class="financeiro-card__valor financeiro-card__valor--alerta">' + formatarMoeda(resumo.pendenteAlunos) + "</p>" +
      "</article>" +
      '<article class="financeiro-card">' +
        '<p class="financeiro-card__label">Folha paga</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.pagoFolha) + "</p>" +
      "</article>" +
      '<article class="financeiro-card">' +
        '<p class="financeiro-card__label">Folha agendada</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.agendadoFolha) + "</p>" +
      "</article>" +
    "</div>" +
    '<p class="financeiro-aviso">' +
      '<strong>Segurança:</strong> esta é uma demonstração local. Em produção, utilize servidor seguro (HTTPS), ' +
      "autenticação em dois fatores e APIs oficiais dos bancos." +
    "</p>" +
    '<h3 class="financeiro-subtitulo">Instituições conectadas</h3>' +
    '<ul class="financeiro-instituicoes">' +
      instituicoes.map(function (inst) {
        return (
          "<li><strong>" + escaparHtml(inst.nome) + "</strong> — " +
          escaparHtml(inst.tipo) +
          ' <span class="status-badge status--entregue">' + escaparHtml(inst.status) + "</span></li>"
        );
      }).join("") +
    "</ul>";
}

function renderizarPagamentosAlunosContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const pagamentos = obterPagamentosAlunos();
  const instituicoes = obterInstituicoesFinanceiras();

  if (pagamentos.length === 0) {
    container.innerHTML = '<p class="painel-vazio">Nenhum pagamento de aluno registrado ainda.</p>';
    return;
  }

  container.innerHTML =
    '<table class="data-table">' +
      "<thead><tr>" +
        "<th>Aluno</th><th>Referência</th><th>Valor</th><th>Status</th><th>Ação</th>" +
      "</tr></thead><tbody>" +
      pagamentos.map(function (p) {
        const acao = p.status === "pendente"
          ? '<form class="financeiro-form-inline" data-pagamento-id="' + escaparHtml(p.id) + '">' +
              '<select name="forma" required>' +
                '<option value="">Forma</option>' +
                '<option value="PIX">PIX</option>' +
                '<option value="Boleto">Boleto</option>' +
                '<option value="Cartão">Cartão</option>' +
              "</select>" +
              '<select name="instituicao" required>' +
                '<option value="">Banco</option>' +
                instituicoes.map(function (i) {
                  return '<option value="' + escaparHtml(i.id) + '">' + escaparHtml(i.nome) + "</option>";
                }).join("") +
              "</select>" +
              '<button type="submit" class="btn btn--small btn--primary">Confirmar pagamento</button>' +
            "</form>"
          : (p.dataPagamento ? formatarData(p.dataPagamento) + " · " + escaparHtml(p.formaPagamento || "") : "—");

        return (
          "<tr>" +
            "<td>" + escaparHtml(p.alunoNome) + "<br><small>" + escaparHtml(p.alunoEmail) + "</small></td>" +
            "<td>" + escaparHtml(p.referencia) + "</td>" +
            "<td>" + formatarMoeda(p.valor) + "</td>" +
            '<td><span class="status-badge ' + obterClassePagamentoStatus(p.status) + '">' +
              obterLabelPagamentoStatus(p.status) + "</span></td>" +
            "<td>" + acao + "</td>" +
          "</tr>"
        );
      }).join("") +
    "</tbody></table>";

  container.querySelectorAll(".financeiro-form-inline").forEach(function (form) {
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const id = form.getAttribute("data-pagamento-id");
      const forma = form.forma.value;
      const instituicao = form.instituicao.value;
      if (!confirm("Confirmar registro de pagamento? Esta ação será registrada no sistema.")) return;

      const resultado = registrarPagamentoAluno(id, forma, instituicao);
      if (resultado.ok) {
        renderizarPagamentosAlunosContador(containerId);
        renderizarDashboardContador("dashboardContadorContainer");
      }
    });
  });
}

function renderizarFolhaContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const folha = obterFolhaPagamento();
  const instituicoes = obterInstituicoesFinanceiras();
  const funcionarios = obterFuncionarios().filter(function (f) { return f.ativo; });

  const mesAtual = new Date().toISOString().slice(0, 7);

  container.innerHTML =
    '<form id="formAgendarFolha" class="financeiro-form-agendar">' +
      "<h3>Agendar pagamento de funcionário</h3>" +
      '<div class="financeiro-form-grid">' +
        '<div class="form-group"><label>Funcionário</label><select id="folhaFuncionario" required>' +
          '<option value="">Selecione</option>' +
          funcionarios.map(function (f) {
            return '<option value="' + escaparHtml(f.id) + '">' + escaparHtml(f.nome) +
              " — " + formatarMoeda(calcularRemuneracaoTotal(f)) + "</option>";
          }).join("") +
        "</select></div>" +
        '<div class="form-group"><label>Referência (mês)</label><input type="month" id="folhaReferencia" value="' + mesAtual + '" required></div>' +
        '<button type="submit" class="btn btn--primary">Agendar</button>' +
      "</div>" +
    "</form>" +
    '<table class="data-table">' +
      "<thead><tr><th>Funcionário</th><th>Referência</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>" +
      folha.map(function (f) {
        const acao = f.status !== "pago"
          ? '<form class="financeiro-form-inline" data-folha-id="' + escaparHtml(f.id) + '">' +
              '<select name="instituicao" required><option value="">Banco</option>' +
              instituicoes.map(function (i) {
                return '<option value="' + escaparHtml(i.id) + '">' + escaparHtml(i.nome) + "</option>";
              }).join("") +
              '</select><button type="submit" class="btn btn--small btn--primary">Pagar</button></form>'
          : formatarData(f.dataPagamento);

        return (
          "<tr>" +
            "<td>" + escaparHtml(f.funcionarioNome) + "</td>" +
            "<td>" + escaparHtml(f.referencia) + "</td>" +
            "<td>" + formatarMoeda(f.valor) + "</td>" +
            '<td><span class="status-badge ' + obterClassePagamentoStatus(f.status) + '">' +
              obterLabelPagamentoStatus(f.status) + "</span></td>" +
            "<td>" + acao + "</td>" +
          "</tr>"
        );
      }).join("") +
    "</tbody></table>";

  const formAgendar = document.getElementById("formAgendarFolha");
  if (formAgendar) {
    formAgendar.addEventListener("submit", function (evento) {
      evento.preventDefault();
      agendarFolhaFuncionario(
        document.getElementById("folhaFuncionario").value,
        document.getElementById("folhaReferencia").value
      );
      renderizarFolhaContador(containerId);
    });
  }

  container.querySelectorAll(".financeiro-form-inline").forEach(function (form) {
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (!confirm("Confirmar pagamento da folha?")) return;
      registrarPagamentoFuncionario(form.getAttribute("data-folha-id"), form.instituicao.value);
      renderizarFolhaContador(containerId);
      renderizarDashboardContador("dashboardContadorContainer");
    });
  });
}

function montarOpcoesSelect(mapa, valorSelecionado) {
  return Object.keys(mapa).map(function (chave) {
    const selecionado = chave === valorSelecionado ? " selected" : "";
    return '<option value="' + escaparHtml(chave) + '"' + selecionado + ">" +
      escaparHtml(mapa[chave]) + "</option>";
  }).join("");
}

function renderizarCadastroColaboradores(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const funcionarios = obterFuncionarios().slice().sort(function (a, b) {
    return new Date(b.dataCadastro || b.dataAdmissao || 0) -
      new Date(a.dataCadastro || a.dataAdmissao || 0);
  });

  const hoje = new Date().toISOString().slice(0, 10);

  container.innerHTML =
    '<p class="financeiro-aviso">Cadastro de professores e colaboradores do seminário. ' +
      "Os valores informados alimentam a folha de pagamento na contabilidade.</p>" +
    '<div id="colabMensagem" class="form-mensagem" role="alert"></div>' +
    '<form id="formColaborador" class="financeiro-form-agendar colaboradores-form">' +
      "<h3>Novo colaborador</h3>" +
      '<div class="financeiro-form-grid colaboradores-form__grid">' +
        '<div class="form-group form-group--full"><label for="colabNome">Nome completo *</label>' +
          '<input type="text" id="colabNome" required autocomplete="name"></div>' +
        '<div class="form-group"><label for="colabEmail">E-mail institucional *</label>' +
          '<input type="email" id="colabEmail" required autocomplete="email"></div>' +
        '<div class="form-group"><label for="colabTelefone">Telefone / WhatsApp</label>' +
          '<input type="tel" id="colabTelefone" placeholder="(91) 99999-9999"></div>' +
        '<div class="form-group"><label for="colabTipo">Tipo *</label>' +
          '<select id="colabTipo" required>' +
            '<option value="">Selecione...</option>' +
            montarOpcoesSelect(TIPOS_COLABORADOR) +
          "</select></div>" +
        '<div class="form-group"><label for="colabVinculo">Vínculo *</label>' +
          '<select id="colabVinculo" required>' +
            montarOpcoesSelect(VINCULOS_COLABORADOR, "clt") +
          "</select></div>" +
        '<div class="form-group"><label for="colabCargo">Cargo *</label>' +
          '<input type="text" id="colabCargo" required></div>' +
        '<div class="form-group"><label for="colabSetor">Setor *</label>' +
          '<input type="text" id="colabSetor" required></div>' +
        '<div class="form-group"><label for="colabAdmissao">Data de admissão</label>' +
          '<input type="date" id="colabAdmissao" value="' + hoje + '"></div>' +
        '<div class="form-group"><label for="colabSalario">Salário base (R$) *</label>' +
          '<input type="number" id="colabSalario" min="0" step="0.01" required></div>' +
        '<div class="form-group"><label for="colabAjuda">Ajuda de custo (R$)</label>' +
          '<input type="number" id="colabAjuda" min="0" step="0.01" value="0"></div>' +
        '<div class="form-group"><label for="colabVale">Vale transporte (R$)</label>' +
          '<input type="number" id="colabVale" min="0" step="0.01" value="0"></div>' +
        '<div class="form-group form-group--full"><label for="colabBeneficios">Outros benefícios</label>' +
          '<input type="text" id="colabBeneficios" placeholder="Ex.: auxílio alimentação, material didático..."></div>' +
        '<div class="form-group form-group--full"><label for="colabObs">Observações</label>' +
          '<textarea id="colabObs" rows="2" placeholder="Informações adicionais do RH..."></textarea></div>' +
        '<div class="form-group form-group--full colaboradores-form__acoes">' +
          '<button type="submit" class="btn btn--primary">Salvar colaborador</button>' +
        "</div>" +
      "</div>" +
    "</form>" +
    "<h3 class=\"financeiro-subtitulo\">Equipe cadastrada (" + funcionarios.length + ")</h3>" +
    (funcionarios.length === 0
      ? '<p class="lista-vazia">Nenhum colaborador cadastrado ainda.</p>'
      : '<table class="data-table">' +
          "<thead><tr>" +
            "<th>Nome</th><th>Tipo</th><th>Cargo / Setor</th>" +
            "<th>Salário</th><th>Ajuda custo</th><th>Total</th><th>Status</th>" +
          "</tr></thead><tbody>" +
          funcionarios.map(function (f) {
            const total = calcularRemuneracaoTotal(f);
            return (
              "<tr>" +
                "<td><strong>" + escaparHtml(f.nome) + "</strong><br>" +
                  "<small>" + escaparHtml(f.email) + "</small>" +
                  (f.telefone ? "<br><small>" + escaparHtml(f.telefone) + "</small>" : "") +
                "</td>" +
                "<td>" + escaparHtml(obterLabelTipoColaborador(f.tipo)) + "<br>" +
                  "<small>" + escaparHtml(obterLabelVinculoColaborador(f.vinculo)) + "</small></td>" +
                "<td>" + escaparHtml(f.cargo) + "<br><small>" + escaparHtml(f.setor) + "</small></td>" +
                "<td>" + formatarMoeda(f.salario || 0) + "</td>" +
                "<td>" + formatarMoeda(f.ajudaCusto || 0) +
                  (f.valeTransporte ? "<br><small>VT: " + formatarMoeda(f.valeTransporte) + "</small>" : "") +
                "</td>" +
                "<td><strong>" + formatarMoeda(total) + "</strong></td>" +
                "<td>" + (f.ativo
                  ? '<span class="status-badge status--entregue">Ativo</span>'
                  : '<span class="status-badge status--pendente">Inativo</span>') +
                  (f.cadastradoPor ? "<br><small>por " + escaparHtml(f.cadastradoPor) + "</small>" : "") +
                "</td>" +
              "</tr>"
            );
          }).join("") +
        "</tbody></table>");

  const telefoneInput = document.getElementById("colabTelefone");
  if (telefoneInput && typeof aplicarMascaraTelefone === "function") {
    aplicarMascaraTelefone(telefoneInput);
  }

  document.getElementById("formColaborador").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagemEl = document.getElementById("colabMensagem");
    mensagemEl.className = "form-mensagem";
    mensagemEl.textContent = "";

    const dados = {
      nome: document.getElementById("colabNome").value.trim(),
      email: document.getElementById("colabEmail").value.trim().toLowerCase(),
      telefone: document.getElementById("colabTelefone").value.trim(),
      tipo: document.getElementById("colabTipo").value,
      vinculo: document.getElementById("colabVinculo").value,
      cargo: document.getElementById("colabCargo").value.trim(),
      setor: document.getElementById("colabSetor").value.trim(),
      dataAdmissao: document.getElementById("colabAdmissao").value,
      salario: parseFloat(document.getElementById("colabSalario").value),
      ajudaCusto: parseFloat(document.getElementById("colabAjuda").value) || 0,
      valeTransporte: parseFloat(document.getElementById("colabVale").value) || 0,
      outrosBeneficios: document.getElementById("colabBeneficios").value.trim(),
      observacoes: document.getElementById("colabObs").value.trim(),
      cadastradoPor: sessao ? sessao.nome : "Sistema"
    };

    const erro = validarCadastroColaborador(dados);
    if (erro) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = erro;
      return;
    }

    cadastrarFuncionario(dados);
    renderizarCadastroColaboradores(containerId, sessao);
  });
}

function renderizarFuncionariosContador(containerId) {
  renderizarCadastroColaboradores(containerId, {
    nome: "Contabilidade SETAD",
    email: "contador@setad.org.br"
  });
}

function renderizarInstituicoesContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const instituicoes = obterInstituicoesFinanceiras();

  container.innerHTML =
    '<p class="financeiro-aviso">Conexões simuladas para demonstração. Integração real exige credenciais OAuth/API do banco.</p>' +
    '<div class="financeiro-inst-grid">' +
      instituicoes.map(function (inst) {
        return (
          '<article class="financeiro-inst-card">' +
            "<h3>" + escaparHtml(inst.nome) + "</h3>" +
            "<p>" + escaparHtml(inst.tipo) + "</p>" +
            "<p><strong>Agência:</strong> " + escaparHtml(inst.agencia) + "</p>" +
            "<p><strong>Conta / Chave:</strong> " + escaparHtml(inst.conta) + "</p>" +
            '<p><span class="status-badge status--entregue">' + escaparHtml(inst.status) + "</span></p>" +
            "<p><small>Última sincronização: " + formatarData(inst.ultimaSync) + "</small></p>" +
          "</article>"
        );
      }).join("") +
    "</div>";
}

/* renderizarRelatoriosContador — definido em contabilidade-relatorios.js */

/* --- Renderização: visão do diretor (financeiro resumido + equipe) --- */

function renderizarFinanceiroDiretor(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const resumo = resumoFinanceiro();

  container.innerHTML =
    '<p class="financeiro-aviso">Visão executiva — dados gerenciados pela contabilidade. ' +
      '<a href="painel-contador.html">Abrir área do contador</a> (somente com login de contador).</p>' +
    '<div class="financeiro-cards">' +
      '<article class="financeiro-card"><p class="financeiro-card__label">Recebido</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.recebidoAlunos) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Pendente</p>' +
        '<p class="financeiro-card__valor financeiro-card__valor--alerta">' + formatarMoeda(resumo.pendenteAlunos) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Folha paga</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.pagoFolha) + "</p></article>" +
    "</div>" +
    '<h3 class="financeiro-subtitulo">Últimos pagamentos de alunos</h3>' +
    renderizarTabelaPagamentosResumo(obterPagamentosAlunos().slice(-5));
}

function renderizarTabelaPagamentosResumo(pagamentos) {
  if (!pagamentos.length) return "<p>Nenhum pagamento registrado.</p>";
  return (
    '<table class="data-table"><thead><tr><th>Aluno</th><th>Valor</th><th>Status</th></tr></thead><tbody>' +
    pagamentos.map(function (p) {
      return "<tr><td>" + escaparHtml(p.alunoNome) + "</td><td>" + formatarMoeda(p.valor) +
        '</td><td><span class="status-badge ' + obterClassePagamentoStatus(p.status) + '">' +
        obterLabelPagamentoStatus(p.status) + "</span></td></tr>";
    }).join("") +
    "</tbody></table>"
  );
}

function renderizarEquipeDiretor(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const funcionarios = obterFuncionarios();
  const staff = CONTAS_STAFF.concat(CONTAS_DIRECAO, [CREDENCIAIS.contador]);

  container.innerHTML =
    "<h3 class=\"financeiro-subtitulo\">Professores e equipe institucional</h3>" +
    '<table class="data-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil / Cargo</th></tr></thead><tbody>' +
      staff.map(function (s) {
        return "<tr><td>" + escaparHtml(s.nome) + "</td><td>" + escaparHtml(s.email) +
          "</td><td>" + escaparHtml(obterLabelPerfil(s.perfil)) + "</td></tr>";
      }).join("") +
    "</tbody></table>" +
    "<h3 class=\"financeiro-subtitulo\">Funcionários cadastrados (RH)</h3>" +
    '<table class="data-table"><thead><tr><th>Nome</th><th>Cargo</th><th>Salário</th><th>Ajuda custo</th><th>Total</th></tr></thead><tbody>' +
      funcionarios.map(function (f) {
        return "<tr><td>" + escaparHtml(f.nome) + "</td><td>" + escaparHtml(f.cargo) +
          "</td><td>" + formatarMoeda(f.salario || 0) + "</td><td>" +
          formatarMoeda(f.ajudaCusto || 0) + "</td><td>" +
          formatarMoeda(calcularRemuneracaoTotal(f)) + "</td></tr>";
      }).join("") +
    "</tbody></table>";
}

function renderizarVisaoDiretor(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const resumo = resumoFinanceiro();
  const matriculas = obterMatriculas().length;
  const entregas = obterEntregas().length;

  container.innerHTML =
    '<div class="financeiro-cards">' +
      '<article class="financeiro-card"><p class="financeiro-card__label">Matrículas online</p>' +
        '<p class="financeiro-card__valor">' + matriculas + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Trabalhos enviados</p>' +
        '<p class="financeiro-card__valor">' + entregas + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Receita (alunos)</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.recebidoAlunos) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Funcionários ativos</p>' +
        '<p class="financeiro-card__valor">' + resumo.totalFuncionarios + "</p></article>" +
    "</div>" +
    '<p class="financeiro-aviso">Use as abas ao lado para notas, trabalhos, matrículas, biblioteca, finanças e equipe.</p>';
}
