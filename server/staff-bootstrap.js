/**
 * E-mails com acesso a todas as áreas institucionais (mesma senha, escolha do painel após login).
 * Idempotente: roda a cada subida do servidor e atualiza staff_autorizados + users existentes.
 */
const { upsertAutorizado } = require("./staff-ativacao");

const PERFIS_TODAS_AREAS_INSTITUCIONAIS = [
  "diretor",
  "contador",
  "secretaria",
  "coordenacao"
];

const STAFF_ACESSO_TODAS_AREAS = [
  { email: "enocmiranda26@gmail.com", nome: "Enoc Miranda da Silva" },
  { email: "gabrielrubens0@gmail.com", nome: "Gabriel Rubens" }
];

function garantirStaffAcessoTodasAreas() {
  STAFF_ACESSO_TODAS_AREAS.forEach(function (item) {
    const resultado = upsertAutorizado(
      item.email,
      item.nome,
      "diretor",
      PERFIS_TODAS_AREAS_INSTITUCIONAIS
    );
    if (resultado.ok) {
      console.log(
        "[SETAD] Perfis institucionais sincronizados:",
        item.email,
        "→",
        resultado.perfis.join(", ")
      );
    } else {
      console.warn("[SETAD] Falha ao sincronizar perfis de", item.email, resultado.erro);
    }
  });
}

module.exports = {
  PERFIS_TODAS_AREAS_INSTITUCIONAIS,
  STAFF_ACESSO_TODAS_AREAS,
  garantirStaffAcessoTodasAreas
};
