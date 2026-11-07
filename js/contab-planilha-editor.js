/**
 * Editor de planilha no navegador — revisar e editar antes de aplicar na contabilidade.
 */
(function (global) {
  "use strict";

  var CONTAB_COLUNAS_EDITAVEIS_PADRAO = [
    "situacao",
    "forma_pagamento",
    "valor_sugerido",
    "observacoes"
  ];

  function normalizarNomeColuna(nome) {
    return String(nome || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  function indiceColunaEditavel(headers, nomeCol) {
    var alvo = normalizarNomeColuna(nomeCol);
    for (var i = 0; i < headers.length; i++) {
      if (normalizarNomeColuna(headers[i]) === alvo) return i;
    }
    return -1;
  }

  function gradeEditavel(headers, body, colunasEditaveis) {
    var edit = {};
    (colunasEditaveis || CONTAB_COLUNAS_EDITAVEIS_PADRAO).forEach(function (c) {
      var ix = indiceColunaEditavel(headers, c);
      if (ix >= 0) edit[ix] = true;
    });
    return edit;
  }

  function lerGradeDoDom(tabela, numCols) {
    var body = [];
    var rows = tabela.querySelectorAll("tbody tr");
    rows.forEach(function (tr) {
      var linha = [];
      for (var c = 0; c < numCols; c++) {
        var cel = tr.querySelector('[data-col="' + c + '"]');
        if (!cel) {
          linha.push("");
          continue;
        }
        var input = cel.querySelector("input, select, textarea");
        linha.push(input ? input.value : (cel.textContent || "").trim());
      }
      body.push(linha);
    });
    return body;
  }

  function fecharEditor(host) {
    if (!host) return;
    host.innerHTML = "";
    host.hidden = true;
    document.documentElement.classList.remove("setad-planilha-editor-aberto");
  }

  /**
   * @param {HTMLElement} host
   * @param {{ titulo, descricao, headers, body, colunasEditaveis, onAplicar, onCancelar }} opts
   */
  function escaparTexto(t) {
    if (typeof global.escaparHtml === "function") return global.escaparHtml(t);
    var el = document.createElement("span");
    el.textContent = t == null ? "" : String(t);
    return el.innerHTML;
  }

  function abrirEditorPlanilhaImportacao(host, opts) {
    if (!host) return;
    var headers = (opts.headers || []).slice();
    var body = (opts.body || []).map(function (row) {
      return row.slice();
    });
    var editMap = gradeEditavel(headers, body, opts.colunasEditaveis);
    var titulo = opts.titulo || "Revisar planilha";
    var descricao =
      opts.descricao ||
      "Confira os dados abaixo. Campos destacados podem ser editados antes de aplicar ao sistema.";

    host.hidden = false;
    document.documentElement.classList.add("setad-planilha-editor-aberto");

    var thead =
      "<tr>" +
      headers
        .map(function (h, i) {
          var cls = editMap[i] ? "setad-planilha-editor__th--edit" : "";
          return '<th scope="col" class="' + cls + '">' + escaparTexto(h) + "</th>";
        })
        .join("") +
      "</tr>";

    var tbody = body
      .map(function (row, ri) {
        return (
          "<tr data-row=\"" +
          ri +
          "\">" +
          headers
            .map(function (_h, ci) {
              var val = row[ci] != null ? row[ci] : "";
              var tdCls = editMap[ci]
                ? "setad-planilha-editor__td--edit"
                : "setad-planilha-editor__td--readonly";
              if (editMap[ci]) {
                if (normalizarNomeColuna(headers[ci]) === "situacao") {
                  return (
                    '<td class="' +
                    tdCls +
                    '" data-col="' +
                    ci +
                    '"><select class="setad-planilha-editor__input">' +
                    '<option value=""></option>' +
                    '<option value="em_dia"' +
                    (val === "em_dia" ? " selected" : "") +
                    ">em_dia</option>" +
                    '<option value="atraso"' +
                    (val === "atraso" ? " selected" : "") +
                    ">atraso</option>" +
                    '<option value="pendente"' +
                    (val === "pendente" ? " selected" : "") +
                    ">pendente</option>" +
                    "</select></td>"
                  );
                }
                return (
                  '<td class="' +
                  tdCls +
                  '" data-col="' +
                  ci +
                  '"><input type="text" class="setad-planilha-editor__input" value="' +
                  escaparTexto(val) +
                  '"></td>'
                );
              }
              return (
                '<td class="' +
                tdCls +
                '" data-col="' +
                ci +
                '"><span class="setad-planilha-editor__readonly">' +
                escaparTexto(val) +
                "</span></td>"
              );
            })
            .join("") +
          "</tr>"
        );
      })
      .join("");

    host.innerHTML =
      '<div class="setad-planilha-editor" role="dialog" aria-modal="true" aria-labelledby="setadPlanilhaEditorTitulo">' +
      '<div class="setad-planilha-editor__backdrop" data-setad-planilha-fechar></div>' +
      '<div class="setad-planilha-editor__painel">' +
      '<header class="setad-planilha-editor__cabecalho">' +
      '<h2 id="setadPlanilhaEditorTitulo" class="setad-planilha-editor__titulo">' +
      escaparTexto(titulo) +
      "</h2>" +
      '<p class="setad-planilha-editor__desc">' +
      escaparTexto(descricao) +
      "</p>" +
      '<p class="setad-planilha-editor__meta">' +
      body.length +
      " linha(s) · colunas editáveis: situação, forma de pagamento, valor e observações</p>" +
      "</header>" +
      '<div class="setad-planilha-editor__scroll" tabindex="0">' +
      '<table class="setad-planilha-editor__tabela" id="setadPlanilhaEditorTabela">' +
      "<thead>" +
      thead +
      "</thead><tbody>" +
      tbody +
      "</tbody></table></div>" +
      '<footer class="setad-planilha-editor__rodape">' +
      '<button type="button" class="btn btn--secondary" id="setadPlanilhaBtnCancelar">Cancelar</button>' +
      '<button type="button" class="btn btn--secondary" id="setadPlanilhaBtnBaixar">Baixar Excel editado</button>' +
      '<button type="button" class="btn btn--primary" id="setadPlanilhaBtnAplicar">Aplicar ao sistema</button>' +
      "</footer></div></div>";

    host.querySelector("#setadPlanilhaBtnCancelar").addEventListener("click", function () {
      fecharEditor(host);
      if (typeof opts.onCancelar === "function") opts.onCancelar();
    });
    host.querySelectorAll("[data-setad-planilha-fechar]").forEach(function (el) {
      el.addEventListener("click", function () {
        fecharEditor(host);
        if (typeof opts.onCancelar === "function") opts.onCancelar();
      });
    });

    host.querySelector("#setadPlanilhaBtnBaixar").addEventListener("click", function () {
      var tabela = host.querySelector("#setadPlanilhaEditorTabela");
      var bodyAtual = lerGradeDoDom(tabela, headers.length);
      if (global.SETADPlanilhaExcel) {
        global.SETADPlanilhaExcel.exportarXlsx(
          headers,
          bodyAtual,
          "setad-contab-revisao-" + new Date().toISOString().slice(0, 10) + ".xlsx"
        );
      }
    });

    host.querySelector("#setadPlanilhaBtnAplicar").addEventListener("click", function () {
      var tabela = host.querySelector("#setadPlanilhaEditorTabela");
      var bodyAtual = lerGradeDoDom(tabela, headers.length);
      fecharEditor(host);
      if (typeof opts.onAplicar === "function") {
        opts.onAplicar({ headers: headers, body: bodyAtual });
      }
    });
  }

  global.SETADContabPlanilhaEditor = {
    abrirEditorPlanilhaImportacao: abrirEditorPlanilhaImportacao,
    fecharEditor: fecharEditor,
    CONTAB_COLUNAS_EDITAVEIS_PADRAO: CONTAB_COLUNAS_EDITAVEIS_PADRAO
  };
})(window);
