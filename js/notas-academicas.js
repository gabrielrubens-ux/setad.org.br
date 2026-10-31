/* Notas e médias — sincronizadas entre secretaria, professores, coordenação e direção */

var NOTAS_ACADEMICAS_KEY = "setad_notas_academicas";

var DISCIPLINAS_SETAD = [
  "Teologia Sistemática I",
  "Hermenêutica Bíblica",
  "História da Igreja",
  "Teologia Prática"
];

var MATERIAIS_NOTAS_POR_MODULO = {
  basico: [
    "Introdução à Bíblia",
    "Doutrina Cristã",
    "Evangelismo e Discipulado",
    "Vida Devocional"
  ],
  medio: [
    "Teologia Sistemática I",
    "Hermenêutica Bíblica",
    "História da Igreja",
    "Teologia Prática"
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

function obterMateriaisPadraoModulo(modulo) {
  var chave = modulo || "medio";
  if (MATERIAIS_NOTAS_POR_MODULO[chave]) {
    return MATERIAIS_NOTAS_POR_MODULO[chave].slice();
  }
  return DISCIPLINAS_SETAD.slice();
}

function listarMateriaisQuadroAluno(matricula, periodo) {
  if (!matricula) return [];
  periodo = periodo || obterPeriodoLetivoAtual();
  var modulo = matricula.modulo || "medio";
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
  if (Array.isArray(quadroPersistido) && quadroPersistido.length) {
    quadroPersistido.forEach(incluir);
  } else {
    obterMateriaisPadraoModulo(modulo).forEach(incluir);
  }

  obterNotasPorAluno(matricula.email).forEach(function (n) {
    if (
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      (n.tipo || "prova") === "prova" &&
      n.disciplina &&
      n.disciplina !== "Média geral"
    ) {
      incluir(n.disciplina);
    }
  });

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

function renomearDisciplinaNotasAluno(email, periodo, nomeAntigo, nomeNovo, sessao) {
  if (!usuarioPodeEditarNotasAcademicas(sessao)) {
    return { ok: false, erro: "Sem permissão." };
  }
  nomeAntigo = String(nomeAntigo || "").trim();
  nomeNovo = String(nomeNovo || "").trim();
  if (!nomeAntigo || !nomeNovo || nomeAntigo === nomeNovo) {
    return { ok: true };
  }
  var norm = (email || "").trim().toLowerCase();
  var lista = obterNotasAcademicas();
  var alterou = false;
  lista = lista.map(function (n) {
    if (
      (n.alunoEmail || "").toLowerCase() === norm &&
      (n.periodo || obterPeriodoLetivoAtual()) === periodo &&
      n.disciplina === nomeAntigo
    ) {
      alterou = true;
      return Object.assign({}, n, {
        disciplina: nomeNovo,
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
  var nota = obterNotaLancamento(matricula.email, nomeMaterial, periodo, "prova", "Prova 1");
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
  return obterNotasAcademicas().filter(function (n) {
    return (n.alunoEmail || "").toLowerCase() === norm;
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

function obterNotaLancamento(email, disciplina, periodo, tipo, avaliacao) {
  periodo = periodo || obterPeriodoLetivoAtual();
  tipo = tipo || "prova";
  avaliacao = avaliacao || "Prova 1";
  var norm = (email || "").trim().toLowerCase();
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

function calcularMediaAutomaticaAluno(email, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  var provas = obterNotasPorAluno(email).filter(function (n) {
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

function obterMediaManualAluno(email, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  return obterNotasPorAluno(email).find(function (n) {
    return (n.periodo || obterPeriodoLetivoAtual()) === periodo && n.tipo === "media_manual";
  });
}

function obterMediaExibicaoAluno(email, periodo) {
  periodo = periodo || obterPeriodoLetivoAtual();
  var manual = obterMediaManualAluno(email, periodo);
  if (manual && manual.valor !== null && manual.valor !== undefined && manual.valor !== "") {
    return Number(manual.valor);
  }
  return calcularMediaAutomaticaAluno(email, periodo);
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
  var perfis = ["diretor", "secretaria", "coordenacao", "professor"];
  if (perfis.indexOf(sessao.perfil) >= 0) return true;
  if (typeof sessaoTemPerfilInstitucional === "function") {
    return perfis.some(function (p) {
      return sessaoTemPerfilInstitucional(sessao, p);
    });
  }
  return false;
}

function salvarNotaAcademica(dados, sessao) {
  if (!dados || !dados.alunoEmail) {
    return { ok: false, erro: "Informe o aluno." };
  }
  if (!usuarioPodeEditarNotasAcademicas(sessao)) {
    return { ok: false, erro: "Sem permissão para lançar notas." };
  }

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
    : obterNotaLancamento(dados.alunoEmail, disciplina, periodo, tipo, avaliacao);

  var matricula =
    typeof obterMatriculaPorEmail === "function"
      ? obterMatriculaPorEmail(dados.alunoEmail)
      : null;

  var registro = Object.assign({}, existente || {}, {
    id: (existente && existente.id) || dados.id || gerarId("nota"),
    matriculaId: (matricula && matricula.id) || dados.matriculaId || null,
    alunoEmail: dados.alunoEmail.trim().toLowerCase(),
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
    document.getElementById("secCadastroAbaNotas") ||
    document.getElementById("fichaAlunoAbaNotas") ||
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

  if (!matricula || !matricula.email) {
    container.innerHTML =
      '<p class="presencial-bloco__hint">Selecione um aluno na lista ou salve o cadastro para lançar notas.</p>';
    return;
  }

  sessao = sessao || obterSessaoOperacionalListaAlunos();
  if (!sessao) {
    container.innerHTML = '<p class="lista-vazia">Sessão inválida.</p>';
    return;
  }

  if (typeof renderizarQuadroMateriaisNotasAluno === "function") {
    renderizarQuadroMateriaisNotasAluno(container, matricula, sessao, {
      somenteLeitura: meta.somenteLeitura === true,
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
