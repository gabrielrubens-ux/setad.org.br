const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../db");
const { gerarId } = require("../seed");
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  authRequired,
  requirePerfis,
  toSessionUser
} = require("../middleware/auth");

const { criarLimiteLogin } = require("../middleware/security");
const {
  iniciarAtivacao,
  definirSenhaAtivacao,
  verificarCodigoAtivacao,
  reenviarCodigoAtivacao,
  enviarCodigoSePossivel,
  listarAutorizados,
  upsertAutorizado,
  desativarAutorizado,
  PERFIS_INSTITUCIONAIS
} = require("../staff-ativacao");

const router = express.Router();
const limitarLogin = criarLimiteLogin();

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email.trim().toLowerCase());
}

function gerarCodigoVerificacao() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/login", limitarLogin, function (req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const senha = req.body.senha || "";

  if (!email || !senha) {
    return res.status(400).json({ ok: false, erro: "Informe e-mail e senha." });
  }

  const user = findUserByEmail(email);
  if (!user || !bcrypt.compareSync(senha, user.password_hash)) {
    return res.status(401).json({ ok: false, erro: "E-mail ou senha incorretos." });
  }

  if (!user.verificado) {
    const perfilInstitucional = PERFIS_INSTITUCIONAIS.includes(user.perfil);
    const mensagem = perfilInstitucional
      ? "Conta pendente. Use Primeiro acesso institucional para criar sua senha."
      : "Conta ainda não verificada.";
    return res.status(403).json({ ok: false, erro: mensagem, precisaAtivacao: true });
  }

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    ok: true,
    token: token,
    user: toSessionUser(user)
  });
});

router.post("/logout", function (_req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", authRequired, function (req, res) {
  const user = findUserByEmail(req.user.email);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ ok: false, erro: "Sessão inválida." });
  }
  res.json({ ok: true, user: toSessionUser(user) });
});

router.post("/aluno/register", function (req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const senha = req.body.senha || "";

  if (!email || senha.length < 6) {
    return res.status(400).json({ ok: false, erro: "Informe e-mail e senha válidos (mín. 6 caracteres)." });
  }

  const matricula = db.prepare("SELECT dados FROM matriculas").all()
    .map((r) => JSON.parse(r.dados))
    .find((m) => (m.email || "").toLowerCase() === email);

  if (!matricula) {
    return res.status(404).json({
      ok: false,
      erro: "Este e-mail não possui matrícula registrada. Faça sua inscrição em Matrícula online antes de criar o acesso."
    });
  }

  const existente = findUserByEmail(email);
  if (existente && existente.verificado) {
    return res.status(409).json({ ok: false, erro: "Já existe uma conta verificada com este e-mail. Use a opção Entrar." });
  }

  const codigo = gerarCodigoVerificacao();
  const codigoExpiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO verificacoes_pendentes (email, password_hash, nome, modulo, matricula_id, codigo, codigo_expira_em, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      nome = excluded.nome,
      modulo = excluded.modulo,
      matricula_id = excluded.matricula_id,
      codigo = excluded.codigo,
      codigo_expira_em = excluded.codigo_expira_em,
      criado_em = excluded.criado_em
  `).run(
    email,
    bcrypt.hashSync(senha, 10),
    matricula.nomeCompleto,
    matricula.modulo,
    matricula.id,
    codigo,
    codigoExpiraEm,
    new Date().toISOString()
  );

  res.json({
    ok: true,
    email,
    codigoDemo: codigo
  });
});

router.post("/aluno/verify", function (req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const codigo = String(req.body.codigo || "").trim();

  const pendente = db.prepare("SELECT * FROM verificacoes_pendentes WHERE email = ?").get(email);
  if (!pendente) {
    return res.status(404).json({ ok: false, erro: "Nenhuma verificação pendente. Crie sua senha novamente." });
  }

  if (new Date() > new Date(pendente.codigo_expira_em)) {
    return res.status(400).json({ ok: false, erro: "O código expirou. Solicite um novo código." });
  }

  if (pendente.codigo !== codigo) {
    return res.status(400).json({ ok: false, erro: "Código incorreto. Verifique os 6 dígitos enviados ao seu e-mail." });
  }

  const now = new Date().toISOString();
  const userId = gerarId("user");

  db.prepare(`
    INSERT INTO users (id, email, password_hash, nome, perfil, modulo, matricula_id, verificado, created_at, verified_at)
    VALUES (?, ?, ?, ?, 'aluno', ?, ?, 1, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      nome = excluded.nome,
      modulo = excluded.modulo,
      matricula_id = excluded.matricula_id,
      verificado = 1,
      verified_at = excluded.verified_at
  `).run(userId, email, pendente.password_hash, pendente.nome, pendente.modulo, pendente.matricula_id, now, now);

  db.prepare("DELETE FROM verificacoes_pendentes WHERE email = ?").run(email);

  const user = findUserByEmail(email);
  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    ok: true,
    token: token,
    conta: {
      email: user.email,
      nome: user.nome,
      modulo: user.modulo,
      matriculaId: user.matricula_id,
      verificado: true
    },
    user: toSessionUser(user)
  });
});

router.post("/aluno/resend-code", function (req, res) {
  const email = (req.body.email || "").trim().toLowerCase();
  const pendente = db.prepare("SELECT * FROM verificacoes_pendentes WHERE email = ?").get(email);

  if (!pendente) {
    return res.status(404).json({ ok: false, erro: "Nenhuma verificação pendente para este e-mail. Crie sua senha novamente." });
  }

  const codigo = gerarCodigoVerificacao();
  const codigoExpiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE verificacoes_pendentes
    SET codigo = ?, codigo_expira_em = ?
    WHERE email = ?
  `).run(codigo, codigoExpiraEm, email);

  res.json({ ok: true, email, codigoDemo: codigo });
});

router.get("/aluno/verificacao-pendente", function (req, res) {
  const email = (req.query.email || "").trim().toLowerCase();
  const pendente = db.prepare("SELECT email, codigo_expira_em FROM verificacoes_pendentes WHERE email = ?").get(email);
  res.json({ ok: true, pendente: !!pendente });
});

router.post("/staff/ativacao/iniciar", function (req, res) {
  const email = (req.body.email || "").trim();
  const resultado = iniciarAtivacao(email);
  if (!resultado.ok) {
    const status = resultado.jaAtivo ? 409 : 403;
    return res.status(status).json(resultado);
  }
  res.json(resultado);
});

router.post("/staff/ativacao/senha", function (req, res) {
  const email = (req.body.email || "").trim();
  const senha = req.body.senha || "";
  const confirmar = req.body.confirmarSenha || req.body.confirmar || "";

  if (senha !== confirmar) {
    return res.status(400).json({ ok: false, erro: "As senhas não coincidem." });
  }

  const resultado = definirSenhaAtivacao(email, senha);
  if (!resultado.ok) {
    return res.status(400).json(resultado);
  }

  enviarCodigoSePossivel(resultado.email, resultado.nome, resultado.codigo).then(function () {
    res.json({
      ok: true,
      email: resultado.email,
      perfil: resultado.perfil,
      etapa: "verificacao",
      codigoDemo: process.env.NODE_ENV === "production" ? undefined : resultado.codigo
    });
  });
});

router.post("/staff/ativacao/verificar", function (req, res) {
  const email = (req.body.email || "").trim();
  const codigo = String(req.body.codigo || "").trim();

  const resultado = verificarCodigoAtivacao(email, codigo);
  if (!resultado.ok) {
    return res.status(400).json(resultado);
  }

  const tokenJwt = signToken(resultado.user);
  setAuthCookie(res, tokenJwt);

  res.json({
    ok: true,
    token: tokenJwt,
    user: toSessionUser(resultado.user),
    redirect: resultado.redirect
  });
});

router.post("/staff/ativacao/reenviar-codigo", function (req, res) {
  const email = (req.body.email || "").trim();
  const resultado = reenviarCodigoAtivacao(email);
  if (!resultado.ok) {
    return res.status(400).json(resultado);
  }

  enviarCodigoSePossivel(resultado.email, resultado.nome, resultado.codigo).then(function () {
    res.json({
      ok: true,
      email: resultado.email,
      codigoDemo: process.env.NODE_ENV === "production" ? undefined : resultado.codigo
    });
  });
});

router.get("/staff/autorizados", authRequired, requirePerfis("diretor"), function (_req, res) {
  res.json({ ok: true, itens: listarAutorizados() });
});

router.post("/staff/autorizados", authRequired, requirePerfis("diretor"), function (req, res) {
  const resultado = upsertAutorizado(req.body.email, req.body.nome, req.body.perfil);
  if (!resultado.ok) {
    return res.status(400).json(resultado);
  }
  res.json(resultado);
});

router.delete("/staff/autorizados/:email", authRequired, requirePerfis("diretor"), function (req, res) {
  const resultado = desativarAutorizado(req.params.email);
  if (!resultado.ok) {
    return res.status(404).json(resultado);
  }
  res.json(resultado);
});

module.exports = router;
