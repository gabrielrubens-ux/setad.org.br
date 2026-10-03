/* Central de impressão — áreas internas SETAD */

function renderizarCentralImpressaoSetad(containerId, sessao) {
  var container = document.getElementById(containerId);
  if (!container || typeof SETADImpressao === "undefined") return;

  if (!SETADImpressao.usuarioPodeImprimirInterno()) {
    container.innerHTML =
      '<p class="lista-vazia">Acesso restrito à equipe institucional.</p>';
    return;
  }

  var cfg = SETADImpressao.obterConfig();

  container.innerHTML =
    '<div class="setad-impressao">' +
    '<p class="section__text setad-impressao__intro">' +
    "Imprima boletos, provas, trabalhos e documentos em PDF ou imagem. " +
    "No navegador, escolha a impressora (rede ou USB) na janela do sistema. " +
    "Para envio direto à impressora padrão ou de rede, instale a " +
    "<strong>SETAD Print Bridge</strong> no computador da secretaria (ver <code>print-bridge/</code>).</p>" +
    '<div id="setadImpressaoStatus" class="setad-impressao__status" role="status"></div>' +
    '<section class="setad-impressao__bloco">' +
    "<h3>Configuração da ponte local</h3>" +
    '<div class="matricula-form__grid">' +
    '<div class="form-group form-group--full">' +
    '<label for="setadBridgeUrl">Endereço da ponte (este PC)</label>' +
    '<input type="url" id="setadBridgeUrl" value="' +
    escaparHtml(cfg.bridgeUrl) +
    '" placeholder="http://127.0.0.1:9247"></div>' +
    '<div class="form-group">' +
    '<label for="setadImpressoraRede">Impressora (rede/USB)</label>' +
    '<select id="setadImpressoraRede"><option value="">Padrão do Windows</option></select></div>' +
    '<div class="form-group">' +
    '<label for="setadCopias">Cópias</label>' +
    '<input type="number" id="setadCopias" min="1" max="20" value="' +
    String(cfg.copias || 1) +
    '"></div>' +
    '<div class="form-group setad-impressao__acoes">' +
    '<button type="button" class="btn btn--secondary" id="setadBtnTestarPonte">Testar ponte</button> ' +
    '<button type="button" class="btn btn--secondary" id="setadBtnListarImpressoras">Listar impressoras</button>' +
    "</div></div></section>" +
    '<section class="setad-impressao__bloco">' +
    "<h3>Imprimir arquivo</h3>" +
    '<p class="presencial-bloco__hint">PDF, imagens (JPG/PNG), HTML ou texto. Word/Excel: salve como PDF antes.</p>' +
    '<div class="setad-impressao__upload">' +
    '<input type="file" id="setadArquivoImpressao" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.html,.htm,.txt,application/pdf,image/*">' +
    '<label class="setad-impressao__check">' +
    '<input type="checkbox" id="setadUsarPonte" checked> Enviar pela ponte quando disponível</label>' +
    '<button type="button" class="btn btn--primary" id="setadBtnImprimirArquivo">Imprimir arquivo</button>' +
    "</div>" +
    '<div id="setadImpressaoMensagem" class="form-mensagem" role="alert"></div>' +
    "</section>" +
    '<section class="setad-impressao__bloco">' +
    "<h3>Atalhos</h3>" +
    '<ul class="setad-impressao__atalhos">' +
    "<li><strong>Boletos:</strong> aba Boletos da secretaria → emitir (abre impressão automaticamente).</li>" +
    "<li><strong>Provas / listas:</strong> use Imprimir arquivo ou copie o conteúdo em um editor e exporte PDF.</li>" +
    "<li><strong>Trabalhos dos alunos:</strong> na aba Trabalhos (direção/professor), baixe o anexo e imprima aqui em PDF.</li>" +
    "</ul></section></div>";

  document.getElementById("setadBtnTestarPonte").addEventListener("click", function () {
    SETADImpressao.salvarConfig({
      bridgeUrl: document.getElementById("setadBridgeUrl").value.trim()
    });
    var status = document.getElementById("setadImpressaoStatus");
    SETADImpressao.pingPonte().then(function (r) {
      status.className = "setad-impressao__status " + (r.ok ? "setad-impressao__status--ok" : "setad-impressao__status--erro");
      status.textContent = r.ok
        ? "Ponte ativa — impressoras de rede/USB podem ser usadas neste computador."
        : "Ponte não encontrada. Execute: cd print-bridge && npm install && npm start";
    });
  });

  document.getElementById("setadBtnListarImpressoras").addEventListener("click", function () {
    SETADImpressao.salvarConfig({
      bridgeUrl: document.getElementById("setadBridgeUrl").value.trim()
    });
    var select = document.getElementById("setadImpressoraRede");
    var msg = document.getElementById("setadImpressaoMensagem");
    SETADImpressao.listarImpressoras().then(function (r) {
      if (!r.ok || !r.impressoras.length) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent =
          "Não foi possível listar impressoras. Inicie a ponte neste PC ou use a impressão do navegador.";
        return;
      }
      select.innerHTML =
        '<option value="">Padrão do sistema</option>' +
        r.impressoras
          .map(function (nome) {
            return (
              '<option value="' +
              escaparHtml(nome) +
              '">' +
              escaparHtml(nome) +
              "</option>"
            );
          })
          .join("");
      msg.className = "form-mensagem form-mensagem--sucesso visible";
      msg.textContent = r.impressoras.length + " impressora(s) encontrada(s).";
    });
  });

  document.getElementById("setadBtnImprimirArquivo").addEventListener("click", function () {
    var input = document.getElementById("setadArquivoImpressao");
    var msg = document.getElementById("setadImpressaoMensagem");
    msg.className = "form-mensagem";
    msg.textContent = "";
    if (!input.files || !input.files[0]) {
      msg.className = "form-mensagem form-mensagem--erro visible";
      msg.textContent = "Selecione um arquivo.";
      return;
    }
    SETADImpressao.salvarConfig({
      bridgeUrl: document.getElementById("setadBridgeUrl").value.trim(),
      impressora: document.getElementById("setadImpressoraRede").value,
      copias: Number(document.getElementById("setadCopias").value) || 1
    });
    var usarPonte = document.getElementById("setadUsarPonte").checked;
    SETADImpressao.imprimirArquivo(input.files[0], { usarPonte: usarPonte }).then(function (res) {
      if (!res.ok) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = res.erro || "Falha na impressão.";
        return;
      }
      msg.className = "form-mensagem form-mensagem--sucesso visible";
      msg.textContent =
        res.modo && res.modo.indexOf("ponte") >= 0
          ? "Enviado para a impressora via ponte local."
          : "Janela de impressão do sistema aberta — escolha a impressora de rede ou USB.";
    });
  });
}
