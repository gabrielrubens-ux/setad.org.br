/* ============================================================
   email.js — Envio de e-mails transacionais (SMTP opcional)
   ============================================================ */

const path = require("path");

let nodemailer = null;
try {
  nodemailer = require("nodemailer");
} catch (_erro) {
  nodemailer = null;
}

function smtpConfigurado() {
  return Boolean(
    process.env.SETAD_SMTP_HOST &&
      process.env.SETAD_SMTP_USER &&
      process.env.SETAD_SMTP_PASS
  );
}

function criarTransporte() {
  if (!nodemailer || !smtpConfigurado()) return null;

  const port = Number(process.env.SETAD_SMTP_PORT || 587);
  const secure = process.env.SETAD_SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SETAD_SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.SETAD_SMTP_USER,
      pass: process.env.SETAD_SMTP_PASS
    }
  });
}

function remetentePadrao() {
  return process.env.SETAD_EMAIL_FROM || "SETAD <noreply@setad.org.br>";
}

/**
 * @returns {Promise<{ enviado: boolean, modo: string, erro?: string }>}
 */
async function enviarEmail(destinatario, assunto, texto, html) {
  const transporte = criarTransporte();

  if (!transporte) {
    console.log("[SETAD e-mail] SMTP não configurado — mensagem não enviada por e-mail.");
    console.log("[SETAD e-mail] Para:", destinatario);
    console.log("[SETAD e-mail] Assunto:", assunto);
    console.log("[SETAD e-mail] Corpo:\n" + texto);
    return { enviado: false, modo: "log" };
  }

  try {
    await transporte.sendMail({
      from: remetentePadrao(),
      to: destinatario,
      subject: assunto,
      text: texto,
      html: html || undefined
    });
    return { enviado: true, modo: "smtp" };
  } catch (erro) {
    console.error("[SETAD e-mail] Falha ao enviar:", erro.message);
    return { enviado: false, modo: "erro", erro: erro.message };
  }
}

function urlPublicaSite(caminho) {
  const base = (process.env.SETAD_PUBLIC_URL || "http://localhost:3456").replace(/\/$/, "");
  const destino = caminho.startsWith("/") ? caminho : "/" + caminho;
  return base + destino;
}

async function enviarCodigoVerificacaoInstitucional(destinatario, nome, codigo) {
  const assunto = "SETAD — Código de verificação (área institucional)";
  const texto =
    "Olá, " +
    nome +
    ".\n\n" +
    "Use o código abaixo para concluir a ativação do seu acesso institucional no SETAD:\n\n" +
    codigo +
    "\n\n" +
    "O código expira em 15 minutos.\n\n" +
    "SETAD — Seminário Teológico";

  const html =
    "<p>Olá, <strong>" +
    nome +
    "</strong>.</p>" +
    "<p>Código de verificação para o <strong>acesso institucional SETAD</strong>:</p>" +
    '<p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#23406b">' +
    codigo +
    "</p>" +
    "<p style=\"font-size:12px;color:#777\">Expira em 15 minutos.</p>";

  return enviarEmail(destinatario, assunto, texto, html);
}

module.exports = {
  enviarEmail,
  enviarCodigoVerificacaoInstitucional,
  urlPublicaSite,
  smtpConfigurado
};
