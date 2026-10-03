/**
 * Atualiza staff_autorizados e perfis do usuário existente (mantém a senha).
 * Uso: node scripts/sync-perfis-staff.mjs [email] [nome]
 * Ex.: node scripts/sync-perfis-staff.mjs enocmiranda26@gmail.com "Enoc Miranda da Silva"
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { upsertAutorizado } = require("../server/staff-ativacao.js");
const { PERFIS_TODAS_AREAS_INSTITUCIONAIS } = require("../server/staff-bootstrap.js");

const email = (process.argv[2] || "enocmiranda26@gmail.com").trim().toLowerCase();
const nome = process.argv[3] || "Enoc Miranda da Silva";
const perfis = PERFIS_TODAS_AREAS_INSTITUCIONAIS;

const resultado = upsertAutorizado(email, nome, "diretor", perfis);
console.log(resultado);

if (!resultado.ok) {
  process.exitCode = 1;
} else {
  console.log("\nPerfis:", resultado.perfis.join(", "));
  console.log("Senha da conta em users não foi alterada. Faça login de novo para atualizar o token.\n");
}
