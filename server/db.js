const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.SETAD_DB_PATH || path.join(__dirname, "..", "data", "setad.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      perfil TEXT NOT NULL,
      modulo TEXT,
      matricula_id TEXT,
      verificado INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS verificacoes_pendentes (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      nome TEXT NOT NULL,
      modulo TEXT,
      matricula_id TEXT,
      codigo TEXT NOT NULL,
      codigo_expira_em TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matriculas (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS livros (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entregas (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pagamentos (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funcionarios (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folha_pagamento (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS instituicoes_financeiras (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exclusoes_solicitacoes (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exclusoes_auditoria (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exclusoes_emails (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fotos_alunos (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      data_url TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fotos_staff (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      data_url TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wpp_conversas (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relatorios_contabeis (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
      id TEXT PRIMARY KEY,
      dados TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
}

function getMeta(chave) {
  const row = db.prepare("SELECT valor FROM app_meta WHERE chave = ?").get(chave);
  return row ? row.valor : null;
}

function setMeta(chave, valor) {
  db.prepare(
    "INSERT INTO app_meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor"
  ).run(chave, valor);
}

function listJson(table) {
  return db.prepare(`SELECT dados FROM ${table}`).all().map((row) => JSON.parse(row.dados));
}

function replaceJsonCollection(table, items, idField = "id") {
  const tx = db.transaction((lista) => {
    db.prepare(`DELETE FROM ${table}`).run();
    const insert = db.prepare(`INSERT INTO ${table} (id, dados) VALUES (?, ?)`);
    lista.forEach((item) => {
      const id = item[idField];
      if (!id) return;
      insert.run(id, JSON.stringify(item));
    });
  });
  tx(items);
}

function upsertJson(table, item, idField = "id") {
  const id = item[idField];
  if (!id) throw new Error("Registro sem id");
  db.prepare(
    `INSERT INTO ${table} (id, dados) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET dados = excluded.dados`
  ).run(id, JSON.stringify(item));
}

function deleteJson(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

function getJsonById(table, id) {
  const row = db.prepare(`SELECT dados FROM ${table} WHERE id = ?`).get(id);
  return row ? JSON.parse(row.dados) : null;
}

initSchema();

module.exports = {
  db,
  DB_PATH,
  getMeta,
  setMeta,
  listJson,
  replaceJsonCollection,
  upsertJson,
  deleteJson,
  getJsonById
};
