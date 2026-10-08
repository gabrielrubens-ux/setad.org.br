const { getMeta, setMeta, replaceJsonCollection } = require("./db");

const META_ACERVO_ZERADO = "biblioteca_acervo_zerado_2026_10";

/**
 * Remove todos os livros/Bíblias do banco (uma vez por ambiente após deploy).
 * Cadastros futuros são só via painel (direção/coordenação).
 */
function aplicarZeragemAcervoBiblioteca() {
  if (getMeta(META_ACERVO_ZERADO) === "true") {
    return;
  }
  replaceJsonCollection("livros", []);
  setMeta(META_ACERVO_ZERADO, "true");
  console.log("[SETAD] Biblioteca: acervo de livros e Bíblias zerado.");
}

module.exports = { aplicarZeragemAcervoBiblioteca };
