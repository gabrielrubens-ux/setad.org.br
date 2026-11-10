/**
 * Valida URLs de WhatsApp institucional (sem "+" no parâmetro phone).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arquivo = path.join(__dirname, "..", "js", "setad-contato-institucional.js");
const codigo = readFileSync(arquivo, "utf8");

const contexto = { window: {}, globalThis: {} };
contexto.window = contexto.globalThis;
vm.runInNewContext(codigo, contexto);

const C = contexto.window.SETAD_CONTATO_INSTITUCIONAL;
assert.ok(C, "SETAD_CONTATO_INSTITUCIONAL deve existir");
assert.equal(C.whatsappNumero, "559180582801");
assert.equal(
  C.normalizarNumeroWhatsapp("+559180582801"),
  "559180582801"
);
assert.equal(C.normalizarNumeroWhatsapp("91980582801"), "559180582801");

const url = C.montarUrlWhatsapp(C.whatsappNumero);
assert.match(url, /^https:\/\/api\.whatsapp\.com\/send\?phone=559180582801/);
assert.doesNotMatch(url, /phone=%2B|phone=\+/);

const numeroErrado = C.montarUrlWhatsapp("5591980852801");
assert.match(numeroErrado, /phone=5591980852801/);

console.log("OK: URLs WhatsApp SETAD —", url);
