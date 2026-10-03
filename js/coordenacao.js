/* Painel da coordenação pedagógica. */

function inicializarPainelCoordenacao() {
  var sessao = protegerPainelCoordenacao();
  if (!sessao) return;

  document.getElementById("usuarioNome").textContent = sessao.nome;
  document.getElementById("usuarioPerfil").textContent = obterLabelPerfil("coordenacao");

  var badgeWpp = document.getElementById("badgeWppNaoLidas");
  if (badgeWpp) {
    var naoLidas = contarConversasWppNaoLidas();
    badgeWpp.textContent = naoLidas;
    badgeWpp.hidden = naoLidas === 0;
  }

  var titulos = {
    "tab-visao": {
      titulo: "Visão Geral",
      subtitulo: "Matrículas e atendimentos do seminário."
    },
    "tab-alunos": {
      titulo: "Alunos",
      subtitulo: "Inscrições e acompanhamento pedagógico."
    },
    "tab-turmas": {
      titulo: "Turmas",
      subtitulo: "Polos e salas do SETAD — acompanhamento dos vínculos dos alunos."
    },
    "tab-cadastro": {
      titulo: "Cadastro presencial",
      subtitulo: "Registro de alunos que procuram o seminário presencialmente."
    },
    "tab-impressao": {
      titulo: "Impressão",
      subtitulo: "Documentos internos — impressoras de rede ou USB."
    },
    "tab-whatsapp": {
      titulo: "WhatsApp",
      subtitulo: "Atendimento e conversas do seminário."
    }
  };

  configurarAbasSecretaria(titulos, sessao);

  inicializarDadosPadrao();
  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
  if (typeof renderizarPainelTurmasInstitucional === "function") {
    renderizarPainelTurmasInstitucional("turmasCoordenacaoContainer", {
      intro:
        "Polo SETADE em destaque (nível e sala). Demais polos em Belém. Clique para ver alunos vinculados.",
      mostrarFiltro: true,
      mostrarAlunosAoClicar: true
    });
  }
  configurarCadastroPresencial(sessao, { omitirPagamento: true });
  if (typeof renderizarCentralImpressaoSetad === "function") {
    renderizarCentralImpressaoSetad("impressaoCoordenacaoContainer", sessao);
  }
  renderizarInboxWpp(sessao);
  if (typeof configurarLinkTrocarAreaInstitucional === "function") {
    configurarLinkTrocarAreaInstitucional();
  }
}
