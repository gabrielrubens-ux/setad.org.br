/* ============================================================
   terminologia-setad.js — Linguagem institucional (sem fins lucrativos)
   Nunca usar "lucro". Preferir superávit e déficit.
   ============================================================ */

/**
 * Classifica saldo financeiro para exibição institucional.
 * @param {number} valor — receitas menos despesas
 */
function classificarSaldoInstitucional(valor) {
  const numero = Number(valor) || 0;

  if (numero > 0) {
    return {
      tipo: "superavit",
      label: "Superávit",
      classe: "contab-dre__saldo--superavit",
      valorExibicao: numero
    };
  }

  if (numero < 0) {
    return {
      tipo: "deficit",
      label: "Déficit",
      classe: "contab-dre__saldo--deficit",
      valorExibicao: Math.abs(numero)
    };
  }

  return {
    tipo: "equilibrio",
    label: "Equilíbrio financeiro",
    classe: "contab-dre__saldo--equilibrio",
    valorExibicao: 0
  };
}

function obterLabelSaldoInstitucional(valor) {
  return classificarSaldoInstitucional(valor).label;
}

function formatarSaldoInstitucional(valor) {
  const info = classificarSaldoInstitucional(valor);
  if (typeof formatarMoeda === "function") {
    return info.label + ": " + formatarMoeda(info.valorExibicao);
  }
  return info.label + ": R$ " + info.valorExibicao.toFixed(2);
}

/**
 * Remove termos inadequados para organização sem fins lucrativos.
 * Uso em textos dinâmicos antes de exibir ao usuário.
 */
function sanitizarTextoInstitucional(texto) {
  if (texto === null || texto === undefined) return texto;

  return String(texto)
    .replace(/\blucrativ[oa]s?\b/gi, "com superávit")
    .replace(/\blucro(s)?\b/gi, "superávit")
    .replace(/\bpreju[ií]zo(s)?\b/gi, "déficit");
}
