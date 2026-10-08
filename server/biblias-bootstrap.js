const { listJson, replaceJsonCollection } = require("./db");
const { montarLivrosCatalogoBibliasPt } = require("./catalogo-biblias-pt.cjs");

function garantirCatalogoBibliasEvangelicasPt() {
  const catalogo = montarLivrosCatalogoBibliasPt();
  const livros = listJson("livros");
  const ids = new Set(livros.map(function (l) { return l.id; }));
  let inseridos = 0;

  var atualizados = 0;

  catalogo.forEach(function (item) {
    if (!ids.has(item.id)) {
      livros.push(item);
      ids.add(item.id);
      inseridos++;
      return;
    }

    var existente = livros.find(function (l) {
      return l.id === item.id;
    });
    if (!existente) return;

    ["tipoAcervo", "versaoApi", "categoria", "descricao", "conteudoEstudo"].forEach(function (campo) {
      if (item[campo] != null && item[campo] !== "" && existente[campo] !== item[campo]) {
        existente[campo] = item[campo];
        atualizados++;
      }
    });
  });

  if (inseridos > 0 || atualizados > 0) {
    replaceJsonCollection("livros", livros);
    if (inseridos > 0) {
      console.log("[SETAD] Biblioteca: " + inseridos + " Bíblia(s) evangélica(s) em PT instalada(s).");
    }
    if (atualizados > 0) {
      console.log("[SETAD] Biblioteca: metadados de Bíblia(s) atualizados (" + atualizados + ").");
    }
  }
}

module.exports = { garantirCatalogoBibliasEvangelicasPt };
