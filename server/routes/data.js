const express = require("express");
const { gerarId } = require("../seed");
const {
  db,
  listJson,
  replaceJsonCollection,
  upsertJson,
  deleteJson,
  getJsonById
} = require("../db");
const { authRequired, requirePerfis } = require("../middleware/auth");
const { usuarioTemAlgumPerfil } = require("../perfis-institucionais");
const { criarLimitePorIp, validarDataUrlImagem } = require("../middleware/security");

const router = express.Router();
const limitarMatriculaPublica = criarLimitePorIp({
  janelaMs: 15 * 60 * 1000,
  maxTentativas: 40,
  mensagem: "Muitas solicitações de matrícula. Tente novamente em alguns minutos."
});

const COLLECTIONS = {
  matriculas: "matriculas",
  livros: "livros",
  entregas: "entregas",
  pagamentos: "pagamentos",
  funcionarios: "funcionarios",
  folha: "folha_pagamento",
  instituicoes: "instituicoes_financeiras",
  exclusoesSolicitacoes: "exclusoes_solicitacoes",
  exclusoesAuditoria: "exclusoes_auditoria",
  exclusoesEmails: "exclusoes_emails",
  wppConversas: "wpp_conversas",
  relatoriosContabeis: "relatorios_contabeis",
  lancamentosContabeis: "lancamentos_contabeis",
  notasAcademicas: "notas_academicas"
};

const STAFF_READ = ["diretor", "contador", "secretaria", "coordenacao", "professor", "autorizado"];
const STAFF_WRITE = ["diretor", "contador", "secretaria", "coordenacao", "professor", "autorizado"];
const STAFF_OPERACIONAL = ["diretor", "secretaria", "coordenacao", "professor", "contador", "autorizado"];

router.get("/snapshot", authRequired, function (req, res) {
  const perfil = req.user.perfil;
  const email = req.user.email;

  const snapshot = {
    matriculas: [],
    livros: listJson(COLLECTIONS.livros),
    entregas: [],
    pagamentos: [],
    funcionarios: [],
    folha: [],
    instituicoes: [],
    exclusoesSolicitacoes: [],
    exclusoesAuditoria: [],
    exclusoesEmails: [],
    wppConversas: [],
    fotosAlunos: {},
    fotosStaff: {},
    verificacoesPendentes: [],
    relatoriosContabeis: [],
    lancamentosContabeis: [],
    notasAcademicas: []
  };

  if (usuarioTemAlgumPerfil(req.user, STAFF_OPERACIONAL)) {
    snapshot.matriculas = listJson(COLLECTIONS.matriculas);
    snapshot.entregas = listJson(COLLECTIONS.entregas);
    snapshot.exclusoesSolicitacoes = listJson(COLLECTIONS.exclusoesSolicitacoes);
    snapshot.exclusoesEmails = listJson(COLLECTIONS.exclusoesEmails);
    snapshot.wppConversas = listJson(COLLECTIONS.wppConversas);

    if (usuarioTemAlgumPerfil(req.user, ["diretor", "contador", "secretaria"])) {
      snapshot.pagamentos = listJson(COLLECTIONS.pagamentos);
    }

    if (usuarioTemAlgumPerfil(req.user, ["diretor"])) {
      snapshot.exclusoesAuditoria = listJson(COLLECTIONS.exclusoesAuditoria);
    }

    if (usuarioTemAlgumPerfil(req.user, ["diretor", "contador"])) {
      snapshot.funcionarios = listJson(COLLECTIONS.funcionarios);
      snapshot.folha = listJson(COLLECTIONS.folha);
      snapshot.instituicoes = listJson(COLLECTIONS.instituicoes);
    }

    if (usuarioTemAlgumPerfil(req.user, ["contador", "diretor"])) {
      snapshot.relatoriosContabeis = listJson(COLLECTIONS.relatoriosContabeis);
      snapshot.lancamentosContabeis = listJson(COLLECTIONS.lancamentosContabeis);
    }

    if (
      usuarioTemAlgumPerfil(req.user, [
        "diretor",
        "secretaria",
        "coordenacao",
        "professor"
      ])
    ) {
      snapshot.notasAcademicas = listJson(COLLECTIONS.notasAcademicas);
    }

    db.prepare("SELECT email, data_url, atualizado_em FROM fotos_alunos").all().forEach((row) => {
      snapshot.fotosAlunos[row.email] = { dataUrl: row.data_url, atualizadoEm: row.atualizado_em };
    });
    db.prepare("SELECT email, data_url, atualizado_em FROM fotos_staff").all().forEach((row) => {
      snapshot.fotosStaff[row.email] = { dataUrl: row.data_url, atualizadoEm: row.atualizado_em };
    });
  } else if (perfil === "aluno") {
    snapshot.matriculas = listJson(COLLECTIONS.matriculas).filter((m) => (m.email || "").toLowerCase() === email.toLowerCase());
    snapshot.entregas = listJson(COLLECTIONS.entregas).filter((e) => (e.alunoEmail || "").toLowerCase() === email.toLowerCase());
    snapshot.pagamentos = listJson(COLLECTIONS.pagamentos).filter((p) => (p.alunoEmail || "").toLowerCase() === email.toLowerCase());
    snapshot.notasAcademicas = listJson(COLLECTIONS.notasAcademicas).filter(
      (n) => (n.alunoEmail || "").toLowerCase() === email.toLowerCase()
    );

    const foto = db.prepare("SELECT data_url, atualizado_em FROM fotos_alunos WHERE email = ?").get(email.toLowerCase());
    if (foto) {
      snapshot.fotosAlunos[email.toLowerCase()] = { dataUrl: foto.data_url, atualizadoEm: foto.atualizado_em };
    }
  }

  res.json({ ok: true, snapshot });
});

router.get("/public/matriculas/check-email", limitarMatriculaPublica, function (req, res) {
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, erro: "Informe um e-mail válido." });
  }
  const matricula = listJson(COLLECTIONS.matriculas).find((m) => (m.email || "").toLowerCase() === email);
  if (!matricula) {
    return res.json({ ok: true, disponivel: true });
  }
  res.json({
    ok: true,
    disponivel: false
  });
});

router.get("/public/matriculas/:id", limitarMatriculaPublica, function (req, res) {
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ ok: false, erro: "Informe o e-mail vinculado à matrícula." });
  }
  const matricula = getJsonById(COLLECTIONS.matriculas, req.params.id);

  if (!matricula || (matricula.email || "").toLowerCase() !== email) {
    return res.status(404).json({ ok: false, erro: "Matrícula não encontrada." });
  }

  const pagamento = listJson(COLLECTIONS.pagamentos).find(function (p) {
    return p.matriculaId === matricula.id && (!p.tipo || p.tipo === "matricula");
  }) || null;

  res.json({ ok: true, matricula, pagamento });
});

router.post("/public/matriculas", limitarMatriculaPublica, function (req, res) {
  const dados = req.body || {};
  const email = (dados.email || "").trim().toLowerCase();

  const existente = listJson(COLLECTIONS.matriculas).find((m) => (m.email || "").toLowerCase() === email);
  if (existente) {
    return res.status(409).json({
      ok: false,
      erro: "Este e-mail já possui matrícula registrada para " + existente.nomeCompleto + "."
    });
  }

  const matricula = Object.assign({}, dados, {
    email,
    id: dados.id || ("mat-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)),
    dataMatricula: dados.dataMatricula || new Date().toISOString(),
    status: dados.status || "pendente",
    origem: dados.origem || "site"
  });

  upsertJson(COLLECTIONS.matriculas, matricula);

  const taxas = { basico: 50, medio: 50, avancado: 50, teologia: 100 };
  const nomes = {
    basico: "Básico",
    medio: "Curso Médio em Teologia e Ciências Bíblicas",
    avancado: "Curso Avançado em Teologia",
    teologia: "Bacharelado em Teologia"
  };
  const modulo = matricula.modulo || "basico";
  const pagamento = {
    id: "pag-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: matricula.email,
    modulo: modulo,
    tipo: "matricula",
    valor: taxas[modulo] || 50,
    referencia: "Taxa de matrícula — " + (nomes[modulo] || modulo),
    vencimento: new Date().toISOString(),
    status: "pendente",
    formaPagamento: null,
    dataPagamento: null,
    criadoEm: matricula.dataMatricula
  };
  upsertJson(COLLECTIONS.pagamentos, pagamento);

  res.status(201).json({ ok: true, matricula, pagamento });
});

function makeCollectionRoutes(pathName, table, writePerfis, opcoes) {
  opcoes = opcoes || {};
  router.get("/" + pathName, authRequired, requirePerfis(...STAFF_READ), function (_req, res) {
    res.json({ ok: true, items: listJson(table) });
  });

  router.put("/" + pathName, authRequired, requirePerfis(...writePerfis), function (req, res) {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ ok: false, erro: "Envie um array de registros." });
    }
    if (opcoes.blockEmptyReplace) {
      const atual = listJson(table);
      if (items.length === 0 && atual.length > 0) {
        return res.status(409).json({
          ok: false,
          erro:
            "Operação bloqueada: não é permitido substituir todas as matrículas por uma lista vazia. Use restauração ou exclusão individual."
        });
      }
    }
    replaceJsonCollection(table, items);
    res.json({ ok: true, total: items.length });
  });

  router.post("/" + pathName, authRequired, requirePerfis(...writePerfis), function (req, res) {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ ok: false, erro: "Registro inválido." });
    }
    upsertJson(table, item);
    res.status(201).json({ ok: true, item });
  });

  router.delete("/" + pathName + "/:id", authRequired, requirePerfis(...writePerfis), function (req, res) {
    deleteJson(table, req.params.id);
    res.json({ ok: true });
  });
}

makeCollectionRoutes("matriculas", COLLECTIONS.matriculas, ["diretor", "secretaria", "coordenacao", "professor"], {
  blockEmptyReplace: true
});

router.post(
  "/matriculas/restaurar-merge",
  authRequired,
  requirePerfis("diretor", "secretaria", "coordenacao"),
  function (req, res) {
    const bruto = req.body && req.body.items;
    if (!Array.isArray(bruto) || bruto.length === 0) {
      return res.status(400).json({
        ok: false,
        erro: "Envie { items: [ ...matrículas ] } com ao menos um registro."
      });
    }

    const existentes = listJson(COLLECTIONS.matriculas);
    const porId = {};
    existentes.forEach(function (m) {
      if (m && m.id) porId[m.id] = m;
    });

    let novos = 0;
    bruto.forEach(function (item) {
      if (!item || typeof item !== "object") return;
      let id = item.id;
      if (!id) {
        id = gerarId("mat");
        novos += 1;
      }
      porId[id] = Object.assign({}, porId[id], item, { id: id });
    });

    const merged = Object.values(porId);
    replaceJsonCollection(COLLECTIONS.matriculas, merged);

    res.json({
      ok: true,
      total: merged.length,
      recebidos: bruto.length,
      novos: novos,
      anterior: existentes.length
    });
  }
);

makeCollectionRoutes("livros", COLLECTIONS.livros, ["diretor", "coordenacao"]);
makeCollectionRoutes("entregas", COLLECTIONS.entregas, STAFF_WRITE.concat(["aluno"]));
makeCollectionRoutes("pagamentos", COLLECTIONS.pagamentos, ["diretor", "contador", "secretaria"]);
makeCollectionRoutes("notas-academicas", COLLECTIONS.notasAcademicas, [
  "diretor",
  "secretaria",
  "coordenacao",
  "professor"
]);
makeCollectionRoutes("funcionarios", COLLECTIONS.funcionarios, ["diretor", "contador"]);
makeCollectionRoutes("folha", COLLECTIONS.folha, ["diretor", "contador"]);
makeCollectionRoutes("instituicoes", COLLECTIONS.instituicoes, ["diretor", "contador"]);
makeCollectionRoutes("exclusoes/solicitacoes", COLLECTIONS.exclusoesSolicitacoes, ["diretor", "secretaria", "coordenacao"]);
makeCollectionRoutes("exclusoes/auditoria", COLLECTIONS.exclusoesAuditoria, ["diretor"]);
makeCollectionRoutes("exclusoes/emails", COLLECTIONS.exclusoesEmails, ["diretor", "secretaria", "coordenacao"]);
makeCollectionRoutes("wpp/conversas", COLLECTIONS.wppConversas, ["secretaria", "coordenacao", "diretor"]);
function makeContabilidadeRoutes(pathName, table) {
  router.get("/" + pathName, authRequired, requirePerfis("diretor", "contador"), function (_req, res) {
    res.json({ ok: true, items: listJson(table) });
  });

  router.put("/" + pathName, authRequired, requirePerfis("contador"), function (req, res) {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ ok: false, erro: "Envie um array de registros." });
    }
    replaceJsonCollection(table, items);
    res.json({ ok: true, total: items.length });
  });

  router.post("/" + pathName, authRequired, requirePerfis("contador"), function (req, res) {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ ok: false, erro: "Registro inválido." });
    }
    upsertJson(table, item);
    res.status(201).json({ ok: true, item });
  });

  router.delete("/" + pathName + "/:id", authRequired, requirePerfis("contador"), function (req, res) {
    deleteJson(table, req.params.id);
    res.json({ ok: true });
  });
}

makeContabilidadeRoutes("contabilidade/relatorios", COLLECTIONS.relatoriosContabeis);
makeContabilidadeRoutes("contabilidade/lancamentos", COLLECTIONS.lancamentosContabeis);

router.put("/fotos/alunos/:email", authRequired, function (req, res) {
  const email = req.params.email.trim().toLowerCase();
  const perfil = req.user.perfil;

  if (perfil === "aluno" && req.user.email.toLowerCase() !== email) {
    return res.status(403).json({ ok: false, erro: "Acesso negado." });
  }

  if (!STAFF_READ.includes(perfil) && perfil !== "aluno") {
    return res.status(403).json({ ok: false, erro: "Acesso negado." });
  }

  const dataUrl = req.body.dataUrl;
  const validacaoFoto = validarDataUrlImagem(dataUrl);
  if (!validacaoFoto.ok) {
    return res.status(400).json({ ok: false, erro: validacaoFoto.erro });
  }

  const atualizadoEm = new Date().toISOString();
  db.prepare(`
    INSERT INTO fotos_alunos (email, data_url, atualizado_em) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET data_url = excluded.data_url, atualizado_em = excluded.atualizado_em
  `).run(email, dataUrl, atualizadoEm);

  res.json({ ok: true, foto: { dataUrl, atualizadoEm } });
});

router.put("/fotos/staff/:email", authRequired, requirePerfis("diretor", "contador", "secretaria", "coordenacao", "professor", "autorizado"), function (req, res) {
  const email = req.params.email.trim().toLowerCase();
  const dataUrl = req.body.dataUrl;
  const validacaoFoto = validarDataUrlImagem(dataUrl);
  if (!validacaoFoto.ok) {
    return res.status(400).json({ ok: false, erro: validacaoFoto.erro });
  }

  const atualizadoEm = new Date().toISOString();
  db.prepare(`
    INSERT INTO fotos_staff (email, data_url, atualizado_em) VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET data_url = excluded.data_url, atualizado_em = excluded.atualizado_em
  `).run(email, dataUrl, atualizadoEm);

  res.json({ ok: true, foto: { dataUrl, atualizadoEm } });
});

module.exports = router;
