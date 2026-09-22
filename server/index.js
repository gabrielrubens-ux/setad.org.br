const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { seedIfNeeded } = require("./seed");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");

const PORT = Number(process.env.PORT || 3456);
const ROOT = path.join(__dirname, "..");

seedIfNeeded();

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^capacitor:\/\/localhost$/,
      /^https:\/\/localhost$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/
    ];
    if (process.env.SETAD_CORS_ORIGIN) {
      allowed.push(new RegExp(process.env.SETAD_CORS_ORIGIN));
    }
    if (allowed.some(function (rule) { return rule.test(origin); })) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(ROOT, "data", "uploads")));

app.get("/api/health", function (_req, res) {
  res.json({
    ok: true,
    service: "setad-api",
    version: "1.0.0",
    mode: "api"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", dataRoutes);

app.use(express.static(ROOT, {
  index: "index.html",
  extensions: ["html"]
}));

app.get("*", function (req, res, next) {
  if (req.path.startsWith("/api/")) return next();
  if (req.path.includes(".")) return next();
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("[SETAD] Servidor em http://localhost:" + PORT);
  console.log("[SETAD] Rede local: use o IP do PC com a porta " + PORT + " no app mobile");
  console.log("[SETAD] API: /api/health | Site + PWA + API unificados");
});
