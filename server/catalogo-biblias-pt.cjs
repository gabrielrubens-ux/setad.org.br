/** Catálogo de Bíblias evangélicas em PT — espelho do front (server). */
const CAPA =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80";

const TRADUCOES = [
  { slug: "acf", titulo: "Almeida Corrigida Fiel", sigla: "ACF", editora: "Tradução evangélica clássica" },
  { slug: "arc", titulo: "Almeida Revista e Corrigida", sigla: "ARC", editora: "Edições evangélicas" },
  { slug: "ara", titulo: "Almeida Revista e Atualizada", sigla: "ARA", editora: "Sociedade Bíblica do Brasil" },
  { slug: "naa", titulo: "Nova Almeida Atualizada", sigla: "NAA", editora: "SBB" },
  { slug: "nvi", titulo: "Nova Versão Internacional", sigla: "NVI", editora: "Biblica" },
  { slug: "nvt", titulo: "Nova Versão Transformadora", sigla: "NVT", editora: "Editora Mundo Cristão" },
  { slug: "ntlh", titulo: "Nova Tradução na Linguagem de Hoje", sigla: "NTLH", editora: "SBB" },
  { slug: "tb", titulo: "Tradução Brasileira", sigla: "TB", editora: "SBB" },
  { slug: "kja", titulo: "King James Atualizada", sigla: "KJA", editora: "Tradução evangélica" },
  { slug: "as21", titulo: "Almeida Século XXI", sigla: "AS21", editora: "CPAD" }
];

const ESTUDO = [
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
  const base = {
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    capaUrl: CAPA
  };
  const lista = [];

  TRADUCOES.forEach(function (t) {
    lista.push({
      ...base,
      id: "bib-trad-" + t.slug,
      titulo: "Bíblia — " + t.titulo + " (" + t.sigla + ")",
      autor: t.editora,
      categoria: "Bíblia — Tradução evangélica",
      tipoAcervo: "biblia_traducao",
      versaoApi: t.slug,
      descricao:
        "Tradução evangélica em português para leitura no portal SETAD (API licenciada).",
      conteudoEstudo: "Leitor integrado — versão " + t.sigla + "."
    });
  });

  ESTUDO.forEach(function (e) {
    lista.push({
      ...base,
      id: "bib-" + e.id,
      titulo: e.titulo,
      autor: e.editora,
      categoria: "Bíblia de Estudo",
      tipoAcervo: "biblia_estudo",
      descricao:
        "Bíblia de estudo evangélica catalogada. Notas completas sujeitas a direitos autorais da editora.",
      conteudoEstudo:
        "Use as traduções evangélicas (ACF, NVI, ARA…) nesta biblioteca para leitura do texto bíblico."
    });
  });

  return lista;
}

module.exports = { montarLivrosCatalogoBibliasPt };
