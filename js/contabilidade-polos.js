/* Contabilidade dos polos — acesso restrito (Kathlen, diretor, contador). */

var CONTAB_POLOS_KEYS = {
  extras: "setad_contab_polos_extras",
  unlock: "setad_contab_polos_unlock"
};

var CONTAB_POLOS_EMAILS_AUTORIZADOS = ["kathlensantiago@gmail.com"];

/** Equipe de contabilidade — painel do contador e contabilidade dos polos. */
var CONTAB_POLOS_EMAILS_CONTABILIDADE = [
  "rafaeladmtc@gmail.com",
  "rsgestaofinanceirapa@gmail.com"
];

/** Rede local / IP — visualização e edição para o programador (localhost, LAN). */
var CONTAB_POLOS_EMAILS_PROGRAMADOR = [
  "gabrielrubens0@gmail.com",
  "enocmiranda26@gmail.com"
];

function contabilidadePolosModoProgramadorIp() {
  return (
    typeof ambientePermiteDemonstracao === "function" && ambientePermiteDemonstracao()
  );
}

function sessaoInstitucionalContabPolos(sessao) {
  if (!sessao) return false;
  var perfis = ["secretaria", "diretor", "contador"];
  if (perfis.indexOf(sessao.perfil) >= 0) return true;
  if (typeof sessaoTemPerfilInstitucional === "function") {
    return perfis.some(function (p) {
      return sessaoTemPerfilInstitucional(sessao, p);
    });
  }
  return false;
}

var CONTAB_POLOS_SITUACOES = [
  { id: "em_dia", label: "Em dia", classe: "polo-contab__sit--ok" },
  { id: "atraso", label: "Em atraso", classe: "polo-contab__sit--atraso" },
  { id: "pendente", label: "Pendente", classe: "polo-contab__sit--pendente" }
];

var CONTAB_POLOS_MODELOS = [
  {
    id: "mensalidade_paga",
    titulo: "Mensalidade paga (mês atual)",
    tipoCobranca: "mensalidade",
    situacaoPagamento: "pago_presencial"
  },
  {
    id: "taxa_matricula",
    titulo: "Taxa de matrícula paga",
    tipoCobranca: "matricula",
    situacaoPagamento: "pago_presencial"
  },
  {
    id: "marcar_atraso",
    titulo: "Marcar em atraso (sem pagamento)",
    apenasSituacao: "atraso"
  },
  {
    id: "marcar_em_dia",
    titulo: "Marcar em dia (controle manual)",
    apenasSituacao: "em_dia"
  }
];

function normalizarEmailContabPolos(email) {
  return (email || "").trim().toLowerCase();
}

function usuarioPodeAcessarContabilidadePolos(sessao) {
  if (!sessao || !sessao.email) return false;
  var email = normalizarEmailContabPolos(sessao.email);

  if (sessao.perfil === "secretaria") return true;
  if (typeof sessaoTemPerfilInstitucional === "function") {
    if (sessaoTemPerfilInstitucional(sessao, "secretaria")) return true;
  }
  if (
    typeof coordenacaoPedagogicaSemFinanceiro === "function" &&
    coordenacaoPedagogicaSemFinanceiro(sessao)
  ) {
    return false;
  }

  if (contabilidadePolosModoProgramadorIp()) {
    if (CONTAB_POLOS_EMAILS_PROGRAMADOR.indexOf(email) >= 0) return true;
    if (sessaoInstitucionalContabPolos(sessao)) return true;
  }

  if (CONTAB_POLOS_EMAILS_AUTORIZADOS.indexOf(email) >= 0) return true;
  if (CONTAB_POLOS_EMAILS_CONTABILIDADE.indexOf(email) >= 0) return true;
  if (typeof sessaoTemPerfilInstitucional === "function") {
    if (sessaoTemPerfilInstitucional(sessao, "diretor")) return true;
    if (sessaoTemPerfilInstitucional(sessao, "contador")) return true;
  }
  return sessao.perfil === "diretor" || sessao.perfil === "contador";
}

function obterPolosParaContabilidade() {
  if (typeof POLOS_SETAD !== "undefined" && POLOS_SETAD.length) {
    return POLOS_SETAD.slice();
  }
  return [];
}

function obterExtrasContabPolos() {
  try {
    var raw = localStorage.getItem(CONTAB_POLOS_KEYS.extras);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function salvarExtrasContabPolos(mapa) {
  localStorage.setItem(CONTAB_POLOS_KEYS.extras, JSON.stringify(mapa || {}));
}

function obterExtraAlunoPolo(matriculaId) {
  var mapa = obterExtrasContabPolos();
  return mapa[matriculaId] || null;
}

function salvarExtraAlunoPolo(matriculaId, parcial) {
  var mapa = obterExtrasContabPolos();
  var atual = mapa[matriculaId] || {};
  mapa[matriculaId] = Object.assign({}, atual, parcial || {}, {
    atualizadoEm: new Date().toISOString()
  });
  salvarExtrasContabPolos(mapa);
}

function estaDesbloqueadaContabilidadePolos(sessao) {
  if (!sessao || !sessao.email) return false;
  if (
    contabilidadePolosModoProgramadorIp() &&
    usuarioPodeAcessarContabilidadePolos(sessao)
  ) {
    return true;
  }
  try {
    var raw = sessionStorage.getItem(CONTAB_POLOS_KEYS.unlock);
    if (!raw) return false;
    var data = JSON.parse(raw);
    var email = normalizarEmailContabPolos(sessao.email);
    if (data.email !== email) return false;
    return Date.now() < Number(data.until || 0);
  } catch (e) {
    return false;
  }
}

function definirDesbloqueioContabilidadePolos(sessao) {
  sessionStorage.setItem(
    CONTAB_POLOS_KEYS.unlock,
    JSON.stringify({
      email: normalizarEmailContabPolos(sessao.email),
      until: Date.now() + 4 * 60 * 60 * 1000
    })
  );
}

function verificarSenhaContabilidadePolos(sessao, senha) {
  if (!sessao || !sessao.email) {
    return Promise.resolve({ ok: false, erro: "Sessão inválida." });
  }
  if (!senha) {
    return Promise.resolve({ ok: false, erro: "Informe sua senha de acesso." });
  }

  if (typeof authApiAtivo === "function" && authApiAtivo() && window.SETADApi) {
    return window.SETADApi.login(sessao.email, senha)
      .then(function (res) {
        if (res && res.ok && res.user) {
          definirDesbloqueioContabilidadePolos(sessao);
          return { ok: true };
        }
        return { ok: false, erro: (res && res.erro) || "Senha incorreta." };
      })
      .catch(function () {
        return { ok: false, erro: "Senha incorreta." };
      });
  }

  var email = normalizarEmailContabPolos(sessao.email);
  var contas = [];
  if (typeof CREDENCIAIS !== "undefined") {
    Object.keys(CREDENCIAIS).forEach(function (k) {
      contas.push(CREDENCIAIS[k]);
    });
  }
  if (typeof CONTAS_DIRECAO !== "undefined") {
    contas = contas.concat(CONTAS_DIRECAO);
  }
  var conta = contas.find(function (c) {
    return normalizarEmailContabPolos(c.email) === email;
  });
  if (conta && conta.senha === senha) {
    definirDesbloqueioContabilidadePolos(sessao);
    return Promise.resolve({ ok: true });
  }
  return Promise.resolve({
    ok: false,
    erro: "Senha incorreta. Use a mesma senha do login institucional."
  });
}

function obterMatriculasDoPolo(poloId) {
  return obterMatriculas().filter(function (m) {
    if (!poloId) return !m.poloId;
    return m.poloId === poloId;
  });
}

function obterPagamentosMatricula(matriculaId) {
  return obterPagamentosAlunos().filter(function (p) {
    return p.matriculaId === matriculaId;
  });
}

function inferirSituacaoFinanceiraPolo(matriculaId) {
  var extra = obterExtraAlunoPolo(matriculaId);
  if (extra && extra.situacao) return extra.situacao;

  var pagamentos = obterPagamentosMatricula(matriculaId);
  var pendentes = pagamentos.filter(function (p) {
    return p.status === "pendente" || p.status === "aguardando";
  });
  var pagos = pagamentos.filter(function (p) {
    return p.status === "pago";
  });

  if (pendentes.length > 0) {
    var agora = Date.now();
    var atraso = pendentes.some(function (p) {
      if (!p.vencimento) return true;
      return new Date(p.vencimento).getTime() < agora;
    });
    return atraso ? "atraso" : "pendente";
  }
  if (pagos.length > 0) return "em_dia";
  return "pendente";
}

function labelSituacaoPolo(id) {
  var item = CONTAB_POLOS_SITUACOES.find(function (s) {
    return s.id === id;
  });
  return item ? item.label : id;
}

function classeSituacaoPolo(id) {
  var item = CONTAB_POLOS_SITUACOES.find(function (s) {
    return s.id === id;
  });
  return item ? item.classe : "";
}

function resumoPoloContabilidade(poloId) {
  var alunos = obterMatriculasDoPolo(poloId);
  var resumo = { total: alunos.length, em_dia: 0, atraso: 0, pendente: 0 };
  alunos.forEach(function (m) {
    var sit = inferirSituacaoFinanceiraPolo(m.id);
    if (resumo[sit] !== undefined) resumo[sit]++;
  });
  return resumo;
}

function registrarLancamentoPoloContabilidade(matricula, polo, valor, titulo, sessao) {
  if (typeof adicionarLancamentoContabil !== "function") return;
  var mesRef =
    new Date().getFullYear() +
    "-" +
    String(new Date().getMonth() + 1).padStart(2, "0");
  adicionarLancamentoContabil(
    {
      codigo: "1.2",
      tipo: "receita",
      titulo: titulo,
      valor: valor,
      referente: (polo ? polo.nome : "Polo") + " — " + matricula.nomeCompleto,
      periodicidade: "mensal",
      referencia: mesRef,
      origem: "polo_contabilidade",
      vinculoId: matricula.id
    },
    sessao
  );
}

function aplicarPagamentoAlunoPolo(matricula, opcoes, sessao) {
  if (typeof inicializarDadosFinanceiros === "function") inicializarDadosFinanceiros();
  if (typeof inicializarDadosContabilidade === "function") inicializarDadosContabilidade();

  var polo =
    obterPolosParaContabilidade().find(function (p) {
      return p.id === matricula.poloId;
    }) || null;

  if (opcoes.apenasSituacao) {
    salvarExtraAlunoPolo(matricula.id, {
      situacao: opcoes.apenasSituacao,
      poloId: matricula.poloId
    });
    return { ok: true };
  }

  var valor = Number(opcoes.valor);
  if (!valor || valor <= 0) {
    return { ok: false, erro: "Informe um valor válido." };
  }

  var registro =
    typeof registrarPagamentoPresencialSecretaria === "function"
      ? registrarPagamentoPresencialSecretaria(matricula, {
          tipoCobranca: opcoes.tipoCobranca || "mensalidade",
          situacaoPagamento: opcoes.situacaoPagamento || "pago_presencial",
          formaPagamento: opcoes.formaPagamento,
          instituicaoId: opcoes.instituicaoId || null,
          valor: valor,
          observacoesPagamento:
            (opcoes.observacoes || "") +
            (polo ? " · Polo: " + polo.nome : "")
        }, sessao)
      : { ok: false, erro: "Módulo financeiro indisponível." };

  if (!registro.ok) return registro;

  salvarExtraAlunoPolo(matricula.id, {
    situacao: "em_dia",
    formaPagamento: opcoes.formaPagamento || null,
    poloId: matricula.poloId,
    ultimoValor: valor
  });

  if (opcoes.situacaoPagamento === "pago_presencial") {
    registrarLancamentoPoloContabilidade(
      matricula,
      polo,
      valor,
      opcoes.tipoCobranca === "matricula" ? "Matrícula — polo" : "Mensalidade — polo",
      sessao
    );
  }

  return registro;
}

function renderizarTelaSenhaContabPolos(container, sessao) {
  container.innerHTML =
    '<div class="polo-contab polo-contab--gate">' +
    '<h2 class="polo-contab__titulo">Contabilidade dos Polos</h2>' +
    '<p class="section__text">Área restrita. Confirme com a <strong>mesma senha do login</strong> institucional.</p>' +
    '<p class="presencial-bloco__hint">Acesso autorizado: Kathlen (secretaria), direção e contabilidade (rafaeladmtc@gmail.com, rsgestaofinanceirapa@gmail.com).</p>' +
    '<form id="formSenhaContabPolos" class="polo-contab__gate-form">' +
    '<div class="form-group"><label for="contabPolosSenha">Senha</label>' +
    '<input type="password" id="contabPolosSenha" autocomplete="current-password" required></div>' +
    '<button type="submit" class="btn btn--primary">Entrar</button>' +
    '<div id="contabPolosGateMsg" class="form-mensagem" role="alert"></div>' +
    "</form></div>";

  document.getElementById("formSenhaContabPolos").addEventListener("submit", function (e) {
    e.preventDefault();
    var senha = document.getElementById("contabPolosSenha").value;
    var msg = document.getElementById("contabPolosGateMsg");
    msg.className = "form-mensagem";
    msg.textContent = "Verificando…";
    verificarSenhaContabilidadePolos(sessao, senha).then(function (r) {
      if (!r.ok) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = r.erro || "Acesso negado.";
        return;
      }
      renderizarContabilidadePolos(container.id, sessao);
    });
  });
}

function renderizarContabilidadePolos(containerId, sessao) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (!usuarioPodeAcessarContabilidadePolos(sessao)) {
    container.innerHTML =
      '<div class="polo-contab polo-contab--restrito">' +
      '<h2 class="polo-contab__titulo">Contabilidade dos polos</h2>' +
      '<p class="section__text">Esta é uma <strong>área restrita</strong>. A planilha de mensalidades por polo e turma está disponível para secretaria, direção e contabilidade autorizada.</p>' +
      '<p class="presencial-bloco__hint">Se você precisa de acesso, procure a direção ou a contabilidade.</p>' +
      "</div>";
    return;
  }

  if (!estaDesbloqueadaContabilidadePolos(sessao)) {
    renderizarTelaSenhaContabPolos(container, sessao);
    return;
  }

  if (typeof inicializarDadosFinanceiros === "function") inicializarDadosFinanceiros();
  if (typeof inicializarDadosContabilidade === "function") inicializarDadosContabilidade();

  var polos = obterPolosParaContabilidade();
  var poloAtivo = container.dataset.poloAtivo || (polos[0] ? polos[0].id : "");

  var cardsPolos = polos
    .map(function (polo) {
      var res = resumoPoloContabilidade(polo.id);
      var ativo = polo.id === poloAtivo ? " polo-contab__polo-card--ativo" : "";
      return (
        '<button type="button" class="polo-contab__polo-card' +
        ativo +
        '" data-polo-id="' +
        escaparHtml(polo.id) +
        '">' +
        '<span class="polo-contab__polo-card-nome">' +
        escaparHtml(polo.nome) +
        "</span>" +
        '<span class="polo-contab__polo-card-stats">' +
        res.total +
        " alunos · " +
        res.em_dia +
        " em dia · " +
        res.atraso +
        " atraso</span></button>"
      );
    })
    .join("");

  var formas =
    typeof FORMAS_PAGAMENTO_PRESENCIAL !== "undefined"
      ? FORMAS_PAGAMENTO_PRESENCIAL
      : ["PIX", "Dinheiro"];

  var avisoDev =
    contabilidadePolosModoProgramadorIp()
      ? '<p class="polo-contab__dev" role="status">Modo programador — acesso pela rede local (IP). Em produção (setad.org.br) vale a política restrita.</p>'
      : "";

  container.innerHTML =
    '<div class="polo-contab">' +
    avisoDev +
    '<div class="polo-contab__toolbar">' +
    '<p class="section__text polo-contab__intro">Lançamentos por polo integrados à contabilidade do SETAD. Mensalidades do ano letivo: <strong>jan–dez/2026</strong> em todos os polos. Importação somente em PDF (cadastro como na secretaria).</p>' +
    '<div class="polo-contab__toolbar-acoes">' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosAtualizar">Atualizar lista</button>' +
    '<label class="btn btn--primary btn--sm polo-contab__pdf-label-toolbar" id="btnContabPolosPdfLabel">' +
    'Importar PDF<input type="file" id="contabPolosPdfInput" accept="application/pdf,.pdf" hidden></label>' +
    "</div></div>" +
    '<p class="presencial-bloco__hint polo-contab__pdf-dica">PDF com tabela ou lista (nome, e-mail, telefone…). Polo SETADE: inclua nível e sala. Não use Excel/planilha nesta tela.</p>' +
    '<div id="contabPolosPdfRevisao" class="polo-contab__pdf-revisao-host" hidden></div>' +
    '<div class="polo-contab__polos-grid" role="tablist" aria-label="Polos">' +
    cardsPolos +
    "</div>" +
    '<div class="polo-contab__turma-filtro form-group">' +
    '<label for="contabPolosTurmaSelect">Turma / sala deste polo</label>' +
    '<select id="contabPolosTurmaSelect" class="polo-contab__turma-select">' +
    '<option value="">Todos os alunos do polo</option>' +
    "</select></div>" +
    '<div id="contabPolosPlanilhaWrap" class="polo-contab__planilha"></div>' +
    '<details class="polo-contab__legado"><summary>Tabela resumida e modelos rápidos</summary>' +
    '<div class="polo-contab__modelos">' +
    "<h3>Modelos rápidos</h3>" +
    '<div class="polo-contab__modelos-btns" id="contabPolosModelosBtns"></div>' +
    '<p class="presencial-bloco__hint">Selecione um aluno na tabela e clique no modelo, ou use o formulário de pagamento abaixo.</p>' +
    "</div>" +
    '<div id="contabPolosTabelaWrap"></div>' +
    '<div id="contabPolosPagamento" class="polo-contab__pagamento"></div>' +
    "</details>" +
    '<div id="contabPolosMsg" class="form-mensagem" role="status"></div>' +
    "</div>";

  container.dataset.poloAtivo = poloAtivo;

  function obterListaAlunosPlanilha() {
    var pid = container.dataset.poloAtivo;
    var turmaSel = document.getElementById("contabPolosTurmaSelect");
    var turmaId = turmaSel ? turmaSel.value : "";
    if (turmaId && typeof obterTurmaCatalogoPorId === "function") {
      var turma = obterTurmaCatalogoPorId(turmaId);
      if (turma && typeof listarAlunosNaTurma === "function") {
        return listarAlunosNaTurma(turma);
      }
    }
    return obterMatriculasDoPolo(pid);
  }

  function preencherSelectTurmasPolo() {
    var select = document.getElementById("contabPolosTurmaSelect");
    if (!select) return;
    var pid = container.dataset.poloAtivo;
    var valorAtual = select.value;
    var turmas = listarTurmasDoPoloContabilidade(pid);
    select.innerHTML =
      '<option value="">Todos os alunos do polo</option>' +
      turmas
        .map(function (t) {
          var sel = t.id === valorAtual ? " selected" : "";
          return (
            '<option value="' + escaparHtml(t.id) + '"' + sel + ">" + escaparHtml(t.nome) + "</option>"
          );
        })
        .join("");
  }

  function renderPlanilha() {
    var wrap = document.getElementById("contabPolosPlanilhaWrap");
    if (!wrap) return;
    var pid = container.dataset.poloAtivo;
    var polo = polos.find(function (p) { return p.id === pid; });
    var turmaSel = document.getElementById("contabPolosTurmaSelect");
    var turmaId = turmaSel ? turmaSel.value : "";
    var turma =
      turmaId && typeof obterTurmaCatalogoPorId === "function"
        ? obterTurmaCatalogoPorId(turmaId)
        : null;
    var lista = obterListaAlunosPlanilha();
    var meta = {
      titulo: turma
        ? "Planilha — " + turma.nome
        : "Planilha — " + (polo ? polo.nome : "Polo"),
      subtitulo:
        "Ano letivo " +
        (typeof PLANILHA_POLO_ANO_INICIO !== "undefined" ? PLANILHA_POLO_ANO_INICIO : "2026") +
        " em 1º e 2º semestre (6 meses cada).",
      fixarGradeAnoLetivoPolo: true,
      dividirSemestresPolo: true,
      planilhaColunaMatricula: true,
      turmaId: turma ? turma.id : null,
      onAtualizar: function () {
        renderPlanilha();
        renderTabela();
      }
    };
    if (typeof renderizarPainelTurmaMensalidadesENotas === "function") {
      renderizarPainelTurmaMensalidadesENotas(wrap, lista, sessao, meta);
    } else if (typeof renderizarPlanilhaMensalidadesTurma === "function") {
      renderizarPlanilhaMensalidadesTurma(wrap, lista, sessao, meta);
    }
  }

  function renderTabela() {
    var wrap = document.getElementById("contabPolosTabelaWrap");
    if (!wrap) return;
    var pid = container.dataset.poloAtivo;
    var lista = obterMatriculasDoPolo(pid);
    if (!lista.length) {
      wrap.innerHTML =
        '<p class="lista-vazia">Nenhum aluno vinculado a este polo ainda. Novas matrículas do site atualizam automaticamente.</p>';
      return;
    }
    var html =
      '<table class="data-table polo-contab__tabela"><thead><tr>' +
      "<th></th><th>Aluno</th><th>E-mail</th><th>Módulo</th><th>Situação</th><th>Forma pgto.</th><th>Ações</th>" +
      "</tr></thead><tbody>";
    lista.forEach(function (m) {
      var sit = inferirSituacaoFinanceiraPolo(m.id);
      var extra = obterExtraAlunoPolo(m.id) || {};
      var mod =
        typeof MODULOS_CURSO !== "undefined" && MODULOS_CURSO[m.modulo]
          ? MODULOS_CURSO[m.modulo].nome
          : m.modulo || "—";
      html +=
        "<tr data-matricula-id=\"" +
        escaparHtml(m.id) +
        '">' +
        '<td><input type="radio" name="contabPoloAlunoSel" value="' +
        escaparHtml(m.id) +
        '"></td>' +
        "<td>" +
        escaparHtml(m.nomeCompleto) +
        "</td>" +
        "<td>" +
        escaparHtml(m.email) +
        "</td>" +
        "<td>" +
        escaparHtml(mod) +
        "</td>" +
        '<td><span class="polo-contab__sit ' +
        classeSituacaoPolo(sit) +
        '">' +
        escaparHtml(labelSituacaoPolo(sit)) +
        "</span></td>" +
        "<td>" +
        escaparHtml(extra.formaPagamento || "—") +
        "</td>" +
        '<td><button type="button" class="btn btn--link btn--sm" data-contab-pagar="' +
        escaparHtml(m.id) +
        '">Pagamento</button></td>' +
        "</tr>";
    });
    html += "</tbody></table>";
    wrap.innerHTML = html;

    wrap.querySelectorAll("[data-contab-pagar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-contab-pagar");
        var radio = wrap.querySelector('input[value="' + id + '"]');
        if (radio) radio.checked = true;
        renderFormPagamento(id);
      });
    });
  }

  function obterAlunoSelecionado() {
    var sel = container.querySelector('input[name="contabPoloAlunoSel"]:checked');
    return sel ? obterMatriculaPorId(sel.value) : null;
  }

  function renderFormPagamento(matriculaId) {
    var alvo = document.getElementById("contabPolosPagamento");
    if (!alvo) return;
    var m = matriculaId ? obterMatriculaPorId(matriculaId) : null;
    if (!m) {
      alvo.innerHTML = "";
      return;
    }
    var valorDefault =
      typeof obterMensalidadeModulo === "function"
        ? obterMensalidadeModulo(m.modulo)
        : 150;
    var optsForma = formas
      .map(function (f) {
        return '<option value="' + escaparHtml(f) + '">' + escaparHtml(f) + "</option>";
      })
      .join("");
    alvo.innerHTML =
      '<h3>Pagamento — ' +
      escaparHtml(m.nomeCompleto) +
      "</h3>" +
      '<div class="matricula-form__grid">' +
      '<div class="form-group"><label for="contabPoloTipo">Tipo</label>' +
      '<select id="contabPoloTipo"><option value="mensalidade">Mensalidade</option><option value="matricula">Taxa de matrícula</option></select></div>' +
      '<div class="form-group"><label for="contabPoloValor">Valor (R$)</label>' +
      '<input type="number" id="contabPoloValor" min="0" step="0.01" value="' +
      valorDefault +
      '"></div>' +
      '<div class="form-group"><label for="contabPoloForma">Forma de pagamento</label>' +
      '<select id="contabPoloForma" required><option value="">Selecione</option>' +
      optsForma +
      "</select></div>" +
      '<div class="form-group"><label for="contabPoloSitManual">Situação manual</label>' +
      '<select id="contabPoloSitManual">' +
      CONTAB_POLOS_SITUACOES.map(function (s) {
        return (
          '<option value="' + s.id + '">' + escaparHtml(s.label) + "</option>"
        );
      }).join("") +
      "</select></div>" +
      '<div class="form-group form-group--full"><label for="contabPoloObs">Observações</label>' +
      '<textarea id="contabPoloObs" rows="2"></textarea></div>' +
      "</div>" +
      '<button type="button" class="btn btn--primary" id="btnContabPoloSalvarPag">Registrar pagamento</button> ' +
      '<button type="button" class="btn btn--secondary" id="btnContabPoloSalvarSit">Só atualizar situação</button>';

    document.getElementById("btnContabPoloSalvarPag").addEventListener("click", function () {
      var msg = document.getElementById("contabPolosMsg");
      var forma = document.getElementById("contabPoloForma").value;
      var valor = Number(document.getElementById("contabPoloValor").value);
      var tipo = document.getElementById("contabPoloTipo").value;
      var obs = document.getElementById("contabPoloObs").value;
      var r = aplicarPagamentoAlunoPolo(
        m,
        {
          tipoCobranca: tipo,
          situacaoPagamento: "pago_presencial",
          formaPagamento: forma,
          valor: valor,
          observacoes: obs
        },
        sessao
      );
      msg.className = r.ok
        ? "form-mensagem form-mensagem--sucesso visible"
        : "form-mensagem form-mensagem--erro visible";
      msg.textContent = r.ok ? "Pagamento registrado e lançamento contábil gerado." : r.erro;
      if (r.ok) {
        renderizarContabilidadePolos(containerId, sessao);
      }
    });

    document.getElementById("btnContabPoloSalvarSit").addEventListener("click", function () {
      var sit = document.getElementById("contabPoloSitManual").value;
      var obs = document.getElementById("contabPoloObs").value;
      salvarExtraAlunoPolo(m.id, { situacao: sit, observacoes: obs });
      renderizarContabilidadePolos(containerId, sessao);
    });
  }

  var modelosEl = document.getElementById("contabPolosModelosBtns");
  if (modelosEl) {
    modelosEl.innerHTML = CONTAB_POLOS_MODELOS
      .map(function (mod) {
        return (
          '<button type="button" class="btn btn--secondary btn--sm" data-modelo="' +
          mod.id +
          '">' +
          escaparHtml(mod.titulo) +
          "</button>"
        );
      })
      .join("");
    modelosEl.querySelectorAll("[data-modelo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mod = CONTAB_POLOS_MODELOS.find(function (x) {
          return x.id === btn.getAttribute("data-modelo");
        });
        var aluno = obterAlunoSelecionado();
        if (!aluno) {
          var msg = document.getElementById("contabPolosMsg");
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = "Selecione um aluno na tabela.";
          return;
        }
        if (mod.apenasSituacao) {
          salvarExtraAlunoPolo(aluno.id, { situacao: mod.apenasSituacao });
          renderizarContabilidadePolos(containerId, sessao);
          return;
        }
        var valor =
          typeof obterMensalidadeModulo === "function"
            ? obterMensalidadeModulo(aluno.modulo)
            : 150;
        aplicarPagamentoAlunoPolo(
          aluno,
          {
            tipoCobranca: mod.tipoCobranca,
            situacaoPagamento: mod.situacaoPagamento,
            formaPagamento: "PIX",
            valor: valor
          },
          sessao
        );
        renderizarContabilidadePolos(containerId, sessao);
      });
    });
  }

  container.querySelectorAll(".polo-contab__polo-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      container.dataset.poloAtivo = btn.getAttribute("data-polo-id");
      renderizarContabilidadePolos(containerId, sessao);
    });
  });

  var turmaSelect = document.getElementById("contabPolosTurmaSelect");
  if (turmaSelect) {
    preencherSelectTurmasPolo();
    turmaSelect.addEventListener("change", function () {
      renderPlanilha();
      renderTabela();
    });
  }

  document.getElementById("btnContabPolosAtualizar").addEventListener("click", function () {
    renderizarContabilidadePolos(containerId, sessao);
  });
  if (typeof configurarImportacaoPdfContabPolos === "function") {
    configurarImportacaoPdfContabPolos(
      container,
      sessao,
      function () {
        return container.dataset.poloAtivo;
      },
      function () {
        renderPlanilha();
        renderTabela();
      }
    );
  }

  renderPlanilha();
  renderTabela();
}

function configurarNavContabilidadePolos() {
  var item = document.getElementById("navItemContabPolos");
  if (item) item.hidden = false;
}
