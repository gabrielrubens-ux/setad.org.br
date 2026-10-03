/**
 * SETAD Print Bridge — rode no PC da secretaria/direção com impressoras de rede ou USB.
 * Porta padrão: 9247 · Somente localhost (não exponha na internet).
 *
 *   cd print-bridge
 *   npm install
 *   npm start
 */
import http from "http";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.SETAD_PRINT_BRIDGE_PORT || 9247);
const HOST = process.env.SETAD_PRINT_BRIDGE_HOST || "127.0.0.1";

const ORIGENS_PERMITIDAS = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  /^https:\/\/setad\.org\.br$/i,
  /^https:\/\/www\.setad\.org\.br$/i
];

let pdfPrinter = null;
try {
  const mod = await import("pdf-to-printer");
  pdfPrinter = mod.default || mod;
} catch (_e) {
  console.warn("[SETAD Print Bridge] pdf-to-printer não instalado — use npm install");
}

function corsHeaders(origin) {
  const permitido = ORIGENS_PERMITIDAS.some(function (re) {
    return re.test(origin || "");
  });
  return {
    "Access-Control-Allow-Origin": permitido ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

async function listarImpressorasWindows() {
  const ps =
    "Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress";
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-Command", ps],
    { windowsHide: true, maxBuffer: 1024 * 1024 }
  );
  const parsed = JSON.parse(stdout.trim() || "[]");
  if (Array.isArray(parsed)) return parsed;
  return parsed ? [parsed] : [];
}

async function imprimirPdfArquivo(filePath, printer, copies) {
  if (!pdfPrinter) {
    throw new Error("Módulo pdf-to-printer ausente. Rode npm install na pasta print-bridge.");
  }
  const opts = {};
  if (printer) opts.printer = printer;
  if (copies > 1) opts.copies = copies;
  await pdfPrinter.print(filePath, opts);
}

function lerCorpo(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    req.on("data", function (c) {
      chunks.push(c);
    });
    req.on("end", function () {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async function (req, res) {
  const origin = req.headers.origin || "";
  const headers = { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ ok: true, service: "setad-print-bridge", platform: process.platform }));
      return;
    }

    if (req.method === "GET" && req.url === "/printers") {
      if (process.platform !== "win32") {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ ok: true, printers: [], aviso: "Listagem automática só no Windows." }));
        return;
      }
      const printers = await listarImpressorasWindows();
      res.writeHead(200, headers);
      res.end(JSON.stringify({ ok: true, printers: printers }));
      return;
    }

    if (req.method === "POST" && req.url === "/print-pdf") {
      const body = await lerCorpo(req);
      const buf = Buffer.from(body.pdfBase64 || "", "base64");
      const tmp = path.join(os.tmpdir(), "setad-print-" + Date.now() + ".pdf");
      await fs.writeFile(tmp, buf);
      try {
        await imprimirPdfArquivo(tmp, body.printer || "", Number(body.copies) || 1);
        res.writeHead(200, headers);
        res.end(JSON.stringify({ ok: true, arquivo: body.titulo || "pdf" }));
      } finally {
        fs.unlink(tmp).catch(function () {});
      }
      return;
    }

    if (req.method === "POST" && req.url === "/print-html") {
      const body = await lerCorpo(req);
      const html = body.html || "";
      const tmpHtml = path.join(os.tmpdir(), "setad-print-" + Date.now() + ".html");
      await fs.writeFile(tmpHtml, html, "utf8");
      if (process.platform === "win32") {
        await execFileAsync(
          "powershell.exe",
          [
            "-NoProfile",
            "-Command",
            "Start-Process",
            "-FilePath",
            tmpHtml,
            "-Verb",
            "Print",
            "-PassThru",
            "|",
            "Out-Null"
          ],
          { windowsHide: true }
        ).catch(async function () {
          await execFileAsync("cmd.exe", ["/c", "start", "", "/min", tmpHtml], { windowsHide: true });
        });
        res.writeHead(200, headers);
        res.end(JSON.stringify({ ok: true, modo: "html-sistema" }));
        return;
      }
      res.writeHead(501, headers);
      res.end(JSON.stringify({ ok: false, erro: "print-html suportado no Windows." }));
      return;
    }

    res.writeHead(404, headers);
    res.end(JSON.stringify({ ok: false, erro: "Rota não encontrada." }));
  } catch (erro) {
    res.writeHead(500, headers);
    res.end(JSON.stringify({ ok: false, erro: erro.message || String(erro) }));
  }
});

server.listen(PORT, HOST, function () {
  console.log("[SETAD Print Bridge] http://" + HOST + ":" + PORT);
});
