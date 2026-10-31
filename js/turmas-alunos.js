/* Turmas no sistema de alunos — catálogo (polos + salas) e vínculo definido pela secretaria. */

function renderizarPainelTurmasInstitucional(containerId, opcoes) {
  var container = document.getElementById(containerId);
  if (!container || typeof listarTurmasCatalogoSetad !== "function") return;

  opcoes = opcoes || {};
  var sessao = opcoes.sessao || null;
  var turmas = listarTurmasCatalogoSetad();
  var porCategoria = {};

  turmas.forEach(function (turma) {
    var cat = turma.categoria || "Turmas";
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(turma);
  });

  var categorias = Object.keys(porCategoria);
  if (!categorias.length) {
    container.innerHTML =
      '<p class="lista-vazia">Nenhuma turma cadastrada. Verifique a lista de polos do SETAD.</p>';
    return;
  }

  var filtroHtml = "";
  if (opcoes.mostrarFiltro) {
    filtroHtml =
      '<div class="turmas-toolbar">' +
      '<label for="turmasFiltroTipo">Filtrar</label>' +
      '<select id="turmasFiltroTipo" class="turmas-toolbar__select">' +
      '<option value="todos">Todas as turmas</option>' +
      '<option value="polo">Somente polos em Belém</option>' +
      '<option value="setade">Somente Polo SETADE (nível e sala)</option>' +
      "</select></div>";
  }

  container.innerHTML =
    (opcoes.intro
      ? '<p class="section__text turmas-intro">' + opcoes.intro + "</p>"
      : "") +
    filtroHtml +
    '<div id="turmasCatalogoGrid" class="turmas-grid"></div>' +
    '<div id="turmasDetalheAlunos" class="turmas-detalhe" hidden></div>';

  function pintarGrid(filtroTipo) {
    var grid = document.getElementById("turmasCatalogoGrid");
    if (!grid) return;
    var html = "";
    categorias.forEach(function (cat) {
      var lista = porCategoria[cat].filter(function (t) {
        if (filtroTipo === "polo") return t.tipo === "polo";
        if (filtroTipo === "setade") return t.tipo === "setade";
        return true;
      });
      if (!lista.length) return;
      html +=
        '<section class="turmas-grupo"><h2 class="turmas-grupo__titulo">' +
        escaparHtml(cat) +
        "</h2><div class=\"turmas-grupo__cards\">";
      lista.forEach(function (turma) {
        var total = contarAlunosNaTurma(turma);
        var meta =
          turma.tipo === "polo"
            ? escaparHtml(turma.bairro || turma.local || "Belém")
            : turma.tipo === "setade"
              ? escaparHtml(
                  "Polo SETADE · " +
                    (turma.modulo === "medio" ? "Nível Médio" : "Nível Avançado")
                )
              : escaparHtml(
                  turma.modulo === "medio" ? "Curso Médio" : "Curso Avançado"
                );
        html +=
          '<article class="turma-card turma-card--' +
          escaparHtml(turma.tipo) +
          '" data-turma-id="' +
          escaparHtml(turma.id) +
          '" tabindex="0" role="button">' +
          '<h3 class="turma-card__nome">' +
          escaparHtml(turma.nome) +
          "</h3>" +
          '<p class="turma-card__meta">' +
          meta +
          "</p>" +
          '<p class="turma-card__contagem"><strong>' +
          total +
          "</strong> aluno" +
          (total === 1 ? "" : "s") +
          " vinculado" +
          (total === 1 ? "" : "s") +
          "</p>" +
          "</article>";
      });
      html += "</div></section>";
    });
    grid.innerHTML =
      html ||
      '<p class="lista-vazia">Nenhuma turma para este filtro.</p>';

    grid.querySelectorAll("[data-turma-id]").forEach(function (card) {
      function abrir() {
        var id = card.getAttribute("data-turma-id");
        if (typeof opcoes.onTurmaClick === "function") {
          opcoes.onTurmaClick(id);
          return;
        }
        if (!opcoes.mostrarAlunosAoClicar) return;
        mostrarAlunosDaTurma(id);
      }
      card.addEventListener("click", abrir);
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          abrir();
        }
      });
    });
  }

  function mostrarAlunosDaTurma(turmaId) {
    var detalhe = document.getElementById("turmasDetalheAlunos");
    if (!detalhe) return;
    var turma = obterTurmaCatalogoPorId(turmaId);
    if (!turma) return;
    var alunos = listarAlunosNaTurma(turma);
    detalhe.hidden = false;

    detalhe.innerHTML =
      '<div id="turmasDetalheVoltarWrap" class="turmas-detalhe__toolbar"></div>' +
      '<div id="turmasPainelAcademico"></div>';

    var voltarWrap = document.getElementById("turmasDetalheVoltarWrap");
    if (voltarWrap) {
      voltarWrap.innerHTML =
        '<button type="button" class="btn btn--secondary btn--sm" id="turmasDetalheVoltar">← Voltar às turmas</button>';
      var voltar = document.getElementById("turmasDetalheVoltar");
      if (voltar) {
        voltar.addEventListener("click", function () {
          detalhe.hidden = true;
          detalhe.innerHTML = "";
        });
      }
    }

    var alvo = document.getElementById("turmasPainelAcademico");
    if (!alunos.length) {
      if (alvo) {
        alvo.innerHTML =
          '<h3 class="turmas-detalhe__titulo">' +
          escaparHtml(turma.nome) +
          '</h3><p class="lista-vazia">Nenhum aluno vinculado a esta turma ainda.</p>';
      }
      detalhe.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (alvo && typeof renderizarPainelTurmaMensalidadesENotas === "function") {
      renderizarPainelTurmaMensalidadesENotas(alvo, alunos, sessao, {
        titulo: turma.nome,
        turmaId: turma.id,
        abaInicial:
          opcoes.abaInicialDetalhe ||
          (typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
          coordenacaoPedagogicaSemFinanceiro(sessao)
            ? "notas"
            : "mensalidades"),
        subtitulo:
          typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
          coordenacaoPedagogicaSemFinanceiro(sessao)
            ? "Notas e médias desta turma. Pagamentos são da secretaria."
            : "Mensalidades e notas desta turma. Alterações refletem em todo o sistema.",
        onAtualizar: function () {
          mostrarAlunosDaTurma(turmaId);
        }
      });
    } else if (alvo) {
      alvo.innerHTML =
        '<p class="lista-vazia">Carregue os módulos acadêmico e financeiro para ver esta turma.</p>';
    }
    detalhe.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  pintarGrid("todos");
  var filtroEl = document.getElementById("turmasFiltroTipo");
  if (filtroEl) {
    filtroEl.addEventListener("change", function () {
      pintarGrid(filtroEl.value);
      var detalhe = document.getElementById("turmasDetalheAlunos");
      if (detalhe) detalhe.hidden = true;
    });
  }
}

function renderizarTurmasPainelAluno(sessao) {
  var container = document.getElementById("turmasAlunoContainer");
  if (!container) return;

  var matricula =
    typeof obterMatriculaPorEmail === "function"
      ? obterMatriculaPorEmail(sessao.email)
      : null;
  var minhas = obterTurmasDoAlunoPorMatricula(matricula);

  var blocoMinha =
    '<section class="turmas-aluno-minha">' +
    "<h2 class=\"turmas-grupo__titulo\">Sua turma no SETAD</h2>" +
    "<p class=\"section__text\">O polo e a sala são definidos pela secretaria ou coordenação — não é possível alterar por aqui.</p>";

  if (!minhas.length) {
    blocoMinha +=
      '<p class="turmas-aluno-pendente">Seu vínculo de turma ainda não foi registrado. Procure a secretaria do seminário.</p>';
  } else {
    blocoMinha += '<div class="turmas-grupo__cards">';
    minhas.forEach(function (turma) {
      blocoMinha +=
        '<article class="turma-card turma-card--destaque turma-card--' +
        escaparHtml(turma.tipo) +
        '">' +
        '<span class="turma-card__selo">Seu vínculo</span>' +
        "<h3 class=\"turma-card__nome\">" +
        escaparHtml(turma.nome) +
        "</h3></article>";
    });
    blocoMinha += "</div>";
  }
  blocoMinha += "</section>";

  container.innerHTML =
    blocoMinha +
    '<div id="turmasAlunoCatalogo"></div>';

  renderizarPainelTurmasInstitucional("turmasAlunoCatalogo", {
    intro:
      "Polo SETADE (sede) com turmas por nível e sala; demais polos em Belém na lista geral.",
    mostrarFiltro: true,
    mostrarAlunosAoClicar: false
  });
}
