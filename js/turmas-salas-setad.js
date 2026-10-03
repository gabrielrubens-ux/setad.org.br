/* Turmas/salas presenciais e vínculo com polos — uso interno (secretaria, coordenação, direção). */

const SALAS_TURMA_SETAD = [
  {
    id: "medio-sala-5",
    modulo: "medio",
    nome: "Médio — Sala 5",
    ordem: 1
  },
  {
    id: "avancado-sala-1",
    modulo: "avancado",
    nome: "Avançado — Sala 1",
    ordem: 1
  },
  {
    id: "avancado-sala-4",
    modulo: "avancado",
    nome: "Avançado — Sala 4",
    ordem: 2
  }
];

const STORAGE_PROFESSORES_POLOS = "setad_professores_polos";

function listarPolosSetadCatalogo() {
  if (typeof POLOS_SETAD !== "undefined" && Array.isArray(POLOS_SETAD)) {
    return POLOS_SETAD.slice();
  }
  return [];
}

function obterNomePoloSetad(poloId) {
  if (!poloId) return "";
  var polos = listarPolosSetadCatalogo();
  var polo = polos.find(function (p) {
    return p.id === poloId;
  });
  return polo ? polo.nome : poloId;
}

function listarSalasTurmaPorModulo(modulo) {
  if (!modulo) return [];
  return SALAS_TURMA_SETAD.filter(function (s) {
    return s.modulo === modulo;
  }).sort(function (a, b) {
    return (a.ordem || 0) - (b.ordem || 0);
  });
}

function moduloExigeSalaTurma(modulo) {
  return modulo === "medio" || modulo === "avancado";
}

function obterLabelSalaTurma(salaId) {
  if (!salaId) return "";
  var sala = SALAS_TURMA_SETAD.find(function (s) {
    return s.id === salaId;
  });
  return sala ? sala.nome : salaId;
}

function formatarDirecionamentoAluno(matricula) {
  if (!matricula) return "—";
  var partes = [];
  if (matricula.poloNome || matricula.poloId) {
    partes.push(matricula.poloNome || obterNomePoloSetad(matricula.poloId));
  }
  if (matricula.salaTurmaNome || matricula.salaTurmaId) {
    partes.push(matricula.salaTurmaNome || obterLabelSalaTurma(matricula.salaTurmaId));
  }
  return partes.length ? partes.join(" · ") : "—";
}

function popularSelectPolosSetad(selectEl, valorSelecionado) {
  if (!selectEl) return;
  var polos = listarPolosSetadCatalogo();
  var html =
    '<option value="">Selecione o polo...</option>' +
    polos
      .map(function (polo) {
        var sel = valorSelecionado === polo.id ? " selected" : "";
        return (
          '<option value="' +
          escaparHtml(polo.id) +
          '"' +
          sel +
          ">" +
          escaparHtml(polo.nome) +
          "</option>"
        );
      })
      .join("");
  selectEl.innerHTML = html;
}

function atualizarSelectSalaTurmaPresencial(modulo, valorSelecionado) {
  var salaEl = document.getElementById("secSalaTurma");
  var hintEl = document.getElementById("secSalaTurmaHint");
  if (!salaEl) return;

  var salas = listarSalasTurmaPorModulo(modulo);
  if (!moduloExigeSalaTurma(modulo)) {
    salaEl.innerHTML = '<option value="">Não se aplica a este módulo</option>';
    salaEl.value = "";
    salaEl.disabled = true;
    salaEl.required = false;
    if (hintEl) {
      hintEl.textContent =
        "Salas presenciais valem para Médio e Avançado. Bacharelado e demais módulos não usam esta divisão.";
    }
    return;
  }

  salaEl.disabled = false;
  salaEl.required = true;
  if (hintEl) {
    hintEl.textContent = "Escolha a sala em que o aluno será acompanhado no polo.";
  }

  salaEl.innerHTML =
    '<option value="">Selecione a sala / turma...</option>' +
    salas
      .map(function (sala) {
        var sel = valorSelecionado === sala.id ? " selected" : "";
        return (
          '<option value="' +
          escaparHtml(sala.id) +
          '"' +
          sel +
          ">" +
          escaparHtml(sala.nome) +
          "</option>"
        );
      })
      .join("");

  if (valorSelecionado) salaEl.value = valorSelecionado;
}

function anexarDirecionamentoInternoAosDados(dados) {
  var poloEl = document.getElementById("secPolo");
  var salaEl = document.getElementById("secSalaTurma");
  dados.poloId = poloEl ? poloEl.value : "";
  dados.poloNome = dados.poloId ? obterNomePoloSetad(dados.poloId) : "";
  dados.salaTurmaId = salaEl && !salaEl.disabled ? salaEl.value : "";
  dados.salaTurmaNome = dados.salaTurmaId ? obterLabelSalaTurma(dados.salaTurmaId) : "";
  return dados;
}

function validarDirecionamentoInternoMatricula(dados) {
  if (!dados.poloId) {
    return "Selecione o polo do SETAD para direcionar o aluno.";
  }
  if (moduloExigeSalaTurma(dados.modulo) && !dados.salaTurmaId) {
    return "Selecione a sala / turma (Médio ou Avançado).";
  }
  if (dados.salaTurmaId) {
    var sala = SALAS_TURMA_SETAD.find(function (s) {
      return s.id === dados.salaTurmaId;
    });
    if (!sala || sala.modulo !== dados.modulo) {
      return "A sala escolhida não corresponde ao módulo do curso.";
    }
  }
  return null;
}

function configurarDirecionamentoPresencialInterno() {
  var poloEl = document.getElementById("secPolo");
  var moduloEl = document.getElementById("secModulo");
  if (!poloEl || poloEl.dataset.direcionamentoBound === "1") return;
  poloEl.dataset.direcionamentoBound = "1";

  popularSelectPolosSetad(poloEl, poloEl.value || "");
  atualizarSelectSalaTurmaPresencial(
    moduloEl ? moduloEl.value : "",
    document.getElementById("secSalaTurma")
      ? document.getElementById("secSalaTurma").value
      : ""
  );

  if (moduloEl) {
    moduloEl.addEventListener("change", function () {
      atualizarSelectSalaTurmaPresencial(moduloEl.value, "");
    });
  }
}

function reinicializarDirecionamentoPresencialAposReset() {
  var poloEl = document.getElementById("secPolo");
  if (poloEl) poloEl.value = "";
  atualizarSelectSalaTurmaPresencial("", "");
}

function obterProfessoresPolos() {
  try {
    var raw = localStorage.getItem(STORAGE_PROFESSORES_POLOS);
    var lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista : [];
  } catch (e) {
    return [];
  }
}

function salvarProfessoresPolos(lista) {
  localStorage.setItem(STORAGE_PROFESSORES_POLOS, JSON.stringify(lista));
}

function cadastrarProfessorPolo(dados, sessao) {
  var nome = (dados.nome || "").trim();
  var poloId = dados.poloId || "";
  if (nome.length < 3) {
    return { ok: false, erro: "Informe o nome completo do professor." };
  }
  if (!poloId) {
    return { ok: false, erro: "Selecione o polo." };
  }

  var lista = obterProfessoresPolos();
  var registro = {
    id: typeof gerarId === "function" ? gerarId("prof-polo") : "prof-polo-" + Date.now(),
    poloId: poloId,
    poloNome: obterNomePoloSetad(poloId),
    nome: nome,
    email: (dados.email || "").trim().toLowerCase(),
    telefone: (dados.telefone || "").trim(),
    salasTurma: Array.isArray(dados.salasTurma) ? dados.salasTurma.slice() : [],
    observacoes: (dados.observacoes || "").trim(),
    cadastradoPor: sessao && sessao.email ? sessao.email : null,
    cadastradoEm: new Date().toISOString()
  };
  lista.push(registro);
  salvarProfessoresPolos(lista);
  return { ok: true, professor: registro };
}

function removerProfessorPolo(professorId) {
  var lista = obterProfessoresPolos().filter(function (p) {
    return p.id !== professorId;
  });
  salvarProfessoresPolos(lista);
  return { ok: true };
}

function listarProfessoresPorPolo(poloId) {
  return obterProfessoresPolos()
    .filter(function (p) {
      return !poloId || p.poloId === poloId;
    })
    .sort(function (a, b) {
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
}

function obterSessaoEquipePedagogicaPolos() {
  if (typeof obterSessaoSecretaria === "function" && obterSessaoSecretaria()) {
    return obterSessaoSecretaria();
  }
  if (typeof obterSessaoCoordenacao === "function" && obterSessaoCoordenacao()) {
    return obterSessaoCoordenacao();
  }
  if (typeof obterSessaoDirecao === "function" && obterSessaoDirecao()) {
    return obterSessaoDirecao();
  }
  return null;
}
