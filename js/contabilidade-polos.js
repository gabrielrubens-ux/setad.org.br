/* Contabilidade dos polos — acesso restrito (Kathlen, diretor, contador). */

var CONTAB_POLOS_KEYS = {
  extras: "setad_contab_polos_extras",
  unlock: "setad_contab_polos_unlock"
};

/** Recepção central — importação desmembra por coluna polo_id da planilha. */
var POLO_SETAD_GERAL_ID = "setad-geral";

function obterPoloSetadGeral() {
  return {
    id: POLO_SETAD_GERAL_ID,
    nome: "SETAD geral",
    bairro: "Recepção de planilhas",
    endereco: "Importação centralizada — desmembra nos polos",
    contato: "",
    virtual: true
  };
}

function ehPoloRecepcaoSetadGeral(poloId) {
  return poloId === POLO_SETAD_GERAL_ID;
}

if (typeof window !== "undefined") {
  window.POLO_SETAD_GERAL_ID = POLO_SETAD_GERAL_ID;
}

var CONTAB_POLOS_EMAILS_AUTORIZADOS = ["kathlensantiago@gmail.com"];

/** Equipe de contabilidade — painel do contador e contabilidade dos polos. */
var CONTAB_POLOS_EMAILS_CONTABILIDADE = [
  "rafaeladmtc@gmail.com",
  "rsgestaofinanceirapa@gmail.com"
];

/** Excel completo, importação multi-aba, lançamentos e notas na contabilidade dos polos. */
function emailPlanilhaContabPolosCompleto(email) {
  var e = normalizarEmailContabPolos(email);
  if (CONTAB_POLOS_EMAILS_AUTORIZADOS.indexOf(e) >= 0) return true;
  if (CONTAB_POLOS_EMAILS_CONTABILIDADE.indexOf(e) >= 0) return true;
  return false;
}

function usuarioPlanilhaContabPolosCompleto(sessao) {
  if (!sessao || !sessao.email) return false;
  return emailPlanilhaContabPolosCompleto(sessao.email);
}

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
  var lista = [];
  if (typeof POLOS_SETAD !== "undefined" && POLOS_SETAD.length) {
    lista = POLOS_SETAD.slice();
  }
  if (!lista.some(function (p) { return p.id === POLO_SETAD_GERAL_ID; })) {
    lista.unshift(obterPoloSetadGeral());
  }
  return lista;
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
  if (ehPoloRecepcaoSetadGeral(poloId)) {
    return obterMatriculas().filter(function (m) {
      return !!m.poloId;
    });
  }
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

function usuarioPodeImportarExportarPlanilhaContab(sessao) {
  return (
    usuarioPodeAcessarContabilidadePolos(sessao) && estaDesbloqueadaContabilidadePolos(sessao)
  );
}

function usuarioEhContadorPlanilhaAutorizado(sessao) {
  if (usuarioPlanilhaContabPolosCompleto(sessao)) return true;
  if (!sessao || !sessao.email) return false;
  var email = normalizarEmailContabPolos(sessao.email);
  if (CONTAB_POLOS_EMAILS_CONTABILIDADE.indexOf(email) >= 0) return true;
  if (sessao.perfil === "contador" || (typeof sessaoTemPerfilInstitucional === "function" &&
      sessaoTemPerfilInstitucional(sessao, "contador"))) {
    return CONTAB_POLOS_EMAILS_CONTABILIDADE.indexOf(email) >= 0;
  }
  return false;
}

/** Quem importa com contabilidade desbloqueada pode persistir a planilha no site. */
function usuarioPodeSalvarPlanilhaContabPolos(sessao) {
  if (usuarioPodeImportarExportarPlanilhaContab(sessao)) return true;
  if (usuarioPlanilhaContabPolosCompleto(sessao)) return true;
  if (usuarioEhContadorPlanilhaAutorizado(sessao)) return true;
  if (sessao && sessao.perfil === "diretor") return true;
  if (
    sessao &&
    typeof sessaoTemPerfilInstitucional === "function" &&
    sessaoTemPerfilInstitucional(sessao, "diretor")
  ) {
    return true;
  }
  return false;
}

var CONTAB_POLOS_COLUNAS_MODELO = [
  "matricula_id",
  "nome",
  "email",
  "polo_id",
  "polo_nome",
  "modulo",
  "situacao",
  "forma_pagamento",
  "valor_sugerido",
  "observacoes"
];

function montarCorpoExportacaoContabPolos(poloId) {
  var polos = obterPolosParaContabilidade();
  var linhas = obterMatriculasDoPolo(poloId);
  return linhas.map(function (m) {
    var polo = polos.find(function (p) {
      return p.id === (m.poloId || poloId);
    });
    var extra = obterExtraAlunoPolo(m.id) || {};
    var sit = inferirSituacaoFinanceiraPolo(m.id);
    var valor =
      extra.ultimoValor ||
      (typeof obterMensalidadeModulo === "function"
        ? obterMensalidadeModulo(m.modulo)
        : "");
    return [
      m.id,
      m.nomeCompleto || "",
      m.email || "",
      m.poloId || "",
      polo ? polo.nome : m.poloNome || "",
      m.modulo || "",
      sit,
      extra.formaPagamento || "",
      valor,
      extra.observacoes || ""
    ];
  });
}

function normalizarCabecalhoPlanilhaContab(nome) {
  return String(nome || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/"/g, "");
}

function normalizarNomePlanilhaContab(nome) {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Localiza matrícula do aluno na planilha por ID, e-mail ou nome (no polo).
 */
function resolverMatriculaLinhaPlanilhaContab(headers, row, poloId) {
  var cab = (headers || []).map(normalizarCabecalhoPlanilhaContab);
  var idxId = cab.indexOf("matricula_id");
  var idxEmail = cab.indexOf("email");
  var idxNome = cab.indexOf("nome");
  var idxPolo = cab.indexOf("polo_id");

  var matricula = null;

  if (idxId >= 0 && row[idxId]) {
    matricula = obterMatriculaPorId(String(row[idxId]).trim());
  }
  if (!matricula && idxEmail >= 0 && row[idxEmail]) {
    matricula = obterMatriculaPorEmail(String(row[idxEmail]).trim());
  }
  if (!matricula && idxNome >= 0 && row[idxNome]) {
    var nomeAlvo = normalizarNomePlanilhaContab(row[idxNome]);
    if (nomeAlvo) {
      var pidLinha =
        idxPolo >= 0 ? String(row[idxPolo] || "").trim() : "";
      var candidatos;
      if (ehPoloRecepcaoSetadGeral(poloId) && pidLinha) {
        candidatos = obterMatriculas().filter(function (m) {
          return m.poloId === pidLinha;
        });
      } else if (poloId && !ehPoloRecepcaoSetadGeral(poloId)) {
        candidatos = obterMatriculasDoPolo(poloId);
      } else {
        candidatos = obterMatriculas();
      }

      matricula =
        candidatos.find(function (m) {
          return normalizarNomePlanilhaContab(m.nomeCompleto) === nomeAlvo;
        }) || null;

      if (!matricula) {
        var parciais = candidatos.filter(function (m) {
          var n = normalizarNomePlanilhaContab(m.nomeCompleto);
          return (
            (n.length >= 4 && nomeAlvo.length >= 4 && n.indexOf(nomeAlvo) >= 0) ||
            (nomeAlvo.length >= 4 && n.indexOf(nomeAlvo) >= 0)
          );
        });
        if (parciais.length === 1) matricula = parciais[0];
        else if (parciais.length > 1) {
          var exatoTokens = parciais.filter(function (m) {
            var n = normalizarNomePlanilhaContab(m.nomeCompleto);
            var a = nomeAlvo.split(" ");
            var b = n.split(" ");
            return a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
          });
          if (exatoTokens.length === 1) matricula = exatoTokens[0];
        }
      }
    }
  }

  if (
    matricula &&
    poloId &&
    !ehPoloRecepcaoSetadGeral(poloId) &&
    matricula.poloId &&
    matricula.poloId !== poloId
  ) {
    return null;
  }

  return matricula;
}

function preencherLinhaComMatriculaPlanilhaContab(headers, row, matricula, poloId) {
  if (!matricula) return row.slice();
  var cab = (headers || []).map(normalizarCabecalhoPlanilhaContab);
  var nova = row.slice();
  var ixId = cab.indexOf("matricula_id");
  var ixEmail = cab.indexOf("email");
  var ixNome = cab.indexOf("nome");
  var ixPolo = cab.indexOf("polo_id");
  var ixPoloNome = cab.indexOf("polo_nome");

  if (ixId >= 0) nova[ixId] = matricula.id;
  if (ixEmail >= 0) {
    var em = String(nova[ixEmail] || "").trim();
    if (!em) nova[ixEmail] = matricula.email || "";
  }
  if (ixNome >= 0) {
    var nm = String(nova[ixNome] || "").trim();
    if (!nm) nova[ixNome] = matricula.nomeCompleto || "";
    else nova[ixNome] = matricula.nomeCompleto || nm;
  }
  if (ixPolo >= 0) {
    var pid = String(nova[ixPolo] || "").trim();
    if (!pid) nova[ixPolo] = matricula.poloId || poloId || "";
  }
  if (ixPoloNome >= 0) {
    var poloRef = matricula.poloId || poloId;
    var polo = obterPolosParaContabilidade().find(function (p) {
      return p.id === poloRef;
    });
    if (polo) nova[ixPoloNome] = polo.nome;
  }
  return nova;
}

/** Reconhece alunos do polo em cada aba (preenche matricula_id, e-mail, nomes oficiais). */
function reconhecerAlunosWorkbookContabPolos(workbook, poloId) {
  var sheets = (workbook && workbook.sheets) || [];
  var reconhecidos = 0;
  var semMatch = 0;

  var saida = sheets.map(function (sh) {
    var headers = (sh.headers || []).slice();
    var body = (sh.body || []).map(function (row) {
      var temConteudo = row.some(function (c) {
        return String(c || "").trim() !== "";
      });
      if (!temConteudo) return row.slice();
      var mat = resolverMatriculaLinhaPlanilhaContab(headers, row, poloId);
      if (mat) reconhecidos++;
      else semMatch++;
      return preencherLinhaComMatriculaPlanilhaContab(headers, row, mat, poloId);
    });
    return { name: sh.name, headers: headers, body: body };
  });

  return {
    sheets: saida,
    reconhecidos: reconhecidos,
    semMatch: semMatch
  };
}

function aplicarGradePlanilhaContabPolos(grade, sessao, poloId) {
  if (!grade || !grade.headers || !grade.body) {
    return { ok: false, erro: "Planilha inválida." };
  }
  if (!usuarioPodeImportarExportarPlanilhaContab(sessao)) {
    return { ok: false, erro: "Sessão sem permissão para importar planilha." };
  }

  var cab = grade.headers.map(normalizarCabecalhoPlanilhaContab);
  var idxId = cab.indexOf("matricula_id");
  var idxSit = cab.indexOf("situacao");
  var idxForma = cab.indexOf("forma_pagamento");
  var idxValor = cab.indexOf("valor_sugerido");
  var idxObs = cab.indexOf("observacoes");

  if (idxId < 0 && cab.indexOf("email") < 0 && cab.indexOf("nome") < 0) {
    return {
      ok: false,
      erro:
        'Inclua ao menos uma coluna "matricula_id", "email" ou "nome" para reconhecer os alunos.'
    };
  }

  var atualizados = 0;
  var ignorados = 0;
  grade.body.forEach(function (row) {
    var matricula = resolverMatriculaLinhaPlanilhaContab(grade.headers, row, poloId);
    if (!matricula) {
      ignorados++;
      return;
    }

    var parcial = {};
    if (idxSit >= 0 && row[idxSit]) {
      parcial.situacao = String(row[idxSit]).trim();
    }
    if (idxForma >= 0 && row[idxForma]) {
      parcial.formaPagamento = String(row[idxForma]).trim();
    }
    if (idxObs >= 0 && row[idxObs]) {
      parcial.observacoes = String(row[idxObs]).trim();
    }
    var taxaMatricula = 0;
    if (idxValor >= 0 && row[idxValor] !== "" && row[idxValor] != null) {
      var v = Number(String(row[idxValor]).replace(",", "."));
      if (!Number.isNaN(v) && v > 0) {
        taxaMatricula = v;
        parcial.ultimoValor = v;
      }
    }
    salvarExtraAlunoPolo(matricula.id, parcial);

    if (taxaMatricula > 0) {
      aplicarPagamentoAlunoPolo(
        matricula,
        {
          tipoCobranca: "matricula",
          situacaoPagamento: "pago_presencial",
          formaPagamento: parcial.formaPagamento || "PIX",
          valor: taxaMatricula,
          observacoes: "Importação planilha — taxa de matrícula"
        },
        sessao
      );
    }
    atualizados++;
  });

  return {
    ok: true,
    atualizados: atualizados,
    ignorados: ignorados,
    aviso:
      ignorados > 0
        ? ignorados + " linha(s) sem aluno reconhecido neste polo (confira nome/e-mail)."
        : ""
  };
}

function atualizarDadosPainelAposPlanilhaContab() {
  if (typeof inicializarDadosFinanceiros === "function") inicializarDadosFinanceiros();
  if (typeof inicializarDadosContabilidade === "function") inicializarDadosContabilidade();
}

function exportarPlanilhaContabPolos(poloId) {
  var body = montarCorpoExportacaoContabPolos(poloId);
  if (window.SETADPlanilhaExcel) {
    window.SETADPlanilhaExcel.exportarCsv(
      CONTAB_POLOS_COLUNAS_MODELO,
      body,
      "setad-contab-polos-" + (poloId || "todos") + "-" + new Date().toISOString().slice(0, 10) + ".csv",
      ";"
    );
    return;
  }
}

function exportarPlanilhaContabPolosXlsx(poloId) {
  if (window.SETADContabPlanilhaWorkbook) {
    window.SETADContabPlanilhaWorkbook.exportarWorkbookPolo(poloId);
    return;
  }
  if (!window.SETADPlanilhaExcel) {
    exportarPlanilhaContabPolos(poloId);
    return;
  }
  var body = montarCorpoExportacaoContabPolos(poloId);
  window.SETADPlanilhaExcel.exportarXlsx(
    CONTAB_POLOS_COLUNAS_MODELO,
    body,
    "setad-contab-polos-" + (poloId || "todos") + "-" + new Date().toISOString().slice(0, 10) + ".xlsx"
  );
}

function exportarModeloPlanilhaContabPolos() {
  var poloId = obterPolosParaContabilidade()[0]
    ? obterPolosParaContabilidade()[0].id
    : "modelo";
  if (window.SETADContabPlanilhaWorkbook && window.SETADPlanilhaExcel) {
    var abas = window.SETADContabPlanilhaWorkbook.montarWorkbookExportacaoPolo(poloId);
    abas.forEach(function (aba) {
      if (aba.name === "Cadastro_contabil" && (!aba.body || !aba.body.length)) {
        aba.body = [
          [
            "exemplo-matricula",
            "Aluno Exemplo",
            "aluno@exemplo.com",
            poloId,
            "Nome do polo",
            "medio",
            "em_dia",
            "PIX",
            "100",
            "Apague esta linha antes de importar"
          ]
        ];
      }
    });
    window.SETADPlanilhaExcel.exportarWorkbookXlsx(abas, "setad-modelo-contab-polos-completo.xlsx");
    return;
  }
  exportarPlanilhaContabPolos(poloId);
}

function obterHostEditorPlanilhaContab() {
  var host = document.getElementById("contabPlanilhaEditorHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "contabPlanilhaEditorHost";
    host.className = "setad-planilha-editor-host";
    host.hidden = true;
    document.body.appendChild(host);
  }
  return host;
}

function montarOpcoesEditorPlanilhaContab(sessao, optsBase) {
  optsBase = optsBase || {};
  var polos = obterPolosParaContabilidade();

  return {
    titulo: optsBase.titulo || "Planilha Excel no site",
    descricao:
      optsBase.descricao ||
      "Revise e edite cadastro, mensalidades e notas. Ao salvar, os dados do site são atualizados e a planilha permanece aberta com a lista mesclada.",
    polos: polos,
    poloIdDefault: optsBase.poloIdDefault || "",
    modoCheckin: !!optsBase.modoCheckin,
    modoEdicaoSite: true,
    manterAbertoAposSalvar: true,
    nomeArquivo: optsBase.nomeArquivo || "",
    editarCompleto: usuarioEhContadorPlanilhaAutorizado(sessao),
    onAplicar: function (payload, concluir) {
      var poloId = payload.poloId;
      var posRecon = reconhecerAlunosWorkbookContabPolos(
        { sheets: payload.sheets },
        poloId
      );
      var r = { ok: false, erro: "Erro desconhecido ao salvar." };

      try {
        if (window.SETADContabPlanilhaWorkbook) {
          r = window.SETADContabPlanilhaWorkbook.aplicarWorkbookContabPolos(
            { sheets: posRecon.sheets },
            poloId,
            sessao
          );
        } else {
          var primeira = posRecon.sheets[0];
          r = aplicarGradePlanilhaContabPolos(primeira, sessao, poloId);
        }
      } catch (err) {
        r = { ok: false, erro: (err && err.message) || "Falha ao gravar os dados." };
      }

      if (posRecon.reconhecidos != null) {
        r.reconhecidos = posRecon.reconhecidos;
      }
      if (posRecon.semMatch > 0) {
        r.avisoNome =
          posRecon.semMatch +
          " linha(s) sem matrícula reconhecida no polo — confira nomes na aba Mensalidades.";
      }

      function encerrarSalvar() {
        if (r.ok) {
          atualizarDadosPainelAposPlanilhaContab();
        }
        if (r.ok && window.SETADContabPlanilhaWorkbook) {
          var mesclado = window.SETADContabPlanilhaWorkbook.mesclarWorkbooksImportadoSite(
            { sheets: posRecon.sheets },
            poloId
          );
          concluir(r, {
            manterEditor: true,
            workbook: { sheets: mesclado },
            poloId: poloId
          });
        } else {
          concluir(r);
        }
      }

      function finalizarComSync() {
        var etapas = Promise.resolve();
        if (r.ok && window.SETAD && SETAD.sincronizarColecaoAgora) {
          etapas = etapas.then(function () {
            return SETAD.sincronizarColecaoAgora("pagamentos");
          });
        }
        if (r.ok && window.SETAD && SETAD.pullColecoesInstitucionais) {
          etapas = etapas.then(function () {
            return SETAD.pullColecoesInstitucionais({ notificar: true, forcar: true });
          });
        }
        etapas.then(encerrarSalvar).catch(encerrarSalvar);
      }

      finalizarComSync();
    },
    onSalvo: optsBase.onSalvo,
    onCancelar: optsBase.onCancelar
  };
}

function abrirPlanilhaExcelNoSite(sessao, poloId, onSalvoCb) {
  if (!window.SETADContabPlanilhaEditor || !window.SETADContabPlanilhaWorkbook) {
    if (typeof onSalvoCb === "function") {
      onSalvoCb({ ok: false, erro: "Módulos de planilha não carregados." });
    }
    return;
  }
  if (!usuarioPodeImportarExportarPlanilhaContab(sessao)) {
    if (typeof onSalvoCb === "function") {
      onSalvoCb({ ok: false, erro: "Confirme a senha da contabilidade." });
    }
    return;
  }
  var pid = poloId || (obterPolosParaContabilidade()[0] && obterPolosParaContabilidade()[0].id);
  var sheets = window.SETADContabPlanilhaWorkbook.montarWorkbookExportacaoPolo(pid);
  var host = obterHostEditorPlanilhaContab();
  var opts = montarOpcoesEditorPlanilhaContab(sessao, {
    titulo: "Planilha do polo no site",
    descricao:
      "Lista atualizada com cadastro, mensalidades e notas já lançados. Edite e use «Salvar alterações no site».",
    poloIdDefault: pid,
    modoCheckin: ehPoloRecepcaoSetadGeral(pid),
    workbook: { sheets: sheets },
    onSalvo: onSalvoCb,
    onCancelar: function () {
      if (typeof onSalvoCb === "function") {
        onSalvoCb({ ok: false, cancelado: true });
      }
    }
  });
  opts.workbook = { sheets: sheets };
  window.SETADContabPlanilhaEditor.abrirEditorPlanilhaImportacao(host, opts);
}

function configurarArrastarSoltarPlanilhaContabPolos(container, sessao, obterPoloAtivoId, cbImportacao) {
  var zona = document.getElementById("contabPolosDropZone");
  if (!zona) return;

  function ehArquivoPlanilha(file) {
    if (!file) return false;
    if (window.SETADPlanilhaExcel && window.SETADPlanilhaExcel.arquivoPlanilhaPermitido(file)) {
      return true;
    }
    var nome = file.name || "";
    if (/\.(xlsx|xls|xlsm|xlsb|xlt|xltx|ods|csv|txt)$/i.test(nome)) return true;
    if (file.type && /spreadsheet|excel|csv|ods/i.test(file.type)) return true;
    return false;
  }

  function aplicarClasseAtiva(ativo) {
    zona.classList.toggle("polo-contab__dropzone--ativo", !!ativo);
  }

  function processarArquivo(file) {
    if (!ehArquivoPlanilha(file)) {
      var msg = document.getElementById("contabPolosMsg");
      if (msg) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = "Solte um arquivo Excel (.xlsx, .xls, .ods…) ou CSV.";
      }
      return;
    }
    importarPlanilhaContabPolos(file, sessao, cbImportacao, null, obterPoloAtivoId());
  }

  ["dragenter", "dragover"].forEach(function (ev) {
    zona.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      aplicarClasseAtiva(true);
    });
  });

  ["dragleave", "dragend"].forEach(function (ev) {
    zona.addEventListener(ev, function (e) {
      e.preventDefault();
      aplicarClasseAtiva(false);
    });
  });

  zona.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    aplicarClasseAtiva(false);
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    processarArquivo(file);
  });

  zona.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      var input = document.getElementById("contabPolosImport");
      if (input) input.click();
    }
  });

  zona.addEventListener("click", function (e) {
    if (e.target && e.target.id === "contabPolosImport") return;
    var input = document.getElementById("contabPolosImport");
    if (input) input.click();
  });
}

function processarWorkbookImportacaoContabPolos(workbook, sessao, cb, hostEditor, poloIdDefault, meta) {
  meta = meta || {};
  if (!usuarioPodeImportarExportarPlanilhaContab(sessao)) {
    cb({ ok: false, erro: "Confirme a senha da contabilidade para importar planilhas." });
    return;
  }
  if (!window.SETADContabPlanilhaEditor) {
    cb({ ok: false, erro: "Módulos de planilha não carregados. Atualize a página." });
    return;
  }
  if (!workbook || !workbook.sheets || !workbook.sheets.length) {
    cb({
      ok: false,
      erro:
        "Nenhuma aba com dados reconhecida. Confira se a planilha tem a coluna ALUNOS (modelo de polo) ou use o modelo SETAD (3 abas)."
    });
    return;
  }

  var host = hostEditor || obterHostEditorPlanilhaContab();
  var poloDestino = poloIdDefault || POLO_SETAD_GERAL_ID;
  var rotuloOrigem = meta.nomeArquivo || meta.rotuloOrigem || "planilha";

  if (window.SETADContabPlanilhaLegadoPolo) {
    workbook = window.SETADContabPlanilhaLegadoPolo.normalizarWorkbookImportadoLegadoPolo(
      workbook,
      poloDestino
    );
  }
  if (workbook.origemLegadoPolo && ehPoloRecepcaoSetadGeral(poloDestino)) {
    cb({
      ok: false,
      erro:
        "Esta planilha é de um polo específico (coluna ALUNOS). Selecione o polo no card acima — por exemplo Guamá II — e importe de novo."
    });
    return;
  }

  var reconhecido = reconhecerAlunosWorkbookContabPolos(workbook, poloDestino);
  var mesclado;
  if (workbook.origemLegadoPolo) {
    mesclado = reconhecido.sheets;
  } else if (window.SETADContabPlanilhaWorkbook) {
    mesclado = window.SETADContabPlanilhaWorkbook.mesclarWorkbooksImportadoSite(
      { sheets: reconhecido.sheets },
      poloDestino
    );
  } else {
    mesclado = reconhecido.sheets;
  }

  var legadoAviso =
    workbook && workbook.origemLegadoPolo
      ? " Planilha legada de polo convertida (" + (workbook.alunosLegado || 0) + " alunos)."
      : "";
  var descricaoColar =
    meta.origemColar
      ? " Dados colados do Excel — confira alunos, mensalidades e matrículas antes de salvar."
      : "";
  var descricao = ehPoloRecepcaoSetadGeral(poloDestino)
    ? "Mesclado com o cadastro do site. Destino SETAD geral — desmembra por polo_id em cada linha." +
      legadoAviso +
      descricaoColar
    : "Mesclado com pagamentos e valores já lançados neste polo. Alunos reconhecidos por nome/e-mail do cadastro (" +
      reconhecido.reconhecidos +
      " linha(s))." +
      legadoAviso +
      descricaoColar +
      " Revise e salve.";

  var poloLabel = (function () {
    var p = obterPolosParaContabilidade().find(function (x) {
      return x.id === poloDestino;
    });
    return p ? p.nome : poloDestino;
  })();

  var opts = montarOpcoesEditorPlanilhaContab(sessao, {
    titulo: ehPoloRecepcaoSetadGeral(poloDestino)
      ? "Check-in de entrada — planilha"
      : "Planilha — " + poloLabel,
    descricao: descricao,
    poloIdDefault: poloDestino,
    modoCheckin: ehPoloRecepcaoSetadGeral(poloDestino),
    nomeArquivo: rotuloOrigem,
    onSalvo: function (r) {
      cb(r);
    },
    onCancelar: function () {
      cb({ ok: false, erro: "Importação cancelada.", cancelado: true });
    }
  });
  opts.workbook = { sheets: mesclado };
  opts.origemLegadoPolo = !!workbook.origemLegadoPolo;

  window.SETADContabPlanilhaEditor.abrirEditorPlanilhaImportacao(host, opts);
  cb({
    ok: true,
    abertoEditor: true,
    mensagemAbertura:
      "«" +
      rotuloOrigem +
      "» convertido para " +
      poloLabel +
      " — " +
      mesclado.length +
      " aba(s), " +
      reconhecido.reconhecidos +
      " aluno(s) reconhecidos."
  });
}

function importarPlanilhaContabPolos(arquivo, sessao, cb, hostEditor, poloIdDefault) {
  if (!arquivo) {
    cb({ ok: false, erro: "Selecione um arquivo Excel (.xlsx, .xls, .xlsm…), ODS ou CSV." });
    return;
  }
  if (!window.SETADPlanilhaExcel) {
    cb({ ok: false, erro: "Módulos de planilha não carregados. Atualize a página." });
    return;
  }

  var ler =
    window.SETADPlanilhaExcel.lerArquivoCompleto ||
    function (f) {
      return window.SETADPlanilhaExcel.lerArquivo(f).then(function (g) {
        return { sheets: [g] };
      });
    };

  ler(arquivo)
    .then(function (workbook) {
      processarWorkbookImportacaoContabPolos(workbook, sessao, cb, hostEditor, poloIdDefault, {
        nomeArquivo: arquivo.name || "arquivo"
      });
    })
    .catch(function (err) {
      cb({
        ok: false,
        erro: (err && err.message) || "Não foi possível ler a planilha."
      });
    });
}

/** Cola tabela copiada do Excel (Ctrl+C) na área de contabilidade do polo selecionado. */
function importarColarPlanilhaContabPolos(clipboardData, sessao, cb, hostEditor, poloIdDefault) {
  if (!window.SETADPlanilhaExcel || !window.SETADPlanilhaExcel.workbookDaAreaTransferencia) {
    cb({ ok: false, erro: "Módulo de área de transferência não carregado. Atualize a página." });
    return;
  }
  var wb = window.SETADPlanilhaExcel.workbookDaAreaTransferencia(clipboardData);
  if (!wb.ok) {
    cb({ ok: false, erro: wb.erro || "Não foi possível interpretar o conteúdo colado." });
    return;
  }
  processarWorkbookImportacaoContabPolos(wb, sessao, cb, hostEditor, poloIdDefault, {
    rotuloOrigem: "Colado do Excel",
    origemColar: true
  });
}

function configurarColarPlanilhaContabPolos(sessao, obterPoloAtivoId, cbImportacao) {
  var zona = document.getElementById("contabPolosPasteZone");
  if (!zona) return;

  function processarClipboard(data) {
    if (!data) return;
    zona.classList.remove("polo-contab__pastezone--ok");
    importarColarPlanilhaContabPolos(data, sessao, cbImportacao, null, obterPoloAtivoId());
  }

  zona.addEventListener("paste", function (e) {
    e.preventDefault();
    e.stopPropagation();
    processarClipboard(e.clipboardData);
  });

  zona.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      zona.focus();
    }
  });

  zona.addEventListener("focus", function () {
    zona.classList.add("polo-contab__pastezone--foco");
  });
  zona.addEventListener("blur", function () {
    zona.classList.remove("polo-contab__pastezone--foco");
  });

  var btnColar = document.getElementById("btnContabPolosColar");
  if (btnColar) {
    btnColar.addEventListener("click", function () {
      zona.focus();
      var msg = document.getElementById("contabPolosMsg");
      if (msg) {
        msg.className = "form-mensagem form-mensagem--sucesso visible";
        msg.textContent =
          "Área de colar ativa — selecione as células no Excel, copie (Ctrl+C) e cole aqui (Ctrl+V).";
      }
      if (navigator.clipboard && navigator.clipboard.read) {
        navigator.clipboard
          .read()
          .then(function (items) {
            var htmlItem = items.find(function (it) {
              return it.types.indexOf("text/html") >= 0;
            });
            if (htmlItem) {
              return htmlItem.getType("text/html");
            }
            return null;
          })
          .then(function (blob) {
            if (!blob) return;
            return blob.text();
          })
          .then(function (html) {
            if (!html) return;
            var fake = {
              getData: function (type) {
                if (type === "text/html") return html;
                return "";
              }
            };
            processarClipboard(fake);
          })
          .catch(function () {
            /* aguarda Ctrl+V na zona */
          });
      }
    });
  }
}

function renderizarTelaSenhaContabPolos(container, sessao) {
  container.innerHTML =
    '<div class="polo-contab polo-contab--gate">' +
    '<h2 class="polo-contab__titulo">Contabilidade dos Polos</h2>' +
    '<p class="section__text">Área restrita. Confirme com a <strong>mesma senha do login</strong> institucional.</p>' +
    '<p class="presencial-bloco__hint">Acesso e planilha Excel completa: Kathlen (kathlensantiago@gmail.com), contabilidade (rafaeladmtc@gmail.com, rsgestaofinanceirapa@gmail.com) e direção.</p>' +
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
      var geral =
        polo.id === POLO_SETAD_GERAL_ID ? " polo-contab__polo-card--geral" : "";
      return (
        '<button type="button" class="polo-contab__polo-card' +
        ativo +
        geral +
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
    '<p class="section__text polo-contab__intro">Lançamentos por polo integrados à contabilidade do SETAD. Excel completo: cadastro, mensalidades e notas/médias. Contabilidade autorizada pode editar e salvar.</p>' +
    '<div class="polo-contab__toolbar-acoes">' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosAtualizar">Atualizar lista</button>' +
    '<button type="button" class="btn btn--primary btn--sm" id="btnContabPolosAbrirPlanilha">Abrir planilha no site</button>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosColar">Colar do Excel</button>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosModelo">Modelo Excel (3 abas)</button>' +
    '<label class="btn btn--secondary btn--sm polo-contab__import-label">' +
    "Importar Excel<input type=\"file\" id=\"contabPolosImport\" accept=\".xlsx,.xls,.xlt,.xltx,.xlsm,.xlsb,.xla,.ods,.csv,.txt,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet\" hidden></label>" +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosExportXlsx">Exportar Excel completo</button>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosExport">Exportar CSV</button>' +
    "</div></div>" +
    '<div class="polo-contab__polos-grid" role="tablist" aria-label="Polos">' +
    cardsPolos +
    "</div>" +
    (function () {
      var poloSel = polos.find(function (p) {
        return p.id === poloAtivo;
      });
      var nomePolo = poloSel ? poloSel.nome : "Polo";
      var dicaGeral = ehPoloRecepcaoSetadGeral(poloAtivo)
        ? " SETAD geral: use planilha com polo_id em cada linha."
        : " Conversão automática para cadastro, mensalidades por mês e pagamentos dos alunos deste polo.";
      return (
        '<div class="polo-contab__import-duplo">' +
        '<div class="polo-contab__dropzone" id="contabPolosDropZone" tabindex="0" role="button" aria-label="Arrastar planilha Excel do polo selecionado">' +
        '<p class="polo-contab__dropzone-icone" aria-hidden="true">📥</p>' +
        '<p class="polo-contab__dropzone-titulo"><strong>Arrastar arquivo</strong> ou clique para escolher</p>' +
        '<p class="polo-contab__dropzone-polo" id="contabPolosDropPoloNome">Polo: ' +
        escaparHtml(nomePolo) +
        "</p>" +
        '<p class="polo-contab__dropzone-hint">Formato SETAD (3 abas) ou planilha manual (ALUNOS + meses).' +
        escaparHtml(dicaGeral) +
        "</p></div>" +
        '<div class="polo-contab__pastezone" id="contabPolosPasteZone" tabindex="0" role="textbox" aria-label="Colar planilha copiada do Excel">' +
        '<p class="polo-contab__pastezone-icone" aria-hidden="true">📋</p>' +
        '<p class="polo-contab__dropzone-titulo"><strong>Copiar e colar</strong></p>' +
        '<p class="polo-contab__dropzone-polo" id="contabPolosPastePoloNome">Polo: ' +
        escaparHtml(nomePolo) +
        "</p>" +
        '<p class="polo-contab__dropzone-hint">Selecione as células no Excel, <kbd>Ctrl+C</kbd>, clique aqui e <kbd>Ctrl+V</kbd>. Uma aba por colagem; use «Salvar alterações no site» após conferir. O suporte a Excel carrega automaticamente pela internet (SheetJS) — não precisa instalar plugin no navegador.</p>' +
        "</div></div>"
      );
    })() +
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
    '<p class="presencial-bloco__hint">Selecione o polo (incluindo SETAD geral), arraste o .xlsx ou cole do Excel, revise no editor e use «Salvar alterações no site» para atualizar pagamentos e a lista editável de cada polo.</p>' +
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
        : ehPoloRecepcaoSetadGeral(pid)
          ? "SETAD geral — visão consolidada"
          : "Planilha — " + (polo ? polo.nome : "Polo"),
      subtitulo: ehPoloRecepcaoSetadGeral(pid)
        ? "Todos os alunos por polo. Use Importar Excel com destino SETAD geral para desmembrar automaticamente."
        : "Mensalidades e notas do polo/turma. Contadores autorizados podem editar e salvar; alterações sincronizam com o servidor.",
      turmaId: turma ? turma.id : null,
      permissoesFicha: {
        notasEditar:
          usuarioEhContadorPlanilhaAutorizado(sessao) ||
          sessao.perfil === "secretaria" ||
          sessao.perfil === "diretor"
      },
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
  var btnAbrirPlanilha = document.getElementById("btnContabPolosAbrirPlanilha");
  if (btnAbrirPlanilha) {
    btnAbrirPlanilha.addEventListener("click", function () {
      var msg = document.getElementById("contabPolosMsg");
      abrirPlanilhaExcelNoSite(sessao, container.dataset.poloAtivo, function (r) {
        if (r && r.cancelado) return;
        if (!msg) return;
        msg.className = r && r.ok
          ? "form-mensagem form-mensagem--sucesso visible"
          : "form-mensagem form-mensagem--erro visible";
        msg.textContent =
          r && r.ok
            ? "Planilha salva — " + (r.atualizados || "dados atualizados.")
            : (r && r.erro) || "Não foi possível abrir a planilha.";
        if (r && r.ok) {
          atualizarDadosPainelAposPlanilhaContab();
          renderPlanilha();
          renderTabela();
        }
      });
    });
  }
  document.getElementById("btnContabPolosModelo").addEventListener("click", exportarModeloPlanilhaContabPolos);
  document.getElementById("btnContabPolosExport").addEventListener("click", function () {
    exportarPlanilhaContabPolos(container.dataset.poloAtivo);
  });
  var btnExportXlsx = document.getElementById("btnContabPolosExportXlsx");
  if (btnExportXlsx) {
    btnExportXlsx.addEventListener("click", function () {
      exportarPlanilhaContabPolosXlsx(container.dataset.poloAtivo);
    });
  }
  function aoFeedbackImportacaoPlanilha(r, inputEl) {
    if (r.cancelado) {
      if (inputEl) inputEl.value = "";
      return;
    }
    var msg = document.getElementById("contabPolosMsg");
    if (msg) {
      msg.className = r.ok
        ? "form-mensagem form-mensagem--sucesso visible"
        : "form-mensagem form-mensagem--erro visible";
      if (!r.ok) {
        msg.textContent = r.erro || "Não foi possível importar.";
      } else if (r.abertoEditor) {
        msg.textContent =
          (r.mensagemAbertura || "Planilha convertida.") + " Revise e clique em «Salvar alterações no site».";
      } else {
        var extraRec =
          r.reconhecidos != null ? " · " + r.reconhecidos + " aluno(s) reconhecido(s) no polo." : "";
        msg.textContent =
          "Alterações salvas — " +
          (r.atualizados || r.resumo || "concluído.") +
          extraRec +
          " Lista de pagamentos atualizada.";
      }
    }
    if (r.ok && (r.atualizados || r.resumo || !r.abertoEditor)) {
      atualizarDadosPainelAposPlanilhaContab();
      renderPlanilha();
      renderTabela();
    }
    if (inputEl) inputEl.value = "";
  }

  document.getElementById("contabPolosImport").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    importarPlanilhaContabPolos(
      file,
      sessao,
      function (r) {
        aoFeedbackImportacaoPlanilha(r, e.target);
      },
      null,
      container.dataset.poloAtivo
    );
  });

  configurarArrastarSoltarPlanilhaContabPolos(
    container,
    sessao,
    function () {
      return container.dataset.poloAtivo;
    },
    function (r) {
      aoFeedbackImportacaoPlanilha(r, document.getElementById("contabPolosImport"));
    }
  );

  configurarColarPlanilhaContabPolos(
    sessao,
    function () {
      return container.dataset.poloAtivo;
    },
    function (r) {
      aoFeedbackImportacaoPlanilha(r, null);
    }
  );

  renderPlanilha();
  renderTabela();
}

function configurarNavContabilidadePolos() {
  var item = document.getElementById("navItemContabPolos");
  if (item) item.hidden = false;
}
