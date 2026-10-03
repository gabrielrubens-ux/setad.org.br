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
    "tab-cadastro": {
      titulo: "Cadastro presencial",
      subtitulo: "Registro de alunos que procuram o seminário presencialmente."
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
  configurarCadastroPresencial(sessao, { omitirPagamento: true });
  renderizarInboxWpp(sessao);
  if (typeof configurarLinkTrocarAreaInstitucional === "function") {
    configurarLinkTrocarAreaInstitucional();
  }
}
