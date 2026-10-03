/**
 * Verifica SPF / DKIM / DMARC / MX públicos de setad.org.br
 * Uso: npm run verify:dns-email
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { verificarDnsEmailDominio } = require("../server/services/email-dns-check.js");

const dominio = process.argv[2] || "setad.org.br";

const resultado = await verificarDnsEmailDominio(dominio);

console.log("\n=== DNS e-mail SETAD:", dominio, "===\n");
console.log("SPF:   ", resultado.spf ? "OK" : "FALTANDO");
console.log("DKIM:  ", resultado.dkim ? "OK" : "FALTANDO");
console.log("DMARC: ", resultado.dmarc ? "OK" : "FALTANDO");
console.log("MX:    ", resultado.mx ? "OK" : "FALTANDO");
console.log("\nEntrega Gmail (autenticação):", resultado.okEntrega ? "PRONTA" : "INCOMPLETA");

if (resultado.erros.length) {
  console.log("\nDetalhes:", resultado.erros.join("; "));
}

if (!resultado.okEntrega) {
  console.log("\n→ Siga: docs/REGISTRO-BR-COLAR-AGORA.md\n");
  process.exitCode = 1;
} else {
  console.log("\n→ DNS de e-mail OK. Teste o código no primeiro acesso.\n");
}
