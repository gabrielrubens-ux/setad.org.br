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

/** Contabilidade SETAD — painel do contador e dados financeiros (primeiro acesso por e-mail). */
const STAFF_CONTABILIDADE = [
  { email: "rafaeladmtc@gmail.com", nome: "Rafael Gadelha" },
  { email: "rsgestaofinanceirapa@gmail.com", nome: "RS Gestão Financeira PA" }
];

/** Secretaria SETAD — painel da secretaria (primeiro acesso por e-mail). */
const STAFF_SECRETARIA = [
  { email: "santiagolais324@gmail.com", nome: "Laís Santiago da Silva" },
  { email: "ledyannymaria.02@gmail.com", nome: "Ledyanny Maria" },
  { email: "kathlensantiago@gmail.com", nome: "Kathlen Santiago" },
  { email: "sfanny484@gmail.com", nome: "Steffany" }
];

function garantirStaffSecretaria() {
  STAFF_SECRETARIA.forEach(function (item) {
    const resultado = upsertAutorizado(item.email, item.nome, "secretaria", ["secretaria"]);
    if (resultado.ok) {
      console.log(
        "[SETAD] Secretaria sincronizada:",
        item.email,
        "→",
        resultado.perfis.join(", ")
      );
    } else {
      console.warn("[SETAD] Falha ao sincronizar secretaria de", item.email, resultado.erro);
    }
  });
}

function garantirStaffContabilidade() {
  STAFF_CONTABILIDADE.forEach(function (item) {
    const resultado = upsertAutorizado(item.email, item.nome, "contador", ["contador"]);
    if (resultado.ok) {
      console.log(
        "[SETAD] Contabilidade sincronizada:",
        item.email,
        "→",
        resultado.perfis.join(", ")
      );
    } else {
      console.warn("[SETAD] Falha ao sincronizar contabilidade de", item.email, resultado.erro);
    }
  });
}

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
  STAFF_CONTABILIDADE,
  STAFF_SECRETARIA,
  garantirStaffAcessoTodasAreas,
  garantirStaffContabilidade,
  garantirStaffSecretaria
};
