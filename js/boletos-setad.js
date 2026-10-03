/* Emissão e impressão de boletos (demonstração institucional) */

function montarHtmlBoletoImpressao(dados) {
  const pag = dados.pagamento;
  const bol = dados.boleto;
  const sacado = dados.sacado;
  const cedente = dados.cedente;
  const inst = dados.instituicao;

  return (
    "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\">" +
    "<title>Boleto SETAD — " + escaparHtml(pag.referencia) + "</title>" +
    "<style>" +
    "body{font-family:Arial,sans-serif;margin:24px;color:#111}" +
    ".boleto{border:2px solid #23406b;padding:20px;max-width:720px}" +
    ".boleto h1{font-size:1.1rem;color:#23406b;margin:0 0 12px}" +
    ".boleto__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}" +
    ".boleto__linha{margin:16px 0;padding:12px;background:#f4f6fa;font-family:monospace;font-size:0.95rem;word-break:break-all}" +
    ".boleto__valor{font-size:1.35rem;font-weight:700}" +
    "@media print{body{margin:0}.no-print{display:none}}" +
    "</style></head><body>" +
    '<div class="boleto">' +
    "<h1>SETAD — Seminário Teológico · Boleto bancário</h1>" +
    "<p><strong>Cedente:</strong> " + escaparHtml(cedente.titular || "SETAD") + "</p>" +
    "<p><strong>Banco / convênio:</strong> " + escaparHtml(inst.nome) +
    (bol.convenio && bol.convenio !== "—" ? " · Convênio " + escaparHtml(bol.convenio) : "") + "</p>" +
    '<div class="boleto__grid">' +
    "<div><strong>Sacado</strong><br>" + escaparHtml(sacado.nome) + "<br>" +
    escaparHtml(sacado.email) + (sacado.cpf ? "<br>CPF: " + escaparHtml(sacado.cpf) : "") + "</div>" +
    "<div><strong>Vencimento</strong><br>" + escaparHtml(formatarData(bol.vencimento)) + "<br>" +
    "<span class=\"boleto__valor\">" + formatarMoeda(pag.valor) + "</span></div>" +
    "</div>" +
    "<p><strong>Referência:</strong> " + escaparHtml(pag.referencia) + "</p>" +
    "<p><strong>Nosso número:</strong> " + escaparHtml(bol.nossoNumero) + "</p>" +
    "<p><strong>Linha digitável</strong></p>" +
    '<div class="boleto__linha">' + escaparHtml(bol.linhaDigitavel) + "</div>" +
    "<p><small>Demonstração local — compensação simulada em até 3 dias úteis. " +
    "Em produção, use API do banco emissor.</small></p>" +
    '<p class="no-print"><button onclick="window.print()">Imprimir boleto</button></p>' +
    "</div></body></html>"
  );
}

function imprimirBoletoSetad(dadosEmissao) {
  const html = montarHtmlBoletoImpressao(dadosEmissao);
  if (typeof SETADImpressao !== "undefined") {
    SETADImpressao.imprimirHtml(html, {
      titulo: "Boleto SETAD",
      enviarPontePdf: false
    });
    return true;
  }
  const janela = window.open("", "_blank", "width=800,height=720");
  if (!janela) {
    alert("Permita pop-ups para imprimir o boleto.");
    return false;
  }
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  setTimeout(function () {
    janela.print();
  }, 400);
  return true;
}

function renderizarEmissaoBoletoSecretaria(containerId, sessao) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    '<p class="financeiro-aviso">Emita boleto para alunos com matrícula ativa. O boleto pode ser impresso na hora para entrega presencial.</p>' +
    '<div id="boletoSecMensagem" class="form-mensagem" role="alert"></div>' +
    '<form id="formBoletoSecretaria" class="financeiro-form-agendar colaboradores-form">' +
    "<h3>Emitir boleto</h3>" +
    '<div class="financeiro-form-grid colaboradores-form__grid">' +
    '<div class="form-group"><label for="bolEmailAluno">E-mail do aluno *</label>' +
    '<input type="email" id="bolEmailAluno" required></div>' +
    '<div class="form-group"><button type="button" class="btn btn--secondary" id="bolBtnCarregarParcelas">Carregar débitos</button></div>' +
    '<div class="form-group form-group--full"><label for="bolPagamentoId">Parcela / débito em aberto</label>' +
    '<select id="bolPagamentoId"><option value="">— Informe o e-mail e carregue —</option></select></div>' +
    '<div class="form-group"><label for="bolValor">Valor (R$) — cobrança avulsa</label>' +
    '<input type="number" id="bolValor" min="0" step="0.01" placeholder="Opcional se escolher parcela"></div>' +
    '<div class="form-group form-group--full"><label for="bolReferencia">Descrição</label>' +
    '<input type="text" id="bolReferencia" placeholder="Ex.: Mensalidade 03/2026"></div>' +
    '<div class="form-group form-group--full colaboradores-form__acoes">' +
    '<button type="submit" class="btn btn--primary">Emitir e imprimir boleto</button>' +
    "</div></div></form>";

  const btnCarregar = document.getElementById("bolBtnCarregarParcelas");
  if (btnCarregar) {
    btnCarregar.addEventListener("click", function () {
      const email = document.getElementById("bolEmailAluno").value.trim().toLowerCase();
      const select = document.getElementById("bolPagamentoId");
      if (!email) return;
      const parcelas = obterPagamentosPorAluno(email).filter(function (p) {
        return p.status === "pendente" || p.status === "agendado";
      });
      select.innerHTML =
        parcelas.length === 0
          ? '<option value="">Nenhum débito em aberto — use valor avulso</option>'
          : '<option value="">Selecione uma parcela...</option>' +
            parcelas
              .map(function (p) {
                return (
                  '<option value="' + escaparHtml(p.id) + '">' +
                  escaparHtml(p.referencia) + " — " + formatarMoeda(p.valor) +
                  "</option>"
                );
              })
              .join("");
    });
  }

  document.getElementById("formBoletoSecretaria").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const msg = document.getElementById("boletoSecMensagem");
    msg.className = "form-mensagem";
    msg.textContent = "";

    const email = document.getElementById("bolEmailAluno").value.trim().toLowerCase();
    const pagamentoId = document.getElementById("bolPagamentoId").value;
    let resultado;

    if (pagamentoId) {
      resultado = emitirBoletoParaPagamento(
        pagamentoId,
        sessao && sessao.email ? sessao.email : "secretaria"
      );
    } else {
      resultado = criarPagamentoParaBoletoSecretaria(
        {
          email: email,
          valor: document.getElementById("bolValor").value,
          referencia: document.getElementById("bolReferencia").value,
          tipoCobranca: "mensalidade"
        },
        sessao
      );
    }

    if (!resultado.ok) {
      msg.className = "form-mensagem form-mensagem--erro visible";
      msg.textContent = resultado.erro;
      return;
    }

    imprimirBoletoSetad(resultado);
    msg.className = "form-mensagem form-mensagem--sucesso visible";
    msg.textContent =
      "Boleto emitido para " + resultado.sacado.nome + ". A janela de impressão foi aberta.";
  });
}

function configurarImpressaoBoletoAluno(parcela, sessao) {
  const resultado = emitirBoletoParaPagamento(
    parcela.id,
    sessao && sessao.email ? sessao.email : "aluno"
  );
  if (!resultado.ok) {
    alert(resultado.erro);
    return;
  }
  imprimirBoletoSetad(resultado);
}
