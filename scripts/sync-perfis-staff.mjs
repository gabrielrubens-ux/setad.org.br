/**
 * Atualiza staff_autorizados e perfis do usuário existente (mantém a senha).
 * Uso: node scripts/sync-perfis-staff.mjs gabrielrubens0@gmail.com
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { upsertAutorizado } = require("../server/staff-ativacao.js");

const email = (process.argv[2] || "gabrielrubens0@gmail.com").trim().toLowerCase();
const nome = process.argv[3] || "Gabriel Rubens";
const perfis = ["diretor", "contador", "secretaria"];

const resultado = upsertAutorizado(email, nome, "diretor", perfis);
console.log(resultado);

if (!resultado.ok) {
  process.exitCode = 1;
} else {
  console.log("\nPerfis:", resultado.perfis.join(", "));
  console.log("Senha da conta em users não foi alterada. Faça login de novo para atualizar o token.\n");
}
