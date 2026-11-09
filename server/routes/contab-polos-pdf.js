const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { authRequired, requirePerfis } = require("../middleware/auth");
const { parsearTextoPdfAlunos } = require("../services/contab-polos-pdf-parse");

const router = express.Router();

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    fields: 8,
    fieldNestingDepth: 1,
    fieldArrayIndexLimit: 32
  },
  fileFilter: function (_req, file, cb) {
    const nome = (file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    if (mime === "application/pdf" || nome.endsWith(".pdf")) {
      return cb(null, true);
    }
    cb(new Error("Envie um arquivo PDF."));
  }
});

router.post(
  "/contab-polos/pdf/extrair",
  authRequired,
  requirePerfis("diretor", "secretaria", "contador"),
  function (req, res, next) {
    uploadPdf.single("arquivo")(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          ok: false,
          erro: err.message || "Falha ao receber o PDF."
        });
      }
      next();
    });
  },
  async function (req, res) {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, erro: "Nenhum PDF enviado." });
    }

    try {
      const parsed = await pdfParse(req.file.buffer);
      const texto = parsed.text || "";
      if (!texto.trim()) {
        return res.status(422).json({
          ok: false,
          erro:
            "O PDF não contém texto selecionável. Exporte a planilha como PDF com texto (não apenas imagem escaneada)."
        });
      }

      const resultado = parsearTextoPdfAlunos(texto);
      return res.json({
        ok: true,
        alunos: resultado.alunos,
        metodo: resultado.metodo,
        totalLinhasTexto: resultado.totalLinhasTexto,
        paginas: parsed.numpages || 0,
        amostraTexto: texto.slice(0, 2000),
        nomeArquivo: req.file.originalname || "documento.pdf"
      });
    } catch (erro) {
      console.error("[SETAD] PDF contab polos:", erro);
      return res.status(500).json({
        ok: false,
        erro: "Não foi possível ler o PDF. Verifique o arquivo e tente novamente."
      });
    }
  }
);

module.exports = router;
