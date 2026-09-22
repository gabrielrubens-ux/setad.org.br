/* ============================================================
   pagamento-matricula.js — Área de pagamento pós-matrícula
   Transferência, PIX e cartão (demonstração local).
   ============================================================ */

let pagamentoMatriculaAtual = null;
let matriculaPagamentoAtual = null;
let formaPagamentoMatricula = "Transferência";

function inicializarPagamentoMatricula() {
  const params = new URLSearchParams(window.location.search);
  const matriculaId = params.get("matricula");
  const email = params.get("email");

  if (!matriculaId || !email) {
    mostrarErroPagamentoMatricula(
      "Link de pagamento inválido. Volte ao formulário de matrícula e tente novamente.",
      "index.html"
    );
    return;
  }

  const fluxo = (window.SETAD && SETAD.ready) ? SETAD.ready : Promise.resolve();

  fluxo.then(function () {
    if (window.SETAD && SETAD.apiAtivo) {
      return SETADApi.obterMatriculaPublica(matriculaId, email).then(function (resposta) {
        if (!resposta.ok) return resposta;
        if (SETAD.cache.matriculas) {
          const existe = SETAD.cache.matriculas.some(function (m) { return m.id === resposta.matricula.id; });
          if (!existe) SETAD.cache.matriculas.push(resposta.matricula);
        }
        if (resposta.pagamento && SETAD.cache.pagamentos) {
          const existePag = SETAD.cache.pagamentos.some(function (p) { return p.id === resposta.pagamento.id; });
          if (!existePag) SETAD.cache.pagamentos.push(resposta.pagamento);
        }
        return resposta;
      });
    }

    inicializarDadosFinanceiros();
    matriculaPagamentoAtual = obterMatriculaPorId(matriculaId);

    if (!matriculaPagamentoAtual || matriculaPagamentoAtual.email !== email.trim().toLowerCase()) {
      return { ok: false, erro: "Inscrição não encontrada ou e-mail não confere com o cadastro." };
    }

    pagamentoMatriculaAtual = obterPagamentoMatriculaPorMatriculaId(matriculaId);
    if (!pagamentoMatriculaAtual) {
      criarPagamentoDeMatricula(matriculaPagamentoAtual);
      pagamentoMatriculaAtual = obterPagamentoMatriculaPorMatriculaId(matriculaId);
    }

    return {
      ok: !!pagamentoMatriculaAtual,
      matricula: matriculaPagamentoAtual,
      pagamento: pagamentoMatriculaAtual,
      erro: "Não foi possível carregar o pagamento da matrícula. Tente novamente em instantes."
    };
  }).then(function (resposta) {
    if (!resposta || !resposta.ok) {
      mostrarErroPagamentoMatricula(
        (resposta && resposta.erro) || "Não foi possível carregar o pagamento da matrícula.",
        "index.html"
      );
      return;
    }

    matriculaPagamentoAtual = resposta.matricula;
    pagamentoMatriculaAtual = resposta.pagamento;

    const linkSenha = obterUrlLoginAposMatricula(matriculaPagamentoAtual.email);
    const linkPular = document.getElementById("linkPularPagamento");
    const linkCriarSenha = document.getElementById("linkCriarSenhaAposPago");

    if (linkPular) linkPular.href = linkSenha;
    if (linkCriarSenha) linkCriarSenha.href = linkSenha;

    if (pagamentoMatriculaAtual.status === "pago") {
      mostrarPagamentoMatriculaJaQuitado();
      return;
    }

    document.getElementById("pagamentoMatriculaConteudo").hidden = false;
    renderizarResumoPagamentoMatricula();
    renderizarPainelFormaPagamentoMatricula(formaPagamentoMatricula);
    configurarEventosPagamentoMatricula();
  }).catch(function () {
    mostrarErroPagamentoMatricula(
      "Erro de conexão com o servidor. Tente novamente em instantes.",
      "index.html"
    );
  });
}

function mostrarErroPagamentoMatricula(mensagem, linkVoltar) {
  const erroEl = document.getElementById("pagamentoMatriculaErro");
  erroEl.hidden = false;
  erroEl.innerHTML =
    "<strong>Não foi possível abrir o pagamento</strong><p>" + escaparHtml(mensagem) + "</p>" +
    '<a class="btn btn--secondary" href="' + escaparHtml(linkVoltar) + '">Voltar à matrícula</a>';
}

function mostrarPagamentoMatriculaJaQuitado() {
  document.getElementById("pagamentoMatriculaPago").hidden = false;
  document.getElementById("pagamentoMatriculaPagoTexto").innerHTML =
    "<strong>Taxa de matrícula já quitada!</strong><br>" +
    escaparHtml(matriculaPagamentoAtual.nomeCompleto) +
    ", o pagamento da sua inscrição já foi registrado. Agora crie sua senha de acesso ao portal.";
}

function renderizarResumoPagamentoMatricula() {
  const modulo = MODULOS_CURSO[matriculaPagamentoAtual.modulo];
  const moduloNome = modulo ? modulo.nome : matriculaPagamentoAtual.modulo;
  const mensalidade = obterMensalidadeModulo(matriculaPagamentoAtual.modulo);

  document.getElementById("pagamentoMatriculaSubtitulo").textContent =
    matriculaPagamentoAtual.nomeCompleto + " — " + moduloNome;

  document.getElementById("pagamentoMatriculaResumo").innerHTML =
    '<article class="pagamento-matricula__card">' +
      '<div class="pagamento-matricula__card-linha">' +
        "<span>Curso</span><strong>" + escaparHtml(moduloNome) + "</strong>" +
      "</div>" +
      '<div class="pagamento-matricula__card-linha">' +
        "<span>Inscrito</span><strong>" + escaparHtml(matriculaPagamentoAtual.email) + "</strong>" +
      "</div>" +
      '<div class="pagamento-matricula__card-linha">' +
        "<span>Mensalidade do curso</span><strong>" + formatarMoeda(mensalidade) + "</strong>" +
      "</div>" +
      '<div class="pagamento-matricula__card-linha pagamento-matricula__card-linha--destaque">' +
        "<span>Taxa de matrícula (pagar agora)</span>" +
        "<strong class=\"pagamento-matricula__valor\">" + formatarMoeda(pagamentoMatriculaAtual.valor) + "</strong>" +
      "</div>" +
    "</article>";
}

function renderizarPainelFormaPagamentoMatricula(forma) {
  formaPagamentoMatricula = forma;
  const painel = document.getElementById("pagamentoMatriculaPainel");
  if (!painel) return;

  document.querySelectorAll(".pagamento-matricula__opcao").forEach(function (btn) {
    btn.classList.toggle(
      "pagamento-matricula__opcao--ativa",
      btn.getAttribute("data-forma") === forma
    );
  });

  let html = "";

  if (forma === "Transferência") {
    html =
      '<div class="pagamento-matricula__painel-card">' +
        "<h3>Dados para transferência bancária</h3>" +
        "<p>Transfira o valor exato da taxa de matrícula para a conta institucional do SETAD:</p>" +
        '<dl class="pagamento-matricula__dados-banco">' +
          renderizarItemDadoBanco("Titular", CONTA_BANCARIA_SETAD.titular) +
          renderizarItemDadoBanco("CNPJ", CONTA_BANCARIA_SETAD.cnpj) +
          renderizarItemDadoBanco("Banco", CONTA_BANCARIA_SETAD.banco + " — " + CONTA_BANCARIA_SETAD.bancoNome) +
          renderizarItemDadoBanco("Agência", CONTA_BANCARIA_SETAD.agencia) +
          renderizarItemDadoBanco("Conta", CONTA_BANCARIA_SETAD.conta) +
          renderizarItemDadoBanco("Tipo", CONTA_BANCARIA_SETAD.tipo) +
          renderizarItemDadoBanco("Valor", formatarMoeda(pagamentoMatriculaAtual.valor), "pagamento-matricula__valor-inline") +
        "</dl>" +
        '<p class="pagamento-matricula__aviso">Após a transferência, clique em <strong>Confirmar pagamento</strong> e guarde o protocolo gerado.</p>' +
      "</div>";
  } else if (forma === "PIX") {
    const codigoPix = gerarCodigoPixDemo(pagamentoMatriculaAtual.valor, pagamentoMatriculaAtual.referencia);
    const linkPix = gerarLinkPixDemonstracao(pagamentoMatriculaAtual.valor, pagamentoMatriculaAtual.referencia);

    html =
      '<div class="pagamento-matricula__painel-card">' +
        "<h3>PIX — pagamento instantâneo</h3>" +
        "<p>Pague <strong>" + formatarMoeda(pagamentoMatriculaAtual.valor) + "</strong> via PIX com a chave CNPJ do seminário:</p>" +
        '<div class="pagamento-matricula__pix-chave">' +
          "<span>Chave PIX (CNPJ)</span>" +
          "<strong id=\"pixChaveMatricula\">" + escaparHtml(CONTA_BANCARIA_SETAD.cnpj) + "</strong>" +
          '<button type="button" class="btn btn--secondary btn--small" id="btnCopiarChavePix">Copiar chave</button>' +
        "</div>" +
        '<p class="pagamentos-checkout__label">Código PIX copia e cola:</p>' +
        '<div class="pagamentos-pix-codigo" id="codigoPixMatricula">' + escaparHtml(codigoPix) + "</div>" +
        '<div class="pagamento-matricula__pix-acoes">' +
          '<button type="button" class="btn btn--secondary" id="btnCopiarPixMatricula">Copiar código PIX</button>' +
          '<a class="btn btn--primary" id="linkPixMatricula" href="' + escaparHtml(linkPix) + '" target="_blank" rel="noopener noreferrer">Abrir link PIX — ' + formatarMoeda(pagamentoMatriculaAtual.valor) + "</a>" +
        "</div>" +
        "<p><small>O link abre a página de pagamento PIX com o valor de <strong>" + formatarMoeda(pagamentoMatriculaAtual.valor) + "</strong> já preenchido (demonstração).</small></p>" +
      "</div>";
  } else {
    html =
      '<div class="pagamento-matricula__painel-card">' +
        "<h3>Cartão de crédito ou débito</h3>" +
        "<p>Informe os dados do cartão para quitar a taxa de matrícula de <strong>" + formatarMoeda(pagamentoMatriculaAtual.valor) + "</strong>.</p>" +
        '<div class="pagamento-matricula__tipo-cartao">' +
          '<label class="pagamento-matricula__tipo-cartao-item">' +
            '<input type="radio" name="tipoCartaoMatricula" value="crédito" checked> Crédito' +
          "</label>" +
          '<label class="pagamento-matricula__tipo-cartao-item">' +
            '<input type="radio" name="tipoCartaoMatricula" value="débito"> Débito' +
          "</label>" +
        "</div>" +
        '<div class="pagamentos-cartao-grid">' +
          '<div class="form-group form-group--full"><label for="cartaoNomeMatricula">Nome no cartão</label>' +
            '<input type="text" id="cartaoNomeMatricula" required autocomplete="cc-name"></div>' +
          '<div class="form-group form-group--full"><label for="cartaoNumeroMatricula">Número do cartão</label>' +
            '<input type="text" id="cartaoNumeroMatricula" placeholder="0000 0000 0000 0000" maxlength="19" required autocomplete="cc-number"></div>' +
          '<div class="form-group"><label for="cartaoValidadeMatricula">Validade</label>' +
            '<input type="text" id="cartaoValidadeMatricula" placeholder="MM/AA" maxlength="5" required autocomplete="cc-exp"></div>' +
          '<div class="form-group"><label for="cartaoCvvMatricula">CVV</label>' +
            '<input type="password" id="cartaoCvvMatricula" placeholder="***" maxlength="4" required autocomplete="cc-csc"></div>' +
        "</div>" +
        '<p class="pagamentos-cartao-aviso">Demonstração — não insira dados reais de cartão em ambiente de testes.</p>' +
      "</div>";
  }

  painel.innerHTML = html;
  configurarCopiasPixMatricula();
}

function renderizarItemDadoBanco(label, valor, classeExtra) {
  const classe = classeExtra ? " " + classeExtra : "";
  const idBotao = "btnCopiar" + label.replace(/\W/g, "");
  return (
    "<div class=\"pagamento-matricula__dado" + classe + "\">" +
      "<dt>" + escaparHtml(label) + "</dt>" +
      "<dd><span id=\"" + idBotao + "Valor\">" + escaparHtml(valor) + "</span>" +
      '<button type="button" class="pagamento-matricula__copiar" data-copiar="' + escaparHtml(valor) + '" data-feedback="' + idBotao + '">Copiar</button></dd>' +
    "</div>"
  );
}

function configurarCopiasPixMatricula() {
  const btnChave = document.getElementById("btnCopiarChavePix");
  if (btnChave) {
    btnChave.addEventListener("click", function () {
      copiarTextoPagamento(CONTA_BANCARIA_SETAD.cnpj, btnChave, "Chave copiada!");
    });
  }

  const btnCodigo = document.getElementById("btnCopiarPixMatricula");
  if (btnCodigo) {
    btnCodigo.addEventListener("click", function () {
      const codigo = document.getElementById("codigoPixMatricula").textContent;
      copiarTextoPagamento(codigo, btnCodigo, "Código copiado!");
    });
  }

  document.querySelectorAll(".pagamento-matricula__copiar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copiarTextoPagamento(btn.getAttribute("data-copiar"), btn, "Copiado!");
    });
  });
}

function copiarTextoPagamento(texto, botao, mensagemOk) {
  if (!navigator.clipboard) {
    alert(texto);
    return;
  }

  navigator.clipboard.writeText(texto).then(function () {
    const textoOriginal = botao.textContent;
    botao.textContent = mensagemOk;
    setTimeout(function () {
      botao.textContent = textoOriginal;
    }, 1800);
  });
}

function configurarEventosPagamentoMatricula() {
  document.querySelectorAll(".pagamento-matricula__opcao").forEach(function (btn) {
    btn.addEventListener("click", function () {
      renderizarPainelFormaPagamentoMatricula(btn.getAttribute("data-forma"));
    });
  });

  document.getElementById("btnConfirmarPagamentoMatricula").addEventListener("click", confirmarPagamentoMatricula);
}

function confirmarPagamentoMatricula() {
  const mensagemEl = document.getElementById("pagamentoMatriculaMensagem");
  const sucessoEl = document.getElementById("pagamentoMatriculaSucesso");
  mensagemEl.className = "form-mensagem";
  mensagemEl.textContent = "";
  sucessoEl.hidden = true;

  if (!document.getElementById("pagamentoAceiteTermos").checked) {
    mensagemEl.className = "form-mensagem form-mensagem--erro visible";
    mensagemEl.textContent = "Aceite os termos para continuar.";
    return;
  }

  let subtipoCartao = null;

  if (formaPagamentoMatricula === "Cartão") {
    const numero = document.getElementById("cartaoNumeroMatricula").value.replace(/\s/g, "");
    const nome = document.getElementById("cartaoNomeMatricula").value.trim();
    const validade = document.getElementById("cartaoValidadeMatricula").value.trim();
    const cvv = document.getElementById("cartaoCvvMatricula").value.trim();
    const tipoSelecionado = document.querySelector('input[name="tipoCartaoMatricula"]:checked');

    if (!nome || numero.length < 13 || validade.length < 4 || cvv.length < 3) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Preencha todos os dados do cartão (demonstração).";
      return;
    }

    subtipoCartao = tipoSelecionado ? tipoSelecionado.value : "crédito";
  }

  const resultado = confirmarPagamentoMatriculaPublico(
    pagamentoMatriculaAtual.id,
    matriculaPagamentoAtual.email,
    formaPagamentoMatricula,
    subtipoCartao
  );

  if (!resultado.ok) {
    mensagemEl.className = "form-mensagem form-mensagem--erro visible";
    mensagemEl.textContent = resultado.erro;
    return;
  }

  document.getElementById("pagamentoMatriculaConteudo").hidden = true;
  document.getElementById("pagamentoMatriculaPago").hidden = false;
  document.getElementById("pagamentoMatriculaPagoTexto").innerHTML =
    "<strong>Pagamento confirmado!</strong><br>" +
    "Protocolo: <strong>" + escaparHtml(resultado.protocolo) + "</strong><br>" +
    escaparHtml(resultado.referencia) + " — " + formatarMoeda(resultado.valor) +
    "<br><br>Em instantes você poderá criar sua senha de acesso ao portal.";
}

function obterUrlLoginAposMatricula(email) {
  return "../login-aluno.html?cadastro=1&email=" + encodeURIComponent(email);
}

document.addEventListener("DOMContentLoaded", inicializarPagamentoMatricula);
