/* Notas e médias — sincronizadas entre secretaria, professores, coordenação e direção */

var NOTAS_ACADEMICAS_KEY = "setad_notas_academicas";

var MATERIAIS_NOTAS_POR_MODULO = {
  basico: [
    "Introdução à Bíblia",
    "Doutrina Cristã",
    "Evangelismo e Discipulado",
    "Vida Devocional"
  ],
  medio: [
    /* Curso médio em Teologia e Ciências Bíblicas — grade oficial SETAD */
    "Ética cristã",
    "Aconselhamento pastoral",
    "Cristologia",
    "Soteriologia",
    "Eclesiologia",
    "Hermenêutica",
    "Bibliologia",
    "História do cristianismo",
    "Teontologia",
    "Pneumatologia",
    "Panorama do Antigo Testamento",
    "Panorama do Novo Testamento",
    "Evangelismo e discipulado",
    "Direito eclesial, ética e cidadania",
    "Implantação de novas igrejas",
    "Liderança eclesiástica",
    "Homilética",
    "Teologia pastoral",
    "Antropologia bíblica",
    "Angelologia",
    "Hamartiologia",
    "Escatologia",
    "Didática e metodologia do ensino cristão",
    "Geografia bíblica",
    "Arqueologia bíblica",
    "Noções de hebraico bíblico",
    "Noções de grego bíblico",
    "Manuscritologia e tradução da Bíblia",
    "Noções de exegese bíblica"
  ],
  avancado: [
    "Teologia Sistemática II",
    "Apologética",
    "Administração Eclesiástica",
    "Missões e Evangelismo"
  ],
  teologia: [
    "Teologia Bíblica",
    "Ética Cristã",
    "Liturgia e Culto",
    "Filosofia e Religião"
  ]
};

/** Incrementar ao alterar a grade oficial de um módulo (ex.: médio v2 = 29 disciplinas). */
var MATERIAIS_QUADRO_VERSAO_OFICIAL = {
  basico: 1,
  medio: 2,
  avancado: 1,
  teologia: 1
};

var DISCIPLINAS_SETAD = [
  "Teologia Sistemática I",
  "Hermenêutica Bíblica",
  "História da Igreja",
  "Teologia Prática"
];

function obterModuloAcademicoAluno(matricula) {
  if (!matricula) return "medio";
  if (matricula.setadeNivel === "medio" || matricula.setadeNivel === "avancado") {
    return matricula.setadeNivel;
  }
  return matricula.modulo || "medio";
}

function normalizarNomeMaterialComparacao(nome) {
  return String(nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function listasMateriaisIguais(listaA, listaB) {
  if (!listaA || !listaB || listaA.length !== listaB.length) return false;
  for (var i = 0; i < listaA.length; i++) {
    if (
      normalizarNomeMaterialComparacao(listaA[i]) !==
      normalizarNomeMaterialComparacao(listaB[i])
    ) {
      return false;
    }
  }
  return true;
}

function obterMateriaisPadraoModulo(modulo) {
  var chave = modulo || "medio";
  if (
    chave === "medio" &&
    window.SETAD_GRADE_OFICIAL &&
    typeof window.SETAD_GRADE_OFICIAL.listarDisciplinasMedio === "function"
  ) {
    return window.SETAD_GRADE_OFICIAL.listarDisciplinasMedio();
  }
  if (MATERIAIS_NOTAS_POR_MODULO[chave]) {
    return MATERIAIS_NOTAS_POR_MODULO[chave].slice();
  }
  return DISCIPLINAS_SETAD.slice();
}

function listarMateriaisQuadroAluno(matricula, periodo) {
  if (!matricula) return [];
  periodo = periodo || obterPeriodoLetivoAtual();
  var modulo = obterModuloAcademicoAluno(matricula);
  var porId = {};
  var ordem = [];

  function incluir(nome) {
    var limpo = String(nome || "").trim();
    if (!limpo || porId[limpo]) return;
    porId[limpo] = true;
    ordem.push(limpo);
  }

  var quadroPersistido =
    matricula.quadroMateriaisNotas && matricula.quadroMateriaisNotas[periodo];
  var listaOficial = obterMateriaisPadraoModulo(modulo);
  var versaoQuadro =
    matricula.quadroMateriaisVersao && matricula.quadroMateriaisVersao[periodo];
  var versaoAlvo = MATERIAIS_QUADRO_VERSAO_OFICIAL[modulo] || 1;
  var quadroOficialMedio =
    modulo === "medio" &&
    versaoQuadro >= versaoAlvo &&
    Array.isArray(quadroPersistido) &&
    listasMateriaisIguais(quadroPersistido, listaOficial);

  if (Array.isArray(quadroPersistido) && quadroPersistido.length) {
    quadroPersistido.forEach(incluir);
  } else {
    listaOficial.forEach(incluir);
  }

  if (!quadroOficialMedio) {
    obterNotasDaMatricula(matricula).forEach(function (n) {
      if (
        (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
        (n.tipo || "prova") === "prova" &&
        n.disciplina &&
        n.disciplina !== "Média geral"
      ) {
        incluir(n.disciplina);
      }
    });
  }

  return ordem;
}

function salvarListaMateriaisQuadro(matriculaId, periodo, lista, sessao) {
  if (!usuarioPodeEditarNotasAcademicas(sessao)) {
    return { ok: false, erro: "Sem permissão." };
  }
  if (typeof atualizarDadosMatricula !== "function") {
    return { ok: false, erro: "Cadastro indisponível." };
  }
  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) {
    return { ok: false, erro: "Matrícula não encontrada." };
  }
  var quadro = Object.assign({}, matricula.quadroMateriaisNotas || {});
  quadro[periodo] = (lista || [])
    .map(function (s) {
      return String(s || "").trim();
    })
    .filter(function (s) {
      return !!s;
    });
  return atualizarDadosMatricula(matriculaId, { quadroMateriaisNotas: quadro });
}

function sincronizarMateriaisOficiaisNaMatricula(matricula, periodo) {
  if (!matricula) {
    return { matricula: matricula, alterou: false };
  }
  periodo = periodo || obterPeriodoLetivoAtual();
  var modulo = obterModuloAcademicoAluno(matricula);
  var oficial = obterMateriaisPadraoModulo(modulo);
  if (!oficial.length) {
    return { matricula: matricula, alterou: false };
  }

  var versaoAlvo = MATERIAIS_QUADRO_VERSAO_OFICIAL[modulo] || 1;
  var versaoMap = Object.assign({}, matricula.quadroMateriaisVersao || {});
  var versaoAtual = versaoMap[periodo] || 0;
  var quadroMap = Object.assign({}, matricula.quadroMateriaisNotas || {});
  var listaAtual = Array.isArray(quadroMap[periodo]) ? quadroMap[periodo].slice() : [];

  var precisaAtualizar = false;
  if (modulo === "medio") {
    precisaAtualizar =
      versaoAtual < versaoAlvo || !listasMateriaisIguais(listaAtual, oficial);
  } else if (!listaAtual.length) {
    precisaAtualizar = true;
  }

  if (!precisaAtualizar) {
    return { matricula: matricula, alterou: false };
  }

  quadroMap[periodo] = oficial.slice();
  versaoMap[periodo] = versaoAlvo;

  return {
    alterou: true,
    matricula: Object.assign({}, matricula, {
      quadroMateriaisNotas: quadroMap,
      quadroMateriaisVersao: versaoMap
    })
  };
}

function aplicarMigracaoMateriaisOficiaisEmMatriculas(matriculas) {
  if (!Array.isArray(matriculas) || !matriculas.length) {
    return { lista: matriculas || [], alterou: false };
  }
  var periodo =
    typeof obterPeriodoLetivoAtual === "function" ? obterPeriodoLetivoAtual() : "";
  var alterou = false;
  var lista = matriculas.map(function (m) {
    var sync = sincronizarMateriaisOficiaisNaMatricula(m, periodo);
    if (sync.alterou) alterou = true;
    return sync.matricula;
  });
  return { lista: lista, alterou: alterou };
}

function garantirMateriaisOficiaisQuadroAluno(matricula, periodo, sessao) {
  if (!matricula || !matricula.id) return;
  if (!usuarioPodeEditarNotasAcademicas(sessao)) return;
  var sync = sincronizarMateriaisOficiaisNaMatricula(matricula, periodo);
  if (!sync.alterou || typeof atualizarDadosMatricula !== "function") return;
  atualizarDadosMatricula(matricula.id, {
    quadroMateriaisNotas: sync.matricula.quadroMateriaisNotas,
    quadroMateriaisVersao: sync.matricula.quadroMateriaisVersao
  });
}

function renomearDisciplinaNotasAluno(emailOuMatricula, periodo, nomeAntigo, nomeNovo, sessao) {
  if (!usuarioPodeEditarNotasAcademicas(sessao)) {
    return { ok: false, erro: "Sem permissão." };
  }
  nomeAntigo = String(nomeAntigo || "").trim();
  nomeNovo = String(nomeNovo || "").trim();
  if (!nomeAntigo || !nomeNovo || nomeAntigo === nomeNovo) {
    return { ok: true };
  }
  var matricula =
    emailOuMatricula && typeof emailOuMatricula === "object" ? emailOuMatricula : null;
  var norm =
    !matricula && emailOuMatricula
      ? String(emailOuMatricula).trim().toLowerCase()
      : "";
  var lista = obterNotasAcademicas();
  var alterou = false;
  lista = lista.map(function (n) {
    var pertence = matricula
      ? notaPertenceAMatricula(n, matricula)
      : (n.alunoEmail || "").toLowerCase() === norm;
    if (
      pertence &&
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      n.disciplina === nomeAntigo
    ) {
      alterou = true;
      return Object.assign({}, n, {
        disciplina: nomeNovo,
        matriculaId: (matricula && matricula.id) || n.matriculaId || null,
        atualizadoEm: new Date().toISOString(),
        lancadoPor: sessao.email,
        lancadoPorPerfil: sessao.perfil
      });
    }
    return n;
  });
  if (alterou) salvarNotasAcademicas(lista);
  return { ok: true };
}

function removerMaterialQuadroAluno(matricula, periodo, nomeMaterial, sessao) {
  if (!matricula || !nomeMaterial) return { ok: false, erro: "Material inválido." };
  var lista = listarMateriaisQuadroAluno(matricula, periodo).filter(function (m) {
    return m !== nomeMaterial;
  });
  salvarListaMateriaisQuadro(matricula.id, periodo, lista, sessao);
  var nota = obterNotaLancamentoMatricula(
    matricula,
    nomeMaterial,
    periodo,
    "prova",
    "Prova 1"
  );
  if (nota) {
    salvarNotaAcademica(
      {
        id: nota.id,
        alunoEmail: matricula.email,
        alunoNome: matricula.nomeCompleto,
        matriculaId: matricula.id,
        disciplina: nomeMaterial,
        tipo: "prova",
        valor: null,
        periodo: periodo
      },
      sessao
    );
  }
  return { ok: true };
}

function obterPeriodoLetivoAtual() {
  var d = new Date();
  var semestre = d.getMonth() < 6 ? 1 : 2;
  return d.getFullYear() + "-" + semestre;
}

function notasApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function obterNotasAcademicas() {
  if (notasApiAtivo()) {
    return (window.SETAD.cache.notasAcademicas || []).slice();
  }
  try {
    var raw = localStorage.getItem(NOTAS_ACADEMICAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function salvarNotasAcademicas(lista) {
  var copia = (lista || []).slice();
  if (notasApiAtivo()) {
    window.SETAD.setCache("notasAcademicas", copia, "notas-academicas");
    return;
  }
  localStorage.setItem(NOTAS_ACADEMICAS_KEY, JSON.stringify(copia));
}

function obterNotasPorAluno(email) {
  var norm = (email || "").trim().toLowerCase();
  if (!norm) return [];
  return obterNotasAcademicas().filter(function (n) {
    return (n.alunoEmail || "").toLowerCase() === norm;
  });
}

function notaPertenceAMatricula(nota, matricula) {
  if (!nota || !matricula) return false;
  if (matricula.id && nota.matriculaId === matricula.id) return true;
  var norm =
    typeof normalizarEmailMatricula === "function"
      ? normalizarEmailMatricula(matricula.email)
      : (matricula.email || "").trim().toLowerCase();
  if (norm && (nota.alunoEmail || "").toLowerCase() === norm) return true;
  return false;
}

function obterNotasDaMatricula(matricula) {
  if (!matricula) return [];
  return obterNotasAcademicas().filter(function (n) {
    return notaPertenceAMatricula(n, matricula);
  });
}

function matriculaPermiteLancamentoNotas(matricula) {
  if (!matricula) return false;
  if (matricula.id) return true;
  var email =
    typeof normalizarEmailMatricula === "function"
      ? normalizarEmailMatricula(matricula.email)
      : (matricula.email || "").trim();
  return !!email;
}

function obterNotaLancamentoMatricula(matricula, disciplina, periodo, tipo, avaliacao) {
  periodo = periodo || obterPeriodoLetivoAtual();
  tipo = tipo || "prova";
  avaliacao = avaliacao || "Prova 1";
  return obterNotasDaMatricula(matricula).find(function (n) {
    return (
      n.disciplina === disciplina &&
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      (n.tipo || "prova") === tipo &&
      (n.avaliacao || "Prova 1") === avaliacao
    );
  });
}

function chaveNotaAcademica(nota) {
  return [
    (nota.alunoEmail || "").toLowerCase(),
    nota.periodo || "",
    nota.disciplina || "",
    nota.tipo || "prova",
    nota.avaliacao || ""
  ].join("|");
}

function obterNotaLancamento(emailOuMatricula, disciplina, periodo, tipo, avaliacao) {
  if (emailOuMatricula && typeof emailOuMatricula === "object") {
    return obterNotaLancamentoMatricula(
      emailOuMatricula,
      disciplina,
      periodo,
      tipo,
      avaliacao
    );
  }
  periodo = periodo || obterPeriodoLetivoAtual();
  tipo = tipo || "prova";
  avaliacao = avaliacao || "Prova 1";
  var norm = (emailOuMatricula || "").trim().toLowerCase();
  return obterNotasAcademicas().find(function (n) {
    return (
      (n.alunoEmail || "").toLowerCase() === norm &&
      n.disciplina === disciplina &&
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      (n.tipo || "prova") === tipo &&
      (n.avaliacao || "Prova 1") === avaliacao
    );
  });
}

function calcularMediaAutomaticaAluno(emailOuMatricula, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  var provas = (
    emailOuMatricula && typeof emailOuMatricula === "object"
      ? obterNotasDaMatricula(emailOuMatricula)
      : obterNotasPorAluno(emailOuMatricula)
  ).filter(function (n) {
    return (
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      (n.tipo || "prova") === "prova" &&
      n.valor !== null &&
      n.valor !== undefined &&
      n.valor !== ""
    );
  });
  if (!provas.length) return null;
  var soma = provas.reduce(function (s, n) {
    return s + Number(n.valor);
  }, 0);
  return Math.round((soma / provas.length) * 100) / 100;
}

function obterMediaManualAluno(emailOuMatricula, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  var notas =
    emailOuMatricula && typeof emailOuMatricula === "object"
      ? obterNotasDaMatricula(emailOuMatricula)
      : obterNotasPorAluno(emailOuMatricula);
  return notas.find(function (n) {
    return (n.periodo || obterPeriodoLetivoAtual()) === periodo && n.tipo === "media_manual";
  });
}

function obterMediaExibicaoAluno(emailOuMatricula, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  var manual = obterMediaManualAluno(emailOuMatricula, periodo);
  if (manual && manual.valor !== null && manual.valor !== undefined && manual.valor !== "") {
    return Number(manual.valor);
  }
  return calcularMediaAutomaticaAluno(emailOuMatricula, periodo);
}

function formatarNotaValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  var n = Number(valor);
  if (isNaN(n)) return "—";
  return n.toFixed(1).replace(".", ",");
}

function obterClasseNotaBadge(valor) {
  if (valor === null || valor === undefined || valor === "") return "nota-badge--pendente";
  var n = Number(valor);
  if (isNaN(n)) return "nota-badge--pendente";
  if (n >= 7) return "nota-badge--alta";
  if (n >= 5) return "nota-badge--media";
  return "nota-badge--baixa";
}

function usuarioPodeEditarNotasAcademicas(sessao) {
  if (!sessao) return false;
  var perfis = ["diretor", "secretaria", "coordenacao", "professor", "autorizado"];
  if (perfis.indexOf(sessao.perfil) >= 0) return true;
  if (typeof sessaoTemPerfilInstitucional === "function") {
    return ["secretaria", "coordenacao", "professor"].some(function (p) {
      return sessaoTemPerfilInstitucional(sessao, p);
    });
  }
  return false;
}

function podeEditarNotasNoQuadro(sessao, meta) {
  meta = meta || {};
  if (meta.somenteLeitura === true) return false;
  if (meta.permissoesFicha && meta.permissoesFicha.notasEditar === true) {
    return true;
  }
  return usuarioPodeEditarNotasAcademicas(sessao);
}

function garantirMateriaisIniciaisQuadroAluno(matricula, periodo, sessao) {
  garantirMateriaisOficiaisQuadroAluno(matricula, periodo, sessao);
}

function salvarNotaAcademica(dados, sessao) {
  if (!dados || (!dados.alunoEmail && !dados.matriculaId)) {
    return { ok: false, erro: "Informe o aluno." };
  }
  if (!usuarioPodeEditarNotasAcademicas(sessao)) {
    return { ok: false, erro: "Sem permissão para lançar notas." };
  }

  var matricula = null;
  if (dados.matriculaId && typeof obterMatriculas === "function") {
    matricula = obterMatriculas().find(function (m) {
      return m.id === dados.matriculaId;
    });
  }
  if (!matricula && dados.alunoEmail && typeof obterMatriculaPorEmail === "function") {
    matricula = obterMatriculaPorEmail(dados.alunoEmail);
  }
  if (matricula) {
    dados.matriculaId = matricula.id;
    if (!dados.alunoNome) dados.alunoNome = matricula.nomeCompleto;
    if (!dados.alunoEmail && matricula.email) {
      dados.alunoEmail = matricula.email;
    }
  }
  dados.alunoEmail = dados.alunoEmail
    ? String(dados.alunoEmail).trim().toLowerCase()
    : "";

  var valor =
    dados.valor === null || dados.valor === undefined || dados.valor === ""
      ? null
      : Number(String(dados.valor).replace(",", "."));

  if (valor !== null && (isNaN(valor) || valor < 0 || valor > 10)) {
    return { ok: false, erro: "A nota deve estar entre 0 e 10." };
  }

  var periodo = dados.periodo || obterPeriodoLetivoAtual();
  var tipo = dados.tipo || "prova";
  var disciplina = (dados.disciplina || "").trim();
  var avaliacao = (dados.avaliacao || "Prova 1").trim();

  if (tipo === "prova" && !disciplina) {
    return { ok: false, erro: "Selecione a disciplina." };
  }

  var lista = obterNotasAcademicas();
  var existente = dados.id
    ? lista.find(function (n) {
        return n.id === dados.id;
      })
    : null;
  if (!existente && matricula) {
    existente = obterNotaLancamentoMatricula(matricula, disciplina, periodo, tipo, avaliacao);
  }
  if (!existente && dados.alunoEmail) {
    existente = obterNotaLancamento(dados.alunoEmail, disciplina, periodo, tipo, avaliacao);
  }

  var registro = Object.assign({}, existente || {}, {
    id: (existente && existente.id) || dados.id || gerarId("nota"),
    matriculaId: (matricula && matricula.id) || dados.matriculaId || null,
    alunoEmail: dados.alunoEmail,
    alunoNome:
      dados.alunoNome ||
      (matricula && matricula.nomeCompleto) ||
      (existente && existente.alunoNome) ||
      "Aluno",
    turmaId: dados.turmaId || (existente && existente.turmaId) || null,
    disciplina: tipo === "media_manual" ? "Média geral" : disciplina,
    avaliacao: tipo === "media_manual" ? "Média" : avaliacao,
    valor: valor,
    periodo: periodo,
    tipo: tipo,
    observacoes: (dados.observacoes || "").trim(),
    lancadoPor: sessao.email,
    lancadoPorPerfil: sessao.perfil,
    atualizadoEm: new Date().toISOString()
  });

  if (!existente) {
    registro.criadoEm = new Date().toISOString();
    lista.push(registro);
  } else {
    var idx = lista.findIndex(function (n) {
      return n.id === registro.id;
    });
    if (idx >= 0) lista[idx] = registro;
    else lista.push(registro);
  }

  salvarNotasAcademicas(lista);
  return { ok: true, nota: registro };
}

function obterSessaoOperacionalListaAlunos() {
  if (
    typeof document !== "undefined" &&
    document.body &&
    document.body.classList.contains("painel-coordenacao") &&
    typeof obterSessaoCoordenacao === "function"
  ) {
    return obterSessaoCoordenacao();
  }
  if (typeof obterSessaoSecretaria === "function") {
    return obterSessaoSecretaria();
  }
  return null;
}

function renderizarPlanilhaNotasCadastroAluno(matricula, sessao, meta) {
  meta = meta || {};
  var container =
    meta.containerEl ||
    document.getElementById("fichaAlunoAbaNotas") ||
    document.getElementById("secCadastroAbaNotas") ||
    document.getElementById("secPlanilhaNotas");
  if (!container) return;

  matricula =
    matricula ||
    (typeof obterMatriculaAtivaNoCadastroPresencial === "function"
      ? obterMatriculaAtivaNoCadastroPresencial()
      : null);

  if (matricula && matricula.id) {
    var atualizada = obterMatriculas().find(function (m) {
      return m.id === matricula.id;
    });
    if (atualizada) matricula = atualizada;
  }

  if (!matricula || !matriculaPermiteLancamentoNotas(matricula)) {
    container.innerHTML =
      '<p class="presencial-bloco__hint">Selecione um aluno na lista ou salve o cadastro para lançar notas.</p>';
    return;
  }

  if (!matricula.email) {
    container.setAttribute("data-notas-sem-email", "1");
  } else {
    container.removeAttribute("data-notas-sem-email");
  }

  sessao = sessao || obterSessaoOperacionalListaAlunos();
  if (!sessao && typeof obterSessaoFichaAlunoInstitucional === "function") {
    sessao = obterSessaoFichaAlunoInstitucional();
  }
  if (!sessao && typeof window !== "undefined" && window.SETAD && SETAD.session) {
    sessao = SETAD.session;
  }
  if (!sessao) {
    container.innerHTML = '<p class="lista-vazia">Sessão inválida.</p>';
    return;
  }

  if (typeof renderizarQuadroMateriaisNotasAluno === "function") {
    renderizarQuadroMateriaisNotasAluno(container, matricula, sessao, {
      somenteLeitura: meta.somenteLeitura === true,
      lancamentoFicha: meta.lancamentoFicha === true,
      permissoesFicha: meta.permissoesFicha || null,
      onAtualizar: function () {
        renderizarPlanilhaNotasCadastroAluno(matricula, sessao, meta);
      }
    });
    return;
  }

  if (typeof renderizarPlanilhaNotasTurma !== "function") {
    container.innerHTML = '<p class="lista-vazia">Módulo de notas indisponível.</p>';
    return;
  }

  renderizarPlanilhaNotasTurma(container, [matricula], sessao, {
    titulo: "Notas de " + (matricula.nomeCompleto || "aluno"),
    subtitulo:
      "Período " +
      obterPeriodoLetivoAtual() +
      ". Alterações aparecem para aluno, professores, coordenação e direção.",
    mostrarAtualizar: true,
    somenteLeitura: meta.somenteLeitura === true,
    onAtualizar: function () {
      renderizarPlanilhaNotasCadastroAluno(matricula, sessao, meta);
    }
  });
}

function abrirCadastroAlunoNotasFromLista(matriculaId) {
  if (typeof abrirFichaAlunoNotasFromLista === "function") {
    abrirFichaAlunoNotasFromLista(matriculaId);
    return;
  }

  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var sessao = obterSessaoOperacionalListaAlunos();
  if (!sessao) return;

  var tab = document.querySelector('[data-tab="tab-cadastro"]');
  if (tab) tab.click();

  var tipoNovo = document.getElementById("secTipoAlunoNovo");
  if (tipoNovo) tipoNovo.checked = true;
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }
  if (typeof preencherFormularioComMatricula === "function") {
    preencherFormularioComMatricula(matricula);
  }

  renderizarPlanilhaNotasCadastroAluno(matricula, sessao);

  var bloco = document.getElementById("secBlocoAcademicoAluno");
  if (bloco) {
    bloco.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function renderizarNotasAlunoPainel(sessao) {
  var container = document.getElementById("notasAlunoContainer");
  if (!container || !sessao) return;
  var matricula =
    typeof obterMatriculaPorEmail === "function"
      ? obterMatriculaPorEmail(sessao.email)
      : null;
  if (!matricula) {
    container.innerHTML =
      '<p class="lista-vazia">Matrícula não encontrada. Procure a secretaria do seminário.</p>';
    return;
  }
  if (typeof renderizarQuadroMateriaisNotasAluno === "function") {
    renderizarQuadroMateriaisNotasAluno(container, matricula, sessao, {
      somenteLeitura: true,
      mostrarAtualizar: true,
      onAtualizar: function () {
        renderizarNotasAlunoPainel(sessao);
      }
    });
    return;
  }
  if (typeof renderizarPlanilhaNotasTurma !== "function") {
    container.innerHTML = '<p class="lista-vazia">Notas indisponíveis no momento.</p>';
    return;
  }
  renderizarPlanilhaNotasTurma(container, [matricula], sessao, {
    titulo: "Suas notas e média",
    subtitulo:
      "Período " +
      obterPeriodoLetivoAtual() +
      ". Valores lançados pela secretaria e pelos professores.",
    somenteLeitura: true,
    mostrarAtualizar: true,
    onAtualizar: function () {
      renderizarNotasAlunoPainel(sessao);
    }
  });
}
