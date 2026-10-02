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
    codigoBanco: "104",
    agencia: "0187",
    conta: "*****-45",
    convenioBoleto: "SETAD-2026",
    titular: "SEMINARIO TEOLOGICO DA ASSEMBLEIA DE DEUS EM BELEM",
    status: "conectado",
    ultimaSync: "2026-09-09T18:30:00.000Z"
  },
  {
    id: "banco-003",
    nome: "PIX Institucional SETAD",
    tipo: "Chave PIX (CNPJ)",
    codigoBanco: "290",
    agencia: "0001",
    conta: "86532518-7",
    pixChave: "21175313000150",
    titular: "SEMINARIO TEOLOGICO DA ASSEMBLEIA DE DEUS EM BELEM",
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

function obterUrlRelatorioAlunoPagamentosContador(email) {
  return (
    "painel-contador-aluno-pagamentos.html?email=" +
    encodeURIComponent(String(email || "").trim())
  );
}

function navegarRelatorioAlunoPagamentosContador(email) {
  if (!email || !String(email).trim()) return;
  window.location.href = obterUrlRelatorioAlunoPagamentosContador(email);
}

function isoParaInputData(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function inputDataParaIso(dataInput) {
  if (!dataInput) return null;
  return new Date(dataInput + "T12:00:00").toISOString();
}

function listarAlunosResumoPagamentosContador() {
  sincronizarPagamentosDeMatriculas();
  const porEmail = {};

  obterPagamentosAlunos().forEach(function (p) {
    const chave = (p.alunoEmail || "").trim().toLowerCase();
    if (!chave) return;
    if (!porEmail[chave]) {
      porEmail[chave] = {
        email: p.alunoEmail,
        nome: p.alunoNome || "Aluno",
        modulo: p.modulo || null
      };
    }
  });

  if (typeof obterMatriculas === "function") {
    obterMatriculas().forEach(function (m) {
      const chave = (m.email || "").trim().toLowerCase();
      if (!chave) return;
      if (!porEmail[chave]) {
        porEmail[chave] = {
          email: m.email,
          nome: m.nomeCompleto || "Aluno",
          modulo: m.modulo || null
        };
      }
    });
  }

  return Object.keys(porEmail)
    .map(function (chave) {
      return porEmail[chave];
    })
    .sort(function (a, b) {
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
}

function atualizarPagamentoContador(pagamentoId, campos) {
  const pagamentos = obterPagamentosAlunos();
  const indice = pagamentos.findIndex(function (p) {
    return p.id === pagamentoId;
  });
  if (indice === -1) {
    return { ok: false, erro: "Pagamento não encontrado." };
  }

  const pagamento = pagamentos[indice];
  const statusAnterior = pagamento.status;

  if (campos.valor !== undefined && campos.valor !== null && campos.valor !== "") {
    const valor = Number(campos.valor);
    if (!valor || valor <= 0) {
      return { ok: false, erro: "Informe um valor válido." };
    }
    pagamento.valor = valor;
  }

  if (campos.referencia !== undefined) {
    pagamento.referencia = String(campos.referencia || "").trim();
    if (!pagamento.referencia) {
      return { ok: false, erro: "A referência não pode ficar vazia." };
    }
  }

  if (campos.vencimento !== undefined) {
    pagamento.vencimento = campos.vencimento
      ? inputDataParaIso(campos.vencimento)
      : pagamento.vencimento;
  }

  if (campos.observacoes !== undefined) {
    pagamento.observacoes = String(campos.observacoes || "").trim();
  }

  if (campos.status) {
    const novoStatus = campos.status;
    if (novoStatus === "pago") {
      const forma = campos.formaPagamento || pagamento.formaPagamento;
      if (!forma) {
        return { ok: false, erro: "Selecione a forma de pagamento para marcar como pago." };
      }
      pagamento.status = "pago";
      pagamento.formaPagamento = forma;
      pagamento.instituicaoId = campos.instituicaoId || pagamento.instituicaoId || null;
      pagamento.dataPagamento =
        campos.dataPagamento
          ? inputDataParaIso(campos.dataPagamento)
          : pagamento.dataPagamento || new Date().toISOString();
      pagamento.pagoPor = "contador";
    } else if (
      novoStatus === "pendente" ||
      novoStatus === "agendado" ||
      novoStatus === "cancelado"
    ) {
      pagamento.status = novoStatus;
      if (statusAnterior === "pago" && novoStatus !== "pago") {
        pagamento.formaPagamento = null;
        pagamento.instituicaoId = null;
        pagamento.dataPagamento = null;
        pagamento.pagoPor = null;
      }
    }
  } else if (pagamento.status === "pago") {
    if (campos.formaPagamento) {
      pagamento.formaPagamento = campos.formaPagamento;
    }
    if (campos.instituicaoId !== undefined) {
      pagamento.instituicaoId = campos.instituicaoId || null;
    }
    if (campos.dataPagamento) {
      pagamento.dataPagamento = inputDataParaIso(campos.dataPagamento);
    }
  }

  pagamentos[indice] = pagamento;
  salvarPagamentosAlunos(pagamentos);
  return { ok: true, pagamento: pagamento };
}

var FORMAS_PAGAMENTO_PRESENCIAL = [
  "Dinheiro",
  "PIX",
  "Cartão de débito",
  "Cartão de crédito",
  "Transferência bancária",
  "Cheque"
];

function obterReferenciaMensalidadeAtual() {
  const agora = new Date();
  return (
    "Mensalidade " +
    String(agora.getMonth() + 1).padStart(2, "0") +
    "/" +
    agora.getFullYear()
  );
}

function registrarPagamentoPresencialSecretaria(matricula, opcoes, sessao) {
  if (!matricula || !matricula.id) {
    return { ok: false, erro: "Matrícula inválida para o pagamento." };
  }
  if (!sessao || !sessao.email) {
    return { ok: false, erro: "Sessão da secretaria inválida." };
  }

  inicializarDadosFinanceiros();
  if (typeof inicializarDadosContabilidade === "function") {
    inicializarDadosContabilidade();
  }

  const tipo = opcoes.tipoCobranca || "matricula";
  const situacao = opcoes.situacaoPagamento || "pago_presencial";
  const forma = opcoes.formaPagamento || null;
  const instituicaoId = opcoes.instituicaoId || null;
  const valor = Number(opcoes.valor);

  if (!valor || valor <= 0) {
    return { ok: false, erro: "Informe um valor válido para o pagamento." };
  }
  if (situacao === "pago_presencial" && !forma) {
    return { ok: false, erro: "Selecione a forma de pagamento presencial." };
  }

  const pagamentos = obterPagamentosAlunos();
  let pagamento = null;

  if (tipo === "matricula") {
    const existente = pagamentos.find(function (p) {
      return p.matriculaId === matricula.id && (!p.tipo || p.tipo === "matricula");
    });
    if (existente) {
      pagamento = existente;
      pagamento.valor = valor;
    } else {
      pagamento = criarRegistroPagamentoMatricula(matricula);
      pagamento.valor = valor;
      pagamentos.push(pagamento);
    }
  } else if (tipo === "mensalidade") {
    const ref = opcoes.referenciaMensalidade || obterReferenciaMensalidadeAtual();
    const parcelaExistente = pagamentos.find(function (p) {
      return (
        p.matriculaId === matricula.id &&
        p.tipo === "mensalidade" &&
        p.referencia === ref
      );
    });
    if (parcelaExistente) {
      pagamento = parcelaExistente;
      pagamento.valor = valor;
    } else {
      pagamento = {
        id: gerarId("pag"),
        matriculaId: matricula.id,
        alunoNome: matricula.nomeCompleto,
        alunoEmail: matricula.email,
        modulo: matricula.modulo,
        tipo: "mensalidade",
        valor: valor,
        referencia: ref,
        vencimento: new Date().toISOString(),
        status: "pendente",
        formaPagamento: null,
        dataPagamento: null,
        criadoEm: new Date().toISOString(),
        canal: "presencial"
      };
      pagamentos.push(pagamento);
    }
  } else {
    const refOutro = (opcoes.referenciaOutro || "Recebimento presencial").trim();
    pagamento = {
      id: gerarId("pag"),
      matriculaId: matricula.id,
      alunoNome: matricula.nomeCompleto,
      alunoEmail: matricula.email,
      modulo: matricula.modulo,
      tipo: "outro",
      valor: valor,
      referencia: refOutro,
      vencimento: new Date().toISOString(),
      status: "pendente",
      formaPagamento: null,
      dataPagamento: null,
      criadoEm: new Date().toISOString(),
      canal: "presencial",
      observacoes: opcoes.observacoesPagamento || ""
    };
    pagamentos.push(pagamento);
  }

  pagamento.canal = "presencial";
  pagamento.registradoPorSecretaria = sessao.email;

  if (situacao === "pago_presencial") {
    pagamento.status = "pago";
    pagamento.formaPagamento = forma;
    pagamento.instituicaoId = instituicaoId;
    pagamento.dataPagamento = new Date().toISOString();
    pagamento.pagoPor = "secretaria";
  } else {
    pagamento.status = "pendente";
    pagamento.formaPagamento = null;
    pagamento.dataPagamento = null;
  }

  salvarPagamentosAlunos(pagamentos);

  if (pagamento.status === "pago" && typeof adicionarLancamentoContabil === "function") {
    const mesRef =
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0");
    const tituloReceita =
      (tipo === "matricula"
        ? "Taxa de matrícula"
        : tipo === "mensalidade"
          ? "Mensalidade"
          : "Receita") +
      " — " +
      matricula.nomeCompleto;
    adicionarLancamentoContabil(
      {
        codigo: "1.1",
        tipo: "receita",
        titulo: tituloReceita,
        valor: valor,
        referente: pagamento.referencia || tituloReceita,
        periodicidade: "mensal",
        referencia: mesRef,
        origem: "pagamento_presencial",
        vinculoId: pagamento.id
      },
      sessao
    );
  }

  if (pagamento.status === "pago" && typeof atualizarStatusMatricula === "function") {
    const novoStatus = tipo === "matricula" ? "confirmado" : "ativo";
    atualizarStatusMatricula(matricula.id, novoStatus);
  }

  return { ok: true, pagamento: pagamento };
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

function emailFuncionarioJaCadastrado(email, ignorarFuncionarioId) {
  const emailNormalizado = email.trim().toLowerCase();
  return obterFuncionarios().some(function (f) {
    if (ignorarFuncionarioId && f.id === ignorarFuncionarioId) return false;
    return f.email === emailNormalizado && f.ativo;
  });
}

function obterFuncionarioPorId(funcionarioId) {
  return obterFuncionarios().find(function (f) {
    return f.id === funcionarioId;
  }) || null;
}

function validarCadastroColaborador(dados, funcionarioIdEdicao) {
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
  if (emailFuncionarioJaCadastrado(dados.email, funcionarioIdEdicao || null)) {
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

function atualizarFuncionario(funcionarioId, dados) {
  const funcionarios = obterFuncionarios();
  const indice = funcionarios.findIndex(function (f) {
    return f.id === funcionarioId;
  });
  if (indice === -1) {
    return { ok: false, erro: "Colaborador não encontrado." };
  }

  const anterior = funcionarios[indice];
  funcionarios[indice] = Object.assign({}, anterior, normalizarColaborador(dados), {
    id: anterior.id,
    ativo: anterior.ativo,
    dataCadastro: anterior.dataCadastro,
    cadastradoPor: anterior.cadastradoPor,
    atualizadoPor: dados.atualizadoPor || null,
    atualizadoEm: new Date().toISOString()
  });
  salvarFuncionarios(funcionarios);
  return { ok: true, funcionario: funcionarios[indice] };
}

function desativarColaborador(funcionarioId, sessao) {
  const funcionarios = obterFuncionarios();
  const indice = funcionarios.findIndex(function (f) {
    return f.id === funcionarioId;
  });
  if (indice === -1) {
    return { ok: false, erro: "Colaborador não encontrado." };
  }

  funcionarios[indice].ativo = false;
  funcionarios[indice].desativadoEm = new Date().toISOString();
  funcionarios[indice].desativadoPor = sessao && sessao.email ? sessao.email : null;
  salvarFuncionarios(funcionarios);
  return { ok: true, funcionario: funcionarios[indice] };
}

function reativarColaborador(funcionarioId, sessao) {
  const funcionario = obterFuncionarioPorId(funcionarioId);
  if (!funcionario) {
    return { ok: false, erro: "Colaborador não encontrado." };
  }
  if (emailFuncionarioJaCadastrado(funcionario.email, funcionarioId)) {
    return {
      ok: false,
      erro: "Outro colaborador ativo já utiliza este e-mail. Ajuste o e-mail antes de reativar."
    };
  }

  const funcionarios = obterFuncionarios();
  const indice = funcionarios.findIndex(function (f) {
    return f.id === funcionarioId;
  });
  funcionarios[indice].ativo = true;
  funcionarios[indice].reativadoEm = new Date().toISOString();
  funcionarios[indice].reativadoPor = sessao && sessao.email ? sessao.email : null;
  salvarFuncionarios(funcionarios);
  return { ok: true, funcionario: funcionarios[indice] };
}

function excluirColaboradorDefinitivo(funcionarioId) {
  const folha = obterFolhaPagamento().filter(function (f) {
    return f.funcionarioId === funcionarioId;
  });
  if (folha.length > 0) {
    return {
      ok: false,
      erro:
        "Este colaborador possui histórico na folha de pagamento. Use “Desativar” para manter os registros."
    };
  }

  const listaAtual = obterFuncionarios();
  const funcionarios = listaAtual.filter(function (f) {
    return f.id !== funcionarioId;
  });
  if (funcionarios.length === listaAtual.length) {
    return { ok: false, erro: "Colaborador não encontrado." };
  }
  salvarFuncionarios(funcionarios);
  return { ok: true };
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

function salvarInstituicoesFinanceiras(lista) {
  if (financeiroApiAtivo()) {
    window.SETAD.setCache("instituicoes", lista, "instituicoes");
    return;
  }
  localStorage.setItem(FINANCEIRO_KEYS.instituicoes, JSON.stringify(lista));
}

function obterInstituicaoPorId(instituicaoId) {
  return obterInstituicoesFinanceiras().find(function (i) {
    return i.id === instituicaoId;
  }) || null;
}

function normalizarInstituicaoFinanceira(dados) {
  return {
    nome: (dados.nome || "").trim(),
    tipo: (dados.tipo || "").trim(),
    codigoBanco: dados.codigoBanco ? String(dados.codigoBanco).trim() : "",
    agencia: (dados.agencia || "").trim(),
    conta: (dados.conta || "").trim(),
    pixChave: dados.pixChave ? String(dados.pixChave).trim() : "",
    titular: dados.titular ? String(dados.titular).trim() : "",
    convenioBoleto: dados.convenioBoleto ? String(dados.convenioBoleto).trim() : "",
    status: dados.status || "ativo",
    ultimaSync: dados.ultimaSync || new Date().toISOString()
  };
}

function validarInstituicaoFinanceira(dados, instituicaoIdEdicao) {
  if (!dados.nome || dados.nome.length < 2) {
    return "Informe o nome do banco ou instituição.";
  }
  if (!dados.tipo) return "Informe o tipo de conta ou serviço.";
  const lista = obterInstituicoesFinanceiras();
  const duplicado = lista.find(function (i) {
    if (instituicaoIdEdicao && i.id === instituicaoIdEdicao) return false;
    return i.nome.toLowerCase() === dados.nome.toLowerCase();
  });
  if (duplicado) {
    return "Já existe uma instituição com este nome.";
  }
  return null;
}

function cadastrarInstituicaoFinanceira(dados, sessao) {
  const erro = validarInstituicaoFinanceira(dados, null);
  if (erro) return { ok: false, erro: erro };

  const lista = obterInstituicoesFinanceiras();
  const nova = Object.assign({}, normalizarInstituicaoFinanceira(dados), {
    id: gerarId("banco"),
    cadastradoPor: sessao && sessao.email ? sessao.email : null,
    cadastradoEm: new Date().toISOString()
  });
  lista.push(nova);
  salvarInstituicoesFinanceiras(lista);
  return { ok: true, instituicao: nova };
}

function atualizarInstituicaoFinanceira(instituicaoId, dados, sessao) {
  const lista = obterInstituicoesFinanceiras();
  const indice = lista.findIndex(function (i) {
    return i.id === instituicaoId;
  });
  if (indice === -1) {
    return { ok: false, erro: "Instituição não encontrada." };
  }

  const erro = validarInstituicaoFinanceira(dados, instituicaoId);
  if (erro) return { ok: false, erro: erro };

  lista[indice] = Object.assign({}, lista[indice], normalizarInstituicaoFinanceira(dados), {
    id: lista[indice].id,
    atualizadoPor: sessao && sessao.email ? sessao.email : null,
    atualizadoEm: new Date().toISOString()
  });
  salvarInstituicoesFinanceiras(lista);
  return { ok: true, instituicao: lista[indice] };
}

function obterContaBancariaSetad() {
  const instituicoes = obterInstituicoesFinanceiras();
  const pix = instituicoes.find(function (i) {
    return i.pixChave || (i.tipo && i.tipo.toLowerCase().indexOf("pix") >= 0);
  });
  const contaPrincipal = instituicoes.find(function (i) {
    return i.codigoBanco === "290" || (i.nome && i.nome.toLowerCase().indexOf("pagbank") >= 0);
  });

  const base = Object.assign({}, CONTA_BANCARIA_SETAD);
  if (contaPrincipal) {
    if (contaPrincipal.codigoBanco) base.banco = contaPrincipal.codigoBanco;
    if (contaPrincipal.nome) base.bancoNome = contaPrincipal.nome;
    if (contaPrincipal.agencia) base.agencia = contaPrincipal.agencia;
    if (contaPrincipal.conta) base.conta = contaPrincipal.conta;
    if (contaPrincipal.titular) base.titular = contaPrincipal.titular;
  }
  if (pix && pix.pixChave) {
    base.pixChave = pix.pixChave.replace(/\s/g, "");
    const digitos = base.pixChave.replace(/\D/g, "");
    if (digitos.length === 14) {
      base.cnpjNumeros = digitos;
      base.cnpj = digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    } else {
      base.cnpjNumeros = digitos || base.cnpjNumeros;
    }
  }
  return base;
}

function obterInstituicaoEmissaoBoleto() {
  const lista = obterInstituicoesFinanceiras();
  return (
    lista.find(function (i) {
      return i.convenioBoleto || (i.tipo && i.tipo.toLowerCase().indexOf("boleto") >= 0);
    }) ||
    lista.find(function (i) {
      return i.id === "banco-002";
    }) ||
    lista[0] ||
    { id: "banco-002", nome: "Convênio boleto", agencia: "—", conta: "—" }
  );
}

function calcularVencimentoBoleto(diasUteis) {
  const dias = diasUteis || 3;
  const data = new Date();
  let adicionados = 0;
  while (adicionados < dias) {
    data.setDate(data.getDate() + 1);
    const dia = data.getDay();
    if (dia !== 0 && dia !== 6) adicionados++;
  }
  return data.toISOString().slice(0, 10);
}

function gerarLinhaBoletoDemo(pagamentoId, valor) {
  const valorCentavos = String(Math.round((Number(valor) || 0) * 100)).padStart(10, "0");
  const sufixo = String(84610000000 + (String(pagamentoId || "").length * 137)).slice(0, 10);
  return "23793.38128 60000.00000" + valorCentavos.slice(0, 3) + " 00000.000400 1 " + sufixo;
}

function emitirBoletoParaPagamento(pagamentoId, emitidoPor) {
  const pagamentos = obterPagamentosAlunos();
  const indice = pagamentos.findIndex(function (p) {
    return p.id === pagamentoId;
  });
  if (indice === -1) {
    return { ok: false, erro: "Pagamento não encontrado." };
  }

  const pagamento = pagamentos[indice];
  if (pagamento.status === "pago") {
    return { ok: false, erro: "Este pagamento já está quitado." };
  }

  const instituicao = obterInstituicaoEmissaoBoleto();
  const vencimento = calcularVencimentoBoleto(3);
  const linhaDigitavel = gerarLinhaBoletoDemo(pagamento.id, pagamento.valor);
  const boleto = {
    linhaDigitavel: linhaDigitavel,
    nossoNumero: gerarId("bol"),
    vencimento: vencimento,
    emitidoEm: new Date().toISOString(),
    emitidoPor: emitidoPor || "sistema",
    instituicaoId: instituicao.id,
    bancoNome: instituicao.nome,
    convenio: instituicao.convenioBoleto || "—"
  };

  pagamentos[indice].boleto = boleto;
  pagamentos[indice].formaPagamento = "Boleto";
  pagamentos[indice].instituicaoId = instituicao.id;
  salvarPagamentosAlunos(pagamentos);

  const matricula = pagamento.matriculaId
    ? obterMatriculas().find(function (m) {
        return m.id === pagamento.matriculaId;
      })
    : obterMatriculaPorEmail(pagamento.alunoEmail);

  return {
    ok: true,
    pagamento: pagamentos[indice],
    boleto: boleto,
    sacado: {
      nome: pagamento.alunoNome || (matricula && matricula.nomeCompleto) || "Aluno SETAD",
      email: pagamento.alunoEmail,
      cpf: matricula && matricula.cpf ? matricula.cpf : "—"
    },
    cedente: obterContaBancariaSetad(),
    instituicao: instituicao
  };
}

function criarPagamentoParaBoletoSecretaria(dados, sessao) {
  const email = (dados.email || "").trim().toLowerCase();
  const matricula = obterMatriculaPorEmail(email);
  if (!matricula) {
    return { ok: false, erro: "Nenhuma matrícula encontrada para este e-mail." };
  }

  const valor = Number(dados.valor);
  if (!valor || valor <= 0) {
    return { ok: false, erro: "Informe um valor válido." };
  }

  const referencia = (dados.referencia || "Boleto emitido na secretaria").trim();
  const pagamentos = obterPagamentosAlunos();
  const novo = {
    id: gerarId("pag"),
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: email,
    modulo: matricula.modulo,
    tipo: dados.tipoCobranca || "mensalidade",
    valor: valor,
    referencia: referencia,
    vencimento: calcularVencimentoBoleto(3) + "T12:00:00.000Z",
    status: "pendente",
    formaPagamento: "Boleto",
    dataPagamento: null,
    criadoEm: new Date().toISOString(),
    canal: "secretaria",
    registradoPorSecretaria: sessao && sessao.email ? sessao.email : null
  };
  pagamentos.push(novo);
  salvarPagamentosAlunos(pagamentos);
  return emitirBoletoParaPagamento(novo.id, sessao && sessao.email ? sessao.email : "secretaria");
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

function obterResumoSecretariaParaContabilidade() {
  const matriculas = typeof obterMatriculas === "function" ? obterMatriculas() : [];
  const porOrigem = { site: 0, presencial: 0, quadro: 0, whatsapp: 0 };
  let ativos = 0;
  let pendentesMatricula = 0;

  matriculas.forEach(function (m) {
    const origem = m.origem || "site";
    if (porOrigem[origem] !== undefined) {
      porOrigem[origem]++;
    }
    if (m.status === "ativo" || m.status === "confirmado") {
      ativos++;
    }
    if (m.status === "pendente") {
      pendentesMatricula++;
    }
  });

  const pagamentos = obterPagamentosAlunos();
  let qtdPagos = 0;
  let qtdEmAberto = 0;

  pagamentos.forEach(function (p) {
    if (p.status === "pago") qtdPagos++;
    if (p.status === "pendente" || p.status === "agendado") qtdEmAberto++;
  });

  return {
    totalMatriculas: matriculas.length,
    alunosAtivos: ativos,
    pendentesMatricula: pendentesMatricula,
    porOrigem: porOrigem,
    totalPagamentos: pagamentos.length,
    qtdPagos: qtdPagos,
    qtdEmAberto: qtdEmAberto
  };
}

function listarPagamentosResumoContador(tipo) {
  const lista = obterPagamentosAlunos().slice().sort(function (a, b) {
    const da = a.dataPagamento || a.vencimento || a.criadoEm || "";
    const db = b.dataPagamento || b.vencimento || b.criadoEm || "";
    return db.localeCompare(da);
  });

  if (tipo === "recebido") {
    return lista.filter(function (p) {
      return p.status === "pago";
    });
  }
  if (tipo === "pendente") {
    return lista.filter(function (p) {
      return p.status === "pendente" || p.status === "agendado";
    });
  }
  return lista;
}

function montarTabelaPagamentosResumoContador(pagamentos, limite) {
  const fatia = pagamentos.slice(0, limite || 12);
  if (!fatia.length) {
    return '<p class="painel-vazio">Nenhum registro nesta categoria.</p>';
  }
  return (
    '<table class="data-table data-table--compact">' +
      "<thead><tr><th>Aluno</th><th>Referência</th><th>Valor</th><th>Status</th></tr></thead><tbody>" +
      fatia
        .map(function (p) {
          return (
            "<tr>" +
              "<td>" + escaparHtml(p.alunoNome || "—") + "</td>" +
              "<td>" + escaparHtml(p.referencia || "—") + "</td>" +
              "<td>" + formatarMoeda(p.valor || 0) + "</td>" +
              '<td><span class="status-badge ' + obterClassePagamentoStatus(p.status) + '">' +
                obterLabelPagamentoStatus(p.status) + "</span></td>" +
            "</tr>"
          );
        })
        .join("") +
      "</tbody></table>"
  );
}

function ativarAbaPainelContador(tabId) {
  const link = document.querySelector('.painel__nav-link[data-tab="' + tabId + '"]');
  if (link) link.click();
}

function configurarInteracoesDashboardContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function alternarDetalhe(tipo) {
    const painel = document.getElementById("contadorDetalhe" + tipo);
    const card = container.querySelector('[data-contador-card="' + tipo + '"]');
    if (!painel || !card) return;

    const aberto = !painel.hidden;
    container.querySelectorAll(".contador-painel-detalhe").forEach(function (el) {
      el.hidden = true;
    });
    container.querySelectorAll(".financeiro-card--interativo").forEach(function (el) {
      el.classList.remove("financeiro-card--aberto");
    });

    if (!aberto) {
      painel.hidden = false;
      card.classList.add("financeiro-card--aberto");
    }
  }

  container.querySelectorAll("[data-contador-card]").forEach(function (card) {
    card.addEventListener("click", function () {
      alternarDetalhe(card.getAttribute("data-contador-card"));
    });
    card.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        alternarDetalhe(card.getAttribute("data-contador-card"));
      }
    });
  });

  container.querySelectorAll("[data-contador-ir-aba]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      ativarAbaPainelContador(btn.getAttribute("data-contador-ir-aba"));
    });
  });
}

function renderizarDashboardContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const resumo = resumoFinanceiro();
  const sec = obterResumoSecretariaParaContabilidade();
  const pagosLista = listarPagamentosResumoContador("recebido");
  const pendLista = listarPagamentosResumoContador("pendente");

  container.innerHTML =
    '<div class="financeiro-cards financeiro-cards--destaque">' +
      '<article class="financeiro-card financeiro-card--interativo" tabindex="0" role="button" ' +
        'data-contador-card="Recebido" aria-expanded="false">' +
        '<p class="financeiro-card__label">Recebido (alunos) · clique para detalhes</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.recebidoAlunos) + "</p>" +
        "<small>" + sec.qtdPagos + " pagamento(s) confirmado(s)</small>" +
      "</article>" +
      '<article class="financeiro-card financeiro-card--interativo financeiro-card--alerta" tabindex="0" role="button" ' +
        'data-contador-card="Pendente" aria-expanded="false">' +
        '<p class="financeiro-card__label">Pendente (alunos) · clique para detalhes</p>' +
        '<p class="financeiro-card__valor financeiro-card__valor--alerta">' + formatarMoeda(resumo.pendenteAlunos) + "</p>" +
        "<small>" + sec.qtdEmAberto + " em aberto</small>" +
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
    '<div id="contadorDetalheRecebido" class="contador-painel-detalhe" hidden>' +
      "<h4>Pagamentos recebidos (amostra)</h4>" +
      montarTabelaPagamentosResumoContador(pagosLista, 15) +
      '<button type="button" class="btn btn--sm btn--secondary" data-contador-ir-aba="tab-pagamentos-alunos">Ver todos os pagamentos</button>' +
    "</div>" +
    '<div id="contadorDetalhePendente" class="contador-painel-detalhe" hidden>' +
      "<h4>Pagamentos pendentes ou agendados</h4>" +
      montarTabelaPagamentosResumoContador(pendLista, 15) +
      '<button type="button" class="btn btn--sm btn--secondary" data-contador-ir-aba="tab-pagamentos-alunos">Ir para pagamentos de alunos</button>' +
    "</div>" +
    '<h3 class="financeiro-subtitulo">Resumo da contabilidade</h3>' +
    '<p class="contador-painel-hint">Acesso rápido às áreas do painel financeiro e contábil.</p>' +
    '<div class="contador-areas-grid">' +
      '<button type="button" class="contador-area-card" data-contador-ir-aba="tab-pagamentos-alunos">' +
        "<strong>Pagamentos de alunos</strong><span>Extrato e confirmações</span></button>" +
      '<button type="button" class="contador-area-card" data-contador-ir-aba="tab-folha">' +
        "<strong>Folha de pagamento</strong><span>Funcionários e repasses</span></button>" +
      '<button type="button" class="contador-area-card" data-contador-ir-aba="tab-funcionarios">' +
        "<strong>Funcionários</strong><span>Cadastro e remuneração</span></button>" +
      '<button type="button" class="contador-area-card" data-contador-ir-aba="tab-instituicoes">' +
        "<strong>Bancos e PIX</strong><span>Contas e convênios</span></button>" +
      '<button type="button" class="contador-area-card" data-contador-ir-aba="tab-relatorios">' +
        "<strong>Relatórios e DRE</strong><span>Documentos e demonstrativos</span></button>" +
    "</div>" +
    '<h3 class="financeiro-subtitulo">Dados da secretaria (somente leitura)</h3>' +
    '<p class="contador-painel-hint">Visão consolidada de matrículas e inscrições registradas pela secretaria e pelo site.</p>' +
    '<div class="modulos-resumo contador-secretaria-resumo">' +
      '<article class="modulo-card-resumo modulo-card-resumo--medio">' +
        '<span class="modulo-card-resumo__numero">' + sec.totalMatriculas + "</span>" +
        '<span class="modulo-card-resumo__nome">Alunos inscritos</span></article>' +
      '<article class="modulo-card-resumo modulo-card-resumo--avancado">' +
        '<span class="modulo-card-resumo__numero">' + sec.alunosAtivos + "</span>" +
        '<span class="modulo-card-resumo__nome">Matrículas ativas</span></article>' +
      '<article class="modulo-card-resumo modulo-card-resumo--basico">' +
        '<span class="modulo-card-resumo__numero">' + sec.pendentesMatricula + "</span>" +
        '<span class="modulo-card-resumo__nome">Cadastros pendentes</span></article>' +
      '<article class="modulo-card-resumo modulo-card-resumo--teologia">' +
        '<span class="modulo-card-resumo__numero">' + sec.totalPagamentos + "</span>" +
        '<span class="modulo-card-resumo__nome">Lançamentos de pagamento</span></article>' +
    "</div>" +
    '<div class="secretaria-resumo-origens contador-secretaria-origens">' +
      "<p><strong>Site:</strong> " + sec.porOrigem.site + " · " +
      "<strong>Presencial:</strong> " + sec.porOrigem.presencial + " · " +
      "<strong>Quadro:</strong> " + sec.porOrigem.quadro + " · " +
      "<strong>WhatsApp:</strong> " + sec.porOrigem.whatsapp + "</p>" +
      "<p><strong>Pagamentos quitados:</strong> " + sec.qtdPagos +
      " · <strong>Em aberto:</strong> " + sec.qtdEmAberto + "</p>" +
    "</div>";

  configurarInteracoesDashboardContador(containerId);
}

function obterLabelTipoPagamentoAluno(tipo) {
  const mapa = {
    matricula: "Matrícula",
    mensalidade: "Mensalidade",
    outro: "Outro"
  };
  return mapa[tipo] || tipo || "—";
}

function montarOpcoesStatusPagamento(valorAtual) {
  return ["pago", "pendente", "agendado", "cancelado"]
    .map(function (st) {
      const sel = st === valorAtual ? " selected" : "";
      return (
        '<option value="' + st + '"' + sel + ">" +
        escaparHtml(obterLabelPagamentoStatus(st)) +
        "</option>"
      );
    })
    .join("");
}

function montarFormularioPagamentoContador(p, instituicoes) {
  const formas =
    '<option value="">Forma</option>' +
    ["PIX", "Boleto", "Cartão", "Dinheiro", "Transferência bancária", "Cheque"]
      .map(function (f) {
        const sel = p.formaPagamento === f ? " selected" : "";
        return '<option value="' + escaparHtml(f) + '"' + sel + ">" + escaparHtml(f) + "</option>";
      })
      .join("");

  const bancos =
    '<option value="">Banco / conta</option>' +
    instituicoes
      .map(function (i) {
        const sel = p.instituicaoId === i.id ? " selected" : "";
        return (
          '<option value="' + escaparHtml(i.id) + '"' + sel + ">" +
          escaparHtml(i.nome) +
          "</option>"
        );
      })
      .join("");

  return (
    '<form class="contador-pagamento-form" data-pagamento-id="' + escaparHtml(p.id) + '">' +
      '<div class="contador-pagamento-form__grid">' +
        '<div class="form-group"><label>Referência</label>' +
          '<input type="text" name="referencia" value="' + escaparHtml(p.referencia || "") + '" required></div>' +
        '<div class="form-group"><label>Tipo</label>' +
          '<input type="text" readonly class="input-readonly" value="' +
          escaparHtml(obterLabelTipoPagamentoAluno(p.tipo)) + '"></div>' +
        '<div class="form-group"><label>Valor (R$)</label>' +
          '<input type="number" name="valor" min="0.01" step="0.01" value="' +
          escaparHtml(String(p.valor || 0)) + '" required></div>' +
        '<div class="form-group"><label>Vencimento</label>' +
          '<input type="date" name="vencimento" value="' + escaparHtml(isoParaInputData(p.vencimento)) + '"></div>' +
        '<div class="form-group"><label>Status</label>' +
          '<select name="status">' + montarOpcoesStatusPagamento(p.status) + "</select></div>" +
        '<div class="form-group"><label>Forma de pagamento</label><select name="formaPagamento">' + formas + "</select></div>" +
        '<div class="form-group"><label>Conta recebedora</label><select name="instituicaoId">' + bancos + "</select></div>" +
        '<div class="form-group"><label>Data do pagamento</label>' +
          '<input type="date" name="dataPagamento" value="' +
          escaparHtml(isoParaInputData(p.dataPagamento)) + '"></div>' +
        '<div class="form-group form-group--full"><label>Observações</label>' +
          '<textarea name="observacoes" rows="2" placeholder="Anotações internas (opcional)">' +
          escaparHtml(p.observacoes || "") + "</textarea></div>" +
      "</div>" +
      '<div class="contador-pagamento-form__acoes">' +
        '<button type="submit" class="btn btn--small btn--primary">Salvar alterações</button>' +
        (p.status !== "pago"
          ? '<button type="button" class="btn btn--small btn--secondary" data-acao-confirmar-rapido="1">' +
            "Confirmar como pago</button>"
          : "") +
        (p.canal ? '<span class="contador-pagamento-meta">Canal: ' + escaparHtml(p.canal) + "</span>" : "") +
        (p.pagoPor ? '<span class="contador-pagamento-meta">Registrado por: ' + escaparHtml(p.pagoPor) + "</span>" : "") +
      "</div>" +
    "</form>"
  );
}

function montarDetalheAlunoPagamentosContador(email, instituicoes) {
  const emailNorm = email.trim().toLowerCase();
  const parcelas = obterPagamentosPorAluno(email);
  const resumo = resumoExtratoAluno(email);
  const matricula = typeof obterMatriculaPorEmail === "function"
    ? obterMatriculaPorEmail(email)
    : null;
  const nome =
    (matricula && matricula.nomeCompleto) ||
    (parcelas[0] && parcelas[0].alunoNome) ||
    "Aluno";
  const moduloId = (matricula && matricula.modulo) || (parcelas[0] && parcelas[0].modulo);
  const moduloNome = moduloId && MODULOS_CURSO[moduloId]
    ? MODULOS_CURSO[moduloId].nome
    : moduloId || "—";

  let blocoMatricula = "";
  if (matricula) {
    blocoMatricula =
      '<dl class="contador-aluno-dados-matricula">' +
        "<div><dt>E-mail</dt><dd>" + escaparHtml(matricula.email || "—") + "</dd></div>" +
        "<div><dt>CPF</dt><dd>" + escaparHtml(matricula.cpf || "—") + "</dd></div>" +
        "<div><dt>Telefone</dt><dd>" + escaparHtml(matricula.telefone || matricula.whatsapp || "—") + "</dd></div>" +
        "<div><dt>Status da matrícula</dt><dd>" + escaparHtml(matricula.status || "—") + "</dd></div>" +
        "<div><dt>Origem</dt><dd>" + escaparHtml(matricula.origem || "site") + "</dd></div>" +
        "<div><dt>Módulo</dt><dd>" + escaparHtml(moduloNome) + "</dd></div>" +
        (matricula.dataMatricula
          ? "<div><dt>Data da inscrição</dt><dd>" + formatarData(matricula.dataMatricula) + "</dd></div>"
          : "") +
      "</dl>";
  } else {
    blocoMatricula =
      '<p class="contador-painel-hint">Nenhuma ficha de matrícula vinculada a este e-mail; exibindo apenas lançamentos financeiros.</p>';
  }

  const listaPagamentos = parcelas.length
    ? parcelas
        .map(function (p) {
          return (
            '<article class="contador-pagamento-item">' +
              '<header class="contador-pagamento-item__cabecalho">' +
                "<strong>" + escaparHtml(p.referencia || "Pagamento") + "</strong>" +
                '<span class="status-badge ' + obterClassePagamentoStatus(p.status) + '">' +
                  obterLabelPagamentoStatus(p.status) + "</span>" +
              "</header>" +
              montarFormularioPagamentoContador(p, instituicoes) +
            "</article>"
          );
        })
        .join("")
    : '<p class="painel-vazio">Nenhum lançamento para este aluno.</p>';

  return (
    '<div id="contadorAlunoPagamentoDetalhe" class="contador-aluno-detalhe contador-aluno-detalhe--pagina">' +
      '<div class="contador-aluno-detalhe__topo">' +
        "<div>" +
          "<h3 class=\"financeiro-subtitulo\">" + escaparHtml(nome) + "</h3>" +
          "<p class=\"contador-painel-hint\">" + escaparHtml(emailNorm) + " · relatório financeiro completo</p>" +
        "</div>" +
      "</div>" +
      '<div class="modulos-resumo contador-aluno-resumo-financeiro">' +
        '<article class="modulo-card-resumo modulo-card-resumo--avancado">' +
          '<span class="modulo-card-resumo__numero">' + formatarMoeda(resumo.valorPago) + "</span>" +
          '<span class="modulo-card-resumo__nome">Total recebido</span></article>' +
        '<article class="modulo-card-resumo modulo-card-resumo--basico">' +
          '<span class="modulo-card-resumo__numero">' + formatarMoeda(resumo.valorPendente) + "</span>" +
          '<span class="modulo-card-resumo__nome">Pendente</span></article>' +
        '<article class="modulo-card-resumo modulo-card-resumo--medio">' +
          '<span class="modulo-card-resumo__numero">' + formatarMoeda(resumo.valorAgendado) + "</span>" +
          '<span class="modulo-card-resumo__nome">Agendado</span></article>' +
        '<article class="modulo-card-resumo modulo-card-resumo--teologia">' +
          '<span class="modulo-card-resumo__numero">' + formatarMoeda(resumo.valorCurso) + "</span>" +
          '<span class="modulo-card-resumo__nome">Total do extrato</span></article>' +
      "</div>" +
      "<h4>Dados da secretaria / matrícula</h4>" +
      blocoMatricula +
      "<h4>Pagamentos e edição</h4>" +
      '<div class="contador-pagamentos-lista">' + listaPagamentos + "</div>" +
    "</div>"
  );
}

function configurarListaPagamentosAlunosContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function abrirRelatorio(email) {
    navegarRelatorioAlunoPagamentosContador(email);
  }

  container.querySelectorAll("[data-contador-aluno-email]").forEach(function (linha) {
    linha.addEventListener("click", function (evento) {
      if (evento.target.closest("button, a, input, select, form, textarea")) return;
      abrirRelatorio(linha.getAttribute("data-contador-aluno-email"));
    });
    linha.addEventListener("keydown", function (evento) {
      if (evento.key !== "Enter" && evento.key !== " ") return;
      evento.preventDefault();
      abrirRelatorio(linha.getAttribute("data-contador-aluno-email"));
    });
  });
}

function configurarFormulariosPagamentoContador(containerId, aoAtualizar) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll(".contador-pagamento-form").forEach(function (form) {
    const btnRapido = form.querySelector("[data-acao-confirmar-rapido]");
    if (btnRapido) {
      btnRapido.addEventListener("click", function () {
        const forma = form.formaPagamento ? form.formaPagamento.value : "";
        const inst = form.instituicaoId ? form.instituicaoId.value : "";
        if (!forma) {
          alert("Selecione a forma de pagamento antes de confirmar.");
          return;
        }
        if (!confirm("Confirmar este pagamento como quitado?")) return;
        const id = form.getAttribute("data-pagamento-id");
        const resultado = registrarPagamentoAluno(id, forma, inst);
        if (resultado.ok) {
          if (typeof aoAtualizar === "function") aoAtualizar();
          else renderizarPagamentosAlunosContador(containerId);
          if (document.getElementById("dashboardContadorContainer")) {
            renderizarDashboardContador("dashboardContadorContainer");
          }
        } else {
          alert(resultado.erro || "Não foi possível confirmar.");
        }
      });
    }

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const id = form.getAttribute("data-pagamento-id");
      const campos = {
        referencia: form.referencia.value,
        valor: form.valor.value,
        vencimento: form.vencimento ? form.vencimento.value : "",
        status: form.status.value,
        formaPagamento: form.formaPagamento ? form.formaPagamento.value : "",
        instituicaoId: form.instituicaoId ? form.instituicaoId.value : "",
        dataPagamento: form.dataPagamento ? form.dataPagamento.value : "",
        observacoes: form.observacoes ? form.observacoes.value : ""
      };

      const antes = obterPagamentosAlunos().find(function (p) {
        return p.id === id;
      });
      if (antes && antes.status !== "pago" && campos.status === "pago") {
        if (!confirm("Marcar este lançamento como pago?")) return;
      }
      if (antes && antes.status === "pago" && campos.status !== "pago") {
        if (
          !confirm(
            "Reabrir este pagamento (deixar em aberto)? Os dados de quitação serão removidos."
          )
        ) {
          return;
        }
      }

      const resultado = atualizarPagamentoContador(id, campos);
      if (!resultado.ok) {
        alert(resultado.erro || "Não foi possível salvar.");
        return;
      }
      if (typeof aoAtualizar === "function") aoAtualizar();
      else renderizarPagamentosAlunosContador(containerId);
      if (document.getElementById("dashboardContadorContainer")) {
        renderizarDashboardContador("dashboardContadorContainer");
      }
    });
  });
}

function renderizarRelatorioAlunoPagamentosContador(containerId, email) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const emailBruto = String(email || "").trim();
  if (!emailBruto) {
    container.innerHTML =
      '<p class="painel-vazio">Nenhum aluno informado.</p>' +
      '<p><a href="painel-contador.html#tab-pagamentos-alunos">Voltar à lista de pagamentos</a></p>';
    return;
  }

  const instituicoes = obterInstituicoesFinanceiras();
  container.innerHTML = montarDetalheAlunoPagamentosContador(emailBruto, instituicoes);

  const titulo = document.getElementById("relatorioAlunoTitulo");
  const subtitulo = document.getElementById("relatorioAlunoSubtitulo");
  const detalhe = document.getElementById("contadorAlunoPagamentoDetalhe");
  const nomeAluno = detalhe
    ? detalhe.querySelector(".financeiro-subtitulo")
    : null;
  if (titulo && nomeAluno) {
    titulo.textContent = "Pagamentos — " + nomeAluno.textContent;
  }
  if (subtitulo) {
    subtitulo.textContent =
      "Extrato, dados da secretaria e edição de cada lançamento deste aluno.";
  }

  configurarFormulariosPagamentoContador(containerId, function () {
    renderizarRelatorioAlunoPagamentosContador(containerId, emailBruto);
  });
}

function renderizarPagamentosAlunosContador(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const alunos = listarAlunosResumoPagamentosContador();

  if (alunos.length === 0) {
    container.innerHTML = '<p class="painel-vazio">Nenhum aluno com pagamentos registrado ainda.</p>';
    return;
  }

  const linhas = alunos
    .map(function (aluno) {
      const resumo = resumoExtratoAluno(aluno.email);
      const moduloNome =
        aluno.modulo && MODULOS_CURSO[aluno.modulo]
          ? MODULOS_CURSO[aluno.modulo].nome
          : "";

      return (
        '<tr class="contador-aluno-linha" ' +
          'tabindex="0" role="link" data-contador-aluno-email="' + escaparHtml(aluno.email) + '">' +
          "<td><strong>" + escaparHtml(aluno.nome) + "</strong><br>" +
            "<small>" + escaparHtml(aluno.email) + "</small>" +
            (moduloNome ? "<br><small>" + escaparHtml(moduloNome) + "</small>" : "") +
          "</td>" +
          "<td>" + formatarMoeda(resumo.valorPago) + "<br><small>" + resumo.qtdPagas + " quitado(s)</small></td>" +
          "<td>" + formatarMoeda(resumo.valorPendente + resumo.valorAgendado) + "</td>" +
          "<td>" + formatarMoeda(resumo.valorCurso) + "<br><small>" + resumo.totalParcelas + " lançamento(s)</small></td>" +
          "<td><span class=\"contador-aluno-linha__hint\">Abrir relatório</span></td>" +
        "</tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<p class="contador-painel-hint">Resumo por aluno. Clique em uma linha para abrir o relatório em página dedicada (dados da secretaria e edição de pagamentos).</p>' +
    '<table class="data-table contador-alunos-resumo-table">' +
      "<thead><tr>" +
        "<th>Aluno</th><th>Recebido</th><th>Em aberto</th><th>Total extrato</th><th></th>" +
      "</tr></thead><tbody>" +
      linhas +
    "</tbody></table>";

  configurarListaPagamentosAlunosContador(containerId);
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

function lerDadosFormularioColaborador(sessao) {
  return {
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
    cadastradoPor: sessao ? sessao.nome : "Sistema",
    atualizadoPor: sessao ? sessao.email : null
  };
}

function preencherFormularioColaborador(funcionario) {
  document.getElementById("colabEditId").value = funcionario.id;
  document.getElementById("colabNome").value = funcionario.nome || "";
  document.getElementById("colabEmail").value = funcionario.email || "";
  document.getElementById("colabTelefone").value = funcionario.telefone || "";
  document.getElementById("colabTipo").value = funcionario.tipo || "";
  document.getElementById("colabVinculo").value = funcionario.vinculo || "clt";
  document.getElementById("colabCargo").value = funcionario.cargo || "";
  document.getElementById("colabSetor").value = funcionario.setor || "";
  document.getElementById("colabAdmissao").value =
    funcionario.dataAdmissao || new Date().toISOString().slice(0, 10);
  document.getElementById("colabSalario").value = String(funcionario.salario || 0);
  document.getElementById("colabAjuda").value = String(funcionario.ajudaCusto || 0);
  document.getElementById("colabVale").value = String(funcionario.valeTransporte || 0);
  document.getElementById("colabBeneficios").value = funcionario.outrosBeneficios || "";
  document.getElementById("colabObs").value = funcionario.observacoes || "";

  const titulo = document.getElementById("colabFormTitulo");
  const btnCancelar = document.getElementById("colabBtnCancelar");
  const btnSalvar = document.getElementById("colabBtnSalvar");
  if (titulo) titulo.textContent = "Editar colaborador";
  if (btnCancelar) btnCancelar.hidden = false;
  if (btnSalvar) btnSalvar.textContent = "Salvar alterações";
}

function resetFormularioColaborador(hoje) {
  const form = document.getElementById("formColaborador");
  if (form) form.reset();
  document.getElementById("colabEditId").value = "";
  document.getElementById("colabAdmissao").value = hoje;
  document.getElementById("colabAjuda").value = "0";
  document.getElementById("colabVale").value = "0";
  document.getElementById("colabVinculo").value = "clt";

  const titulo = document.getElementById("colabFormTitulo");
  const btnCancelar = document.getElementById("colabBtnCancelar");
  const btnSalvar = document.getElementById("colabBtnSalvar");
  if (titulo) titulo.textContent = "Novo colaborador";
  if (btnCancelar) btnCancelar.hidden = true;
  if (btnSalvar) btnSalvar.textContent = "Salvar colaborador";
}

function renderizarCadastroColaboradores(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const funcionarios = obterFuncionarios().slice().sort(function (a, b) {
    return new Date(b.dataCadastro || b.dataAdmissao || 0) -
      new Date(a.dataCadastro || a.dataAdmissao || 0);
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const editIdPreservar = container.dataset.colabEditId || "";

  container.innerHTML =
    '<p class="financeiro-aviso">Cadastro de professores e colaboradores do seminário. ' +
      "Os valores informados alimentam a folha de pagamento na contabilidade. " +
      "Use <strong>Editar</strong> para alterar dados e remuneração; <strong>Desativar</strong> encerra o vínculo ativo (mantém histórico na folha).</p>" +
    '<div id="colabMensagem" class="form-mensagem" role="alert"></div>' +
    '<form id="formColaborador" class="financeiro-form-agendar colaboradores-form">' +
      '<input type="hidden" id="colabEditId" value="' + escaparHtml(editIdPreservar) + '">' +
      '<h3 id="colabFormTitulo">Novo colaborador</h3>' +
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
          '<button type="submit" class="btn btn--primary" id="colabBtnSalvar">Salvar colaborador</button>' +
          '<button type="button" class="btn btn--secondary" id="colabBtnCancelar" hidden>Cancelar edição</button>' +
        "</div>" +
      "</div>" +
    "</form>" +
    "<h3 class=\"financeiro-subtitulo\">Equipe cadastrada (" + funcionarios.length + ")</h3>" +
    (funcionarios.length === 0
      ? '<p class="lista-vazia">Nenhum colaborador cadastrado ainda.</p>'
      : '<table class="data-table colaboradores-tabela">' +
          "<thead><tr>" +
            "<th>Nome</th><th>Tipo</th><th>Cargo / Setor</th>" +
            "<th>Salário</th><th>Ajuda custo</th><th>Total</th><th>Status</th><th>Ações</th>" +
          "</tr></thead><tbody>" +
          funcionarios.map(function (f) {
            const total = calcularRemuneracaoTotal(f);
            const acoes = f.ativo
              ? '<button type="button" class="btn btn--sm btn--secondary" data-colab-acao="editar" data-colab-id="' +
                escaparHtml(f.id) + '">Editar</button> ' +
                '<button type="button" class="btn btn--sm btn--danger" data-colab-acao="desativar" data-colab-id="' +
                escaparHtml(f.id) + '">Desativar</button>'
              : '<button type="button" class="btn btn--sm btn--secondary" data-colab-acao="editar" data-colab-id="' +
                escaparHtml(f.id) + '">Editar</button> ' +
                '<button type="button" class="btn btn--sm btn--primary" data-colab-acao="reativar" data-colab-id="' +
                escaparHtml(f.id) + '">Reativar</button> ' +
                '<button type="button" class="btn btn--sm btn--danger" data-colab-acao="excluir" data-colab-id="' +
                escaparHtml(f.id) + '">Excluir</button>';
            return (
              "<tr" + (f.ativo ? "" : ' class="colaboradores-linha--inativo"') + ">" +
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
                '<td class="colaboradores-tabela__acoes">' + acoes + "</td>" +
              "</tr>"
            );
          }).join("") +
        "</tbody></table>");

  const telefoneInput = document.getElementById("colabTelefone");
  if (telefoneInput && typeof aplicarMascaraTelefone === "function") {
    aplicarMascaraTelefone(telefoneInput);
  }

  if (editIdPreservar) {
    const emEdicao = obterFuncionarioPorId(editIdPreservar);
    if (emEdicao) preencherFormularioColaborador(emEdicao);
    else resetFormularioColaborador(hoje);
  } else {
    resetFormularioColaborador(hoje);
  }

  const btnCancelar = document.getElementById("colabBtnCancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", function () {
      container.dataset.colabEditId = "";
      resetFormularioColaborador(hoje);
      const mensagemEl = document.getElementById("colabMensagem");
      mensagemEl.className = "form-mensagem";
      mensagemEl.textContent = "";
    });
  }

  container.querySelectorAll("[data-colab-acao]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-colab-id");
      const acao = btn.getAttribute("data-colab-acao");
      const mensagemEl = document.getElementById("colabMensagem");
      const funcionario = obterFuncionarioPorId(id);
      if (!funcionario) return;

      if (acao === "editar") {
        container.dataset.colabEditId = id;
        preencherFormularioColaborador(funcionario);
        mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
        mensagemEl.textContent = "Editando: " + funcionario.nome + ". Altere os campos e salve.";
        document.getElementById("formColaborador").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (acao === "desativar") {
        if (!confirm("Desativar " + funcionario.nome + "? Ele deixa de aparecer na folha ativa, mas o histórico é mantido.")) {
          return;
        }
        const res = desativarColaborador(id, sessao);
        if (!res.ok) {
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = res.erro;
          return;
        }
        container.dataset.colabEditId = "";
        renderizarCadastroColaboradores(containerId, sessao);
        return;
      }

      if (acao === "reativar") {
        const res = reativarColaborador(id, sessao);
        if (!res.ok) {
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = res.erro;
          return;
        }
        renderizarCadastroColaboradores(containerId, sessao);
        return;
      }

      if (acao === "excluir") {
        if (!confirm("Excluir permanentemente " + funcionario.nome + "? Só é possível sem histórico na folha.")) {
          return;
        }
        const res = excluirColaboradorDefinitivo(id);
        if (!res.ok) {
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = res.erro;
          return;
        }
        container.dataset.colabEditId = "";
        renderizarCadastroColaboradores(containerId, sessao);
      }
    });
  });

  document.getElementById("formColaborador").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagemEl = document.getElementById("colabMensagem");
    mensagemEl.className = "form-mensagem";
    mensagemEl.textContent = "";

    const editId = document.getElementById("colabEditId").value.trim();
    const dados = lerDadosFormularioColaborador(sessao);

    const erro = validarCadastroColaborador(dados, editId || null);
    if (erro) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = erro;
      return;
    }

    if (editId) {
      const resultado = atualizarFuncionario(editId, dados);
      if (!resultado.ok) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = resultado.erro;
        return;
      }
      container.dataset.colabEditId = "";
      mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
      mensagemEl.textContent = "Cadastro de " + resultado.funcionario.nome + " atualizado.";
      renderizarCadastroColaboradores(containerId, sessao);
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

function renderizarInstituicoesContador(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const instituicoes = obterInstituicoesFinanceiras();
  const editId = container.dataset.instEditId || "";
  const painelFormAberto = editId ? " open" : "";

  container.innerHTML =
    '<p class="financeiro-aviso">Contas e PIX usados em boletos e repasses. Edite os cartões abaixo quando necessário.</p>' +
    '<div id="instMensagem" class="form-mensagem" role="alert"></div>' +
    '<h3 class="financeiro-subtitulo">Instituições cadastradas</h3>' +
    '<div class="financeiro-inst-grid">' +
      instituicoes.map(function (inst) {
        const ehPix = inst.pixChave || (inst.tipo && inst.tipo.toLowerCase().indexOf("pix") >= 0);
        return (
          '<article class="financeiro-inst-card">' +
            "<h3>" + escaparHtml(inst.nome) + "</h3>" +
            "<p>" + escaparHtml(inst.tipo) + "</p>" +
            (inst.codigoBanco ? "<p><strong>Banco:</strong> " + escaparHtml(inst.codigoBanco) + "</p>" : "") +
            "<p><strong>Agência:</strong> " + escaparHtml(inst.agencia || "—") + "</p>" +
            "<p><strong>Conta:</strong> " + escaparHtml(inst.conta || "—") + "</p>" +
            (ehPix ? "<p><strong>PIX:</strong> " + escaparHtml(inst.pixChave || inst.conta || "—") + "</p>" : "") +
            (inst.convenioBoleto ? "<p><strong>Convênio boleto:</strong> " + escaparHtml(inst.convenioBoleto) + "</p>" : "") +
            (inst.titular ? "<p><small>" + escaparHtml(inst.titular) + "</small></p>" : "") +
            '<p><span class="status-badge status--entregue">' + escaparHtml(inst.status || "ativo") + "</span></p>" +
            '<p class="colaboradores-tabela__acoes">' +
              '<button type="button" class="btn btn--sm btn--secondary" data-inst-edit="' + escaparHtml(inst.id) + '">Editar</button>' +
            "</p>" +
          "</article>"
        );
      }).join("") +
    "</div>" +
    '<details class="inst-banco-novo" id="instPainelNovo"' + painelFormAberto + ">" +
      '<summary class="inst-banco-novo__toggle">Adicionar novo banco</summary>' +
      '<div class="inst-banco-novo__corpo">' +
    '<form id="formInstituicao" class="financeiro-form-agendar colaboradores-form inst-banco-novo__form">' +
      '<input type="hidden" id="instEditId" value="' + escaparHtml(editId) + '">' +
      '<p id="instFormTitulo" class="inst-banco-novo__titulo">Novo banco / instituição</p>' +
      '<div class="financeiro-form-grid colaboradores-form__grid inst-banco-novo__grid">' +
        '<div class="form-group form-group--full"><label for="instNome">Nome *</label>' +
          '<input type="text" id="instNome" required placeholder="Ex.: Caixa, PagBank, PIX SETAD"></div>' +
        '<div class="form-group"><label for="instTipo">Tipo *</label>' +
          '<input type="text" id="instTipo" required placeholder="Conta corrente, PIX, boleto..."></div>' +
        '<div class="form-group"><label for="instCodigoBanco">Código do banco</label>' +
          '<input type="text" id="instCodigoBanco" placeholder="Ex.: 104, 290"></div>' +
        '<div class="form-group"><label for="instAgencia">Agência</label>' +
          '<input type="text" id="instAgencia"></div>' +
        '<div class="form-group"><label for="instConta">Conta / identificador</label>' +
          '<input type="text" id="instConta"></div>' +
        '<div class="form-group form-group--full"><label for="instPixChave">Chave PIX (se aplicável)</label>' +
          '<input type="text" id="instPixChave" placeholder="CNPJ, e-mail ou chave aleatória"></div>' +
        '<div class="form-group form-group--full"><label for="instTitular">Titular da conta</label>' +
          '<input type="text" id="instTitular"></div>' +
        '<div class="form-group"><label for="instConvenio">Convênio boleto</label>' +
          '<input type="text" id="instConvenio" placeholder="Número do convênio"></div>' +
        '<div class="form-group"><label for="instStatus">Status</label>' +
          '<select id="instStatus"><option value="ativo">Ativo</option><option value="conectado">Conectado</option>' +
          '<option value="inativo">Inativo</option></select></div>' +
        '<div class="form-group form-group--full colaboradores-form__acoes inst-banco-novo__acoes">' +
          '<button type="submit" class="btn btn--sm btn--secondary" id="instBtnSalvar">Salvar</button>' +
          '<button type="button" class="btn btn--sm" id="instBtnCancelar" hidden>Cancelar</button>' +
        "</div></div></form></div></details>";

  if (editId) {
    const emEdicao = obterInstituicaoPorId(editId);
    if (emEdicao) preencherFormularioInstituicao(emEdicao);
  }

  document.getElementById("formInstituicao").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const mensagemEl = document.getElementById("instMensagem");
    mensagemEl.className = "form-mensagem";
    mensagemEl.textContent = "";

    const dados = lerDadosFormularioInstituicao();
    const idEdicao = document.getElementById("instEditId").value.trim();
    const resultado = idEdicao
      ? atualizarInstituicaoFinanceira(idEdicao, dados, sessao)
      : cadastrarInstituicaoFinanceira(dados, sessao);

    if (!resultado.ok) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = resultado.erro;
      return;
    }

    container.dataset.instEditId = "";
    renderizarInstituicoesContador(containerId, sessao);
    mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
    mensagemEl.textContent = "Instituição salva com sucesso.";
  });

  const btnCancelar = document.getElementById("instBtnCancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", function () {
      container.dataset.instEditId = "";
      renderizarInstituicoesContador(containerId, sessao);
    });
  }

  container.querySelectorAll("[data-inst-edit]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      container.dataset.instEditId = btn.getAttribute("data-inst-edit");
      renderizarInstituicoesContador(containerId, sessao);
    });
  });
}

function lerDadosFormularioInstituicao() {
  return {
    nome: document.getElementById("instNome").value.trim(),
    tipo: document.getElementById("instTipo").value.trim(),
    codigoBanco: document.getElementById("instCodigoBanco").value.trim(),
    agencia: document.getElementById("instAgencia").value.trim(),
    conta: document.getElementById("instConta").value.trim(),
    pixChave: document.getElementById("instPixChave").value.trim(),
    titular: document.getElementById("instTitular").value.trim(),
    convenioBoleto: document.getElementById("instConvenio").value.trim(),
    status: document.getElementById("instStatus").value
  };
}

function preencherFormularioInstituicao(inst) {
  document.getElementById("instEditId").value = inst.id;
  document.getElementById("instNome").value = inst.nome || "";
  document.getElementById("instTipo").value = inst.tipo || "";
  document.getElementById("instCodigoBanco").value = inst.codigoBanco || "";
  document.getElementById("instAgencia").value = inst.agencia || "";
  document.getElementById("instConta").value = inst.conta || "";
  document.getElementById("instPixChave").value = inst.pixChave || "";
  document.getElementById("instTitular").value = inst.titular || "";
  document.getElementById("instConvenio").value = inst.convenioBoleto || "";
  document.getElementById("instStatus").value = inst.status || "ativo";
  document.getElementById("instFormTitulo").textContent = "Editar instituição";
  document.getElementById("instBtnSalvar").textContent = "Salvar alterações";
  document.getElementById("instBtnCancelar").hidden = false;
  const painel = document.getElementById("instPainelNovo");
  if (painel) {
    painel.open = true;
    painel.classList.add("inst-banco-novo--edicao");
    const summary = painel.querySelector(".inst-banco-novo__toggle");
    if (summary) summary.textContent = "Editar instituição";
  }
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
