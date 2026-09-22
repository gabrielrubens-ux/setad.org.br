/* ============================================================
   wpp-secretaria.js — Integração WhatsApp (demonstração local)
   Em produção: conectar à API oficial do WhatsApp Business (Meta).
   ============================================================ */

var WPP_SEMINARIO_NUMERO = "5591980852801";

function normalizarTelefoneWpp(telefone) {
  if (!telefone) return "";
  var numeros = String(telefone).replace(/\D/g, "");
  if (numeros.length === 11) {
    return "55" + numeros;
  }
  if (numeros.length === 13 && numeros.indexOf("55") === 0) {
    return numeros;
  }
  return numeros;
}

function wppApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function obterConversasWpp() {
  if (wppApiAtivo() && window.SETAD.cache.wppConversas) {
    return window.SETAD.cache.wppConversas.slice();
  }
  var dados = localStorage.getItem(STORAGE_KEYS.wppConversas);
  return dados ? JSON.parse(dados) : [];
}

function salvarConversasWpp(conversas) {
  if (wppApiAtivo()) {
    window.SETAD.setCache("wppConversas", conversas, "wpp/conversas");
    return;
  }
  localStorage.setItem(STORAGE_KEYS.wppConversas, JSON.stringify(conversas));
}

function obterConversaWppPorId(id) {
  return obterConversasWpp().find(function (c) {
    return c.id === id;
  }) || null;
}

function obterOuCriarConversaWpp(telefone, nome, origem) {
  var conversas = obterConversasWpp();
  var numero = normalizarTelefoneWpp(telefone);
  var chave = numero || "visitante-site";

  var conversa = conversas.find(function (c) {
    return c.chave === chave;
  });

  if (!conversa) {
    conversa = {
      id: gerarId("wpp"),
      chave: chave,
      telefone: numero || null,
      nome: nome || "Visitante",
      origem: origem || "whatsapp",
      naoLidas: 0,
      matriculaId: null,
      ultimaAtualizacao: new Date().toISOString(),
      mensagens: []
    };
    conversas.unshift(conversa);
  } else if (nome) {
    conversa.nome = nome;
  }

  salvarConversasWpp(conversas);
  return conversa;
}

function adicionarMensagemWpp(opcoes) {
  obterOuCriarConversaWpp(
    opcoes.telefone,
    opcoes.nome,
    opcoes.origemConversa
  );

  var conversas = obterConversasWpp();
  var chave = normalizarTelefoneWpp(opcoes.telefone) || "visitante-site";
  var conversa = conversas.find(function (c) {
    return c.chave === chave;
  });

  if (!conversa) return null;

  var mensagem = {
    id: gerarId("msg"),
    texto: opcoes.texto,
    direcao: opcoes.direcao || "entrada",
    data: new Date().toISOString(),
    autor: opcoes.autor || (opcoes.direcao === "saida" ? "Secretaria SETAD" : conversa.nome)
  };

  conversa.mensagens.push(mensagem);
  conversa.ultimaAtualizacao = mensagem.data;

  if (opcoes.direcao === "entrada") {
    conversa.naoLidas += 1;
  }

  if (opcoes.matriculaId) {
    conversa.matriculaId = opcoes.matriculaId;
  }

  salvarConversasWpp(conversas);
  return conversa;
}

function registrarInteresseWppSite() {
  adicionarMensagemWpp({
    telefone: null,
    nome: "Interesse via site",
    origemConversa: "site-wpp",
    texto: "Visitante clicou em \"Quero atendimento\" e foi direcionado ao WhatsApp do seminário.",
    direcao: "entrada",
    autor: "Balão do site"
  });
}

function notificarMatriculaNoWpp(matricula) {
  var moduloNome = MODULOS_CURSO[matricula.modulo]
    ? MODULOS_CURSO[matricula.modulo].nome
    : matricula.modulo;

  var origemLabel = matricula.origem === "presencial"
    ? "cadastro presencial"
    : "matrícula online";

  adicionarMensagemWpp({
    telefone: matricula.telefone,
    nome: matricula.nomeCompleto,
    origemConversa: matricula.origem === "presencial" ? "presencial" : "site",
    texto:
      "Nova " + origemLabel + ": " + matricula.nomeCompleto +
      " — " + moduloNome + " — " + matricula.email,
    direcao: "entrada",
    autor: "Sistema SETAD",
    matriculaId: matricula.id
  });
}

function marcarConversaWppComoLida(conversaId) {
  var conversas = obterConversasWpp();
  conversas.forEach(function (c) {
    if (c.id === conversaId) {
      c.naoLidas = 0;
    }
  });
  salvarConversasWpp(conversas);
}

function enviarRespostaWpp(conversaId, texto, autorNome) {
  var conversa = obterConversaWppPorId(conversaId);
  if (!conversa || !texto.trim()) return null;

  adicionarMensagemWpp({
    telefone: conversa.telefone,
    nome: conversa.nome,
    origemConversa: conversa.origem,
    texto: texto.trim(),
    direcao: "saida",
    autor: autorNome || "Secretaria SETAD",
    matriculaId: conversa.matriculaId
  });

  if (conversa.telefone) {
    var url =
      "https://wa.me/" + conversa.telefone +
      "?text=" + encodeURIComponent(texto.trim());
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.open(
      "https://wa.me/" + WPP_SEMINARIO_NUMERO,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return conversa;
}

function contarConversasWppNaoLidas() {
  return obterConversasWpp().reduce(function (total, c) {
    return total + (c.naoLidas || 0);
  }, 0);
}

function obterLabelOrigemMatricula(origem) {
  var labels = {
    site: "Site",
    presencial: "Presencial",
    whatsapp: "WhatsApp"
  };
  return labels[origem] || origem || "Site";
}
