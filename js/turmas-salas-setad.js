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
const POLO_SETADE_ID = "setade-sede";

const NIVEIS_SETADE_SALA = [
  { id: "medio", nome: "Médio — Teologia e Ciências Bíblicas" },
  { id: "avancado", nome: "Avançado — Teologia" }
];

function ehPoloSetade(poloId) {
  return poloId === POLO_SETADE_ID;
}

function listarPolosSetadCatalogo() {
  if (typeof POLOS_SETAD !== "undefined" && Array.isArray(POLOS_SETAD)) {
    var lista = POLOS_SETAD.slice();
    lista.sort(function (a, b) {
      var pa = a.principal || a.id === POLO_SETADE_ID ? 0 : 1;
      var pb = b.principal || b.id === POLO_SETADE_ID ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
    return lista;
  }
  return [];
}

function listarPolosExcetoSetade() {
  return listarPolosSetadCatalogo().filter(function (p) {
    return !ehPoloSetade(p.id);
  });
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

function idTurmaPolo(poloId) {
  return "turma-polo-" + poloId;
}

function idTurmaSala(salaTurmaId) {
  return "turma-sala-" + salaTurmaId;
}

function idTurmaSetadeSala(salaTurmaId) {
  return "turma-setade-" + salaTurmaId;
}

/**
 * Catálogo oficial: Polo SETADE (nível + sala) em destaque; demais polos em Belém.
 */
function listarTurmasCatalogoSetad() {
  var turmas = [];
  SALAS_TURMA_SETAD.forEach(function (sala, indice) {
    turmas.push({
      id: idTurmaSetadeSala(sala.id),
      tipo: "setade",
      categoria: "Polo SETADE — Sede principal (nível e sala)",
      nome: sala.nome,
      poloId: POLO_SETADE_ID,
      poloNome: obterNomePoloSetad(POLO_SETADE_ID),
      salaTurmaId: sala.id,
      modulo: sala.modulo,
      ordem: indice
    });
  });
  listarPolosExcetoSetade().forEach(function (polo, indice) {
    turmas.push({
      id: idTurmaPolo(polo.id),
      tipo: "polo",
      categoria: "Polos em Belém",
      nome: polo.nome,
      poloId: polo.id,
      bairro: polo.bairro || "",
      local: polo.local || "",
      ordem: 100 + indice
    });
  });
  return turmas;
}

function obterTurmaCatalogoPorId(turmaId) {
  return listarTurmasCatalogoSetad().find(function (t) {
    return t.id === turmaId;
  });
}

function contarAlunosNaTurma(turma) {
  if (!turma || typeof obterMatriculas !== "function") return 0;
  var matriculas = obterMatriculas();
  if (turma.tipo === "setade") {
    return matriculas.filter(function (m) {
      return ehPoloSetade(m.poloId) && m.salaTurmaId === turma.salaTurmaId;
    }).length;
  }
  if (turma.tipo === "polo") {
    return matriculas.filter(function (m) {
      return m.poloId === turma.poloId && !ehPoloSetade(m.poloId);
    }).length;
  }
  return 0;
}

function listarAlunosNaTurma(turma) {
  if (!turma || typeof obterMatriculas !== "function") return [];
  var matriculas = obterMatriculas();
  if (turma.tipo === "setade") {
    return matriculas.filter(function (m) {
      return ehPoloSetade(m.poloId) && m.salaTurmaId === turma.salaTurmaId;
    });
  }
  if (turma.tipo === "polo") {
    return matriculas.filter(function (m) {
      return m.poloId === turma.poloId && !ehPoloSetade(m.poloId);
    });
  }
  return [];
}

function obterTurmasDoAlunoPorMatricula(matricula) {
  if (!matricula) return [];
  var catalogo = listarTurmasCatalogoSetad();
  var vinculadas = [];
  if (ehPoloSetade(matricula.poloId) && matricula.salaTurmaId) {
    var turmaSetade = catalogo.find(function (t) {
      return t.tipo === "setade" && t.salaTurmaId === matricula.salaTurmaId;
    });
    if (turmaSetade) vinculadas.push(turmaSetade);
  } else if (matricula.poloId) {
    var turmaPolo = catalogo.find(function (t) {
      return t.tipo === "polo" && t.poloId === matricula.poloId;
    });
    if (turmaPolo) vinculadas.push(turmaPolo);
  }
  return vinculadas;
}

function formatarDirecionamentoAluno(matricula) {
  if (!matricula) return "—";
  var partes = [];
  if (matricula.poloNome || matricula.poloId) {
    partes.push(matricula.poloNome || obterNomePoloSetad(matricula.poloId));
  }
  if (ehPoloSetade(matricula.poloId) && (matricula.salaTurmaNome || matricula.salaTurmaId)) {
    partes.push(matricula.salaTurmaNome || obterLabelSalaTurma(matricula.salaTurmaId));
  }
  return partes.length ? partes.join(" · ") : "—";
}

function popularSelectPolosSetad(selectEl, valorSelecionado) {
  if (!selectEl) return;
  var setade = listarPolosSetadCatalogo().find(function (p) {
    return ehPoloSetade(p.id);
  });
  var outros = listarPolosExcetoSetade();
  var html = '<option value="">Selecione o polo...</option>';
  if (setade) {
    var selSetade = valorSelecionado === setade.id ? " selected" : "";
    html +=
      '<option value="' +
      escaparHtml(setade.id) +
      '"' +
      selSetade +
      ">" +
      escaparHtml(setade.nome) +
      " (principal)</option>";
  }
  if (outros.length) {
    html += '<optgroup label="Polos em Belém">';
    html += outros
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
    html += "</optgroup>";
  }
  selectEl.innerHTML = html;
}

function popularSelectNivelSetade(selectEl, valorSelecionado) {
  if (!selectEl) return;
  selectEl.innerHTML =
    '<option value="">Selecione o nível...</option>' +
    NIVEIS_SETADE_SALA.map(function (n) {
      var sel = valorSelecionado === n.id ? " selected" : "";
      return (
        '<option value="' +
        escaparHtml(n.id) +
        '"' +
        sel +
        ">" +
        escaparHtml(n.nome) +
        "</option>"
      );
    }).join("");
}

function alternarUiPoloSetadePresencial() {
  var poloEl = document.getElementById("secPolo");
  var bloco = document.getElementById("secBlocoSetadeNivelSala");
  var salaEl = document.getElementById("secSalaTurma");
  var nivelEl = document.getElementById("secSetadeNivel");
  if (!poloEl || !bloco) return;

  var setade = ehPoloSetade(poloEl.value);
  bloco.hidden = !setade;

  if (!setade) {
    if (nivelEl) nivelEl.value = "";
    if (salaEl) {
      salaEl.disabled = true;
      salaEl.required = false;
      salaEl.innerHTML = '<option value="">Selecione o polo SETADE para nível e sala</option>';
    }
    return;
  }

  var moduloEl = document.getElementById("secModulo");
  if (nivelEl && moduloEl && moduloEl.value && !nivelEl.value) {
    if (moduloEl.value === "medio" || moduloEl.value === "avancado") {
      nivelEl.value = moduloEl.value;
    }
  }
  atualizarSelectSalaTurmaPresencial(nivelEl ? nivelEl.value : "", salaEl ? salaEl.value : "");
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
  var nivelEl = document.getElementById("secSetadeNivel");
  dados.poloId = poloEl ? poloEl.value : "";
  dados.poloNome = dados.poloId ? obterNomePoloSetad(dados.poloId) : "";
  dados.setadeNivel = nivelEl && ehPoloSetade(dados.poloId) ? nivelEl.value : "";
  if (ehPoloSetade(dados.poloId)) {
    dados.salaTurmaId = salaEl && !salaEl.disabled ? salaEl.value : "";
    dados.salaTurmaNome = dados.salaTurmaId ? obterLabelSalaTurma(dados.salaTurmaId) : "";
  } else {
    dados.salaTurmaId = "";
    dados.salaTurmaNome = "";
    dados.setadeNivel = "";
  }
  return dados;
}

function validarDirecionamentoInternoMatricula(dados) {
  if (!dados.poloId) {
    return "Selecione o polo do SETAD para direcionar o aluno.";
  }
  if (ehPoloSetade(dados.poloId)) {
    var nivel = dados.setadeNivel || dados.modulo;
    if (nivel !== "medio" && nivel !== "avancado") {
      if (dados.modulo === "teologia") {
        return null;
      }
      return "No Polo SETADE, selecione o nível (Médio ou Avançado) e a sala.";
    }
    if (!dados.salaTurmaId) {
      return "No Polo SETADE, selecione a sala da turma.";
    }
    var salaSetade = SALAS_TURMA_SETAD.find(function (s) {
      return s.id === dados.salaTurmaId;
    });
    if (!salaSetade || salaSetade.modulo !== nivel) {
      return "A sala não corresponde ao nível escolhido no SETADE.";
    }
    if (dados.modulo && dados.modulo !== nivel && dados.modulo !== "teologia") {
      return "O módulo do curso deve ser o mesmo nível selecionado no SETADE.";
    }
    return null;
  }
  return null;
}

function configurarDirecionamentoPresencialInterno() {
  var poloEl = document.getElementById("secPolo");
  var moduloEl = document.getElementById("secModulo");
  if (!poloEl || poloEl.dataset.direcionamentoBound === "1") return;
  poloEl.dataset.direcionamentoBound = "1";

  popularSelectPolosSetad(poloEl, poloEl.value || "");
  var nivelEl = document.getElementById("secSetadeNivel");
  if (nivelEl) {
    popularSelectNivelSetade(nivelEl, nivelEl.value || "");
  }
  alternarUiPoloSetadePresencial();

  poloEl.addEventListener("change", alternarUiPoloSetadePresencial);

  if (nivelEl) {
    nivelEl.addEventListener("change", function () {
      atualizarSelectSalaTurmaPresencial(nivelEl.value, "");
      if (moduloEl && (nivelEl.value === "medio" || nivelEl.value === "avancado")) {
        moduloEl.value = nivelEl.value;
      }
    });
  }

  if (moduloEl) {
    moduloEl.addEventListener("change", function () {
      if (ehPoloSetade(poloEl.value) && nivelEl) {
        if (moduloEl.value === "medio" || moduloEl.value === "avancado") {
          nivelEl.value = moduloEl.value;
          atualizarSelectSalaTurmaPresencial(moduloEl.value, "");
        } else {
          nivelEl.value = "";
          atualizarSelectSalaTurmaPresencial("", "");
        }
      }
    });
  }
}

function reinicializarDirecionamentoPresencialAposReset() {
  var poloEl = document.getElementById("secPolo");
  var nivelEl = document.getElementById("secSetadeNivel");
  if (poloEl) poloEl.value = "";
  if (nivelEl) nivelEl.value = "";
  alternarUiPoloSetadePresencial();
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
