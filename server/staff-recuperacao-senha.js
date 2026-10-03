const bcrypt = require("bcryptjs");
const { db } = require("./db");
const { enviarCodigoRecuperacaoSenhaInstitucional } = require("./services/email");
const { perfisDoRegistro } = require("./perfis-institucionais");
const { buscarAutorizado, findUserByEmail } = require("./staff-ativacao");

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function gerarCodigoVerificacao() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function buscarRecuperacaoPendente(email) {
  return db
    .prepare("SELECT * FROM recuperacoes_senha_institucional WHERE email = ? COLLATE NOCASE")
    .get(normalizarEmail(email));
}

function iniciarRecuperacaoSenha(email) {
  const emailNorm = normalizarEmail(email);
  if (!emailNorm) {
    return { ok: false, erro: "Informe um e-mail válido." };
  }

  const autorizado = buscarAutorizado(emailNorm);
  if (!autorizado) {
    return {
      ok: false,
      erro: "Este e-mail não está autorizado. Solicite acesso à direção do SETAD."
    };
  }

  const usuario = findUserByEmail(emailNorm);
  if (!usuario || !usuario.verificado) {
    return {
      ok: false,
      erro: "Não há conta ativa com este e-mail. Use o primeiro acesso institucional.",
      precisaPrimeiroAcesso: true
    };
  }

  return {
    ok: true,
    email: emailNorm,
    nome: autorizado.nome || usuario.nome
  };
}

function definirNovaSenhaRecuperacao(email, senha, confirmar) {
  const inicio = iniciarRecuperacaoSenha(email);
  if (!inicio.ok) {
    return inicio;
  }

  const emailNorm = inicio.email;
  if (!senha || senha.length < 6) {
    return { ok: false, erro: "A senha deve ter no mínimo 6 caracteres." };
  }
  if (senha !== confirmar) {
    return { ok: false, erro: "As senhas não coincidem." };
  }

  const codigo = gerarCodigoVerificacao();
  const agora = new Date().toISOString();
  const codigoExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const passwordHash = bcrypt.hashSync(senha, 10);

  db.prepare(`
    INSERT INTO recuperacoes_senha_institucional (
      email, nome, password_hash, codigo, codigo_expira_em, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      nome = excluded.nome,
      password_hash = excluded.password_hash,
      codigo = excluded.codigo,
      codigo_expira_em = excluded.codigo_expira_em,
      criado_em = excluded.criado_em
  `).run(emailNorm, inicio.nome, passwordHash, codigo, codigoExpira, agora);

  return {
    ok: true,
    email: emailNorm,
    nome: inicio.nome,
    codigo: codigo
  };
}

function verificarRecuperacaoSenha(email, codigoInformado) {
  const emailNorm = normalizarEmail(email);
  const pendente = buscarRecuperacaoPendente(emailNorm);
  const autorizado = buscarAutorizado(emailNorm);
  const usuario = findUserByEmail(emailNorm);

  if (!pendente || !autorizado || !usuario) {
    return { ok: false, erro: "Solicite a recuperação de senha novamente." };
  }

  if (!pendente.password_hash) {
    return { ok: false, erro: "Defina a nova senha antes de verificar o código." };
  }

  if (!pendente.codigo || !pendente.codigo_expira_em) {
    return { ok: false, erro: "Nenhum código pendente. Defina a nova senha novamente." };
  }

  if (new Date() > new Date(pendente.codigo_expira_em)) {
    return {
      ok: false,
      erro: "O código expirou. Defina a nova senha novamente para receber outro código.",
      codigoExpirado: true
    };
  }

  if (String(codigoInformado || "").trim() !== pendente.codigo) {
    return { ok: false, erro: "Código incorreto. Verifique os 6 dígitos enviados ao seu e-mail." };
  }

  const perfisJson =
    autorizado.perfis_json || JSON.stringify(perfisDoRegistro(autorizado));
  const perfilPrincipal = autorizado.perfil;

  db.prepare(`
    UPDATE users SET
      password_hash = ?,
      nome = ?,
      perfil = ?,
      perfis_institucionais_json = ?,
      verificado = 1
    WHERE email = ? COLLATE NOCASE
  `).run(pendente.password_hash, pendente.nome, perfilPrincipal, perfisJson, emailNorm);

  db.prepare("DELETE FROM recuperacoes_senha_institucional WHERE email = ? COLLATE NOCASE").run(
    emailNorm
  );
  db.prepare("DELETE FROM ativacoes_staff_pendentes WHERE email = ? COLLATE NOCASE").run(emailNorm);

  const user = findUserByEmail(emailNorm);
  return { ok: true, user: user };
}

function reenviarCodigoRecuperacao(email) {
  const emailNorm = normalizarEmail(email);
  const pendente = buscarRecuperacaoPendente(emailNorm);
  if (!pendente || !pendente.password_hash) {
    return {
      ok: false,
      erro: "Defina a nova senha primeiro para receber um código por e-mail."
    };
  }

  const codigo = gerarCodigoVerificacao();
  const codigoExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE recuperacoes_senha_institucional
    SET codigo = ?, codigo_expira_em = ?
    WHERE email = ? COLLATE NOCASE
  `).run(codigo, codigoExpira, emailNorm);

  return {
    ok: true,
    email: emailNorm,
    nome: pendente.nome,
    codigo: codigo
  };
}

async function enviarCodigoRecuperacaoSePossivel(email, nome, codigo) {
  return enviarCodigoRecuperacaoSenhaInstitucional(email, nome, codigo);
}

module.exports = {
  iniciarRecuperacaoSenha,
  definirNovaSenhaRecuperacao,
  verificarRecuperacaoSenha,
  reenviarCodigoRecuperacao,
  enviarCodigoRecuperacaoSePossivel
};
