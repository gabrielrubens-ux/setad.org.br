const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { seedIfNeeded } = require("./seed");
const { getStorageInfo } = require("./db");
const { criarBackupAutomaticoSqlite } = require("./backup-sqlite");
const { importarAutorizadosIniciais } = require("./staff-ativacao");
const {
  garantirStaffAcessoTodasAreas,
  garantirStaffContabilidade,
  garantirStaffSecretaria
} = require("./staff-bootstrap");
const { aplicarZeragemAcervoBiblioteca } = require("./biblioteca-acervo");
const bibliaRoutes = require("./routes/biblia");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");
const {
  corsPermitido,
  headersSeguranca,
  validarSegredosProducao,
  hostPermiteLoginAlunoRedeLocal
} = require("./middleware/security");
const { logStatusSmtpInicializacao, smtpConfigurado } = require("./services/email");

const PORT = Number(process.env.PORT || 3456);
const ROOT = path.join(__dirname, "..");

validarSegredosProducao();
seedIfNeeded();
const storage = getStorageInfo();
criarBackupAutomaticoSqlite(storage.dbPath);
logStatusSmtpInicializacao();

(function carregarStaffAutorizadosEnv() {
  const raw = (process.env.SETAD_STAFF_AUTORIZADOS_JSON || "").trim();
  if (!raw) return;
  try {
    importarAutorizadosIniciais(JSON.parse(raw));
    console.log("[SETAD] Lista de e-mails institucionais carregada de SETAD_STAFF_AUTORIZADOS_JSON.");
  } catch (erro) {
    console.error("[SETAD] SETAD_STAFF_AUTORIZADOS_JSON inválido:", erro.message);
  }
})();

garantirStaffAcessoTodasAreas();
garantirStaffContabilidade();
garantirStaffSecretaria();
aplicarZeragemAcervoBiblioteca();

const app = express();

app.use(headersSeguranca);

app.use(cors({
  origin: function (origin, callback) {
    if (corsPermitido(origin)) {
      return callback(null, true);
    }
    callback(new Error("Origem não permitida pelo CORS"));
  },
  credentials: true
}));

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(storage.uploadsDir));

app.get("/api/health", function (_req, res) {
  res.json({
    ok: true,
    service: "setad-api",
    version: "1.0.0",
    mode: "api",
    emailSmtpConfigurado: smtpConfigurado(),
    armazenamento: {
      dadosForaDoDeploy: storage.dadosForaDoDeploy,
      usuariosNoBanco: storage.totalUsuarios,
      matriculasNoBanco: storage.totalMatriculas,
      pagamentosNoBanco: storage.totalPagamentos,
      notasNoBanco: storage.totalNotas
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/biblia", bibliaRoutes);
app.use("/api", dataRoutes);

app.get("/login-aluno-ip.html", function (req, res) {
  if (!hostPermiteLoginAlunoRedeLocal(req)) {
    return res.redirect(302, "/");
  }
  res.sendFile(path.join(ROOT, "login-aluno-ip.html"));
});

app.use(
  express.static(ROOT, {
    index: "index.html",
    extensions: ["html"],
    setHeaders: function (res, filePath) {
      if (/\.(js|mjs|css|woff2?)$/i.test(filePath)) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=604800, stale-while-revalidate=86400"
        );
      } else if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(filePath)) {
        res.setHeader(
          "Cache-Control",
          "public, max-age=2592000, stale-while-revalidate=86400"
        );
      } else if (/\.html$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    }
  })
);

app.get("*", function (req, res, next) {
  if (req.path.startsWith("/api/")) return next();
  if (req.path.includes(".")) return next();
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("[SETAD] Servidor em http://localhost:" + PORT);
  console.log("[SETAD] Rede local: use o IP do PC com a porta " + PORT + " no app mobile");
  console.log("[SETAD] API: /api/health | Site + PWA + API unificados");
  console.log("[SETAD] SQLite:", storage.dbPath);
  console.log("[SETAD] Uploads:", storage.uploadsDir);
  console.log(
    "[SETAD] Usuários no banco:",
    storage.totalUsuarios,
    "| Matrículas:",
    storage.totalMatriculas,
    "| Pagamentos:",
    storage.totalPagamentos,
    "| Notas:",
    storage.totalNotas,
    "| Persistente fora do deploy:",
    storage.dadosForaDoDeploy ? "sim" : "não"
  );
  if (process.env.NODE_ENV === "production" && !storage.dadosForaDoDeploy) {
    console.warn(
      "[SETAD] AVISO: banco dentro da pasta do deploy — atualizações Git podem apagar cadastros e senhas. " +
        "Defina SETAD_DATA_DIR ou SETAD_DB_PATH absoluto (docs/HOSTINGER-PERSISTENCIA-DADOS.md)."
    );
  }
});
