/* ============================================================
   dados.js — Camada de dados local (localStorage)
   Simula um banco de dados no navegador.
   Em produção, esses dados viriam de um servidor/API.
   ============================================================ */

const STORAGE_KEYS = {
  biblioteca: "setad_biblioteca_livros",
  entregas: "setad_trabalhos_entregas",
  matriculas: "setad_matriculas_alunos",
  contasAlunos: "setad_contas_alunos",
  verificacoesPendentes: "setad_verificacoes_pendentes",
  fotosAlunos: "setad_fotos_alunos",
  fotosStaff: "setad_fotos_staff",
  wppConversas: "setad_wpp_conversas",
  inicializado: "setad_dados_inicializados"
};

function setadApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function setadGetCache(chave) {
  if (!setadApiAtivo()) return null;
  return window.SETAD.cache[chave];
}

function setadSetCache(chave, valor, apiPath) {
  if (!setadApiAtivo()) return;
  window.SETAD.setCache(chave, valor, apiPath);
}

/* Módulos do curso teológico SETAD */
const MODULOS_CURSO = {
  basico: {
    id: "basico",
    nome: "Básico",
    descricao: "Introdução à teologia para vocacionados iniciantes.",
    taxaMatricula: 50,
    mensalidade: 80
  },
  medio: {
    id: "medio",
    nome: "Curso Médio em Teologia e Ciências Bíblicas",
    descricao: "Curso livre presencial — 18 meses, aulas aos sábados 14h30.",
    taxaMatricula: 50,
    mensalidade: 100
  },
  avancado: {
    id: "avancado",
    nome: "Curso Avançado em Teologia",
    descricao: "Curso livre presencial — 2 anos, aulas aos sábados 14h30.",
    taxaMatricula: 50,
    mensalidade: 200
  },
  teologia: {
    id: "teologia",
    nome: "Bacharelado em Teologia",
    descricao: "Curso superior em Teologia — formação acadêmica completa para o ministério e pesquisa.",
    taxaMatricula: 100,
    mensalidade: 280
  }
};

function obterTaxaMatriculaModulo(moduloId) {
  const modulo = MODULOS_CURSO[moduloId];
  return modulo && modulo.taxaMatricula ? modulo.taxaMatricula : 50;
}

function obterMensalidadeModulo(moduloId) {
  const modulo = MODULOS_CURSO[moduloId];
  return modulo && modulo.mensalidade ? modulo.mensalidade : 180;
}

/* Trabalhos atribuídos pelo seminário (fixos — modelo de dados) */
const TRABALHOS_ATRIBUIDOS = [
  {
    id: "trab-001",
    titulo: "Resumo: Doutrina da Trindade",
    disciplina: "Teologia Sistemática I",
    prazo: "2026-03-28"
  },
  {
    id: "trab-002",
    titulo: "Exegese de Romanos 8:28–30",
    disciplina: "Hermenêutica Bíblica",
    prazo: "2026-04-04"
  },
  {
    id: "trab-003",
    titulo: "Biografia de Agostinho de Hipona",
    disciplina: "História da Igreja",
    prazo: "2026-04-18"
  },
  {
    id: "trab-004",
    titulo: "Esboço de sermão expositivo",
    disciplina: "Teologia Prática",
    prazo: "2026-04-25"
  }
];

/* Acervo inicial da biblioteca teológica */
const LIVROS_INICIAIS = [
  {
    id: "liv-001",
    titulo: "Bíblia de Estudo Andrews",
    autor: "Editora Cultura Cristã",
    categoria: "Bíblia de Estudo",
    capaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    descricao: "Bíblia com notas de rodapé, referências cruzadas e comentários teológicos para estudo aprofundado.",
    conteudoEstudo: "Gênesis 1:1 — No princípio, criou Deus os céus e a terra. Estudo introdutório sobre a criação e a soberania de Deus conforme o relato bíblico."
  },
  {
    id: "liv-002",
    titulo: "Teologia Sistemática — Berkhof",
    autor: "Louis Berkhof",
    categoria: "Teologia Sistemática",
    capaUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    descricao: "Obra clássica de teologia reformada organizada por doutrinas.",
    conteudoEstudo: "Cap. 1 — A necessidade da teologia sistemática: a fé cristã busca compreensão ordenada das verdades reveladas por Deus nas Escrituras."
  },
  {
    id: "liv-003",
    titulo: "Como Interpretar a Bíblia",
    autor: "Walter C. Kaiser Jr.",
    categoria: "Hermenêutica",
    capaUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    descricao: "Introdução aos princípios de interpretação bíblica.",
    conteudoEstudo: "Princípio 1 — O contexto literário e histórico é essencial para interpretar corretamente qualquer passagem bíblica."
  },
  {
    id: "liv-004",
    titulo: "Bíblia Thompson — Referências Cruzadas",
    autor: "Ed. Vida",
    categoria: "Bíblia de Estudo",
    capaUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80",
    cadastradoPor: "Sistema SETAD",
    perfilCadastro: "diretor",
    descricao: "Bíblia de estudo com cadeia de referências temáticas ao longo do texto.",
    conteudoEstudo: "João 3:16 — Referências cruzadas: Romanos 5:8; 1 João 4:9. Tema central: o amor de Deus manifestado na redenção."
  }
];

const CATEGORIAS_LIVRO = [
  "Bíblia de Estudo",
  "Teologia Sistemática",
  "Hermenêutica",
  "História da Igreja",
  "Teologia Prática",
  "Comentário Bíblico",
  "Outros"
];

const TAMANHO_MAX_ARQUIVO = 2 * 1024 * 1024; /* 2 MB — limite do localStorage */
const TAMANHO_MAX_ARQUIVO_LIVRO = 3 * 1024 * 1024; /* 3 MB — arquivos digitais da biblioteca */

const FORMATOS_LIVRO_BIBLIOTECA = [
  { ext: ".pdf", mime: "application/pdf", label: "PDF", visualizavel: true },
  { ext: ".epub", mime: "application/epub+zip", label: "EPUB", visualizavel: false },
  { ext: ".mobi", mime: "application/x-mobipocket-ebook", label: "MOBI", visualizavel: false },
  { ext: ".azw3", mime: "application/vnd.amazon.ebook", label: "AZW3", visualizavel: false },
  { ext: ".doc", mime: "application/msword", label: "DOC", visualizavel: false },
  { ext: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX", visualizavel: false },
  { ext: ".odt", mime: "application/vnd.oasis.opendocument.text", label: "ODT", visualizavel: false },
  { ext: ".rtf", mime: "application/rtf", label: "RTF", visualizavel: false },
  { ext: ".txt", mime: "text/plain", label: "TXT", visualizavel: true },
  { ext: ".html", mime: "text/html", label: "HTML", visualizavel: true },
  { ext: ".htm", mime: "text/html", label: "HTML", visualizavel: true }
];

/**
 * Garante que livros e entregas demo existam na primeira visita.
 */
function inicializarDadosPadrao() {
  if (setadApiAtivo()) {
    return;
  }

  repararArmazenamentoMatriculas();

  if (!localStorage.getItem(STORAGE_KEYS.inicializado)) {
    localStorage.setItem(STORAGE_KEYS.biblioteca, JSON.stringify(LIVROS_INICIAIS));

    localStorage.setItem(STORAGE_KEYS.entregas, JSON.stringify([
      {
        id: "ent-001",
        trabalhoId: "trab-001",
        alunoEmail: "aluno@setad.org.br",
        alunoNome: "Aluno SETAD",
        arquivoNome: "resumo-trindade.pdf",
        arquivoTipo: "application/pdf",
        arquivoTamanho: 245000,
        dataEnvio: "2026-03-20T14:30:00.000Z"
      }
    ]));

    localStorage.setItem(STORAGE_KEYS.inicializado, "true");
  }

  migrarBiblioteca();
}

/**
 * Atualiza livros antigos com campos de estudo (descricao, conteudoEstudo).
 */
function migrarBiblioteca() {
  const dados = localStorage.getItem(STORAGE_KEYS.biblioteca);
  if (!dados) return;

  const livros = JSON.parse(dados);
  let alterou = false;

  LIVROS_INICIAIS.forEach(function (inicial) {
    const livro = livros.find(function (l) { return l.id === inicial.id; });
    if (livro && !livro.conteudoEstudo) {
      livro.descricao = livro.descricao || inicial.descricao;
      livro.conteudoEstudo = inicial.conteudoEstudo;
      alterou = true;
    }
  });

  if (alterou) salvarLivros(livros);
}

function obterTrabalhosAtribuidos() {
  return TRABALHOS_ATRIBUIDOS;
}

function obterEntregas() {
  inicializarDadosPadrao();
  if (setadApiAtivo()) {
    return (setadGetCache("entregas") || []).slice();
  }
  const dados = localStorage.getItem(STORAGE_KEYS.entregas);
  return dados ? JSON.parse(dados) : [];
}

function salvarEntregas(entregas) {
  if (setadApiAtivo()) {
    setadSetCache("entregas", entregas, "entregas");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.entregas, JSON.stringify(entregas));
}

function obterEntregaDoAluno(trabalhoId, alunoEmail) {
  return obterEntregas().find(function (e) {
    return e.trabalhoId === trabalhoId && e.alunoEmail === alunoEmail;
  });
}

function obterLivros() {
  inicializarDadosPadrao();
  if (setadApiAtivo()) {
    return (setadGetCache("livros") || []).slice();
  }
  const dados = localStorage.getItem(STORAGE_KEYS.biblioteca);
  return dados ? JSON.parse(dados) : [];
}

function salvarLivros(livros) {
  if (setadApiAtivo()) {
    setadSetCache("livros", livros, "livros");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.biblioteca, JSON.stringify(livros));
}

function obterLivroPorId(id) {
  return obterLivros().find(function (livro) {
    return livro.id === id;
  });
}

function atualizarLivro(id, dadosAtualizados) {
  const livros = obterLivros();
  const indice = livros.findIndex(function (l) { return l.id === id; });

  if (indice === -1) return false;

  livros[indice] = Object.assign({}, livros[indice], dadosAtualizados, {
    id: id,
    atualizadoEm: new Date().toISOString()
  });

  salvarLivros(livros);
  return true;
}

function excluirLivro(id) {
  const livros = obterLivros().filter(function (l) {
    return l.id !== id;
  });

  salvarLivros(livros);
}

function obterFormatosLivroBiblioteca() {
  return FORMATOS_LIVRO_BIBLIOTECA;
}

function obterExtensoesLivroAccept() {
  return FORMATOS_LIVRO_BIBLIOTECA.map(function (formato) {
    return formato.ext;
  }).join(",");
}

function obterListaFormatosLivroLabel() {
  return FORMATOS_LIVRO_BIBLIOTECA.map(function (formato) {
    return formato.label;
  }).join(", ");
}

function detectarFormatoLivroPorNome(nomeArquivo) {
  const nome = (nomeArquivo || "").toLowerCase();
  return FORMATOS_LIVRO_BIBLIOTECA.find(function (formato) {
    return nome.endsWith(formato.ext);
  }) || null;
}

function validarArquivoLivroBiblioteca(arquivo) {
  if (!arquivo) {
    return { ok: true, formato: null };
  }

  if (arquivo.size > TAMANHO_MAX_ARQUIVO_LIVRO) {
    return {
      ok: false,
      erro: "Arquivo muito grande. O limite é " + formatarTamanhoArquivo(TAMANHO_MAX_ARQUIVO_LIVRO) + "."
    };
  }

  const formato = detectarFormatoLivroPorNome(arquivo.name);
  if (!formato) {
    return {
      ok: false,
      erro: "Formato não permitido. Use: " + obterListaFormatosLivroLabel() + "."
    };
  }

  return { ok: true, formato: formato };
}

function validarUrlArquivoLivroBiblioteca(url) {
  const endereco = (url || "").trim();
  if (!endereco) {
    return { ok: true };
  }

  try {
    const parsed = new URL(endereco);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, erro: "O link do arquivo deve começar com http:// ou https://." };
    }
  } catch (erro) {
    return { ok: false, erro: "Informe um link válido para o arquivo digital." };
  }

  return { ok: true };
}

function lerArquivoComoDataUrl(arquivo) {
  return new Promise(function (resolver, rejeitar) {
    const leitor = new FileReader();

    leitor.onload = function () {
      resolver(leitor.result);
    };

    leitor.onerror = function () {
      rejeitar(new Error("Não foi possível ler o arquivo selecionado."));
    };

    leitor.readAsDataURL(arquivo);
  });
}

function criarMetadadosArquivoLivro(arquivo, dataUrl) {
  const validacao = validarArquivoLivroBiblioteca(arquivo);
  if (!validacao.ok || !validacao.formato) {
    throw new Error(validacao.erro || "Arquivo inválido.");
  }

  return {
    nome: arquivo.name,
    tipo: arquivo.type || validacao.formato.mime,
    formato: validacao.formato.ext.replace(".", ""),
    label: validacao.formato.label,
    visualizavel: validacao.formato.visualizavel,
    tamanho: arquivo.size,
    dataUrl: dataUrl,
    origem: "upload",
    enviadoEm: new Date().toISOString()
  };
}

function criarArquivoLivroDeUrl(url) {
  const endereco = url.trim();
  const nome = decodeURIComponent(endereco.split("/").pop().split("?")[0] || "arquivo");
  const formato = detectarFormatoLivroPorNome(nome);

  return {
    nome: nome,
    tipo: formato ? formato.mime : "",
    formato: formato ? formato.ext.replace(".", "") : "link",
    label: formato ? formato.label : "Link",
    visualizavel: formato ? formato.visualizavel : false,
    url: endereco,
    origem: "url",
    enviadoEm: new Date().toISOString()
  };
}

function livroPossuiArquivoDigital(livro) {
  if (!livro || !livro.arquivo) return false;
  return !!(livro.arquivo.dataUrl || livro.arquivo.url);
}

function obterFonteArquivoLivro(livro) {
  if (!livro || !livro.arquivo) return null;
  return livro.arquivo.dataUrl || livro.arquivo.url || null;
}

/* --- Sistema de matrículas (alunos por módulo) --- */

function normalizarEmailMatricula(email) {
  return (email || "").trim().toLowerCase();
}

function normalizarCpfMatricula(cpf) {
  return (cpf || "").replace(/\D/g, "");
}

function sanitizarMatriculaRegistro(matricula) {
  if (!matricula || typeof matricula !== "object") return null;

  const email = normalizarEmailMatricula(matricula.email);
  if (!email) return null;

  return Object.assign({}, matricula, {
    email: email,
    cpf: matricula.cpf ? String(matricula.cpf).trim() : "",
    nomeCompleto: (matricula.nomeCompleto || "").trim()
  });
}

function repararArmazenamentoMatriculas() {
  const matriculas = obterMatriculasBrutas();
  const porEmail = {};

  matriculas.forEach(function (matricula) {
    const registro = sanitizarMatriculaRegistro(matricula);
    if (!registro) return;

    const atual = porEmail[registro.email];
    if (!atual) {
      porEmail[registro.email] = registro;
      return;
    }

    const dataAtual = new Date(atual.dataMatricula || 0).getTime();
    const dataNova = new Date(registro.dataMatricula || 0).getTime();
    if (dataNova >= dataAtual) {
      porEmail[registro.email] = registro;
    }
  });

  const normalizadas = Object.keys(porEmail).map(function (email) {
    return porEmail[email];
  });

  const invalidas = matriculas.length - matriculas.filter(sanitizarMatriculaRegistro).length;
  const precisaSalvar =
    invalidas > 0 ||
    normalizadas.length !== matriculas.length ||
    JSON.stringify(normalizadas) !== JSON.stringify(matriculas);

  if (precisaSalvar) {
    salvarMatriculas(normalizadas);
  }

  return normalizadas;
}

function obterMatriculasBrutas() {
  if (setadApiAtivo()) {
    return (setadGetCache("matriculas") || []).slice();
  }

  const dados = localStorage.getItem(STORAGE_KEYS.matriculas);
  if (!dados) return [];

  try {
    const lista = JSON.parse(dados);
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

function obterMatriculas() {
  return repararArmazenamentoMatriculas();
}

function salvarMatriculas(matriculas) {
  const lista = (matriculas || [])
    .map(sanitizarMatriculaRegistro)
    .filter(Boolean);

  if (setadApiAtivo()) {
    setadSetCache("matriculas", lista, "matriculas");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.matriculas, JSON.stringify(lista));
}

function obterMatriculasPorModulo(moduloId) {
  return obterMatriculas().filter(function (m) {
    return m.modulo === moduloId;
  });
}

function contarMatriculasPorModulo() {
  const contagem = { basico: 0, medio: 0, avancado: 0, teologia: 0 };
  obterMatriculas().forEach(function (m) {
    if (contagem[m.modulo] !== undefined) {
      contagem[m.modulo]++;
    }
  });
  return contagem;
}

function obterMatriculaPorEmail(email) {
  const emailNormalizado = normalizarEmailMatricula(email);
  if (!emailNormalizado) return null;

  return obterMatriculas().find(function (m) {
    return normalizarEmailMatricula(m.email) === emailNormalizado;
  }) || null;
}

function verificarEmailDisponivelParaMatricula(email) {
  const emailNormalizado = normalizarEmailMatricula(email);
  if (!emailNormalizado) {
    return { ok: false, erro: "Informe um e-mail válido." };
  }

  const existente = obterMatriculaPorEmail(emailNormalizado);
  if (!existente) {
    return { ok: true };
  }

  return {
    ok: false,
    erro:
      "Este e-mail já possui matrícula registrada para " +
      existente.nomeCompleto + " (" +
      (typeof formatarData === "function" ? formatarData(existente.dataMatricula) : "data não informada") +
      "). Se necessário, exclua o cadastro anterior em Novos alunos."
  };
}

function emailJaMatriculado(email) {
  return !verificarEmailDisponivelParaMatricula(email).ok;
}

function cadastrarMatricula(dados) {
  const emailNormalizado = normalizarEmailMatricula(dados.email);
  const verificacao = verificarEmailDisponivelParaMatricula(emailNormalizado);
  if (!verificacao.ok) {
    return { ok: false, erro: verificacao.erro };
  }

  const matriculas = obterMatriculas();
  const novaMatricula = Object.assign({}, dados, {
    email: emailNormalizado,
    cpf: dados.cpf ? String(dados.cpf).trim() : "",
    id: gerarId("mat"),
    dataMatricula: new Date().toISOString(),
    status: dados.status || "pendente",
    origem: dados.origem || "site",
    cadastradoPor: dados.cadastradoPor || null
  });
  matriculas.push(novaMatricula);
  salvarMatriculas(matriculas);

  if (typeof notificarMatriculaNoWpp === "function") {
    notificarMatriculaNoWpp(novaMatricula);
  }

  return { ok: true, matricula: novaMatricula };
}

function verificarEmailDisponivelParaMatriculaAsync(email) {
  if (!setadApiAtivo()) {
    return Promise.resolve(verificarEmailDisponivelParaMatricula(email));
  }

  return SETADApi.checkEmailMatricula(email).then(function (resposta) {
    if (resposta.disponivel) {
      return { ok: true };
    }

    const existente = resposta.matricula || {};
    return {
      ok: false,
      erro:
        "Este e-mail já possui matrícula registrada para " +
        (existente.nomeCompleto || "outro aluno") + " (" +
        (typeof formatarData === "function" && existente.dataMatricula
          ? formatarData(existente.dataMatricula)
          : "data não informada") +
        "). Se necessário, exclua o cadastro anterior em Novos alunos."
    };
  });
}

function cadastrarMatriculaAsync(dados) {
  if (!setadApiAtivo()) {
    return Promise.resolve(cadastrarMatricula(dados));
  }

  const emailNormalizado = normalizarEmailMatricula(dados.email);
  const payload = Object.assign({}, dados, {
    email: emailNormalizado,
    cpf: dados.cpf ? String(dados.cpf).trim() : "",
    status: dados.status || "pendente",
    origem: dados.origem || "site",
    cadastradoPor: dados.cadastradoPor || null
  });

  return SETADApi.criarMatriculaPublica(payload).then(function (resposta) {
    if (!resposta.ok) {
      return { ok: false, erro: resposta.erro || "Não foi possível concluir a matrícula." };
    }

    if (setadGetCache("matriculas")) {
      setadGetCache("matriculas").push(resposta.matricula);
    }

    if (resposta.pagamento && setadGetCache("pagamentos")) {
      setadGetCache("pagamentos").push(resposta.pagamento);
    }

    if (typeof notificarMatriculaNoWpp === "function") {
      notificarMatriculaNoWpp(resposta.matricula);
    }

    return { ok: true, matricula: resposta.matricula, pagamento: resposta.pagamento };
  });
}

/* --- Contas de acesso dos alunos (vinculadas à matrícula) --- */

function obterContasAlunos() {
  const dados = localStorage.getItem(STORAGE_KEYS.contasAlunos);
  return dados ? JSON.parse(dados) : [];
}

function salvarContasAlunos(contas) {
  localStorage.setItem(STORAGE_KEYS.contasAlunos, JSON.stringify(contas));
}

function obterMatriculaPorId(matriculaId) {
  return obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  }) || null;
}

function atualizarStatusMatricula(matriculaId, status) {
  const matriculas = obterMatriculas();
  const indice = matriculas.findIndex(function (m) {
    return m.id === matriculaId;
  });
  if (indice === -1) return false;

  matriculas[indice].status = status;
  salvarMatriculas(matriculas);
  return true;
}

function excluirMatricula(matriculaId) {
  const matriculas = obterMatriculas();
  const indice = matriculas.findIndex(function (m) {
    return m.id === matriculaId;
  });

  if (indice === -1) {
    return { ok: false, erro: "Matrícula não encontrada." };
  }

  const matricula = matriculas[indice];
  const email = matricula.email.trim().toLowerCase();

  matriculas.splice(indice, 1);
  salvarMatriculas(matriculas);

  const contas = obterContasAlunos().filter(function (c) {
    return normalizarEmailMatricula(c.email) !== email;
  });
  salvarContasAlunos(contas);

  const verificacoes = obterVerificacoesPendentes().filter(function (v) {
    return normalizarEmailMatricula(v.email) !== email;
  });
  salvarVerificacoesPendentes(verificacoes);

  const fotos = obterFotosAlunos();
  Object.keys(fotos).forEach(function (chave) {
    if (normalizarEmailMatricula(chave) === email) {
      delete fotos[chave];
    }
  });
  salvarFotosAlunos(fotos);

  if (typeof excluirPagamentosPorMatricula === "function") {
    excluirPagamentosPorMatricula(matriculaId, email);
  }

  if (typeof limparVinculosExclusaoPorMatricula === "function") {
    limparVinculosExclusaoPorMatricula(matriculaId, email);
  }

  return { ok: true, nome: matricula.nomeCompleto };
}

function emailJaTemContaAluno(email) {
  const emailNormalizado = email.trim().toLowerCase();
  return obterContasAlunos().some(function (c) {
    return c.email === emailNormalizado && c.verificado === true;
  });
}

function gerarCodigoVerificacao() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function obterVerificacoesPendentes() {
  const dados = localStorage.getItem(STORAGE_KEYS.verificacoesPendentes);
  return dados ? JSON.parse(dados) : [];
}

function salvarVerificacoesPendentes(lista) {
  localStorage.setItem(STORAGE_KEYS.verificacoesPendentes, JSON.stringify(lista));
}

function obterVerificacaoPendente(email) {
  const emailNormalizado = email.trim().toLowerCase();
  return obterVerificacoesPendentes().find(function (p) {
    return p.email === emailNormalizado;
  }) || null;
}

function emailTemVerificacaoPendente(email) {
  return !!obterVerificacaoPendente(email);
}

/**
 * Inicia o cadastro: salva senha temporariamente e gera código de 6 dígitos.
 * Em produção, o código seria enviado por e-mail (simulado no front-end).
 */
function solicitarVerificacaoCadastro(email, senha) {
  const emailNormalizado = email.trim().toLowerCase();
  const matricula = obterMatriculaPorEmail(emailNormalizado);

  if (!matricula) {
    return {
      ok: false,
      erro: "Este e-mail não possui matrícula registrada. Faça sua inscrição em Matrícula online antes de criar o acesso."
    };
  }

  if (emailJaTemContaAluno(emailNormalizado)) {
    return {
      ok: false,
      erro: "Já existe uma conta verificada com este e-mail. Use a opção Entrar."
    };
  }

  const codigo = gerarCodigoVerificacao();
  const codigoExpiraEm = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const pendentes = obterVerificacoesPendentes().filter(function (p) {
    return p.email !== emailNormalizado;
  });

  pendentes.push({
    email: emailNormalizado,
    senha: senha,
    nome: matricula.nomeCompleto,
    modulo: matricula.modulo,
    matriculaId: matricula.id,
    codigo: codigo,
    codigoExpiraEm: codigoExpiraEm,
    criadoEm: new Date().toISOString()
  });

  salvarVerificacoesPendentes(pendentes);

  return {
    ok: true,
    email: emailNormalizado,
    codigo: codigo
  };
}

function reenviarCodigoVerificacao(email) {
  const emailNormalizado = email.trim().toLowerCase();
  const pendente = obterVerificacaoPendente(emailNormalizado);

  if (!pendente) {
    return {
      ok: false,
      erro: "Nenhuma verificação pendente para este e-mail. Crie sua senha novamente."
    };
  }

  const codigo = gerarCodigoVerificacao();
  const pendentes = obterVerificacoesPendentes().map(function (p) {
    if (p.email !== emailNormalizado) return p;
    return Object.assign({}, p, {
      codigo: codigo,
      codigoExpiraEm: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  });

  salvarVerificacoesPendentes(pendentes);

  return { ok: true, codigo: codigo, email: emailNormalizado };
}

/**
 * Confirma o código e ativa a conta do aluno.
 */
function confirmarVerificacaoCadastro(email, codigoInformado) {
  const emailNormalizado = email.trim().toLowerCase();
  const codigo = String(codigoInformado || "").trim();
  const pendente = obterVerificacaoPendente(emailNormalizado);

  if (!pendente) {
    return {
      ok: false,
      erro: "Nenhuma verificação pendente. Crie sua senha novamente."
    };
  }

  if (new Date() > new Date(pendente.codigoExpiraEm)) {
    return {
      ok: false,
      erro: "O código expirou. Solicite um novo código."
    };
  }

  if (pendente.codigo !== codigo) {
    return {
      ok: false,
      erro: "Código incorreto. Verifique os 6 dígitos enviados ao seu e-mail."
    };
  }

  const contas = obterContasAlunos().filter(function (c) {
    return c.email !== emailNormalizado;
  });

  const novaConta = {
    email: pendente.email,
    senha: pendente.senha,
    nome: pendente.nome,
    modulo: pendente.modulo,
    matriculaId: pendente.matriculaId,
    verificado: true,
    cadastradoEm: new Date().toISOString(),
    verificadoEm: new Date().toISOString()
  };

  contas.push(novaConta);
  salvarContasAlunos(contas);

  const pendentes = obterVerificacoesPendentes().filter(function (p) {
    return p.email !== emailNormalizado;
  });
  salvarVerificacoesPendentes(pendentes);

  return { ok: true, conta: novaConta };
}

function cadastrarContaAluno(email, senha) {
  return solicitarVerificacaoCadastro(email, senha);
}

function autenticarAluno(email, senha) {
  const emailNormalizado = email.trim().toLowerCase();
  return obterContasAlunos().find(function (c) {
    return c.email === emailNormalizado && c.senha === senha && c.verificado === true;
  }) || null;
}

/* --- Fotos de perfil dos alunos (identificação) --- */

function obterFotosAlunos() {
  if (setadApiAtivo() && setadGetCache("fotosAlunos")) {
    return Object.assign({}, setadGetCache("fotosAlunos"));
  }
  const dados = localStorage.getItem(STORAGE_KEYS.fotosAlunos);
  return dados ? JSON.parse(dados) : {};
}

function salvarFotosAlunos(fotos) {
  if (setadApiAtivo()) {
    setadSetCache("fotosAlunos", fotos, null);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.fotosAlunos, JSON.stringify(fotos));
}

function obterFotoAluno(email) {
  const emailNormalizado = email.trim().toLowerCase();
  const fotos = obterFotosAlunos();
  return fotos[emailNormalizado] || null;
}

function salvarFotoAluno(email, dataUrl) {
  const emailNormalizado = email.trim().toLowerCase();
  const foto = {
    dataUrl: dataUrl,
    atualizadoEm: new Date().toISOString()
  };

  if (setadApiAtivo()) {
    const fotos = obterFotosAlunos();
    fotos[emailNormalizado] = foto;
    salvarFotosAlunos(fotos);
    SETADApi.salvarFotoAluno(emailNormalizado, dataUrl).catch(function () {});
    return foto;
  }

  const fotos = obterFotosAlunos();
  fotos[emailNormalizado] = foto;
  salvarFotosAlunos(fotos);
  return foto;
}

/* --- Fotos de perfil do corpo docente (identificação) --- */

function obterFotosStaff() {
  if (setadApiAtivo() && setadGetCache("fotosStaff")) {
    return Object.assign({}, setadGetCache("fotosStaff"));
  }
  const dados = localStorage.getItem(STORAGE_KEYS.fotosStaff);
  return dados ? JSON.parse(dados) : {};
}

function salvarFotosStaff(fotos) {
  if (setadApiAtivo()) {
    setadSetCache("fotosStaff", fotos, null);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.fotosStaff, JSON.stringify(fotos));
}

function obterFotoStaff(email) {
  const emailNormalizado = email.trim().toLowerCase();
  const fotos = obterFotosStaff();
  return fotos[emailNormalizado] || null;
}

function salvarFotoStaff(email, dataUrl) {
  const emailNormalizado = email.trim().toLowerCase();
  const foto = {
    dataUrl: dataUrl,
    atualizadoEm: new Date().toISOString()
  };

  if (setadApiAtivo()) {
    const fotos = obterFotosStaff();
    fotos[emailNormalizado] = foto;
    salvarFotosStaff(fotos);
    SETADApi.salvarFotoStaff(emailNormalizado, dataUrl).catch(function () {});
    return foto;
  }

  const fotos = obterFotosStaff();
  fotos[emailNormalizado] = foto;
  salvarFotosStaff(fotos);
  return foto;
}

/**
 * Escapa HTML para evitar injeção ao exibir textos do usuário.
 */
function escaparHtml(texto) {
  if (!texto) return "";
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function gerarId(prefixo) {
  return prefixo + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function formatarData(isoString) {
  const data = new Date(isoString);
  return data.toLocaleDateString("pt-BR");
}

function formatarTamanhoArquivo(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function obterStatusTrabalhoAluno(trabalho, entrega) {
  if (entrega) return "entregue";
  if (new Date(trabalho.prazo) < new Date()) return "atrasado";
  return "pendente";
}

function obterLabelStatus(status) {
  const labels = {
    entregue: "Entregue",
    pendente: "Pendente",
    atrasado: "Atrasado",
    avaliando: "Em avaliação"
  };
  return labels[status] || status;
}

function obterClasseStatus(status) {
  if (status === "entregue") return "status--entregue";
  if (status === "avaliando") return "status--avaliando";
  if (status === "atrasado") return "status--atrasado";
  return "status--pendente";
}
