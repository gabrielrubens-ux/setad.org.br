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
    id: "setade-sede",
    nome: "Polo SETADE — Sede do Seminário",
    principal: true,
    local: "SETAD — Seminário Teológico da Assembleia de Deus em Belém",
    endereco: "Sede do SETAD",
    bairro: "Marco",
    cidade: "Belém",
    estado: "PA",
    lat: -1.4374973,
    lng: -48.4656471,
    mapsUrl:
      "https://www.google.com/maps/place/SETAD+-+Semin%C3%A1rio+Teol%C3%B3gico+da+Assembleia+de+Deus+em+Bel%C3%A9m/@-1.4374973,-48.4656471,17z/data=!3m1!4b1!4m6!3m5!1s0x92a48c11c506c41f:0xe90ebc274a2cebe6!8m2!3d-1.4374973!4d-48.4656471!16s%2Fg%2F11b72mzw9w"
  },
  {
    id: "nazare-templo-central",
    nome: "Polo Nazaré — Templo Central",
    local: "Assembleia de Deus em Belém — Templo Central",
    endereco: "Tv. 14 de Março c/ Av. José Malcher",
    bairro: "Nazaré",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-nazare-templo-central.jpg",
    mapsUrl: "https://www.google.com/maps/place/Assembleia+de+Deus+em+Bel%C3%A9m/@-1.4489785,-48.4801054,1053m/data=!3m2!1e3!4b1!4m6!3m5!1s0x92a48c732b51b705:0xdb20bccb8e086988!8m2!3d-1.4489785!4d-48.4801054!16s%2Fg%2F1tslkt13!18m1!1e1?entry=ttu"
  },
  {
    id: "curio-utinga-i",
    nome: "Polo Curió Utinga I",
    local: "Assembleia de Deus — Templo do Utinga",
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
    local: "Assembleia de Deus Monte Horebe",
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
    id: "maracangalha-i",
    nome: "Polo Maracangalha I",
    local: "Assembleia de Deus Templo Ágape",
    endereco: "Conjunto Paraíso dos Pássaros, Tv. Rio Jari",
    bairro: "Maracangalha",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-maracangalha-i.jpg",
    mapsUrl: "https://www.google.com/maps/place/AD+TEMPLO+%C3%81GAPE+-+Igreja+M%C3%A3e+Bel%C3%A9m%2FPA/@-1.4046286,-48.4796254,3a,75y,213.86h,103.03t/data=!3m7!1e1!3m5!1sjkzpvPBG4aJ2nCKHTOpZxw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-13.034124020662006%26panoid%3DjkzpvPBG4aJ2nCKHTOpZxw%26yaw%3D213.8591726343098!7i16384!8i8192!4m12!1m5!3m4!2zMcKwMjQnMTcuMCJTIDQ4wrAyOCc0Ni44Ilc!8m2!3d-1.404707!4d-48.479664!3m5!1s0x92a4897ddfeff6df:0xa2e208d9f0c8f900!8m2!3d-1.4047732!4d-48.4796965!16s%2Fg%2F11ckfqrpmt?entry=ttu"
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
    imagem: "../assets/images/polo-projeto-resgate-espiritual.png",
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
    imagem: "../assets/images/polo-mangueirao-i.jpg",
    mapsUrl: "https://www.google.com/maps/place/ASSEMBLEIA+DE+DEUS+BELEM+PARA+BRASIL/@-1.3804209,-48.4388017,20.56z/data=!4m14!1m7!3m6!1s0x92a48bdf8e3dc3b3:0xaf4e7282b2b0f4ba!2sAssembleia+de+Deus+Templo+Carmel%C3%A2ndia!8m2!3d-1.3801642!4d-48.4382932!16s%2Fg%2F11q9j113l7!3m5!1s0x92a48a89d3c722bb:0x48febe5ac8ef2410!8m2!3d-1.380179!4d-48.4383333!16s%2Fg%2F11npy9z8c0?entry=ttu"
  },
  {
    id: "castanheira-ii",
    nome: "Polo Castanheira II",
    local: "Assembleia de Deus Santa Odília",
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
    local: "Assembleia de Deus Tavares Bastos",
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
  },
  {
    id: "condor-i",
    nome: "Polo Condor I",
    local: "Assembleia de Deus — Condor",
    endereco: "Av. Alcindo Cacela, 4200",
    bairro: "Condor",
    cidade: "Belém",
    estado: "PA",
    cep: "66065-217",
    imagem: "../assets/images/polo-condor-i.png",
    mapsUrl: "https://www.google.com/maps/place/Casa+De+Ora%C3%A7%C3%A3o+Assembleia+de+Deus+-+Condor/@-1.4739113,-48.4759147,3a,60y,273.87h,99.82t/data=!3m1!1e3!4m16!1m9!3m8!1s0x92a48ddfd4b06bcb:0xdf8d333556ce11b2!2sAv.+Alcindo+Cacela,+4200+-+Condor,+Bel%C3%A9m+-+PA,+66065-217!3b1!8m2!3d-1.4739022!4d-48.4762718!10e5!16s%2Fg%2F11c1n1v4v4!3m5!1s0x92a48dde2bdbdb73:0xac07bf96e5bb918a!8m2!3d-1.4739022!4d-48.4762718!16s%2Fg%2F11cn0wjc9r?entry=ttu"
  },
  {
    id: "sacramenta-i",
    nome: "Polo Sacramenta I",
    local: "Assembleia de Deus Angústura",
    endereco: "Travessa Angústura",
    bairro: "Sacramenta",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-sacramenta-i.jpg",
    mapsUrl: "https://www.google.com/maps/place/ASSEMBLEIA+DE+DEUS+AD+ANGUSTURA+%7C%7C/@-1.4208548,-48.4775932,50m/data=!3m1!1e3!4m12!1m5!3m4!2zMcKwMjUnMTQuOSJTIDQ4wrAyOCczOC41Ilc!8m2!3d-1.4208157!4d-48.4773598!3m5!1s0x92a48b005e52fde3:0x37fea668330e1dc9!8m2!3d-1.4207274!4d-48.477369!16s%2Fg%2F11w_mmmklt?hl=pt-BR&entry=ttu"
  },
  {
    id: "sacramenta-ii",
    nome: "Polo Sacramenta II",
    local: "Assembleia de Deus Templo Sacramenta",
    endereco: "Av. Senador Lemos, 4234",
    bairro: "Sacramenta",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-sacramenta-ii.jpg",
    mapsUrl: "https://www.google.com/maps/place/Igreja+Assembl%C3%A9ia+De+Deus+Templo+Sacramenta/@-1.4144321,-48.4720673,17z/data=!4m6!3m5!1s0x92a48bdd38cd198d:0xe2e3cbfa25b711ac!8m2!3d-1.4144375!4d-48.4694924!16s%2Fg%2F1tfjrsk2?entry=ttu"
  },
  {
    id: "bengui",
    nome: "Polo Bengui",
    local: "Assembleia de Deus Templo São Clemente",
    endereco: "Rua São Bento, 7 c/ Tv. São Roque",
    bairro: "Bengui",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-bengui.jpg",
    mapsUrl: "https://www.google.com/maps/place/Assembl%C3%A9ia+de+Deus+-+Templo+S%C3%A3o+Clemente/@-1.3784856,-48.4617597,17z/data=!3m1!4b1!4m6!3m5!1s0x92a48bf8a7988e1b:0x51b40bc124e4208!8m2!3d-1.3784856!4d-48.4617597!16s%2Fg%2F11gk8p6szy?entry=ttu"
  },
  {
    id: "marco-ii",
    nome: "Polo Marco II",
    local: "Igreja Evangélica Plenitude Palavra",
    endereco: "Tv. Mauriti, 3261",
    bairro: "Marco",
    cidade: "Belém",
    estado: "PA",
    cep: "66093-681",
    imagem: "../assets/images/polo-marco-ii.jpg",
    mapsUrl: "https://www.google.com/maps/place/IGREJA+EVANG%C3%89LICA+PLENITUDE+PALAVRA/@-1.4379951,-48.4572739,20.25z/data=!4m15!1m8!3m7!1s0x92a48c6d6d399e07:0x3d4088ae0575b7b2!2sTv.+Mauriti,+3261+-+Marco,+Bel%C3%A9m+-+PA,+66093-681!3b1!8m2!3d-1.4379292!4d-48.4569705!16s%2Fg%2F11gdc121ds!3m5!1s0x92a48c6d12db8297:0xdfc2be362e80bfe3!8m2!3d-1.4380038!4d-48.4569917!16s%2Fg%2F11nq8svy37!18m1!1e1?entry=ttu"
  },
  {
    id: "marco-iii",
    nome: "Polo Marco III",
    local: "Capela Evangélica da Aeronáutica",
    endereco: "Tv. Perebebui, 2003",
    bairro: "Marco",
    cidade: "Belém",
    estado: "PA",
    imagem: "../assets/images/polo-marco-iii.jpg",
    mapsUrl: "https://www.google.com/maps/place/Capela+Evang%C3%A9lica+da+Aeron%C3%A1utica/@-1.4255149,-48.4597631,3a,75y,90t/data=!3m7!1e2!3m5!1sCIHM0ogKEICAgICcp57m1QE!2e10!3e12!7i4608!8i2184!4m7!3m6!1s0x92a48bf343fa9511:0x3364e158b7cf3184!8m2!3d-1.4253836!4d-48.459716!10e5!16s%2Fg%2F11cp782y8b?entry=ttu"
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

function atualizarContagemPolos() {
  var el = document.getElementById("polosContagem");
  if (!el || !Array.isArray(POLOS_SETAD)) return;
  var total = POLOS_SETAD.length;
  el.textContent =
    total === 0
      ? ""
      : total === 1
        ? "1 polo em Belém"
        : total + " polos em Belém";
}

document.addEventListener("DOMContentLoaded", function () {
  renderizarPolos("polosContainer");
  atualizarContagemPolos();
});
