const JWT_INSEGURO = [
  "setad-dev-secret-altere-em-producao",
  "altere-esta-chave-em-producao",
  "altere-esta-chave-em-producao"
];

function origensCorsPermitidas() {
  const regras = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^capacitor:\/\/localhost$/,
    /^https:\/\/localhost$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    /^https:\/\/[a-z0-9-]+\.hostingersite\.com$/,
    /^https:\/\/setad\.org\.br$/,
    /^https:\/\/www\.setad\.org\.br$/
  ];

  const extra = (process.env.SETAD_CORS_ORIGIN || "")
    .split(",")
    .map(function (item) { return item.trim(); })
    .filter(Boolean);

  extra.forEach(function (pattern) {
    try {
      regras.push(new RegExp(pattern));
    } catch (_error) {
      console.warn("[SETAD] SETAD_CORS_ORIGIN inválido ignorado:", pattern);
    }
  });

  return regras;
}

function corsPermitido(origin) {
  if (!origin) return true;
  return origensCorsPermitidas().some(function (rule) {
    return rule.test(origin);
  });
}

function headersSeguranca(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

function validarSegredosProducao() {
  if (process.env.NODE_ENV !== "production") return;

  const secret = (process.env.JWT_SECRET || "").trim();
  if (!secret || JWT_INSEGURO.includes(secret) || secret.length < 32) {
    console.error(
      "[SETAD] JWT_SECRET ausente ou fraco. Defina uma chave aleatória (32+ caracteres) no painel Hostinger."
    );
    process.exit(1);
  }
}

function criarLimiteLogin() {
  const janelaMs = 15 * 60 * 1000;
  const maxTentativas = 20;
  const tentativas = new Map();

  return function limitarLogin(req, res, next) {
    const chave = req.ip || req.socket.remoteAddress || "unknown";
    const agora = Date.now();
    const registro = tentativas.get(chave) || { count: 0, inicio: agora };

    if (agora - registro.inicio > janelaMs) {
      registro.count = 0;
      registro.inicio = agora;
    }

    registro.count += 1;
    tentativas.set(chave, registro);

    if (registro.count > maxTentativas) {
      return res.status(429).json({
        ok: false,
        erro: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
      });
    }

    next();
  };
}

module.exports = {
  corsPermitido,
  headersSeguranca,
  validarSegredosProducao,
  criarLimiteLogin
};
