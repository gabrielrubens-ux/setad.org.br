/* ============================================================
   polos.js — Lista de polos do seminário SETAD
   Adicione os endereços no array POLOS_SETAD abaixo.
   ============================================================ */

/**
 * Cadastro dos polos — inclua um objeto por unidade.
 *
 * Exemplo:
 * {
 *   id: "belem-sede",
 *   nome: "Polo Belém — Sede",
 *   endereco: "Av. Exemplo, 123",
 *   bairro: "Marco",
 *   cidade: "Belém",
 *   estado: "PA",
 *   cep: "66000-000",
 *   telefone: "(91) 3000-0000",
 *   mapsUrl: "https://maps.google.com/?q=...",
 *   lat: -1.4558,  // opcional — se omitido, extrai do mapsUrl
 *   lng: -48.4902
 * }
 */
const POLOS_SETAD = [
  {
    id: "curio-utinga-i",
    nome: "Polo Curió Utinga I",
    local: "AD Templo do Utinga",
    endereco: "R. do Utinga, 389",
    bairro: "Utinga",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-curio-utinga-i.jpg",
    mapsUrl: "https://www.google.com/maps/place/Assembleia+de+Deus+Templo+do+Utinga./@-1.4248325,-48.4479763,20.69z/data=!4m12!1m5!3m4!2zMcKwMjUnMjkuNSJTIDQ4wrAyNic1Mi4xIlc!8m2!3d-1.4248727!4d-48.4478111!3m5!1s0x92a48b85eb84ea1f:0x8056d7cb38c63222!8m2!3d-1.4248331!4d-48.4478805!16s%2Fg%2F11g6nzjx0p?hl=pt-BR&entry=ttu"
  },
  {
    id: "guama-ii",
    nome: "Polo Guamá II",
    local: "AD Monte Horebe",
    endereco: "Tv. Francisco Monteiro, 130",
    bairro: "Guamá",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-guama-ii.png",
    mapsUrl: "https://www.google.com/maps/place/Assembleia+de+Deus+(Monte+Horebe)/@-1.4575093,-48.4639897,17z/data=!4m10!1m2!2m1!1sAssembleia+de+Deus+Monte+Horebe!3m6!1s0x92a48c3571308199:0xc3f42e4bc0adad30!8m2!3d-1.4575087!4d-48.4595286!15sCh9Bc3NlbWJsZWlhIGRlIERldXMgTW9udGUgSG9yZWJlkgEGY2h1cmNo4AEA!16s%2Fg%2F11f2smtt8g?hl=pt-BR&entry=ttu"
  },
  {
    id: "guama-iii",
    nome: "Polo Guamá III",
    local: "Assembleia de Deus — Ministério Belém",
    endereco: "R. Epitácio Pessoa, 326",
    bairro: "Guamá",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-guama-iii.jpg",
    mapsUrl: "https://www.google.com/maps/place/R.+Epit%C3%A1cio+Pessoa,+326+-+Guam%C3%A1,+Bel%C3%A9m+-+PA,+66075-210/@-1.4695966,-48.4602277,17z/data=!3m1!4b1!4m6!3m5!1s0x92a48dc739e0cf43:0x920bf707cc792bd2!8m2!3d-1.4695966!4d-48.4602277!16s%2Fg%2F11wht68j20?entry=ttu"
  },
  {
    id: "maracangalha-ii",
    nome: "Polo Maracangalha II",
    local: "Assembleia de Deus Templo Ágape",
    endereco: "Tv. Rio Jari, 18",
    bairro: "Maracangalha",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-maracangalha-ii.png",
    mapsUrl: "https://www.google.com/maps/place/AD+TEMPLO+%C3%81GAPE+-+Igreja+M%C3%A3e+Bel%C3%A9m%2FPA/@-1.4043734,-48.4789168,78a,46.7y,244.23h,45t/data=!3m1!1e3!4m6!3m5!1s0x92a4897ddfeff6df:0xa2e208d9f0c8f900!8m2!3d-1.4047732!4d-48.4796965!16s%2Fg%2F11ckfqrpmt?entry=ttu"
  },
  {
    id: "projeto-resgate",
    nome: "Polo Projeto Resgate Espiritual",
    local: "Projeto Resgate",
    endereco: "Passagem Ariri, 92",
    bairro: "Maracangalha",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-projeto-resgate.png",
    mapsUrl: "https://www.google.com/maps/place/Projeto+Resgate/@-1.4041725,-48.4765138,20z/data=!4m10!1m2!2m1!1sProjeto+Resgate+Espiritua!3m6!1s0x92a48bb1f091b009:0xb23ef511cb96a70f!8m2!3d-1.4041354!4d-48.4759764!15sChpQcm9qZXRvIFJlc2dhdGUgRXNwaXJpdHVhbJIBDXNwb3J0c19zY2hvb2zgAQA!16s%2Fg%2F11fr1016dy?entry=ttu"
  },
  {
    id: "mangueirao-i",
    nome: "Polo Mangueirão I",
    local: "Assembleia de Deus Templo Carmelândia",
    endereco: "Rua Dezessete de Agosto, 28",
    bairro: "Mangueirão",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-carmelandia.jpg",
    mapsUrl: "https://www.google.com/maps/place/ASSEMBLEIA+DE+DEUS+BELEM+PARA+BRASIL/@-1.3804209,-48.4388017,20.56z/data=!4m14!1m7!3m6!1s0x92a48bdf8e3dc3b3:0xaf4e7282b2b0f4ba!2sAssembleia+de+Deus+Templo+Carmel%C3%A2ndia!8m2!3d-1.3801642!4d-48.4382932!16s%2Fg%2F11q9j113l7!3m5!1s0x92a48a89d3c722bb:0x48febe5ac8ef2410!8m2!3d-1.380179!4d-48.4383333!16s%2Fg%2F11npy9z8c0?entry=ttu"
  },
  {
    id: "castanheira-ii",
    nome: "Polo Castanheira II",
    local: "AD Sta. Odília",
    endereco: "Rua Santa Odília, 112A",
    bairro: "Castanheira",
    cidade: "Belém",
    estado: "PA",
    cep: "66645-500",
    imagem: "../assets/images/polo-castanheira-ii.jpg",
    mapsUrl: "https://www.google.com/maps/place/R.+Santa+Od%C3%ADlia,+112+-+Castanheira,+Bel%C3%A9m+-+PA,+66645-500/@-1.3997898,-48.4344944,17z/data=!3m1!4b1!4m10!1m2!2m1!1sII+Rua+Santa+Odilia+112A!3m6!1s0x92a48afd8884d441:0xa6a52fe047d3bdc7!8m2!3d-1.3997952!4d-48.4319195!15sChhJSSBSdWEgU2FudGEgT2RpbGlhIDExMkGSARFjb21wb3VuZF9idWlsZGluZ-ABAA!16s%2Fg%2F11f2grr9fz?authuser=0&entry=ttu"
  },
  {
    id: "marambaia-iii",
    nome: "Polo Marambaia III",
    local: "AD Tavares Bastos",
    endereco: "Av. Rodolfo Chermont, 1470",
    bairro: "Marambaia",
    cidade: "Belém",
    estado: "PA",
    cep: "66620-000",
    imagem: "../assets/images/polo-marambaia-iii.jpg",
    mapsUrl: "https://www.google.com/maps/place/Assembleia+de+Deus+Tavares+Bastos/@-1.3964812,-48.4537898,20.69z/data=!4m15!1m8!3m7!1s0x92a48a4eacfd80dd:0xfe65d580d06b4851!2sAv.+Rodolfo+Chermont,+1470+-+Marambaia,+Bel%C3%A9m+-+PA,+66620-000!3b1!8m2!3d-1.3964106!4d-48.4536146!16s%2Fg%2F11xsqsv0pp!3m5!1s0x92a48a4ed54c39c7:0xf72f316b9a095db2!8m2!3d-1.3964106!4d-48.4536146!16s%2Fg%2F1q2wkxmf1?authuser=0&entry=ttu"
  },
  {
    id: "parque-verde",
    nome: "Polo Parque Verde",
    local: "Santuário da Benção",
    endereco: "Rod. Augusto Montenegro, 8232",
    bairro: "Parque Verde",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-parque-verde.png",
    mapsUrl: "https://www.google.com/maps/place/Santu%C3%A1rio+da+Ben%C3%A7%C3%A3o/@-1.3559058,-48.4538602,17z/data=!3m1!4b1!4m6!3m5!1s0x92a461b8b3622e0b:0x3962aacd29cc56dd!8m2!3d-1.3559058!4d-48.4538602!16s%2Fg%2F11bwn6k1ym!18m1!1e1?entry=ttu"
  }
];

function renderizarPolos(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (POLOS_SETAD.length === 0) {
    container.innerHTML =
      '<p class="polos-vazio">Os endereços dos polos serão publicados em breve. ' +
      "Aguarde a atualização com a lista completa de unidades do seminário.</p>";
    return;
  }

  container.innerHTML = POLOS_SETAD.map(function (polo) {
    const enderecoCompleto = [
      polo.endereco,
      polo.bairro,
      polo.cidade + "/" + polo.estado
    ].filter(Boolean).join(" - ");

    const mapsLink = polo.mapsUrl
      ? '<a href="' + escaparHtml(polo.mapsUrl) + '" class="polo-card__maps" target="_blank" rel="noopener noreferrer">Ver no mapa</a>'
      : "";

    const telefone = polo.telefone
      ? '<p class="polo-card__telefone"><strong>Telefone:</strong> ' + escaparHtml(polo.telefone) + "</p>"
      : "";

    const local = polo.local
      ? '<p class="polo-card__local">' + escaparHtml(polo.local) + "</p>"
      : "";

    const conteudo =
      '<h2 class="polo-card__nome">' + escaparHtml(polo.nome) + "</h2>" +
      local +
      '<p class="polo-card__endereco">' + escaparHtml(enderecoCompleto) + "</p>" +
      telefone +
      mapsLink;

    if (polo.imagem) {
      return (
        '<article id="polo-' + escaparHtml(polo.id) + '" class="polo-card polo-card--com-foto polo-card--' + escaparHtml(polo.id) + '" style="background-image: url(\'' +
        escaparHtml(polo.imagem) +
        "')\">" +
          '<div class="polo-card__overlay" aria-hidden="true"></div>' +
          '<div class="polo-card__conteudo">' + conteudo + "</div>" +
        "</article>"
      );
    }

    return (
      '<article id="polo-' + escaparHtml(polo.id) + '" class="polo-card polo-card--' + escaparHtml(polo.id) + '">' + conteudo + "</article>"
    );
  }).join("");
}

document.addEventListener("DOMContentLoaded", function () {
  renderizarPolos("polosContainer");
});
