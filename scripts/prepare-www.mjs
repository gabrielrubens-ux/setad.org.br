/**
 * Copia os arquivos estáticos do site para www/ (bundle Capacitor).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const www = path.join(root, "www");

const COPY_DIRS = ["css", "js", "assets", "matricula", "polos"];
const COPY_FILES = [
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "sw.js",
  "culto-ao-vivo.html",
  "login-aluno.html",
  "login-professor.html",
  "login-direcao.html",
  "painel-aluno.html",
  "painel-professor.html",
  "painel-diretor.html",
  "painel-secretaria.html",
  "painel-contador.html"
];

const SKIP_IN_COPY = new Set([
  "node_modules",
  "server",
  "data",
  "www",
  "android",
  "ios",
  ".git"
]);

function rimraf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (SKIP_IN_COPY.has(base)) return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function (entry) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    });
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  console.log("Preparando www/ para Capacitor...");
  rimraf(www);
  fs.mkdirSync(www, { recursive: true });

  COPY_FILES.forEach(function (file) {
    const src = path.join(root, file);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(www, file));
      console.log("  +", file);
    }
  });

  COPY_DIRS.forEach(function (dir) {
    const src = path.join(root, dir);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(www, dir));
      console.log("  +", dir + "/");
    }
  });

  console.log("www/ pronto em", www);
}

main();
