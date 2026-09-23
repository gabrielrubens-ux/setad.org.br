const bcrypt = require("bcryptjs");
const {
  db,
  getMeta,
  setMeta,
  replaceJsonCollection,
  upsertJson
} = require("./db");

const LIVROS_INICIAIS = require("./seed-data/livros.json");
const FUNCIONARIOS_INICIAIS = require("./seed-data/funcionarios.json");
const INSTITUICOES_INICIAIS = require("./seed-data/instituicoes.json");

const STAFF_USERS = [
  { id: "user-aluno-demo", email: "aluno@setad.org.br", senha: "aluno123", nome: "Aluno SETAD", perfil: "aluno", modulo: "basico" },
  { id: "user-prof", email: "professor@setad.org.br", senha: "prof123", nome: "Prof. SETAD", perfil: "professor" },
  { id: "user-dir", email: "diretor@setad.org.br", senha: "dir123", nome: "Dir. SETAD", perfil: "diretor" },
  { id: "user-cont", email: "contador@setad.org.br", senha: "cont456", nome: "Contador SETAD", perfil: "contador" },
  { id: "user-sec", email: "secretaria@setad.org.br", senha: "sec123", nome: "Secretaria SETAD", perfil: "secretaria" },
  { id: "user-bib", email: "biblioteca@setad.org.br", senha: "bib123", nome: "Biblioteca SETAD", perfil: "autorizado" }
];

function gerarId(prefixo) {
  return prefixo + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function seedIfNeeded() {
  if (getMeta("seeded") === "true") return;

  const isProd = process.env.NODE_ENV === "production";
  const allowDemo = process.env.SETAD_ALLOW_DEMO_SEED === "true";

  if (isProd && !allowDemo) {
    setMeta("seeded", "true");
    console.log("[SETAD API] Produção: contas de demonstração não foram criadas (defina SETAD_ALLOW_DEMO_SEED=true só em ambiente de teste).");
    return;
  }

  const now = new Date().toISOString();
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, nome, perfil, modulo, matricula_id, verificado, created_at, verified_at)
    VALUES (@id, @email, @password_hash, @nome, @perfil, @modulo, @matricula_id, @verificado, @created_at, @verified_at)
  `);

  STAFF_USERS.forEach((u) => {
    insertUser.run({
      id: u.id,
      email: u.email.toLowerCase(),
      password_hash: bcrypt.hashSync(u.senha, 10),
      nome: u.nome,
      perfil: u.perfil,
      modulo: u.modulo || null,
      matricula_id: null,
      verificado: 1,
      created_at: now,
      verified_at: now
    });
  });

  replaceJsonCollection("livros", LIVROS_INICIAIS);
  replaceJsonCollection("funcionarios", FUNCIONARIOS_INICIAIS);
  replaceJsonCollection("instituicoes_financeiras", INSTITUICOES_INICIAIS);

  replaceJsonCollection("entregas", [{
    id: "ent-001",
    trabalhoId: "trab-001",
    alunoEmail: "aluno@setad.org.br",
    alunoNome: "Aluno SETAD",
    arquivoNome: "resumo-trindade.pdf",
    arquivoTipo: "application/pdf",
    arquivoTamanho: 245000,
    dataEnvio: "2026-03-20T14:30:00.000Z"
  }]);

  replaceJsonCollection("folha_pagamento", [
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
      dataPagamento: "2026-09-05T10:00:00.000Z",
      instituicaoId: "banco-001"
    }
  ]);

  setMeta("seeded", "true");
  console.log("[SETAD API] Banco inicializado com dados de demonstração.");
}

module.exports = { seedIfNeeded, gerarId };
