/**
 * Insere meta tags Windows (ícone com fundo transparente) após o link do manifest.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const skip = new Set(["www", "android", "node_modules", ".git"]);

const tileBlock =
  '  <meta name="msapplication-TileImage" content="/assets/icons/icon-512.png">\n' +
  '  <meta name="msapplication-TileColor" content="transparent">\n';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".html")) patch(full);
  }
}

function patch(file) {
  let html = fs.readFileSync(file, "utf8");
  if (!html.includes('rel="manifest"')) return;
  if (html.includes("msapplication-TileImage")) return;

  const updated = html.replace(
    /(<link rel="manifest" href="[^"]+">)/,
    `$1\n${tileBlock}`
  );
  if (updated === html) return;

  fs.writeFileSync(file, updated);
  console.log("Atualizado:", path.relative(root, file));
}

walk(root);
