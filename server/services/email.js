/* ============================================================
   email.js — Envio de e-mails transacionais (SMTP opcional)
   ============================================================ */

const crypto = require("crypto");

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (_erro) {
  nodemailer = null;
}

let transportePool = null;
let aquecimentoSmtpEmAndamento = false;

function smtpConfigurado() {
  return Boolean(
    process.env.SETAD_SMTP_HOST &&
      process.env.SETAD_SMTP_USER &&
      process.env.SETAD_SMTP_PASS
  );
}

function replyToPadrao() {
  return (
    (process.env.SETAD_EMAIL_REPLY_TO || "").trim() ||
    "contato@setad.org.br"
  );
}

function remetentePadrao() {
  const fromEnv = (process.env.SETAD_EMAIL_FROM || "").trim();
  if (fromEnv) return fromEnv;

  const user = (process.env.SETAD_SMTP_USER || "").trim();
  if (user && user.includes("@")) {
    return "SETAD <" + user + ">";
  }

  return "SETAD <noreply@setad.org.br>";
}

function extrairEmailDoFrom(from) {
  const match = String(from || "").match(/<([^>]+)>/);
  return (match ? match[1] : from || "").trim().toLowerCase();
}

function avisoAlinhamentoRemetente() {
  if (!smtpConfigurado()) return null;

  const user = (process.env.SETAD_SMTP_USER || "").trim().toLowerCase();
  const fromAddr = extrairEmailDoFrom(remetentePadrao());
  if (!user || !fromAddr || user === fromAddr) return null;

  return (
    "SETAD_EMAIL_FROM (" +
    fromAddr +
    ") difere de SETAD_SMTP_USER (" +
    user +
    "). No Gmail, use o mesmo endereço do domínio autenticado (SPF/DKIM)."
  );
}

function obterTransporte() {
  if (!nodemailer || !smtpConfigurado()) return null;

  if (!transportePool) {
    const port = Number(process.env.SETAD_SMTP_PORT || 587);
    const secure = process.env.SETAD_SMTP_SECURE === "true" || port === 465;

    transportePool = nodemailer.createTransport({
      host: process.env.SETAD_SMTP_HOST,
      port: port,
      secure: secure,
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
      connectionTimeout: 15000,
      greetingTimeout: 12000,
      socketTimeout: 30000,
      auth: {
        user: process.env.SETAD_SMTP_USER,
        pass: process.env.SETAD_SMTP_PASS
      },
      tls: {
        minVersion: "TLSv1.2",
        servername: process.env.SETAD_SMTP_HOST
      }
    });
  }

  return transportePool;
}

function reiniciarTransporteSmtp() {
  if (transportePool && typeof transportePool.close === "function") {
    try {
      transportePool.close();
    } catch (_erro) {
      /* ignore */
    }
  }
  transportePool = null;
}

function aquecerConexaoSmtp() {
  if (!smtpConfigurado() || aquecimentoSmtpEmAndamento) return;

  const transporte = obterTransporte();
  if (!transporte || typeof transporte.verify !== "function") return;

  aquecimentoSmtpEmAndamento = true;
  const inicio = Date.now();
  transporte
    .verify()
    .then(function () {
      console.log("[SETAD e-mail] Conexão SMTP verificada em " + (Date.now() - inicio) + " ms.");
    })
    .catch(function (erro) {
      console.warn("[SETAD e-mail] Falha ao aquecer SMTP:", erro.message);
      reiniciarTransporteSmtp();
    })
    .finally(function () {
      aquecimentoSmtpEmAndamento = false;
    });
}

function urlPublicaSite(caminho) {
  const base = (process.env.SETAD_PUBLIC_URL || "http://localhost:3456").replace(/\/$/, "");
  const destino = caminho.startsWith("/") ? caminho : "/" + caminho;
  return base + destino;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function montarMensagemCodigoVerificacao(nome, codigo, tipo) {
  const nomeExibir = (nome || "usuário").trim();
  const siteUrl = urlPublicaSite("/");
  const loginUrl =
    tipo === "aluno"
      ? urlPublicaSite("/login-aluno.html")
      : urlPublicaSite("/primeiro-acesso-institucional.html");

  const contexto =
    tipo === "aluno"
      ? "criação da senha da área do aluno"
      : "ativação do acesso institucional (direção, contabilidade ou secretaria)";

  const assunto =
    tipo === "aluno"
      ? "SETAD — código de verificação (área do aluno)"
      : "SETAD — código de verificação (acesso institucional)";

  const texto =
    "Olá, " +
    nomeExibir +
    ".\n\n" +
    "Você solicitou o código para " +
    contexto +
    " no site do SETAD (Seminário Teológico).\n\n" +
    "Código de verificação (6 dígitos):\n\n" +
    codigo +
    "\n\n" +
    "Validade: 15 minutos.\n\n" +
    "Se você não fez este pedido, ignore este e-mail.\n\n" +
    "Site: " +
    siteUrl +
    "\n" +
    "Acesso: " +
    loginUrl +
    "\n\n" +
    "SETAD — Seminário Teológico\n" +
    replyToPadrao();

  const html =
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a2a3a;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">' +
    '<tr><td style="padding:28px 24px 8px;">' +
    '<p style="margin:0 0 8px;font-size:13px;color:#64748b;letter-spacing:0.04em;text-transform:uppercase;">SETAD</p>' +
    '<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#23406b;">Código de verificação</h1>' +
    '<p style="margin:0 0 20px;font-size:15px;line-height:1.5;">Olá, <strong>' +
    escaparHtml(nomeExibir) +
    "</strong>. Use o código abaixo para concluir a " +
    escaparHtml(contexto) +
    ".</p>" +
    '<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Seu código</p>' +
    '<p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px;color:#23406b;font-family:Consolas,Monaco,monospace;">' +
    escaparHtml(codigo) +
    "</p>" +
    '<p style="margin:0 0 24px;font-size:13px;color:#64748b;">Expira em <strong>15 minutos</strong>. Não compartilhe este código.</p>' +
    '<p style="margin:0 0 8px;font-size:14px;"><a href="' +
    escaparHtml(loginUrl) +
    '" style="color:#2563eb;text-decoration:none;">Continuar no site do SETAD</a></p>' +
    '<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">Se você não solicitou este código, pode ignorar esta mensagem.</p>' +
    "</td></tr></table></td></tr></table></body></html>";

  return { assunto, texto, html };
}

/**
 * @returns {Promise<{ enviado: boolean, modo: string, erro?: string }>}
 */
async function enviarEmail(destinatario, assunto, texto, html, opcoes) {
  const extras = opcoes || {};
  const transporte = obterTransporte();

  if (!transporte) {
    console.log("[SETAD e-mail] SMTP não configurado — mensagem não enviada por e-mail.");
    console.log("[SETAD e-mail] Para:", destinatario);
    console.log("[SETAD e-mail] Assunto:", assunto);
    console.log("[SETAD e-mail] Corpo:\n" + texto);
    return { enviado: false, modo: "log" };
  }

  const messageId =
    "<" +
    crypto.randomBytes(16).toString("hex") +
    "@setad.org.br>";

  const from = remetentePadrao();
  const mailOptions = {
    from: from,
    to: destinatario,
    replyTo: replyToPadrao(),
    subject: assunto,
    text: texto,
    html: html || undefined,
    messageId: messageId,
    priority: "high",
    envelope: {
      from: extrairEmailDoFrom(from) || process.env.SETAD_SMTP_USER,
      to: destinatario
    }
  };

  const inicio = Date.now();

  try {
    await transporte.sendMail(mailOptions);
    console.log(
      "[SETAD e-mail] Aceito pelo SMTP para",
      destinatario,
      "em",
      Date.now() - inicio,
      "ms"
    );
    return { enviado: true, modo: "smtp", duracaoMs: Date.now() - inicio };
  } catch (erro) {
    console.error("[SETAD e-mail] Falha ao enviar para", destinatario, ":", erro.message);
    reiniciarTransporteSmtp();
    try {
      const transporte2 = obterTransporte();
      if (transporte2) {
        await transporte2.sendMail(mailOptions);
        console.log(
          "[SETAD e-mail] Reenvio OK para",
          destinatario,
          "em",
          Date.now() - inicio,
          "ms"
        );
        return { enviado: true, modo: "smtp-retry", duracaoMs: Date.now() - inicio };
      }
    } catch (erro2) {
      console.error("[SETAD e-mail] Reenvio falhou:", erro2.message);
      reiniciarTransporteSmtp();
      return { enviado: false, modo: "erro", erro: erro2.message };
    }
    return { enviado: false, modo: "erro", erro: erro.message };
  }
}

/**
 * @param {"aluno"|"institucional"} tipo
 */
async function enviarCodigoVerificacao(destinatario, nome, codigo, tipo) {
  const tipoNorm = tipo === "aluno" ? "aluno" : "institucional";
  const msg = montarMensagemCodigoVerificacao(nome, codigo, tipoNorm);
  return enviarEmail(destinatario, msg.assunto, msg.texto, msg.html, {
    refId: "setad-codigo-" + tipoNorm
  });
}

async function enviarCodigoVerificacaoInstitucional(destinatario, nome, codigo) {
  return enviarCodigoVerificacao(destinatario, nome, codigo, "institucional");
}

async function enviarCodigoVerificacaoAluno(destinatario, nome, codigo) {
  return enviarCodigoVerificacao(destinatario, nome, codigo, "aluno");
}

function logStatusSmtpInicializacao() {
  if (!smtpConfigurado()) {
    console.warn(
      "[SETAD e-mail] SMTP não configurado — códigos de verificação só aparecem nos logs (não use em produção)."
    );
    return;
  }

  console.log("[SETAD e-mail] SMTP ativo. Remetente:", remetentePadrao());
  const aviso = avisoAlinhamentoRemetente();
  if (aviso) {
    console.warn("[SETAD e-mail]", aviso);
  }
  aquecerConexaoSmtp();
}

module.exports = {
  enviarEmail,
  enviarCodigoVerificacao,
  enviarCodigoVerificacaoInstitucional,
  enviarCodigoVerificacaoAluno,
  urlPublicaSite,
  smtpConfigurado,
  remetentePadrao,
  replyToPadrao,
  avisoAlinhamentoRemetente,
  logStatusSmtpInicializacao,
  aquecerConexaoSmtp,
  reiniciarTransporteSmtp
};
