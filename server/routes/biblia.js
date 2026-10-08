const express = require("express");
const { authRequired } = require("../middleware/auth");
const { criarLimitePorIp } = require("../middleware/security");

const router = express.Router();
const API_BASE = (process.env.SETAD_BIBLIAAPI_BASE || "https://bibliaapi.com.br/api/v2").replace(
  /\/$/,
  ""
);

const limitarBiblia = criarLimitePorIp({
  janelaMs: 60 * 1000,
  maxTentativas: 120,
  mensagem: "Muitas consultas à Bíblia. Aguarde um momento."
});

function tokenBibliaApi() {
  return (process.env.SETAD_BIBLIAAPI_TOKEN || "").trim();
}

async function fetchBibliaApi(caminho) {
  const token = tokenBibliaApi();
  if (!token) {
    return { ok: false, status: 503, erro: "API bíblica não configurada no servidor (SETAD_BIBLIAAPI_TOKEN)." };
  }
  const url = API_BASE + caminho;
  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" }
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = { erro: "Resposta inválida da API bíblica." };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      erro: (data && data.erro) || data.message || "Falha ao consultar a API bíblica."
    };
  }
  return { ok: true, data: data };
}

router.get("/status", authRequired, limitarBiblia, function (_req, res) {
  res.json({
    ok: true,
    configurada: Boolean(tokenBibliaApi()),
    base: API_BASE
  });
});

router.get("/versions", authRequired, limitarBiblia, async function (_req, res) {
  const r = await fetchBibliaApi("/versions");
  if (!r.ok) return res.status(r.status || 502).json({ ok: false, erro: r.erro });
  res.json({ ok: true, versoes: r.data });
});

router.get(
  "/:version/books/:livro/chapters/:capitulo",
  authRequired,
  limitarBiblia,
  async function (req, res) {
    const { version, livro, capitulo } = req.params;
    const caminho =
      "/versions/" +
      encodeURIComponent(version) +
      "/books/" +
      encodeURIComponent(livro) +
      "/chapters/" +
      encodeURIComponent(capitulo);
    const r = await fetchBibliaApi(caminho);
    if (!r.ok) return res.status(r.status || 502).json({ ok: false, erro: r.erro });
    res.json({ ok: true, capitulo: r.data });
  }
);

router.get(
  "/:version/search",
  authRequired,
  limitarBiblia,
  async function (req, res) {
    const { version } = req.params;
    const termo = String(req.query.q || req.query.query || "").trim();
    if (termo.length < 2) {
      return res.status(400).json({ ok: false, erro: "Informe pelo menos 2 caracteres para buscar." });
    }

    const base =
      "/versions/" + encodeURIComponent(version) + "/search?q=" + encodeURIComponent(termo);
    let r = await fetchBibliaApi(base);
    if (!r.ok) {
      const alt =
        "/search?version=" +
        encodeURIComponent(version) +
        "&q=" +
        encodeURIComponent(termo);
      r = await fetchBibliaApi(alt);
    }
    if (!r.ok) return res.status(r.status || 502).json({ ok: false, erro: r.erro });
    res.json({ ok: true, resultados: r.data });
  }
);

module.exports = router;
