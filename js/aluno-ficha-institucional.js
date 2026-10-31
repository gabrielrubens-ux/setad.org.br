/* Ficha do aluno — aba dedicada no painel (notas, mensalidades, turma por permissão). */

var FICHA_ALUNO_ESTADO = {
  matriculaId: null,
  secao: "notas"
};

function obterPermissoesFichaAluno(sessao) {
  sessao = sessao || null;
  var perfil = sessao && sessao.perfil ? sessao.perfil : "";
  var semFinanceiro =
    typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
    coordenacaoPedagogicaSemFinanceiro(sessao);

  var perm = {
    notas: false,
    notasEditar: false,
    mensalidades: false,
    turma: false,
    turmaEditar: false
  };

  if (semFinanceiro || perfil === "coordenacao") {
    perm.notas = true;
    perm.notasEditar = true;
    perm.turma = true;
    perm.turmaEditar = true;
    return perm;
  }

  if (perfil === "secretaria") {
    perm.notas = true;
    perm.notasEditar = true;
    perm.mensalidades = true;
    perm.turma = true;
    perm.turmaEditar = true;
    return perm;
  }

  if (perfil === "contador") {
    perm.mensalidades = true;
    return perm;
  }

  if (perfil === "diretor") {
    perm.notas = true;
    perm.mensalidades = true;
    perm.turma = true;
    return perm;
  }

  if (perfil === "professor" || perfil === "autorizado") {
    perm.notas = true;
    perm.notasEditar = true;
    perm.turma = true;
    return perm;
  }

  perm.notas = true;
  perm.notasEditar = true;
  perm.mensalidades = !semFinanceiro;
  perm.turma = true;
  perm.turmaEditar = perfil === "secretaria";
  return perm;
}

function obterMatriculaFichaAlunoAtual() {
  if (!FICHA_ALUNO_ESTADO.matriculaId) return null;
  return obterMatriculas().find(function (m) {
    return m.id === FICHA_ALUNO_ESTADO.matriculaId;
  });
}

function obterSessaoFichaAlunoInstitucional() {
  if (typeof obterSessaoOperacionalListaAlunos === "function") {
    var s = obterSessaoOperacionalListaAlunos();
    if (s) return s;
  }
  if (typeof obterSessaoSecretaria === "function") {
    var sec = obterSessaoSecretaria();
    if (sec) return sec;
  }
  if (typeof obterSessaoDirecao === "function") {
    return obterSessaoDirecao();
  }
  return null;
}

function ativarNavFichaAlunoInstitucional() {
  var navItem = document.getElementById("navItemFichaAluno");
  if (navItem) navItem.hidden = false;
}

function abrirFichaAlunoInstitucional(matriculaId, secaoInicial) {
  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var perm = obterPermissoesFichaAluno(obterSessaoFichaAlunoInstitucional());
  secaoInicial = secaoInicial || "notas";
  if (secaoInicial === "mensalidades" && !perm.mensalidades) secaoInicial = "notas";
  if (secaoInicial === "turma" && !perm.turma) secaoInicial = perm.notas ? "notas" : "mensalidades";
  if (secaoInicial === "notas" && !perm.notas && perm.mensalidades) secaoInicial = "mensalidades";

  FICHA_ALUNO_ESTADO.matriculaId = matriculaId;
  FICHA_ALUNO_ESTADO.secao = secaoInicial;

  ativarNavFichaAlunoInstitucional();

  var link = document.querySelector('.painel__nav-link[data-tab="tab-ficha-aluno"]');
  if (link) {
    link.click();
    return;
  }

  var navLinks = document.querySelectorAll(".painel__nav-link[data-tab]");
  var tabs = document.querySelectorAll(".painel__tab");
  navLinks.forEach(function (l) {
    l.classList.toggle("active", l.getAttribute("data-tab") === "tab-ficha-aluno");
  });
  tabs.forEach(function (t) {
    t.classList.toggle("active", t.id === "tab-ficha-aluno");
  });
  renderizarFichaAlunoInstitucionalAtual();
}

function renderizarFichaAlunoInstitucionalAtual(sessao) {
  sessao = sessao || obterSessaoFichaAlunoInstitucional();
  var host = document.getElementById("fichaAlunoInstitucionalHost");
  if (!host) return;

  var matricula = obterMatriculaFichaAlunoAtual();
  if (!matricula) {
    host.innerHTML =
      '<p class="lista-vazia">Nenhum aluno selecionado. Na aba <strong>Alunos</strong>, use Notas, Mensalidades ou Turma.</p>';
    return;
  }

  renderizarFichaAlunoInstitucional("fichaAlunoInstitucionalHost", matricula, sessao, {
    secaoInicial: FICHA_ALUNO_ESTADO.secao
  });

  var titulo = document.getElementById("painelTitulo");
  var subtitulo = document.getElementById("painelSubtitulo");
  if (titulo) titulo.textContent = matricula.nomeCompleto || "Ficha do aluno";
  if (subtitulo) {
    subtitulo.textContent =
      "Ficha institucional — e-mail " +
      (matricula.email || "—") +
      ". Conteúdo conforme permissões da sua área.";
  }
}

function renderizarFichaAlunoInstitucional(hostId, matricula, sessao, opcoes) {
  var host = document.getElementById(hostId);
  if (!host || !matricula) return;
  opcoes = opcoes || {};
  sessao = sessao || obterSessaoFichaAlunoInstitucional();

  var perm = obterPermissoesFichaAluno(sessao);
  var esc = typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var moduloNome =
    matricula.modulo && typeof MODULOS_CURSO !== "undefined" && MODULOS_CURSO[matricula.modulo]
      ? MODULOS_CURSO[matricula.modulo].nome
      : matricula.modulo || "—";

  var abas = [];
  if (perm.notas) abas.push({ id: "notas", rotulo: "Notas e médias" });
  if (perm.mensalidades) abas.push({ id: "mensalidades", rotulo: "Mensalidades e pagamentos" });
  if (perm.turma) abas.push({ id: "turma", rotulo: "Polo e turma" });

  var secaoInicial = opcoes.secaoInicial || FICHA_ALUNO_ESTADO.secao || "notas";
  if (abas.every(function (a) { return a.id !== secaoInicial; })) {
    secaoInicial = abas.length ? abas[0].id : "notas";
  }
  FICHA_ALUNO_ESTADO.secao = secaoInicial;

  var navHtml =
    abas.length > 1
      ? '<nav class="turma-painel-academico__abas ficha-aluno__abas" role="tablist" aria-label="Ficha do aluno">' +
        abas
          .map(function (aba) {
            return (
              '<button type="button" class="turma-painel-academico__aba' +
              (aba.id === secaoInicial ? " turma-painel-academico__aba--ativa" : "") +
              '" data-ficha-aba="' +
              esc(aba.id) +
              '" role="tab">' +
              esc(aba.rotulo) +
              "</button>"
            );
          })
          .join("") +
        "</nav>"
      : abas.length === 1
        ? '<p class="presencial-bloco__hint">' + esc(abas[0].rotulo) + "</p>"
        : '<p class="lista-vazia">Nenhuma seção disponível para sua área.</p>';

  host.innerHTML =
    '<div class="ficha-aluno-institucional turma-painel-academico">' +
    '<header class="ficha-aluno__cabecalho">' +
    "<div>" +
    "<h2 class=\"ficha-aluno__nome\">" +
    esc(matricula.nomeCompleto) +
    "</h2>" +
    '<p class="presencial-bloco__hint">' +
    esc(matricula.email || "") +
    " · " +
    esc(moduloNome) +
    "</p></div>" +
    '<button type="button" class="btn btn--link btn--sm" id="fichaAlunoBtnVoltarLista">← Voltar à lista de alunos</button>' +
    "</header>" +
    navHtml +
    '<div id="fichaAlunoAbaConteudo" class="turma-painel-academico__conteudo"></div>' +
    "</div>";

  function pintarSecao(secao) {
    FICHA_ALUNO_ESTADO.secao = secao;
    var alvo = document.getElementById("fichaAlunoAbaConteudo");
    if (!alvo) return;

    host.querySelectorAll("[data-ficha-aba]").forEach(function (btn) {
      btn.classList.toggle(
        "turma-painel-academico__aba--ativa",
        btn.getAttribute("data-ficha-aba") === secao
      );
    });

    if (secao === "mensalidades" && perm.mensalidades) {
      alvo.innerHTML = '<div id="fichaAlunoAbaMensalidades"></div>';
      if (typeof renderizarPlanilhaMensalidadesCadastroAluno === "function") {
        renderizarPlanilhaMensalidadesCadastroAluno(matricula, sessao);
      }
      return;
    }

    if (secao === "turma" && perm.turma) {
      alvo.innerHTML = '<div id="fichaAlunoAbaTurma"></div>';
      renderizarTurmaFichaAluno(document.getElementById("fichaAlunoAbaTurma"), matricula, sessao, perm);
      return;
    }

    renderizarQuadroNotasMediasFichaAluno(matricula, sessao, perm);
  }

  host.querySelectorAll("[data-ficha-aba]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      pintarSecao(btn.getAttribute("data-ficha-aba"));
    });
  });

  var btnVoltar = document.getElementById("fichaAlunoBtnVoltarLista");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", function () {
      var tabId = obterTabVoltarFichaAlunoPainel();
      var link = document.querySelector('.painel__nav-link[data-tab="' + tabId + '"]');
      if (link) link.click();
    });
  }

  pintarSecao(secaoInicial);
}

function renderizarQuadroNotasMediasFichaAluno(matricula, sessao, perm) {
  var alvo = document.getElementById("fichaAlunoAbaConteudo");
  if (!alvo || !matricula) return;
  perm = perm || obterPermissoesFichaAluno(sessao);

  var periodo =
    typeof obterPeriodoLetivoAtual === "function" ? obterPeriodoLetivoAtual() : "";
  var esc = typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var podeEditar = perm.notasEditar !== false;

  alvo.innerHTML =
    '<section class="ficha-aluno__quadro-notas presencial-bloco" aria-labelledby="fichaQuadroNotasTitulo">' +
    '<header class="ficha-aluno__quadro-notas-cab">' +
    '<div><h3 id="fichaQuadroNotasTitulo" class="ficha-aluno__quadro-notas-titulo">Quadro de notas e médias</h3>' +
    '<p class="presencial-bloco__hint">' +
    (podeEditar
      ? "Período " +
        esc(periodo) +
        ". Informe o <strong>material</strong> e a <strong>nota</strong> de cada disciplina conforme o nível do curso. Use <strong>Adicionar material</strong> quando precisar."
      : "Visualização do período " +
        esc(periodo) +
        ". Alterações são feitas pela secretaria ou coordenação pedagógica.") +
    "</p></div>" +
    (podeEditar
      ? '<span class="status-badge status-badge--pago ficha-aluno__quadro-notas-badge">Edição liberada</span>'
      : "") +
    "</header>" +
    '<div id="fichaAlunoAbaNotas" class="ficha-aluno__quadro-notas-corpo"></div>' +
    "</section>";

  if (typeof renderizarPlanilhaNotasCadastroAluno === "function") {
    renderizarPlanilhaNotasCadastroAluno(matricula, sessao, {
      somenteLeitura: !podeEditar
    });
  } else {
    document.getElementById("fichaAlunoAbaNotas").innerHTML =
      '<p class="lista-vazia">Módulo de notas indisponível.</p>';
  }
}

function alternarUiPoloSetadeFichaAluno() {
  var poloEl = document.getElementById("fichaTurmaPolo");
  var bloco = document.getElementById("fichaTurmaBlocoSetade");
  var salaEl = document.getElementById("fichaTurmaSala");
  var nivelEl = document.getElementById("fichaTurmaSetadeNivel");
  if (!poloEl || !bloco) return;

  var setade = typeof ehPoloSetade === "function" && ehPoloSetade(poloEl.value);
  bloco.hidden = !setade;

  if (!setade) {
    if (nivelEl) nivelEl.value = "";
    if (salaEl) {
      salaEl.disabled = true;
      salaEl.innerHTML = '<option value="">Selecione o polo SETADE para nível e sala</option>';
    }
    return;
  }

  atualizarSelectSalaTurmaFichaAluno(nivelEl ? nivelEl.value : "", salaEl ? salaEl.value : "");
}

function atualizarSelectSalaTurmaFichaAluno(modulo, valorSelecionado) {
  var salaEl = document.getElementById("fichaTurmaSala");
  var hintEl = document.getElementById("fichaTurmaSalaHint");
  if (!salaEl || typeof listarSalasTurmaPorModulo !== "function") return;

  var salas = listarSalasTurmaPorModulo(modulo);
  if (typeof moduloExigeSalaTurma === "function" && !moduloExigeSalaTurma(modulo)) {
    salaEl.innerHTML = '<option value="">Não se aplica a este módulo</option>';
    salaEl.disabled = true;
    if (hintEl) {
      hintEl.textContent = "Salas valem para Médio e Avançado no polo SETADE.";
    }
    return;
  }

  salaEl.disabled = !modulo;
  if (hintEl) hintEl.textContent = "Escolha a sala em que o aluno será acompanhado no polo.";
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

function obterTurmaCatalogoIdDaMatricula(matricula) {
  if (typeof obterTurmasDoAlunoPorMatricula !== "function" || !matricula) return "";
  var turmas = obterTurmasDoAlunoPorMatricula(matricula);
  return turmas.length ? turmas[0].id : "";
}

function montarOptionsTurmaCatalogoFicha(valorSelecionado) {
  if (typeof listarTurmasCatalogoSetad !== "function") {
    return '<option value="">Catálogo de turmas indisponível</option>';
  }
  var esc = typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  var turmas = listarTurmasCatalogoSetad();
  var porCategoria = {};
  turmas.forEach(function (t) {
    var cat = t.categoria || "Turmas";
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(t);
  });

  var html = '<option value="">— Selecione polo / turma —</option>';
  Object.keys(porCategoria).forEach(function (cat) {
    html += '<optgroup label="' + esc(cat) + '">';
    porCategoria[cat].forEach(function (t) {
      var sel = valorSelecionado === t.id ? " selected" : "";
      var detalhe =
        t.tipo === "setade" && t.modulo
          ? " (" + (t.modulo === "medio" ? "Médio" : "Avançado") + ")"
          : t.bairro
            ? " — " + t.bairro
            : "";
      html +=
        '<option value="' +
        esc(t.id) +
        '"' +
        sel +
        ">" +
        esc(t.nome) +
        esc(detalhe) +
        "</option>";
    });
    html += "</optgroup>";
  });
  return html;
}

function aplicarTurmaCatalogoNaFichaAluno(turmaId) {
  if (!turmaId || typeof obterTurmaCatalogoPorId !== "function") return;
  var turma = obterTurmaCatalogoPorId(turmaId);
  if (!turma) return;

  var poloEl = document.getElementById("fichaTurmaPolo");
  var nivelEl = document.getElementById("fichaTurmaSetadeNivel");

  if (poloEl) poloEl.value = turma.poloId || "";

  if (turma.tipo === "setade") {
    if (nivelEl) nivelEl.value = turma.modulo || "";
    alternarUiPoloSetadeFichaAluno();
    atualizarSelectSalaTurmaFichaAluno(turma.modulo, turma.salaTurmaId || "");
  } else {
    alternarUiPoloSetadeFichaAluno();
  }

  var resumo = document.getElementById("fichaTurmaResumoAtual");
  if (resumo) {
    resumo.innerHTML = montarResumoTurmaAtualFichaAluno(null, turma);
  }
}

function montarResumoTurmaAtualFichaAluno(matricula, turmaCatalogo) {
  var esc = typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  matricula = matricula || null;

  if (turmaCatalogo) {
    return (
      '<p class="ficha-aluno__turma-atual"><strong>Turma selecionada:</strong> ' +
      esc(turmaCatalogo.nome) +
      (turmaCatalogo.poloNome ? " · " + esc(turmaCatalogo.poloNome) : "") +
      "</p>"
    );
  }

  if (!matricula || (!matricula.poloId && !matricula.salaTurmaId)) {
    return (
      '<p class="ficha-aluno__turma-atual ficha-aluno__turma-atual--vazio">' +
      "Nenhum polo ou turma definido. Use o seletor abaixo para vincular o aluno." +
      "</p>"
    );
  }

  var turmas =
    typeof obterTurmasDoAlunoPorMatricula === "function"
      ? obterTurmasDoAlunoPorMatricula(matricula)
      : [];
  var labelTurma = turmas.length ? turmas[0].nome : "";
  var direcionamento =
    typeof formatarDirecionamentoAluno === "function"
      ? formatarDirecionamentoAluno(matricula)
      : matricula.poloNome || "—";

  return (
    '<p class="ficha-aluno__turma-atual"><strong>Vínculo atual:</strong> ' +
    esc(direcionamento) +
    (labelTurma && labelTurma !== direcionamento ? " · Turma: " + esc(labelTurma) : "") +
    "</p>"
  );
}

function renderizarTurmaFichaAluno(container, matricula, sessao, perm) {
  if (!container) return;

  if (!perm.turmaEditar) {
    container.innerHTML =
      '<div class="ficha-aluno__turma-resumo presencial-bloco">' +
      montarResumoTurmaAtualFichaAluno(matricula) +
      '<p class="presencial-bloco__hint">Alteração de polo e turma é feita pela secretaria ou coordenação.</p>' +
      "</div>";
    return;
  }

  var turmaCatalogoId = obterTurmaCatalogoIdDaMatricula(matricula);
  var semVinculo = !matricula.poloId;

  container.innerHTML =
    '<section class="ficha-aluno__quadro-turma presencial-bloco">' +
    '<header class="ficha-aluno__quadro-turma-cab">' +
    "<div><h3 class=\"ficha-aluno__quadro-turma-titulo\">Polo e turma do aluno</h3>" +
    '<p class="presencial-bloco__hint">Vincule ao catálogo (SETADE ou polos em Belém). Clique em <strong>Editar</strong> para alterar.</p></div>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="fichaTurmaBtnEditar">Editar polo e turma</button>' +
    "</header>" +
    '<div id="fichaTurmaResumoAtual" class="ficha-aluno__turma-resumo-atual">' +
    montarResumoTurmaAtualFichaAluno(matricula) +
    "</div>" +
    '<div id="fichaTurmaFormWrap" class="ficha-aluno__turma-form-wrap"' +
    (semVinculo ? "" : " hidden") +
    ">" +
    '<fieldset class="presencial-bloco presencial-bloco--direcionamento ficha-aluno__turma-form">' +
    "<legend>Alterar vínculo</legend>" +
    '<div class="form-group form-group--full">' +
    '<label for="fichaTurmaCatalogo">Turma no catálogo *</label>' +
    '<select id="fichaTurmaCatalogo">' +
    montarOptionsTurmaCatalogoFicha(turmaCatalogoId) +
    "</select>" +
    '<p class="presencial-bloco__hint presencial-bloco__hint--inline">Escolha a turma; polo e sala são preenchidos automaticamente quando aplicável.</p>' +
    "</div>" +
    '<p class="presencial-bloco__titulo ficha-aluno__turma-manual-titulo">Ajuste manual (opcional)</p>' +
    '<div class="matricula-form__grid">' +
    '<div class="form-group form-group--full">' +
    '<label for="fichaTurmaPolo">Polo do SETAD</label>' +
    '<select id="fichaTurmaPolo"><option value="">Selecione o polo...</option></select>' +
    "</div></div>" +
    '<div id="fichaTurmaBlocoSetade" class="presencial-bloco-setade" hidden>' +
    '<p class="presencial-bloco__titulo">Polo SETADE — nível e sala</p>' +
    '<div class="matricula-form__grid">' +
    '<div class="form-group">' +
    '<label for="fichaTurmaSetadeNivel">Nível</label>' +
    '<select id="fichaTurmaSetadeNivel">' +
    '<option value="">Selecione o nível...</option>' +
    '<option value="medio">Médio — Teologia e Ciências Bíblicas</option>' +
    '<option value="avancado">Avançado — Teologia</option>' +
    "</select></div>" +
    '<div class="form-group">' +
    '<label for="fichaTurmaSala">Sala / turma</label>' +
    '<select id="fichaTurmaSala" disabled><option value="">Selecione o nível primeiro...</option></select>' +
    '<p id="fichaTurmaSalaHint" class="presencial-bloco__hint presencial-bloco__hint--inline"></p>' +
    "</div></div></div>" +
    '<button type="button" class="btn btn--primary btn--sm" id="fichaTurmaBtnSalvar">Salvar polo e turma</button> ' +
    '<button type="button" class="btn btn--link btn--sm" id="fichaTurmaBtnCancelarEdicao">Cancelar edição</button>' +
    '<p id="fichaTurmaMsg" class="form-mensagem" role="status"></p>' +
    "</fieldset></div></section>";

  var poloEl = document.getElementById("fichaTurmaPolo");
  if (poloEl && typeof popularSelectPolosSetad === "function") {
    popularSelectPolosSetad(poloEl, matricula.poloId || "");
  }
  var nivelEl = document.getElementById("fichaTurmaSetadeNivel");
  if (nivelEl && matricula.setadeNivel) {
    nivelEl.value = matricula.setadeNivel;
  } else if (nivelEl && matricula.modulo && (matricula.modulo === "medio" || matricula.modulo === "avancado")) {
    nivelEl.value = matricula.modulo;
  }

  alternarUiPoloSetadeFichaAluno();
  if (matricula.salaTurmaId && nivelEl) {
    atualizarSelectSalaTurmaFichaAluno(nivelEl.value, matricula.salaTurmaId);
  }

  var catalogoEl = document.getElementById("fichaTurmaCatalogo");
  if (catalogoEl) {
    catalogoEl.addEventListener("change", function () {
      aplicarTurmaCatalogoNaFichaAluno(catalogoEl.value);
    });
    if (turmaCatalogoId) {
      aplicarTurmaCatalogoNaFichaAluno(turmaCatalogoId);
    }
  }

  if (poloEl) {
    poloEl.addEventListener("change", function () {
      alternarUiPoloSetadeFichaAluno();
      if (catalogoEl) catalogoEl.value = "";
      var resumo = document.getElementById("fichaTurmaResumoAtual");
      if (resumo) resumo.innerHTML = montarResumoTurmaAtualFichaAluno(matricula);
    });
  }
  if (nivelEl) {
    nivelEl.addEventListener("change", function () {
      atualizarSelectSalaTurmaFichaAluno(nivelEl.value, "");
    });
  }

  var btnSalvar = document.getElementById("fichaTurmaBtnSalvar");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", function () {
      salvarTurmaFichaAluno(matricula.id, sessao);
    });
  }

  var formWrap = document.getElementById("fichaTurmaFormWrap");
  var btnEditar = document.getElementById("fichaTurmaBtnEditar");
  var btnCancelar = document.getElementById("fichaTurmaBtnCancelarEdicao");

  function fecharEdicaoTurmaFicha() {
    if (formWrap) formWrap.hidden = true;
    if (btnEditar) btnEditar.hidden = false;
  }

  function abrirEdicaoTurmaFicha() {
    if (formWrap) formWrap.hidden = false;
    if (btnEditar) btnEditar.hidden = true;
    formWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (btnEditar) {
    btnEditar.addEventListener("click", abrirEdicaoTurmaFicha);
    if (semVinculo) btnEditar.hidden = true;
  }
  if (btnCancelar) {
    btnCancelar.addEventListener("click", fecharEdicaoTurmaFicha);
  }
}

function salvarTurmaFichaAluno(matriculaId, sessao) {
  var msg = document.getElementById("fichaTurmaMsg");
  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var catalogoEl = document.getElementById("fichaTurmaCatalogo");
  if (catalogoEl && catalogoEl.value) {
    aplicarTurmaCatalogoNaFichaAluno(catalogoEl.value);
  }

  var poloEl = document.getElementById("fichaTurmaPolo");
  var salaEl = document.getElementById("fichaTurmaSala");
  var nivelEl = document.getElementById("fichaTurmaSetadeNivel");

  if (!poloEl || !poloEl.value) {
    if (msg) {
      msg.className = "form-mensagem form-mensagem--erro visible";
      msg.textContent = "Selecione a turma no catálogo ou escolha o polo do aluno.";
    }
    return;
  }

  var dados = {
    modulo: matricula.modulo,
    poloId: poloEl ? poloEl.value : "",
    poloNome: poloEl && poloEl.value && typeof obterNomePoloSetad === "function" ? obterNomePoloSetad(poloEl.value) : "",
    setadeNivel: nivelEl && poloEl && typeof ehPoloSetade === "function" && ehPoloSetade(poloEl.value) ? nivelEl.value : "",
    salaTurmaId: salaEl && !salaEl.disabled ? salaEl.value : "",
    salaTurmaNome:
      salaEl && salaEl.value && typeof obterLabelSalaTurma === "function"
        ? obterLabelSalaTurma(salaEl.value)
        : ""
  };

  if (typeof ehPoloSetade === "function" && poloEl && !ehPoloSetade(poloEl.value)) {
    dados.setadeNivel = "";
    dados.salaTurmaId = "";
    dados.salaTurmaNome = "";
  }

  var erro =
    typeof validarDirecionamentoInternoMatricula === "function"
      ? validarDirecionamentoInternoMatricula(dados)
      : null;
  if (erro) {
    if (msg) {
      msg.className = "form-mensagem form-mensagem--erro visible";
      msg.textContent = erro;
    }
    return;
  }

  var matriculas = obterMatriculas();
  var idx = matriculas.findIndex(function (m) {
    return m.id === matriculaId;
  });
  if (idx === -1) return;

  matriculas[idx] = Object.assign({}, matriculas[idx], {
    poloId: dados.poloId,
    poloNome: dados.poloNome,
    setadeNivel: dados.setadeNivel,
    salaTurmaId: dados.salaTurmaId,
    salaTurmaNome: dados.salaTurmaNome,
    turmaCatalogoId: catalogoEl && catalogoEl.value ? catalogoEl.value : obterTurmaCatalogoIdDaMatricula(matriculas[idx])
  });
  salvarMatriculas(matriculas);

  if (msg) {
    msg.className = "form-mensagem form-mensagem--sucesso visible";
    msg.textContent = "Polo e turma atualizados.";
  }

  if (typeof renderizarAlunosSecretaria === "function") {
    renderizarAlunosSecretaria();
  }
  renderizarFichaAlunoInstitucionalAtual(sessao);
  var formWrap = document.getElementById("fichaTurmaFormWrap");
  var btnEditar = document.getElementById("fichaTurmaBtnEditar");
  if (formWrap) formWrap.hidden = true;
  if (btnEditar) btnEditar.hidden = false;
}

function obterTabVoltarFichaAlunoPainel() {
  if (document.querySelector('.painel__nav-link[data-tab="tab-alunos"]')) {
    return "tab-alunos";
  }
  if (document.querySelector('.painel__nav-link[data-tab="tab-pagamentos-alunos"]')) {
    return "tab-pagamentos-alunos";
  }
  return "tab-alunos";
}

function abrirFichaAlunoPorEmailInstitucional(email, secaoInicial) {
  if (typeof obterMatriculaPorEmail !== "function") return false;
  var matricula = obterMatriculaPorEmail(String(email || "").trim());
  if (!matricula) return false;
  abrirFichaAlunoInstitucional(matricula.id, secaoInicial || "mensalidades");
  return true;
}
function abrirFichaAlunoNotasFromLista(matriculaId) {
  abrirFichaAlunoInstitucional(matriculaId, "notas");
}

function abrirFichaAlunoMensalidadesFromLista(matriculaId) {
  abrirFichaAlunoInstitucional(matriculaId, "mensalidades");
}

function abrirFichaAlunoTurmaFromLista(matriculaId) {
  abrirFichaAlunoInstitucional(matriculaId, "turma");
}
