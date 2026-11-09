/**
 * Extrai alunos e pagamentos (matrícula + mensalidades por mês) do texto de PDF.
 */

const ALIASES_COLUNA = {
  nomeCompleto: ["nome", "nome completo", "aluno", "alunos", "estudante", "discente", "participante"],
  email: ["e-mail", "email", "e mail", "correio"],
  telefone: ["telefone", "tel", "celular", "fone", "whatsapp", "contato"],
  cpf: ["cpf", "documento"],
  modulo: ["modulo", "módulo", "curso", "formacao", "formação"],
  cidade: ["cidade", "municipio", "município", "localidade"],
  estado: ["uf", "estado"],
  dataNascimento: ["nascimento", "data nascimento", "data de nascimento", "dt nasc", "nasc"],
  igreja: ["igreja", "congregacao", "congregação", "comunidade"],
  setadeNivel: ["nivel", "nível", "setade"],
  salaTurmaNome: ["sala", "turma", "sala turma"]
};

const ALIASES_TAXA_MATRICULA = [
  "matricula",
  "matrícula",
  "taxa",
  "taxa matricula",
  "taxa de matricula",
  "inscricao",
  "inscrição",
  "mat",
  "matric"
];

const MESES_ABREV = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12
};

const NOMES_MESES = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
};

const MAPA_MODULO = [
  { chave: "teologia", padroes: ["teolog", "bacharel"] },
  { chave: "basico", padroes: ["básico", "basico", "fundamental"] },
  { chave: "medio", padroes: ["médio", "medio"] },
  { chave: "avancado", padroes: ["avançado", "avancado"] }
];

const ANO_LETIVO_FIM = 2026;
const MES_LETIVO_FIM = 12;

function normalizarChaveColuna(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairColunasTabelaFinanceira(linha) {
  var s = String(linha || "").trim();
  if (!s) return null;
  var re = /\b([A-Za-zÀ-ÿ]{3}[-\/]\d{2,4}|\d{1,2}\/\d{2,4})\b/g;
  var meses = [];
  var m;
  while ((m = re.exec(s)) !== null) {
    meses.push({ start: m.index, len: m[0].length, token: m[0] });
  }
  if (!meses.length) return null;

  var cols = [];
  var prefixo = s.slice(0, meses[0].start).trim();
  if (prefixo) {
    if (/\bmatric/i.test(prefixo) && prefixo.split(/\s+/).length >= 2) {
      cols = prefixo.split(/\s+/).filter(Boolean);
    } else {
      cols.push(prefixo);
    }
  }
  meses.forEach(function (x) {
    cols.push(x.token);
  });
  var fimUltimo = meses[meses.length - 1].start + meses[meses.length - 1].len;
  var sufixo = s.slice(fimUltimo).trim();
  if (sufixo) cols.push(sufixo);
  return cols.length >= 2 ? cols : null;
}

function reagruparTokensMesAno(tokens) {
  var out = [];
  for (var i = 0; i < tokens.length; i++) {
    var tok = tokens[i];
    if (/^[A-Za-zÀ-ÿ]{3}[-\/]$/i.test(tok) && /^\d{2,4}$/.test(tokens[i + 1] || "")) {
      out.push(tok + tokens[i + 1]);
      i += 1;
      continue;
    }
    out.push(tok);
  }
  return out;
}

function splitColunasLinha(linha) {
  if (linha.indexOf("|") >= 0) {
    return linha.split("|").map(function (c) {
      return c.trim();
    });
  }
  if (linha.indexOf("\t") >= 0) {
    return linha.split("\t").map(function (c) {
      return c.trim();
    });
  }
  if (linha.indexOf(";") >= 0 && linha.split(";").length >= 3) {
    return linha.split(";").map(function (c) {
      return c.trim();
    });
  }
  var porEspacoDuplo = linha
    .split(/\s{2,}/)
    .map(function (c) {
      return c.trim();
    })
    .filter(Boolean);
  if (porEspacoDuplo.length >= 3) return porEspacoDuplo;
  var porMeses = extrairColunasTabelaFinanceira(linha);
  if (porMeses && porMeses.length >= 2) return porMeses;
  return tokenizarLinhaPdf(linha);
}

function tokenizarLinhaPdf(linha) {
  var s = String(linha || "").trim();
  if (!s) return [];
  var tokens = [];
  var re =
    /(R\$\s*[\d.,]+)|(\d{1,2}\/\d{2,4})|([A-Za-z]{3}[-\/]\d{2,4})|(\d{1,3}(?:\.\d{3})*,\d{2})|(\d+[,.]\d{2})|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})|([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.-]*(?:\s+[A-Za-zÀ-ÿ'’.-]+)*)/g;
  var m;
  while ((m = re.exec(s)) !== null) {
    var t = (m[0] || "").trim();
    if (t) tokens.push(t);
  }
  if (!tokens.length) {
    return reagruparTokensMesAno(s.split(/\s+/).filter(Boolean));
  }
  return reagruparTokensMesAno(tokens);
}

function formatMesColuna(mes, ano) {
  var a = String(ano);
  if (a.length === 2) a = Number(a) > 50 ? "19" + a : "20" + a;
  var mesNum = Number(mes);
  if (!mesNum || mesNum < 1 || mesNum > 12) return null;
  if (Number(a) > ANO_LETIVO_FIM) return null;
  if (Number(a) === ANO_LETIVO_FIM && mesNum > MES_LETIVO_FIM) return null;
  if (Number(a) < 2020) return null;
  var col = String(mesNum).padStart(2, "0") + "/" + a;
  return { coluna: col, referencia: "Mensalidade " + col };
}

function parseRotuloMesColuna(celula) {
  var s = String(celula || "").trim();
  if (!s) return null;

  var m = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{2,4})$/);
  if (m) return formatMesColuna(m[1], m[2]);

  m = s.match(/^([A-Za-zÀ-ÿ]{3,})\s*[\/\-.]\s*(\d{2,4})$/i);
  if (m) {
    var chave = normalizarChaveColuna(m[1]).slice(0, 3);
    var mesN = MESES_ABREV[chave];
    if (mesN) return formatMesColuna(mesN, m[2]);
  }

  m = s.match(/^([A-Za-zÀ-ÿ]{3,})\s*[-\s]+(\d{2,4})$/i);
  if (m) {
    var ch = normalizarChaveColuna(m[1]).slice(0, 3);
    if (MESES_ABREV[ch]) return formatMesColuna(MESES_ABREV[ch], m[2]);
  }

  var norm = normalizarChaveColuna(s);
  Object.keys(NOMES_MESES).forEach(function (nome) {
    if (norm.indexOf(nome) === 0) {
      var resto = s.replace(new RegExp("^" + nome, "i"), "").trim();
      var anoM = resto.match(/(\d{2,4})/);
      if (anoM) m = [null, NOMES_MESES[nome], anoM[1]];
    }
  });
  if (m && m[1]) return formatMesColuna(m[1], m[2]);

  if (/^\d{1,2}$/.test(s) && Number(s) >= 1 && Number(s) <= 12) {
    return formatMesColuna(s, String(ANO_LETIVO_FIM));
  }

  return null;
}

function colunaEhTaxaMatricula(celula) {
  var norm = normalizarChaveColuna(celula);
  return ALIASES_TAXA_MATRICULA.some(function (a) {
    var an = normalizarChaveColuna(a);
    return norm === an || norm.indexOf(an) >= 0 || an.indexOf(norm) >= 0;
  });
}

function colunaEhNome(celula) {
  var norm = normalizarChaveColuna(celula);
  return ALIASES_COLUNA.nomeCompleto.some(function (a) {
    var an = normalizarChaveColuna(a);
    return norm === an || norm.indexOf(an) >= 0;
  });
}

function mapearCabecalhoTabela(cols) {
  if (!cols || cols.length < 2) return null;

  var map = {
    nomeCompleto: null,
    email: null,
    telefone: null,
    cpf: null,
    modulo: null,
    taxaMatricula: null,
    meses: []
  };
  var score = 0;

  cols.forEach(function (cel, ix) {
  var mesInfo = parseRotuloMesColuna(cel);
    if (mesInfo) {
      map.meses.push({ ix: ix, coluna: mesInfo.coluna, referencia: mesInfo.referencia });
      score += 2;
      return;
    }
    if (colunaEhTaxaMatricula(cel)) {
      map.taxaMatricula = ix;
      score += 2;
      return;
    }
    if (colunaEhNome(cel) && map.nomeCompleto == null) {
      map.nomeCompleto = ix;
      score += 3;
      return;
    }

    var norm = normalizarChaveColuna(cel);
    Object.keys(ALIASES_COLUNA).forEach(function (campo) {
      if (map[campo] != null) return;
      var bate = ALIASES_COLUNA[campo].some(function (a) {
        var an = normalizarChaveColuna(a);
        return norm === an || norm.indexOf(an) >= 0 || an.indexOf(norm) >= 0;
      });
      if (bate) {
        map[campo] = ix;
        score += 1;
      }
    });
  });

  if (map.nomeCompleto == null) {
    map.nomeCompleto = 0;
    score += 1;
  }

  var temAluno = map.nomeCompleto != null;
  var temFinanceiro = map.meses.length > 0 || map.taxaMatricula != null;
  if (!temAluno || (!temFinanceiro && score < 2)) return null;

  return map;
}

function encontrarLinhaCabecalho(linhas) {
  var melhor = null;
  for (var i = 0; i < Math.min(60, linhas.length); i++) {
    var cols = splitColunasLinha(linhas[i]);
    var map = mapearCabecalhoTabela(cols);
    if (!map) continue;
    var pontos = map.meses.length * 2 + (map.taxaMatricula != null ? 2 : 0) + 3;
    if (!melhor || pontos > melhor.pontos) {
      melhor = { idx: i, map: map, cols: cols, pontos: pontos };
    }
  }
  return melhor;
}

function extrairEmail(texto) {
  var m = String(texto || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : "";
}

function extrairCpf(texto) {
  var s = String(texto || "").trim();
  var fmt = s.match(/\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2}/);
  if (fmt) {
    var digits = fmt[0].replace(/\D/g, "");
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
  }
  return "";
}

function extrairTelefone(texto) {
  var digits = String(texto || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return String(texto || "").trim();
  if (digits.length === 11) {
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }
  return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
}

function inferirModuloTexto(texto) {
  var t = normalizarChaveColuna(texto);
  for (var i = 0; i < MAPA_MODULO.length; i++) {
    var item = MAPA_MODULO[i];
    if (item.padroes.some(function (p) { return t.indexOf(normalizarChaveColuna(p)) >= 0; })) {
      return item.chave;
    }
  }
  return "";
}

function parseValorPagamentoCelula(celula) {
  var s = String(celula || "").trim();
  if (!s || s === "-" || s === "—" || s === "." || s.toLowerCase() === "x") return null;

  var lower = s.toLowerCase();
  if (
    lower === "p" ||
    lower === "ok" ||
    /^p\s*\/?\s*ok$/i.test(s) ||
    lower === "pago" ||
    lower === "sim" ||
    lower === "s" ||
    lower === "✓" ||
    lower === "v"
  ) {
    return { valor: null, status: "pago", marcador: true };
  }
  if (lower === "pend" || lower === "pendente" || lower === "aberto" || lower === "n") {
    return { valor: null, status: "pendente", marcador: true };
  }

  var numStr = s.replace(/R\$\s*/i, "").replace(/\s/g, "");
  if (numStr.indexOf(",") >= 0 && numStr.indexOf(".") >= 0) {
    numStr = numStr.replace(/\./g, "").replace(",", ".");
  } else {
    numStr = numStr.replace(",", ".");
  }
  var valor = Number(numStr);
  if (!Number.isNaN(valor) && valor > 0) {
    return { valor: valor, status: "pago", formaPagamento: "PIX" };
  }
  return null;
}

function limparNomeAlunoPdf(nome) {
  var s = String(nome || "").replace(/\s+/g, " ").trim();
  for (var pass = 0; pass < 4; pass++) {
    var antes = s;
    s = s.replace(
      /\s+(?:P\s*\/?\s*OK|OK\s+P|P\s+OK|OK|P\/OK|PENDENTE|PEND|R\$\s*[\d.,]+|\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,.]\d{2})$/i,
      ""
    );
    if (s === antes) break;
  }
  return s.trim();
}

function linhaPareceDadosAluno(cols, map) {
  if (!cols || !cols.length) return false;
  var nomeIx = map.nomeCompleto != null ? map.nomeCompleto : 0;
  var nome = String(cols[nomeIx] || cols[0] || "").trim();
  if (!nome || nome.length < 2) return false;
  if (/^(total|soma|subtotal|geral|obs)/i.test(nome)) return false;
  if (/^\d+$/.test(nome)) return false;
  var letras = (nome.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  if (letras < 2) return false;
  return true;
}

function indiceMaximoColuna(map) {
  var max = map.nomeCompleto != null ? map.nomeCompleto : 0;
  if (map.taxaMatricula != null && map.taxaMatricula > max) max = map.taxaMatricula;
  (map.meses || []).forEach(function (m) {
    if (m.ix > max) max = m.ix;
  });
  Object.keys(ALIASES_COLUNA).forEach(function (k) {
    if (map[k] != null && map[k] > max) max = map[k];
  });
  return max;
}

function tokenEhCelulaPagamento(tok) {
  if (!tok) return false;
  return parseValorPagamentoCelula(tok) != null;
}

function montarColsAlinhadasPorCabecalho(linha, map) {
  var tokens = reagruparTokensMesAno(
    String(linha || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
  if (!tokens.length) return null;

  var qtdPag = (map.meses || []).length + (map.taxaMatricula != null ? 1 : 0);
  var pagVals = [];
  var rest = tokens.slice();
  while (pagVals.length < qtdPag && rest.length) {
    var tok = rest.pop();
    if (tokenEhCelulaPagamento(tok) || pagVals.length < qtdPag) {
      pagVals.unshift(tok);
    } else {
      rest.push(tok);
      break;
    }
  }
  if (pagVals.length < qtdPag && rest.length) {
    while (pagVals.length < qtdPag && rest.length) {
      pagVals.unshift(rest.pop());
    }
  }

  var nome = limparNomeAlunoPdf(rest.join(" "));
  if (!nome || nome.length < 2) return null;

  var maxIx = indiceMaximoColuna(map);
  var cols = new Array(maxIx + 1).fill("");
  cols[map.nomeCompleto != null ? map.nomeCompleto : 0] = nome;

  var p = 0;
  if (map.taxaMatricula != null) {
    cols[map.taxaMatricula] = pagVals[p] || "";
    p += 1;
  }
  (map.meses || []).forEach(function (mes) {
    cols[mes.ix] = pagVals[p] || "";
    p += 1;
  });

  return cols;
}

function extrairNomeELinhaFinanceira(linha, map) {
  var email = extrairEmail(linha);
  var cols = splitColunasLinha(linha);
  if (cols.length >= 2 && linhaPareceDadosAluno(cols, map)) {
    return { cols: cols, email: email, modo: "colunas" };
  }

  var colsAlinhadas = montarColsAlinhadasPorCabecalho(linha, map);
  if (colsAlinhadas && linhaPareceDadosAluno(colsAlinhadas, map)) {
    return { cols: colsAlinhadas, email: email, modo: "colunas" };
  }

  var tokens = tokenizarLinhaPdf(linha);
  if (!tokens.length) return null;

  var emailTok = "";
  var valores = [];
  var mesTokens = [];
  var nomePartes = [];

  tokens.forEach(function (tok) {
    if (extrairEmail(tok)) {
      emailTok = extrairEmail(tok);
      return;
    }
    if (parseRotuloMesColuna(tok)) return;
    var pag = parseValorPagamentoCelula(tok);
    if (pag) {
      valores.push(pag);
      return;
    }
    if (/^\d{1,2}$/.test(tok) && Number(tok) <= 12) {
      valores.push(parseValorPagamentoCelula(tok) || { marcador: true, status: "pago" });
      return;
    }
    if (!/^(r\$|total)$/i.test(tok) && !/^(p|ok|p\/ok|pendente|pend)$/i.test(tok)) {
      nomePartes.push(tok);
    }
  });

  var nome = limparNomeAlunoPdf(nomePartes.join(" "));
  if (!nome || nome.length < 3) return null;

  var colsSinteticas = [nome];
  if (emailTok) colsSinteticas.push(emailTok);
  map.meses.forEach(function (_, i) {
    var v = valores[i];
    colsSinteticas.push(v ? (v.valor != null ? String(v.valor) : v.status) : "");
  });

  return {
    cols: colsSinteticas,
    email: emailTok || email,
    modo: "tokens",
    pagamentosSoltos: valores
  };
}

function montarPagamentosDaLinha(cols, map, pagamentosSoltos) {
  var mensalidades = [];
  var taxaMatricula = null;

  if (map.taxaMatricula != null && cols[map.taxaMatricula] != null) {
    var pTaxa = parseValorPagamentoCelula(cols[map.taxaMatricula]);
    if (pTaxa) {
      taxaMatricula = {
        valor: pTaxa.valor,
        status: pTaxa.status || "pago",
        formaPagamento: pTaxa.formaPagamento || "PIX"
      };
    }
  }

  map.meses.forEach(function (mes, ordem) {
    var cel = cols[mes.ix];
    var parsed = parseValorPagamentoCelula(cel);
    if (!parsed && pagamentosSoltos && pagamentosSoltos[ordem]) {
      parsed = pagamentosSoltos[ordem];
    }
    if (!parsed) return;
    var valor = parsed.valor != null ? parsed.valor : null;
    mensalidades.push({
      referencia: mes.referencia,
      coluna: mes.coluna,
      valor: valor,
      status: parsed.status || "pago",
      formaPagamento: parsed.formaPagamento || "PIX",
      marcadorSemValor: parsed.valor == null && parsed.marcador
    });
  });

  return { taxaMatricula: taxaMatricula, mensalidades: mensalidades };
}

function linhaDeColunas(cols, map, extras) {
  extras = extras || {};
  function val(campo) {
    var ix = map[campo];
    if (ix == null || ix >= cols.length) return "";
    return String(cols[ix] || "").trim();
  }

  var nomeIx = map.nomeCompleto != null ? map.nomeCompleto : 0;
  var nome = String(cols[nomeIx] || "").trim();
  if (!nome || nome.length < 2) return null;

  var email = val("email") || extras.email || extrairEmail(cols.join(" "));
  var telefone = val("telefone");
  if (telefone) telefone = extrairTelefone(telefone);
  var cpf = val("cpf");
  if (cpf) cpf = extrairCpf(cpf);

  var pagamentos = montarPagamentosDaLinha(cols, map, extras.pagamentosSoltos);

  return {
    nomeCompleto: limparNomeAlunoPdf(nome),
    email: email,
    telefone: telefone,
    cpf: cpf,
    modulo: inferirModuloTexto(val("modulo")) || "",
    cidade: val("cidade"),
    estado: val("estado"),
    dataNascimento: "",
    igreja: val("igreja") || "",
    setadeNivel: "",
    salaTurmaNome: val("salaTurmaNome") || "",
    taxaMatricula: pagamentos.taxaMatricula,
    mensalidades: pagamentos.mensalidades
  };
}

function parsearLinhaLivre(linha) {
  var email = extrairEmail(linha);
  if (!email) return null;
  var nome = linha.replace(email, " ").replace(/\s+/g, " ").trim();
  nome = nome.replace(/^[\d.)\-\s]+/, "").trim();
  if (nome.length < 3) return null;
  return {
    nomeCompleto: nome,
    email: email,
    telefone: "",
    cpf: extrairCpf(linha),
    modulo: inferirModuloTexto(linha),
    cidade: "",
    estado: "",
    dataNascimento: "",
    igreja: "",
    setadeNivel: "",
    salaTurmaNome: "",
    taxaMatricula: null,
    mensalidades: []
  };
}

function parsearTextoPdfAlunos(textoBruto) {
  var texto = String(textoBruto || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\f/g, "\n");
  var linhas = texto
    .split("\n")
    .map(function (l) {
      return l.trim();
    })
    .filter(function (l) {
      return l.length > 1;
    });

  var cab = encontrarLinhaCabecalho(linhas);
  var alunos = [];
  var vistos = {};
  var metodo = "nenhum";

  if (cab && cab.map) {
    metodo = "tabela_pagamentos";
    for (var j = cab.idx + 1; j < linhas.length; j++) {
      var extraido = extrairNomeELinhaFinanceira(linhas[j], cab.map);
      if (!extraido) continue;

      var cols = extraido.cols;
      if (extraido.modo === "tokens" && cab.map.nomeCompleto === 0 && cols.length > 0) {
        cab.map = Object.assign({}, cab.map);
      }

      var row = linhaDeColunas(cols, cab.map, {
        email: extraido.email,
        pagamentosSoltos: extraido.pagamentosSoltos
      });
      if (!row) continue;

      if (!row.email && (row.mensalidades.length || row.taxaMatricula)) {
        row.emailPendente = true;
      }

      var chave = (row.email || row.nomeCompleto).toLowerCase();
      if (vistos[chave]) continue;
      vistos[chave] = true;
      alunos.push(row);
    }
  }

  if (!alunos.length && cab && cab.map) {
    metodo = "tabela";
    for (var k = cab.idx + 1; k < linhas.length; k++) {
      var cols2 = splitColunasLinha(linhas[k]);
      if (!linhaPareceDadosAluno(cols2, cab.map)) continue;
      var row2 = linhaDeColunas(cols2, cab.map, {});
      if (!row2) continue;
      var ch2 = (row2.email || row2.nomeCompleto).toLowerCase();
      if (vistos[ch2]) continue;
      vistos[ch2] = true;
      alunos.push(row2);
    }
  }

  if (!alunos.length) {
    linhas.forEach(function (linha) {
      var row3 = parsearLinhaLivre(linha);
      if (!row3) return;
      var ch3 = (row3.email || row3.nomeCompleto).toLowerCase();
      if (vistos[ch3]) return;
      vistos[ch3] = true;
      alunos.push(row3);
      metodo = "lista_email";
    });
  }

  return {
    alunos: alunos,
    metodo: metodo,
    totalLinhasTexto: linhas.length,
    cabecalhoDetectado: cab
      ? { linha: cab.idx, meses: (cab.map.meses || []).length, taxa: cab.map.taxaMatricula != null }
      : null
  };
}

module.exports = {
  parsearTextoPdfAlunos,
  splitColunasLinha,
  parseRotuloMesColuna,
  parseValorPagamentoCelula
};
