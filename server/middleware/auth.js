const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "setad-dev-secret-altere-em-producao";
const COOKIE_NAME = "setad_token";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      perfil: user.perfil,
      nome: user.nome,
      modulo: user.modulo || null,
      matriculaId: user.matricula_id || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function extractToken(req) {
  if (req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return null;
}

function authOptional(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    req.user = null;
  }
  next();
}

function authRequired(req, res, next) {
  authOptional(req, res, function () {
    if (!req.user) {
      return res.status(401).json({ ok: false, erro: "Não autenticado." });
    }
    next();
  });
}

function requirePerfis(...perfis) {
  return function (req, res, next) {
    if (!req.user || !perfis.includes(req.user.perfil)) {
      return res.status(403).json({ ok: false, erro: "Acesso negado." });
    }
    next();
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function toSessionUser(user) {
  const perfil = user.perfil;
  let tipo = "professor";
  if (perfil === "aluno") tipo = "aluno";
  if (perfil === "diretor" || perfil === "contador") tipo = "direcao";
  if (perfil === "secretaria") tipo = "secretaria";

  return {
    tipo,
    perfil,
    nome: user.nome,
    email: user.email,
    modulo: user.modulo || null,
    matriculaId: user.matricula_id || null,
    loginEm: new Date().toISOString()
  };
}

module.exports = {
  JWT_SECRET,
  COOKIE_NAME,
  signToken,
  authOptional,
  authRequired,
  requirePerfis,
  setAuthCookie,
  clearAuthCookie,
  toSessionUser
};
