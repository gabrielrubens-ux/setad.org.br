/* ============================================================
   pagamentos-aluno.js — Área de pagamentos do aluno
   Extrato do curso, opções PIX / Boleto / Cartão (demonstração).
   ============================================================ */

let pagamentoAlunoSelecionado = null;
let formaPagamentoSelecionada = null;

function renderizarAreaPagamentosAluno(sessao) {
  const container = document.getElementById("pagamentosAlunoContainer");
  if (!container) return;

  garantirExtratoAluno(sessao);
  const resumo = resumoExtratoAluno(sessao.email);
  const proxima = obterProximaParcelaPendente(sessao.email);
  const parcelas = obterPagamentosPorAluno(sessao.email);

  container.innerHTML =
    '<div class="pagamentos-hero">' +
      '<div class="pagamentos-hero__texto">' +
        "<h2>Central de Pagamentos</h2>" +
        "<p>Gerencie suas mensalidades do curso teológico (3 anos · 36 parcelas). " +
        "Ambiente protegido para consulta de extrato e quitação de débitos.</p>" +
      "</div>" +
      '<div class="pagamentos-hero__selo" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>' +
        "<span>Conexão segura</span>" +
      "</div>" +
    "</div>" +
    '<div class="financeiro-cards pagamentos-resumo">' +
      '<article class="financeiro-card"><p class="financeiro-card__label">Total do curso</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.valorCurso) + "</p></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Já pago</p>' +
        '<p class="financeiro-card__valor">' + formatarMoeda(resumo.valorPago) + "</p>" +
        "<small>" + resumo.qtdPagas + " de " + resumo.totalParcelas + " parcelas</small></article>" +
      '<article class="financeiro-card"><p class="financeiro-card__label">Em aberto</p>' +
        '<p class="financeiro-card__valor financeiro-card__valor--alerta">' +
          formatarMoeda(resumo.valorPendente + resumo.valorAgendado) + "</p></article>" +
    "</div>" +
    (proxima
      ? '<div class="pagamentos-proxima">' +
          "<h3>Próximo pagamento</h3>" +
          "<p><strong>" + escaparHtml(proxima.referencia) + "</strong> — " +
          formatarMoeda(proxima.valor) +
          (proxima.vencimento ? " · Vencimento: " + formatarData(proxima.vencimento) : "") +
          "</p>" +
          '<button type="button" class="btn btn--primary" id="btnPagarProxima" data-id="' +
            escaparHtml(proxima.id) + '">Pagar agora</button>' +
        "</div>"
      : '<div class="pagamentos-proxima pagamentos-proxima--ok">' +
          "<p><strong>Parabéns!</strong> Não há parcelas pendentes no momento.</p></div>") +
    '<section class="pagamentos-opcoes">' +
      "<h3>Formas de pagamento</h3>" +
      '<p class="pagamentos-opcoes__texto">Escolha como deseja quitar a parcela em aberto. ' +
      "Os dados são processados de forma segura (demonstração local).</p>" +
      '<div class="pagamentos-metodos">' +
        '<button type="button" class="pagamentos-metodo" data-forma="PIX">' +
          '<span class="pagamentos-metodo__icone">PIX</span>' +
          "<strong>PIX instantâneo</strong>" +
          "<span>Confirmação em segundos</span>" +
        "</button>" +
        '<button type="button" class="pagamentos-metodo" data-forma="Boleto">' +
          '<span class="pagamentos-metodo__icone">BOL</span>' +
          "<strong>Boleto bancário</strong>" +
          "<span>Vencimento em 3 dias úteis</span>" +
        "</button>" +
        '<button type="button" class="pagamentos-metodo" data-forma="Cartão">' +
          '<span class="pagamentos-metodo__icone">CRD</span>' +
          "<strong>Cartão de crédito</strong>" +
          "<span>Parcelamento em 1x</span>" +
        "</button>" +
      "</div>" +
    "</section>" +
    '<div id="pagamentosCheckout" class="pagamentos-checkout" hidden></div>' +
    '<section class="pagamentos-extrato">' +
      "<h3>Extrato completo do curso</h3>" +
      '<div class="pagamentos-filtros">' +
        '<button type="button" class="pagamentos-filtro pagamentos-filtro--ativa" data-filtro="todos">Todos</button>' +
        '<button type="button" class="pagamentos-filtro" data-filtro="pago">Pagos</button>' +
        '<button type="button" class="pagamentos-filtro" data-filtro="pendente">Pendentes</button>' +
        '<button type="button" class="pagamentos-filtro" data-filtro="agendado">Futuros</button>' +
      "</div>" +
      '<div id="pagamentosExtratoTabela"></div>' +
    "</section>" +
    '<p class="financeiro-aviso">' +
      "<strong>Segurança:</strong> em produção, esta área exige HTTPS, token de sessão e gateway " +
      "de pagamento certificado (PCI-DSS). Não compartilhe senhas ou códigos com terceiros." +
    "</p>";

  renderizarExtratoTabelaAluno(sessao.email, "todos");
  configurarEventosPagamentosAluno(sessao);
}

function renderizarExtratoTabelaAluno(email, filtro) {
  const container = document.getElementById("pagamentosExtratoTabela");
  if (!container) return;

  let parcelas = obterPagamentosPorAluno(email);
  if (filtro !== "todos") {
    parcelas = parcelas.filter(function (p) { return p.status === filtro; });
  }

  if (!parcelas.length) {
    container.innerHTML = '<p class="painel-vazio">Nenhum lançamento para este filtro.</p>';
    return;
  }

  container.innerHTML =
    '<table class="data-table">' +
      "<thead><tr>" +
        "<th>Referência</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Detalhes</th>" +
      "</tr></thead><tbody>" +
      parcelas.map(function (p) {
        const detalhe = p.status === "pago"
          ? (p.formaPagamento || "") + (p.protocolo ? " · " + p.protocolo : "")
          : (p.status === "pendente"
            ? '<button type="button" class="btn btn--small btn--primary btn-pagar-parcela" data-id="' +
              escaparHtml(p.id) + '">Pagar</button>'
            : "—");

        return (
          "<tr>" +
            "<td>" + escaparHtml(p.referencia) + "</td>" +
            "<td>" + (p.vencimento ? formatarData(p.vencimento) : "—") + "</td>" +
            "<td>" + formatarMoeda(p.valor) + "</td>" +
            '<td><span class="status-badge ' + obterClassePagamentoStatus(p.status) + '">' +
              obterLabelPagamentoStatus(p.status) + "</span></td>" +
            "<td>" + detalhe + "</td>" +
          "</tr>"
        );
      }).join("") +
    "</tbody></table>";
}

function configurarEventosPagamentosAluno(sessao) {
  const container = document.getElementById("pagamentosAlunoContainer");
  if (!container) return;

  container.querySelectorAll(".pagamentos-metodo").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const proxima = obterProximaParcelaPendente(sessao.email);
      if (!proxima) {
        alert("Não há parcelas em aberto para pagamento.");
        return;
      }
      formaPagamentoSelecionada = btn.getAttribute("data-forma");
      pagamentoAlunoSelecionado = proxima;
      abrirCheckoutAluno(sessao, proxima, formaPagamentoSelecionada);
    });
  });

  const btnProxima = document.getElementById("btnPagarProxima");
  if (btnProxima) {
    btnProxima.addEventListener("click", function () {
      const id = btnProxima.getAttribute("data-id");
      const parcela = obterPagamentosPorAluno(sessao.email).find(function (p) {
        return p.id === id;
      });
      if (parcela) {
        pagamentoAlunoSelecionado = parcela;
        formaPagamentoSelecionada = "PIX";
        abrirCheckoutAluno(sessao, parcela, "PIX");
      }
    });
  }

  container.querySelectorAll(".pagamentos-filtro").forEach(function (btn) {
    btn.addEventListener("click", function () {
      container.querySelectorAll(".pagamentos-filtro").forEach(function (b) {
        b.classList.remove("pagamentos-filtro--ativa");
      });
      btn.classList.add("pagamentos-filtro--ativa");
      renderizarExtratoTabelaAluno(sessao.email, btn.getAttribute("data-filtro"));
      rebindBotoesPagarParcela(sessao);
    });
  });

  rebindBotoesPagarParcela(sessao);
}

function rebindBotoesPagarParcela(sessao) {
  document.querySelectorAll(".btn-pagar-parcela").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-id");
      const parcela = obterPagamentosPorAluno(sessao.email).find(function (p) {
        return p.id === id;
      });
      if (parcela) {
        pagamentoAlunoSelecionado = parcela;
        formaPagamentoSelecionada = "PIX";
        abrirCheckoutAluno(sessao, parcela, "PIX");
      }
    });
  });
}

function abrirCheckoutAluno(sessao, parcela, forma) {
  const checkout = document.getElementById("pagamentosCheckout");
  if (!checkout) return;

  checkout.hidden = false;
  let conteudoForma = "";

  if (forma === "PIX") {
    const codigo = gerarCodigoPixDemo(parcela.valor, parcela.referencia);
    conteudoForma =
      '<p class="pagamentos-checkout__label">Copie o código PIX abaixo:</p>' +
      '<div class="pagamentos-pix-codigo" id="codigoPixAluno">' + escaparHtml(codigo) + "</div>" +
      '<button type="button" class="btn btn--secondary" id="btnCopiarPix">Copiar código PIX</button>' +
      "<p><small>Chave PIX (CNPJ): " + escaparHtml(CONTA_BANCARIA_SETAD.cnpj) + "</small></p>";
  } else if (forma === "Boleto") {
    conteudoForma =
      '<p class="pagamentos-checkout__label">Linha digitável do boleto:</p>' +
      '<div class="pagamentos-pix-codigo">' + escaparHtml(gerarLinhaBoletoDemo(parcela.id)) + "</div>" +
      "<p><small>O boleto será compensado em até 3 dias úteis após o pagamento.</small></p>";
  } else {
    conteudoForma =
      '<div class="pagamentos-cartao-grid">' +
        '<div class="form-group"><label>Nome no cartão</label>' +
          '<input type="text" id="cartaoNome" required autocomplete="cc-name"></div>' +
        '<div class="form-group"><label>Número do cartão</label>' +
          '<input type="text" id="cartaoNumero" placeholder="0000 0000 0000 0000" maxlength="19" required autocomplete="cc-number"></div>' +
        '<div class="form-group"><label>Validade</label>' +
          '<input type="text" id="cartaoValidade" placeholder="MM/AA" maxlength="5" required autocomplete="cc-exp"></div>' +
        '<div class="form-group"><label>CVV</label>' +
          '<input type="password" id="cartaoCvv" placeholder="***" maxlength="4" required autocomplete="cc-csc"></div>' +
      "</div>" +
      '<p class="pagamentos-cartao-aviso">Demonstração — não insira dados reais de cartão.</p>';
  }

  checkout.innerHTML =
    '<div class="pagamentos-checkout__card">' +
      '<button type="button" class="pagamentos-checkout__fechar" id="btnFecharCheckout" aria-label="Fechar">&times;</button>' +
      "<h3>Finalizar pagamento — " + escaparHtml(forma) + "</h3>" +
      "<p><strong>" + escaparHtml(parcela.referencia) + "</strong> · " + formatarMoeda(parcela.valor) + "</p>" +
      conteudoForma +
      '<label class="pagamentos-termos">' +
        '<input type="checkbox" id="aceiteTermos" required> ' +
        "Li e aceito os termos de pagamento e política de privacidade do SETAD." +
      "</label>" +
      '<button type="button" class="btn btn--primary pagamentos-checkout__confirmar" id="btnConfirmarPagamento">' +
        "Confirmar pagamento seguro" +
      "</button>" +
      '<div id="pagamentoSucesso" class="login-card__success" role="status" hidden></div>' +
      '<div id="pagamentoErro" class="login-card__error" role="alert" hidden></div>' +
    "</div>";

  checkout.scrollIntoView({ behavior: "smooth", block: "nearest" });

  document.getElementById("btnFecharCheckout").addEventListener("click", function () {
    checkout.hidden = true;
  });

  const btnCopiar = document.getElementById("btnCopiarPix");
  if (btnCopiar) {
    btnCopiar.addEventListener("click", function () {
      const codigo = document.getElementById("codigoPixAluno").textContent;
      navigator.clipboard.writeText(codigo).then(function () {
        btnCopiar.textContent = "Código copiado!";
      });
    });
  }

  document.getElementById("btnConfirmarPagamento").addEventListener("click", function () {
    const erroEl = document.getElementById("pagamentoErro");
    const sucessoEl = document.getElementById("pagamentoSucesso");
    erroEl.hidden = true;
    sucessoEl.hidden = true;

    if (!document.getElementById("aceiteTermos").checked) {
      erroEl.textContent = "Aceite os termos para continuar.";
      erroEl.hidden = false;
      return;
    }

    if (forma === "Cartão") {
      const numero = document.getElementById("cartaoNumero").value.replace(/\s/g, "");
      if (numero.length < 13) {
        erroEl.textContent = "Informe um número de cartão válido (demonstração).";
        erroEl.hidden = false;
        return;
      }
    }

    const resultado = alunoConfirmarPagamento(parcela.id, sessao.email, forma);
    if (!resultado.ok) {
      erroEl.textContent = resultado.erro;
      erroEl.hidden = false;
      return;
    }

    sucessoEl.innerHTML =
      "<strong>Pagamento confirmado!</strong><br>Protocolo: " + escaparHtml(resultado.protocolo) +
      "<br>" + escaparHtml(resultado.referencia) + " — " + formatarMoeda(resultado.valor);
    sucessoEl.hidden = false;

    setTimeout(function () {
      renderizarAreaPagamentosAluno(sessao);
    }, 2200);
  });
}
