/**
 * Extrai linhas de alunos a partir do texto bruto de um PDF (tabelas ou listas).
 */

const ALIASES_COLUNA = {
  nomeCompleto: ["nome", "nome completo", "aluno", "estudante", "discente"],
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

const MAPA_MODULO = [
  { chave: "teologia", padroes: ["teolog", "bacharel"] },
  { chave: "basico", padroes: ["básico", "basico", "fundamental"] },
  { chave: "medio", padroes: ["médio", "medio"] },
  { chave: "avancado", padroes: ["avançado", "avancado"] }
];

function normalizarChaveColuna(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  return linha
    .split(/\s{2,}/)
    .map(function (c) {
      return c.trim();
    })
    .filter(Boolean);
}

function mapearIndicesCabecalho(cabecalho) {
  const cols = splitColunasLinha(cabecalho);
  if (cols.length < 2) return null;

  const map = {};
  let hits = 0;

  cols.forEach(function (rotulo, ix) {
    const norm = normalizarChaveColuna(rotulo);
    Object.keys(ALIASES_COLUNA).forEach(function (campo) {
      if (map[campo] != null) return;
      const bate = ALIASES_COLUNA[campo].some(function (a) {
        const an = normalizarChaveColuna(a);
        return norm === an || norm.indexOf(an) >= 0 || an.indexOf(norm) >= 0;
      });
      if (bate) {
        map[campo] = ix;
        hits += 1;
      }
    });
  });

  if (map.nomeCompleto == null && hits === 0) return null;
  if (map.nomeCompleto == null && cols.length >= 2) {
    map.nomeCompleto = 0;
    hits += 1;
  }
  return hits >= 1 ? map : null;
}

function extrairEmail(texto) {
  const m = String(texto || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : "";
}

function extrairCpf(texto) {
  const s = String(texto || "").trim();
  const fmt = s.match(/\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2}/);
  if (fmt) {
    const digits = fmt[0].replace(/\D/g, "");
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 11 && /cpf/i.test(s)) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return "";
}

function extrairTelefone(texto) {
  const digits = String(texto || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return String(texto || "").trim();
  if (digits.length === 11) {
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }
  return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
}

function inferirModuloTexto(texto) {
  const t = normalizarChaveColuna(texto);
  for (let i = 0; i < MAPA_MODULO.length; i++) {
    const item = MAPA_MODULO[i];
    if (item.padroes.some(function (p) { return t.indexOf(normalizarChaveColuna(p)) >= 0; })) {
      return item.chave;
    }
  }
  return "";
}

function normalizarUf(uf) {
  const u = String(uf || "").trim().toUpperCase();
  if (u.length === 2) return u;
  return "";
}

function normalizarDataIso(texto) {
  const s = String(texto || "").trim();
  if (!s) return "";
  const br = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (br) {
    let ano = br[3];
    if (ano.length === 2) ano = Number(ano) > 30 ? "19" + ano : "20" + ano;
    const mes = String(br[2]).padStart(2, "0");
    const dia = String(br[1]).padStart(2, "0");
    return ano + "-" + mes + "-" + dia;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
}

function normalizarNivelSetade(texto) {
  const t = normalizarChaveColuna(texto);
  if (t.indexOf("medio") >= 0 || t.indexOf("médio") >= 0) return "medio";
  if (t.indexOf("avanc") >= 0) return "avancado";
  return "";
}

function linhaDeColunas(cols, map) {
  function val(campo) {
    const ix = map[campo];
    if (ix == null || ix >= cols.length) return "";
    return String(cols[ix] || "").trim();
  }

  const nome = val("nomeCompleto");
  if (!nome || nome.length < 2) return null;

  let email = val("email");
  if (!email) email = extrairEmail(cols.join(" "));
  let cpf = val("cpf");
  if (cpf) cpf = extrairCpf(cpf);
  let telefone = val("telefone");
  if (!telefone) {
    cols.forEach(function (c) {
      if (telefone) return;
      const d = String(c).replace(/\D/g, "");
      if (d.length >= 10 && d.length <= 11) telefone = extrairTelefone(c);
    });
  } else {
    telefone = extrairTelefone(telefone);
  }

  const moduloRaw = val("modulo");
  const modulo = inferirModuloTexto(moduloRaw) || inferirModuloTexto(nome) || "";

  return {
    nomeCompleto: nome.replace(/\s+/g, " ").trim(),
    email: email,
    telefone: telefone,
    cpf: cpf,
    modulo: modulo,
    cidade: val("cidade"),
    estado: normalizarUf(val("estado")),
    dataNascimento: normalizarDataIso(val("dataNascimento")),
    igreja: val("igreja"),
    setadeNivel: normalizarNivelSetade(val("setadeNivel") || moduloRaw),
    salaTurmaNome: val("salaTurmaNome")
  };
}

function parsearLinhaLivre(linha) {
  const email = extrairEmail(linha);
  if (!email) return null;
  let nome = linha.replace(email, " ").replace(/\s+/g, " ").trim();
  nome = nome.replace(/^[\d.)\-\s]+/, "").trim();
  if (nome.length < 3) return null;
  const cpf = extrairCpf(linha);
  return {
    nomeCompleto: nome,
    email: email,
    telefone: "",
    cpf: cpf,
    modulo: inferirModuloTexto(linha),
    cidade: "",
    estado: "",
    dataNascimento: "",
    igreja: "",
    setadeNivel: "",
    salaTurmaNome: ""
  };
}

function parsearTextoPdfAlunos(textoBruto) {
  const texto = String(textoBruto || "")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ");
  const linhas = texto
    .split("\n")
    .map(function (l) {
      return l.trim();
    })
    .filter(function (l) {
      return l.length > 1;
    });

  let headerIdx = -1;
  let map = null;
  for (let i = 0; i < Math.min(40, linhas.length); i++) {
    const candidato = mapearIndicesCabecalho(linhas[i]);
    if (candidato) {
      headerIdx = i;
      map = candidato;
      break;
    }
  }

  const alunos = [];
  const vistos = {};

  if (headerIdx >= 0 && map) {
    for (let j = headerIdx + 1; j < linhas.length; j++) {
      const cols = splitColunasLinha(linhas[j]);
      if (cols.length < 2) continue;
      const row = linhaDeColunas(cols, map);
      if (!row) continue;
      const chave = (row.email || row.cpf || row.nomeCompleto).toLowerCase();
      if (vistos[chave]) continue;
      vistos[chave] = true;
      alunos.push(row);
    }
  }

  if (!alunos.length) {
    linhas.forEach(function (linha) {
      const row = parsearLinhaLivre(linha);
      if (!row) return;
      const chave = (row.email || row.nomeCompleto).toLowerCase();
      if (vistos[chave]) return;
      vistos[chave] = true;
      alunos.push(row);
    });
  }

  return {
    alunos: alunos,
    metodo: headerIdx >= 0 ? "tabela" : alunos.length ? "lista_email" : "nenhum",
    totalLinhasTexto: linhas.length
  };
}

module.exports = {
  parsearTextoPdfAlunos,
  splitColunasLinha
};
