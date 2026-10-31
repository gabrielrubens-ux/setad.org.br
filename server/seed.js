const bcrypt = require("bcryptjs");
const {
  db,
  getMeta,
  setMeta,
  replaceJsonCollection,
  upsertJson
} = require("./db");
const { importarAutorizadosIniciais } = require("./staff-ativacao");

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

  var usuariosExistentes = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (usuariosExistentes > 0) {
    setMeta("seeded", "true");
    console.log(
      "[SETAD API] Banco já contém " +
        usuariosExistentes +
        " usuário(s); senhas e contas preservadas (seed de demo não aplicado)."
    );
    return;
  }

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

  importarAutorizadosIniciais([
    { email: "diretor@setad.org.br", nome: "Dir. SETAD", perfil: "diretor" },
    { email: "contador@setad.org.br", nome: "Contador SETAD", perfil: "contador" },
    { email: "secretaria@setad.org.br", nome: "Secretaria SETAD", perfil: "secretaria" },
    {
      email: "enocmiranda26@gmail.com",
      nome: "Enoc Miranda da Silva",
      perfil: "diretor",
      perfis: ["diretor", "contador", "secretaria", "coordenacao"]
    },
    {
      email: "gabrielrubens0@gmail.com",
      nome: "Gabriel Rubens",
      perfil: "diretor",
      perfis: ["diretor", "contador", "secretaria", "coordenacao"]
    }
  ]);

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

  const matriculaDemo = {
    id: "mat-demonstracao-setad",
    nomeCompleto: "Ana Demonstração Silva",
    email: "demonstracao.aluno@setad.org.br",
    telefone: "(91) 99100-0020",
    cpf: "529.982.247-25",
    dataNascimento: "1995-06-15",
    cidade: "Belém",
    estado: "PA",
    modulo: "basico",
    igreja: "Assembleia de Deus — cadastro fictício",
    dataMatricula: "2026-01-15T12:00:00.000Z",
    status: "ativo",
    origem: "demonstracao",
    observacoes:
      "Aluno fictício para treinar mensalidades, planilha e painéis do contador/diretor.",
    cadastradoPor: "sistema@setad.org.br"
  };

  upsertJson("matriculas", matriculaDemo);

  replaceJsonCollection("pagamentos", [
    {
      id: "pag-demo-matricula",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "matricula",
      valor: 50,
      referencia: "Taxa de matrícula — Básico",
      vencimento: "2026-01-15T12:00:00.000Z",
      status: "pago",
      formaPagamento: "PIX",
      instituicaoId: "banco-003",
      dataPagamento: "2026-01-16T10:30:00.000Z",
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial",
      pagoPor: "secretaria"
    },
    {
      id: "pag-demo-mens-0",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 1,
      valor: 80,
      referencia: "Mensalidade 01/2026",
      vencimento: "2026-01-10T03:00:00.000Z",
      status: "pago",
      formaPagamento: "PIX",
      instituicaoId: "banco-003",
      dataPagamento: "2026-02-05T11:00:00.000Z",
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    },
    {
      id: "pag-demo-mens-1",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 2,
      valor: 80,
      referencia: "Mensalidade 02/2026",
      vencimento: "2026-02-10T03:00:00.000Z",
      status: "pago",
      formaPagamento: "PIX",
      dataPagamento: "2026-03-08T09:15:00.000Z",
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    },
    {
      id: "pag-demo-mens-2",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 3,
      valor: 80,
      referencia: "Mensalidade 03/2026",
      vencimento: "2026-03-10T03:00:00.000Z",
      status: "pago",
      formaPagamento: "PIX",
      dataPagamento: "2026-04-02T16:40:00.000Z",
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    },
    {
      id: "pag-demo-mens-3",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 4,
      valor: 80,
      referencia: "Mensalidade 04/2026",
      vencimento: "2026-04-10T03:00:00.000Z",
      status: "pendente",
      formaPagamento: null,
      dataPagamento: null,
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    },
    {
      id: "pag-demo-mens-4",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 5,
      valor: 80,
      referencia: "Mensalidade 05/2026",
      vencimento: "2026-05-10T03:00:00.000Z",
      status: "pendente",
      formaPagamento: null,
      dataPagamento: null,
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    },
    {
      id: "pag-demo-mens-5",
      matriculaId: matriculaDemo.id,
      alunoNome: matriculaDemo.nomeCompleto,
      alunoEmail: matriculaDemo.email,
      modulo: "basico",
      tipo: "mensalidade",
      parcela: 6,
      valor: 80,
      referencia: "Mensalidade 06/2026",
      vencimento: "2026-06-10T03:00:00.000Z",
      status: "agendado",
      formaPagamento: null,
      dataPagamento: null,
      criadoEm: "2026-01-15T12:00:00.000Z",
      canal: "presencial"
    }
  ]);

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
