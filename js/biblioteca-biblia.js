/* Leitor de traduções bíblicas — portal SETAD (API via servidor). */

var LIVROS_CANONICOS_BIBLIA = [
  { cod: "gn", nome: "Gênesis" },
  { cod: "ex", nome: "Êxodo" },
  { cod: "lv", nome: "Levítico" },
  { cod: "nm", nome: "Números" },
  { cod: "dt", nome: "Deuteronômio" },
  { cod: "js", nome: "Josué" },
  { cod: "jz", nome: "Juízes" },
  { cod: "rt", nome: "Rute" },
  { cod: "1sm", nome: "1 Samuel" },
  { cod: "2sm", nome: "2 Samuel" },
  { cod: "1rs", nome: "1 Reis" },
  { cod: "2rs", nome: "2 Reis" },
  { cod: "1cr", nome: "1 Crônicas" },
  { cod: "2cr", nome: "2 Crônicas" },
  { cod: "ed", nome: "Esdras" },
  { cod: "ne", nome: "Neemias" },
  { cod: "et", nome: "Ester" },
  { cod: "job", nome: "Jó" },
  { cod: "sl", nome: "Salmos" },
  { cod: "pv", nome: "Provérbios" },
  { cod: "ec", nome: "Eclesiastes" },
  { cod: "ct", nome: "Cânticos" },
  { cod: "is", nome: "Isaías" },
  { cod: "jr", nome: "Jeremias" },
  { cod: "lm", nome: "Lamentações" },
  { cod: "ez", nome: "Ezequiel" },
  { cod: "dn", nome: "Daniel" },
  { cod: "os", nome: "Oséias" },
  { cod: "jl", nome: "Joel" },
  { cod: "am", nome: "Amós" },
  { cod: "ob", nome: "Obadias" },
  { cod: "jn", nome: "Jonas" },
  { cod: "mq", nome: "Miquéias" },
  { cod: "na", nome: "Naum" },
  { cod: "hc", nome: "Habacuque" },
  { cod: "sf", nome: "Sofonias" },
  { cod: "ag", nome: "Ageu" },
  { cod: "zc", nome: "Zacarias" },
  { cod: "ml", nome: "Malaquias" },
  { cod: "mt", nome: "Mateus" },
  { cod: "mc", nome: "Marcos" },
  { cod: "lc", nome: "Lucas" },
  { cod: "jo", nome: "João" },
  { cod: "at", nome: "Atos" },
  { cod: "rm", nome: "Romanos" },
  { cod: "1co", nome: "1 Coríntios" },
  { cod: "2co", nome: "2 Coríntios" },
  { cod: "gl", nome: "Gálatas" },
  { cod: "ef", nome: "Efésios" },
  { cod: "fp", nome: "Filipenses" },
  { cod: "cl", nome: "Colossenses" },
  { cod: "1ts", nome: "1 Tessalonicenses" },
  { cod: "2ts", nome: "2 Tessalonicenses" },
  { cod: "1tm", nome: "1 Timóteo" },
  { cod: "2tm", nome: "2 Timóteo" },
  { cod: "tt", nome: "Tito" },
  { cod: "fm", nome: "Filemom" },
  { cod: "hb", nome: "Hebreus" },
  { cod: "tg", nome: "Tiago" },
  { cod: "1pe", nome: "1 Pedro" },
  { cod: "2pe", nome: "2 Pedro" },
  { cod: "1jo", nome: "1 João" },
  { cod: "2jo", nome: "2 João" },
  { cod: "3jo", nome: "3 João" },
  { cod: "jd", nome: "Judas" },
  { cod: "ap", nome: "Apocalipse" }
];

function livroEhTraducaoBiblica(livro) {
  if (!livro) return false;
  if (livro.tipoAcervo === "biblia_traducao" && livro.versaoApi) return true;
  if (livro.id && String(livro.id).indexOf("bib-trad-") === 0 && livro.versaoApi) return true;
  return false;
}

function livroParticipaLeitorBiblico(livro) {
  if (!livro) return false;
  if (livroEhTraducaoBiblica(livro)) return true;
  if (livro.tipoAcervo === "biblia_estudo") return true;
  if (livro.id && String(livro.id).indexOf("bib-estudo-") === 0) return true;
  if (livro.id && String(livro.id).indexOf("bib-") === 0 && livro.categoria === "Bíblia de Estudo") {
    return true;
  }
  return false;
}

function obterVersaoInicialLeitorBiblico(livro) {
  if (livro && livro.versaoApi) return livro.versaoApi;
  return "nvi";
}

function opcoesSelectTraducoesBiblicas(versaoSelecionada) {
  var lista =
    typeof BIBLIAS_TRADUCOES_EVANGELICAS_PT !== "undefined"
      ? BIBLIAS_TRADUCOES_EVANGELICAS_PT
      : [{ slug: "nvi", sigla: "NVI", titulo: "Nova Versão Internacional" }];

  return lista
    .map(function (t) {
      var sel = t.slug === versaoSelecionada ? " selected" : "";
      return (
        '<option value="' +
        escaparHtml(t.slug) +
        '"' +
        sel +
        ">" +
        escaparHtml(t.sigla + " — " + t.titulo) +
        "</option>"
      );
    })
    .join("");
}

function renderizarLeitorBibliaTraducao(livro) {
  var versao = obterVersaoInicialLeitorBiblico(livro);
  var ehEstudo = livro.tipoAcervo === "biblia_estudo";
  var optsLivros = LIVROS_CANONICOS_BIBLIA
    .map(function (b) {
      return (
        '<option value="' +
        escaparHtml(b.cod) +
        '">' +
        escaparHtml(b.nome) +
        "</option>"
      );
    })
    .join("");

  var aviso = ehEstudo
    ? "Leitura do texto bíblico para pesquisa. As notas da Bíblia de estudo não são reproduzidas aqui (direitos autorais). Escolha a tradução abaixo."
    : "Leitura para estudo no portal. Texto via API licenciada (sem download).";

  var seletorVersao = ehEstudo
    ? '<label>Tradução <select id="bibliaVersaoSel" class="biblia-leitor__select">' +
      opcoesSelectTraducoesBiblicas(versao) +
      "</select></label>"
    : "";

  return (
    '<div class="biblia-leitor" data-versao="' +
    escaparHtml(versao) +
    '" oncontextmenu="return false">' +
    '<p class="biblia-leitor__aviso">' +
    escaparHtml(aviso) +
    "</p>" +
    '<div class="biblia-leitor__controles">' +
    seletorVersao +
    '<label>Livro <select id="bibliaLivroSel" class="biblia-leitor__select">' +
    optsLivros +
    "</select></label>" +
    '<label>Capítulo <input type="number" id="bibliaCapSel" class="biblia-leitor__cap" min="1" max="150" value="1"></label>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="bibliaBtnCarregar">Carregar capítulo</button>' +
    "</div>" +
    '<div class="biblia-leitor__busca">' +
    '<label class="biblia-leitor__busca-label">Pesquisar na Bíblia ' +
    '<input type="search" id="bibliaBuscaTermo" class="biblia-leitor__busca-input" placeholder="Ex.: amor, fé, salvação" autocomplete="off">' +
    "</label>" +
    '<button type="button" class="btn btn--secondary btn--sm" id="bibliaBtnBuscar">Buscar</button>' +
    "</div>" +
    '<div id="bibliaLeitorStatus" class="biblia-leitor__status" role="status"></div>' +
    '<div id="bibliaLeitorTexto" class="biblia-leitor__texto"></div>' +
    '<div id="bibliaBuscaResultados" class="biblia-leitor__busca-resultados" hidden></div>' +
    "</div>"
  );
}

function fetchJsonApiSetad(apiPath) {
  if (window.SETADApi && typeof SETADApi.get === "function") {
    return SETADApi.get(apiPath);
  }

  var url = apiPath.indexOf("/api/") === 0 ? apiPath : "/api" + apiPath;
  var opts = {
    credentials: "include",
    headers: { Accept: "application/json" }
  };

  if (window.SETADNative && SETADNative.getToken()) {
    opts.headers.Authorization = "Bearer " + SETADNative.getToken();
  }

  return fetch(url, opts)
    .then(function (r) {
      return r.json().catch(function () {
        return { ok: false, erro: "Resposta inválida do servidor." };
      });
    })
    .then(function (data) {
      if (data && data.erro && data.ok !== true) {
        return data;
      }
      if (data && data.ok === undefined) {
        data.ok = true;
      }
      return data;
    });
}

function extrairVersiculosDoCapitulo(payload) {
  if (!payload) return [];

  if (Array.isArray(payload.verses)) return payload.verses;
  if (payload.chapter && Array.isArray(payload.chapter.verses)) return payload.chapter.verses;
  if (payload.data && Array.isArray(payload.data.verses)) return payload.data.verses;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;

  return [];
}

function inicializarLeitorBibliaNoModal(modal, livro) {
  if (!livroParticipaLeitorBiblico(livro)) return;

  var bloco = modal.querySelector(".biblia-leitor");
  if (!bloco) return;

  var statusEl = modal.querySelector("#bibliaLeitorStatus");
  var textoEl = modal.querySelector("#bibliaLeitorTexto");
  var buscaBox = modal.querySelector("#bibliaBuscaResultados");
  var btn = modal.querySelector("#bibliaBtnCarregar");
  var btnBusca = modal.querySelector("#bibliaBtnBuscar");
  var seletorVersao = modal.querySelector("#bibliaVersaoSel");

  function versaoAtual() {
    return bloco.getAttribute("data-versao") || obterVersaoInicialLeitorBiblico(livro);
  }

  function carregar() {
    var versao = versaoAtual();
    var livroCod = modal.querySelector("#bibliaLivroSel").value;
    var cap = Number(modal.querySelector("#bibliaCapSel").value) || 1;
    statusEl.textContent = "Carregando capítulo…";
    textoEl.innerHTML = "";
    if (buscaBox) {
      buscaBox.hidden = true;
      buscaBox.innerHTML = "";
    }

    var apiPath =
      "/biblia/" +
      encodeURIComponent(versao) +
      "/books/" +
      encodeURIComponent(livroCod) +
      "/chapters/" +
      encodeURIComponent(String(cap));

    fetchJsonApiSetad(apiPath)
      .then(function (data) {
        if (!data.ok) {
          statusEl.textContent =
            data.erro ||
            "Não foi possível carregar o capítulo. Confira SETAD_BIBLIAAPI_TOKEN no servidor.";
          return;
        }
        statusEl.textContent = "";
        renderizarCapituloBiblia(textoEl, data.capitulo || data, livroCod, cap);
      })
      .catch(function () {
        statusEl.textContent =
          "Falha na conexão. Verifique login e SETAD_BIBLIAAPI_TOKEN no servidor.";
      });
  }

  function buscar() {
    var termo = (modal.querySelector("#bibliaBuscaTermo").value || "").trim();
    if (termo.length < 2) {
      statusEl.textContent = "Digite pelo menos 2 caracteres para pesquisar.";
      return;
    }

    var versao = versaoAtual();
    statusEl.textContent = "Buscando…";
    textoEl.innerHTML = "";
    if (buscaBox) {
      buscaBox.hidden = true;
      buscaBox.innerHTML = "";
    }

    var apiPath =
      "/biblia/" + encodeURIComponent(versao) + "/search?q=" + encodeURIComponent(termo);

    fetchJsonApiSetad(apiPath)
      .then(function (data) {
        if (!data.ok) {
          statusEl.textContent = data.erro || "Busca indisponível nesta versão.";
          return;
        }
        statusEl.textContent = "";
        renderizarResultadosBuscaBiblia(buscaBox, textoEl, data.resultados || data.busca || data);
      })
      .catch(function () {
        statusEl.textContent = "Falha na busca. Tente novamente.";
      });
  }

  if (seletorVersao) {
    seletorVersao.addEventListener("change", function () {
      bloco.setAttribute("data-versao", seletorVersao.value);
      carregar();
    });
  }

  if (btn) btn.addEventListener("click", carregar);
  if (btnBusca) btnBusca.addEventListener("click", buscar);

  var inputBusca = modal.querySelector("#bibliaBuscaTermo");
  if (inputBusca) {
    inputBusca.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        buscar();
      }
    });
  }

  carregar();
}

function renderizarCapituloBiblia(container, payload, livroCod, cap) {
  var versos = extrairVersiculosDoCapitulo(payload);

  if (!versos.length && payload && payload.text) {
    container.innerHTML =
      '<p class="biblia-leitor__versiculo">' + escaparHtml(payload.text) + "</p>";
    return;
  }

  if (!versos.length) {
    container.innerHTML =
      '<p class="lista-vazia">Capítulo não disponível nesta versão na API. Tente outro livro ou tradução.</p>';
    return;
  }

  var livroNome =
    (LIVROS_CANONICOS_BIBLIA.find(function (b) {
      return b.cod === livroCod;
    }) || {}).nome || livroCod;

  var html =
    '<h3 class="biblia-leitor__cab">' +
    escaparHtml(livroNome) +
    " " +
    escaparHtml(String(cap)) +
    "</h3>";
  versos.forEach(function (v) {
    var n = v.verse || v.number || v.versiculo || v.verse_number || "";
    var t = v.text || v.verse_text || v.content || "";
    html +=
      '<p class="biblia-leitor__versiculo" data-versiculo="' +
      escaparHtml(String(n)) +
      '"><sup>' +
      escaparHtml(String(n)) +
      "</sup> " +
      escaparHtml(t) +
      "</p>";
  });
  container.innerHTML = html;
}

function renderizarResultadosBuscaBiblia(buscaBox, textoEl, payload) {
  var itens = extrairVersiculosDoCapitulo(payload);
  if (!itens.length && payload && Array.isArray(payload.hits)) itens = payload.hits;

  if (!itens.length) {
    textoEl.innerHTML = '<p class="lista-vazia">Nenhum versículo encontrado para este termo.</p>';
    return;
  }

  if (buscaBox) {
    buscaBox.hidden = false;
    buscaBox.innerHTML =
      '<h3 class="biblia-leitor__cab">Resultados da busca (' + itens.length + ")</h3>";
  }

  var html = "";
  itens.slice(0, 40).forEach(function (item) {
    var livro = item.book || item.livro || item.book_name || "";
    var cap = item.chapter || item.capitulo || "";
    var n = item.verse || item.versiculo || item.number || "";
    var t = item.text || item.verse_text || "";
    html +=
      '<p class="biblia-leitor__versiculo biblia-leitor__versiculo--busca">' +
      "<strong>" +
      escaparHtml([livro, cap, n].filter(Boolean).join(" ")) +
      "</strong> — " +
      escaparHtml(t) +
      "</p>";
  });

  if (buscaBox) {
    buscaBox.innerHTML += html;
  } else {
    textoEl.innerHTML = html;
  }
}
