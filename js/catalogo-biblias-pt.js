/* Catálogo SETAD — traduções evangélicas e Bíblias de estudo em português (metadados + leitura via API). */

var BIBLIAS_CAPA_PADRAO =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";

var BIBLIAS_TRADUCOES_EVANGELICAS_PT = [
  { slug: "acf", titulo: "Almeida Corrigida Fiel", sigla: "ACF", editora: "Tradução evangélica clássica" },
  { slug: "arc", titulo: "Almeida Revista e Corrigida", sigla: "ARC", editora: "Edições evangélicas" },
  { slug: "ara", titulo: "Almeida Revista e Atualizada", sigla: "ARA", editora: "Sociedade Bíblica do Brasil" },
  { slug: "naa", titulo: "Nova Almeida Atualizada", sigla: "NAA", editora: "SBB" },
  { slug: "nvi", titulo: "Nova Versão Internacional", sigla: "NVI", editora: "Biblica / editoras parceiras" },
  { slug: "nvt", titulo: "Nova Versão Transformadora", sigla: "NVT", editora: "Editora Mundo Cristão" },
  { slug: "ntlh", titulo: "Nova Tradução na Linguagem de Hoje", sigla: "NTLH", editora: "SBB" },
  { slug: "tb", titulo: "Tradução Brasileira", sigla: "TB", editora: "SBB" },
  { slug: "kja", titulo: "King James Atualizada", sigla: "KJA", editora: "Tradução evangélica" },
  { slug: "as21", titulo: "Almeida Século XXI", sigla: "AS21", editora: "CPAD" }
];

var BIBLIAS_ESTUDO_EVANGELICAS_PT = [
  { id: "estudo-nvi", titulo: "Bíblia de Estudo NVI", editora: "Editora Vida" },
  { id: "estudo-arco-iris", titulo: "Bíblia de Estudo Arco-Íris", editora: "CPAD" },
  { id: "estudo-macarthur", titulo: "Bíblia de Estudo MacArthur", editora: "Editora Vida" },
  { id: "estudo-reforma", titulo: "Bíblia de Estudo da Reforma", editora: "Fiel" },
  { id: "estudo-expositiva", titulo: "Bíblia de Estudo Expositiva", editora: "Vida" },
  { id: "estudo-cpad", titulo: "Bíblia de Estudo CPAD", editora: "CPAD" },
  { id: "estudo-vida", titulo: "Bíblia de Estudo Vida", editora: "Editora Vida" },
  { id: "estudo-fiel", titulo: "Bíblia de Estudo Almeida Fiel", editora: "Fiel" },
  { id: "estudo-pentecostal", titulo: "Bíblia de Estudo Pentecostal", editora: "CPAD" },
  { id: "estudo-coluna", titulo: "Bíblia de Estudo Coluna", editora: "CPAD" },
  { id: "estudo-obreiro", titulo: "Bíblia de Estudo do Obreiro", editora: "CPAD" },
  { id: "estudo-pregador", titulo: "Bíblia do Pregador", editora: "CPAD" },
  { id: "estudo-aplicacao", titulo: "Bíblia de Aplicação Pessoal", editora: "Vida" },
  { id: "estudo-scofield", titulo: "Bíblia de Estudo Scofield", editora: "Edições evangélicas" },
  { id: "estudo-kja", titulo: "Bíblia de Estudo King James Atualizada", editora: "Abba Press" },
  { id: "estudo-mulher", titulo: "Bíblia de Estudo da Mulher", editora: "Vida" }
];

function montarLivrosCatalogoBibliasPt() {
  var lista = [];
  var base = {
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    capaUrl: BIBLIAS_CAPA_PADRAO
  };

  BIBLIAS_TRADUCOES_EVANGELICAS_PT.forEach(function (t) {
    lista.push(
      Object.assign({}, base, {
        id: "bib-trad-" + t.slug,
        titulo: "Bíblia — " + t.titulo + " (" + t.sigla + ")",
        autor: t.editora,
        categoria: "Bíblia — Tradução evangélica",
        tipoAcervo: "biblia_traducao",
        versaoApi: t.slug,
        descricao:
          "Tradução evangélica em português para leitura e estudo no portal SETAD. " +
          "Texto obtido por API licenciada (configure SETAD_BIBLIAAPI_TOKEN no servidor).",
        conteudoEstudo:
          "Consulte livros e capítulos pelo leitor integrado. Versão: " + t.sigla + "."
      })
    );
  });

  BIBLIAS_ESTUDO_EVANGELICAS_PT.forEach(function (e) {
    lista.push(
      Object.assign({}, base, {
        id: "bib-" + e.id,
        titulo: e.titulo,
        autor: e.editora,
        categoria: "Bíblia de Estudo",
        tipoAcervo: "biblia_estudo",
        descricao:
          "Obra de estudo evangélica em português — notas, referências e comentários. " +
          "O texto bíblico completo com notas de estudo é protegido por direitos autorais; " +
          "use o leitor de traduções paralelas e o material presencial da biblioteca SETAD.",
        conteudoEstudo:
          "Recurso catalogado para orientação acadêmica. Para leitura do texto bíblico, " +
          "abra uma tradução evangélica (ACF, NVI, ARA, etc.) na mesma biblioteca."
      })
    );
  });

  return lista;
}

function mesclarCatalogoBibliasNoAcervo(livros) {
  var catalogo = montarLivrosCatalogoBibliasPt();
  var mapa = {};
  livros.forEach(function (l) {
    mapa[l.id] = l;
  });
  var alterou = false;
  catalogo.forEach(function (item) {
    if (!mapa[item.id]) {
      livros.push(item);
      alterou = true;
    } else {
      var existente = mapa[item.id];
      ["tipoAcervo", "versaoApi", "categoria", "descricao", "conteudoEstudo", "titulo", "autor"].forEach(
        function (campo) {
          if (item[campo] != null && item[campo] !== "" && existente[campo] !== item[campo]) {
            existente[campo] = item[campo];
            alterou = true;
          }
        }
      );
    }
  });
  return { livros: livros, alterou: alterou };
}
