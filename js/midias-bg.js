/* ============================================================
   midias-bg.js — Fundo interativo da seção Conecte-se
   Atualização automática: YouTube (RSS) + Instagram (perfil público)
   ============================================================ */

(function () {
  "use strict";

  var YOUTUBE_CHANNEL_ID = "UCylOo_tCj5sdb5hYJb0jrUw";
  var YOUTUBE_RSS =
    "https://www.youtube.com/feeds/videos.xml?channel_id=" + YOUTUBE_CHANNEL_ID;
  var INSTAGRAM_PERFIL = "https://www.instagram.com/setad.adbelem/";
  var INSTAGRAM_URL =
    "https://www.instagram.com/setad.adbelem?igsh=cmVxZTA1MTZldmRx";

  var CACHE_KEY = "setad_midias_bg_cache_v2";
  var INTERVALO_ATUALIZACAO_MS = 15 * 60 * 1000; /* 15 minutos */
  var CACHE_MAX_IDADE_MS = 24 * 60 * 60 * 1000; /* 24 horas */

  var FALLBACK_YOUTUBE = [
    { id: "PKYh91uy8CM", titulo: "Podcast — Simpósio Teológico" },
    { id: "vgRjtrv5kBE", titulo: "Recap Feira do Livro Cristão" },
    { id: "Ggdj2vUXyAw", titulo: "Highlights Feira do Livro Cristão" },
    { id: "TY3I16m9wjo", titulo: "SETAD no YouTube" },
    { id: "1dL_z1FpZ6o", titulo: "Feira do Livro Cristão" },
    { id: "Jahi3xXpoMc", titulo: "SETAD — Belém" },
    { id: "ubvs68vJkHw", titulo: "Vida no seminário" },
    { id: "g7yCffLCIN0", titulo: "Formação teológica" }
  ];

  var FALLBACK_INSTAGRAM = [
    {
      src: "assets/images/portal-aluno-biblioteca.jpg",
      titulo: "Biblioteca teológica SETAD"
    },
    {
      src: "assets/images/portal-professor-aula.jpg",
      titulo: "Aulas no seminário"
    },
    {
      src: "assets/images/marca-dagua-setad.png",
      titulo: "SETAD Belém"
    }
  ];

  var estado = {
    atualizando: false,
    assinaturaAtual: "",
    timer: null
  };

  function obterThumbnailYoutube(videoId) {
    return "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg";
  }

  function normalizarVideosYoutube(lista) {
    return lista.map(function (item) {
      return {
        tipo: "youtube",
        id: item.id || "",
        src: item.thumbnail || obterThumbnailYoutube(item.id),
        url: item.url || "https://www.youtube.com/watch?v=" + item.id,
        titulo: item.titulo || "SETAD no YouTube"
      };
    });
  }

  function normalizarInstagram(lista) {
    return lista.map(function (item) {
      return {
        tipo: "instagram",
        src: item.src,
        url: item.url || INSTAGRAM_URL,
        titulo: item.titulo || "SETAD no Instagram"
      };
    });
  }

  function lerCache() {
    try {
      var dados = localStorage.getItem(CACHE_KEY);
      if (!dados) return null;
      var cache = JSON.parse(dados);
      if (!cache || !cache.atualizadoEm) return null;
      if (Date.now() - cache.atualizadoEm > CACHE_MAX_IDADE_MS) return null;
      return cache;
    } catch (erro) {
      return null;
    }
  }

  function salvarCache(youtube, instagram, assinatura) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          atualizadoEm: Date.now(),
          assinatura: assinatura,
          youtube: youtube,
          instagram: instagram
        })
      );
    } catch (erro) {
      /* quota excedida — ignora */
    }
  }

  function criarAssinatura(youtube, instagram) {
    var parteYoutube = youtube.map(function (item) {
      return item.id || item.url || item.src;
    }).join("|");

    var parteInstagram = instagram.map(function (item) {
      return item.src;
    }).join("|");

    return parteYoutube + "::" + parteInstagram;
  }

  function buscarTextoRemoto(url) {
    return fetch(url, { cache: "no-store" })
      .then(function (resposta) {
        if (!resposta.ok) throw new Error("Falha na requisição");
        return resposta.text();
      });
  }

  function buscarComProxy(url) {
    var proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    return buscarTextoRemoto(proxy);
  }

  function buscarFeed(url) {
    return buscarTextoRemoto(url).catch(function () {
      return buscarComProxy(url);
    });
  }

  function parsearFeedYoutube(xmlTexto) {
    var parser = new DOMParser();
    var xml = parser.parseFromString(xmlTexto, "text/xml");
    var entries = xml.querySelectorAll("entry");

    if (!entries.length) return null;

    return Array.from(entries).slice(0, 12).map(function (entry) {
      var videoId = entry.querySelector("videoId");
      var link = entry.querySelector("link");
      var titulo = entry.querySelector("title");
      var thumb = entry.getElementsByTagNameNS(
        "http://search.yahoo.com/mrss/",
        "thumbnail"
      )[0];

      return {
        id: videoId ? videoId.textContent : "",
        url: link ? link.getAttribute("href") : "",
        thumbnail: thumb ? thumb.getAttribute("url") : "",
        titulo: titulo ? titulo.textContent : "SETAD"
      };
    }).filter(function (item) {
      return item.id;
    });
  }

  function extrairImagensInstagram(html) {
    var urls = [];
    var padroes = [
      /"display_url":"(https:[^"]+)"/g,
      /\\"display_url\\":\\"(https:[^\\"]+)\\"/g,
      /"thumbnail_src":"(https:[^"]+)"/g
    ];

    padroes.forEach(function (padrao) {
      var match;
      while ((match = padrao.exec(html)) !== null) {
        var url = match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
        if (urls.indexOf(url) === -1) urls.push(url);
      }
    });

    return urls.slice(0, 10).map(function (src, indice) {
      return {
        src: src,
        titulo: "Publicação SETAD #" + (indice + 1),
        url: INSTAGRAM_URL
      };
    });
  }

  function carregarVideosYoutube() {
    return buscarFeed(YOUTUBE_RSS)
      .then(function (texto) {
        var videos = parsearFeedYoutube(texto);
        if (!videos || !videos.length) throw new Error("Feed YouTube vazio");
        return normalizarVideosYoutube(videos);
      });
  }

  function carregarPostsInstagram() {
    return buscarComProxy(INSTAGRAM_PERFIL)
      .then(function (html) {
        var posts = extrairImagensInstagram(html);
        if (!posts.length) throw new Error("Instagram sem imagens");
        return normalizarInstagram(posts);
      });
  }

  function carregarMidiasRedes() {
    return Promise.all([
      carregarVideosYoutube().catch(function () { return null; }),
      carregarPostsInstagram().catch(function () { return null; })
    ]).then(function (resultados) {
      var cache = lerCache();
      var youtube = resultados[0];
      var instagram = resultados[1];

      if (!youtube) {
        youtube = cache && cache.youtube && cache.youtube.length
          ? cache.youtube
          : normalizarVideosYoutube(FALLBACK_YOUTUBE);
      }

      if (!instagram) {
        instagram = cache && cache.instagram && cache.instagram.length
          ? cache.instagram
          : normalizarInstagram(FALLBACK_INSTAGRAM);
      }

      var assinatura = criarAssinatura(youtube, instagram);
      var houveAtualizacaoRemota = !!(resultados[0] || resultados[1]);

      if (houveAtualizacaoRemota) {
        salvarCache(youtube, instagram, assinatura);
      }

      return {
        youtube: youtube,
        instagram: instagram,
        assinatura: assinatura,
        atualizadoEm: Date.now()
      };
    });
  }

  function intercalarMidias(youtube, instagram) {
    var resultado = [];
    var max = Math.max(youtube.length, instagram.length);

    for (var i = 0; i < max; i++) {
      if (youtube[i]) resultado.push(youtube[i]);
      if (instagram[i % instagram.length]) {
        resultado.push(instagram[i % instagram.length]);
      }
    }

    return resultado;
  }

  function criarItemMidia(item, indice) {
    var el = document.createElement("figure");
    el.className = "midias__bg-item midias__bg-item--" + item.tipo;
    el.style.setProperty("--midias-item-delay", (indice * 0.35) + "s");
    el.style.setProperty("--midias-item-duracao", (18 + (indice % 5) * 2) + "s");

    var img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    var badge = document.createElement("span");
    badge.className = "midias__bg-badge";
    badge.textContent = item.tipo === "youtube" ? "YouTube" : "Instagram";

    el.appendChild(img);
    el.appendChild(badge);
    return el;
  }

  function montarColuna(itens, indiceColuna) {
    var coluna = document.createElement("div");
    coluna.className = "midias__bg-coluna midias__bg-coluna--" + indiceColuna;
    coluna.setAttribute("data-parallax", String(8 + indiceColuna * 4));

    var trilha = document.createElement("div");
    trilha.className = "midias__bg-trilha";

    itens.forEach(function (item, indice) {
      trilha.appendChild(criarItemMidia(item, indice + indiceColuna * 3));
    });

    itens.forEach(function (item, indice) {
      trilha.appendChild(criarItemMidia(item, indice + indiceColuna * 3 + 0.5));
    });

    coluna.appendChild(trilha);
    return coluna;
  }

  function distribuirColunas(itens) {
    var colunas = [[], [], []];
    itens.forEach(function (item, indice) {
      colunas[indice % 3].push(item);
    });
    return colunas;
  }

  function renderizarGaleria(gallery, youtube, instagram) {
    var midias = intercalarMidias(youtube, instagram);
    var colunas = distribuirColunas(midias);

    gallery.innerHTML = "";
    colunas.forEach(function (itens, indice) {
      if (itens.length) {
        gallery.appendChild(montarColuna(itens, indice));
      }
    });
  }

  function configurarParallax(section) {
    if (section.dataset.parallaxBound === "1") return;
    section.dataset.parallaxBound = "1";

    var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) return;

    var bg = section.querySelector(".midias__bg");
    var layers = section.querySelectorAll("[data-parallax]");
    var alvoX = 50;
    var alvoY = 42;
    var atualX = 50;
    var atualY = 42;

    function animarGlow() {
      atualX += (alvoX - atualX) * 0.06;
      atualY += (alvoY - atualY) * 0.06;
      if (bg) {
        bg.style.setProperty("--midias-glow-x", atualX + "%");
        bg.style.setProperty("--midias-glow-y", atualY + "%");
      }
      requestAnimationFrame(animarGlow);
    }

    requestAnimationFrame(animarGlow);

    section.addEventListener("mousemove", function (evento) {
      var rect = section.getBoundingClientRect();
      var relX = (evento.clientX - rect.left) / rect.width;
      var relY = (evento.clientY - rect.top) / rect.height;
      var offsetX = relX - 0.5;
      var offsetY = relY - 0.5;

      alvoX = 24 + relX * 52;
      alvoY = 20 + relY * 56;

      layers.forEach(function (layer) {
        var profundidade = parseFloat(layer.getAttribute("data-parallax")) || 8;
        layer.style.transform =
          "translate3d(" + (offsetX * profundidade) + "px, " +
          (offsetY * profundidade * 0.6) + "px, 0)";
      });
    });

    section.addEventListener("mouseleave", function () {
      alvoX = 50;
      alvoY = 42;
      layers.forEach(function (layer) {
        layer.style.transform = "";
      });
    });
  }

  function aplicarMidias(dados, gallery, forcar) {
    if (!dados) return;

    if (!forcar && dados.assinatura === estado.assinaturaAtual) {
      return;
    }

    estado.assinaturaAtual = dados.assinatura;
    renderizarGaleria(gallery, dados.youtube, dados.instagram);
  }

  function atualizarFundoMidias(opcoes) {
    var section = document.getElementById("midias");
    var gallery = document.getElementById("midiasBgGallery");
    if (!section || !gallery || estado.atualizando) return Promise.resolve();

    estado.atualizando = true;

    return carregarMidiasRedes()
      .then(function (dados) {
        aplicarMidias(dados, gallery, opcoes && opcoes.forcar);
        configurarParallax(section);
        return dados;
      })
      .finally(function () {
        estado.atualizando = false;
      });
  }

  function cacheEstaDesatualizado() {
    var cache = lerCache();
    if (!cache) return true;
    return Date.now() - cache.atualizadoEm > INTERVALO_ATUALIZACAO_MS;
  }

  function iniciarAtualizacaoAutomatica() {
    if (estado.timer) clearInterval(estado.timer);

    estado.timer = setInterval(function () {
      if (document.hidden) return;
      atualizarFundoMidias();
    }, INTERVALO_ATUALIZACAO_MS);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && cacheEstaDesatualizado()) {
        atualizarFundoMidias();
      }
    });
  }

  function inicializarFundoMidias() {
    var section = document.getElementById("midias");
    var gallery = document.getElementById("midiasBgGallery");
    if (!section || !gallery) return;

    var cache = lerCache();

    if (cache && cache.youtube && cache.instagram) {
      aplicarMidias(
        {
          youtube: cache.youtube,
          instagram: cache.instagram,
          assinatura: cache.assinatura || criarAssinatura(cache.youtube, cache.instagram)
        },
        gallery,
        true
      );
      configurarParallax(section);
    }

    atualizarFundoMidias({ forcar: false }).then(function () {
      iniciarAtualizacaoAutomatica();
    });
  }

  window.SETADAtualizarMidiasBg = function () {
    return atualizarFundoMidias({ forcar: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarFundoMidias);
  } else {
    inicializarFundoMidias();
  }
})();
