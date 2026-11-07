/**
 * Editor de planilha no navegador — revisar e editar antes de aplicar na contabilidade.
 */
(function (global) {
  "use strict";

  var CONTAB_COLUNAS_EDITAVEIS_PADRAO = [
    "situacao",
    "forma_pagamento",
    "valor_sugerido",
    "taxa_matricula",
    "observacoes",
    "nota",
    "media_manual"
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

  function gradeEditavel(headers, colunasEditaveis, modoCompleto) {
    var edit = {};
    if (modoCompleto) {
      headers.forEach(function (h, i) {
        var n = normalizarNomeColuna(h);
        if (n !== "matricula_id" && n !== "nome") edit[i] = true;
      });
      return edit;
    }
    (colunasEditaveis || CONTAB_COLUNAS_EDITAVEIS_PADRAO).forEach(function (c) {
      var ix = indiceColunaEditavel(headers, c);
      if (ix >= 0) edit[ix] = true;
    });
    headers.forEach(function (h, i) {
      if (/^\d{2}\/\d{4}$/.test(String(h || "").trim())) edit[i] = true;
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

  function escaparTexto(t) {
    if (typeof global.escaparHtml === "function") return global.escaparHtml(t);
    var el = document.createElement("span");
    el.textContent = t == null ? "" : String(t);
    return el.innerHTML;
  }

  function resumoCheckinImportacao(sheets, polos) {
    var totalLinhas = 0;
    var polosIds = {};
    var semPolo = 0;
    sheets.forEach(function (sh) {
      var cab = (sh.headers || []).map(normalizarNomeColuna);
      var idxPolo = cab.indexOf("polo_id");
      totalLinhas += (sh.body || []).length;
      if (idxPolo >= 0) {
        (sh.body || []).forEach(function (row) {
          var pid = String(row[idxPolo] || "").trim();
          if (!pid) semPolo++;
          else polosIds[pid] = (polosIds[pid] || 0) + 1;
        });
      }
    });
    var detalhes = [];
    Object.keys(polosIds).forEach(function (id) {
      var p = (polos || []).find(function (x) {
        return x.id === id;
      });
      detalhes.push((p ? p.nome : id) + " (" + polosIds[id] + " linha(s))");
    });
    return {
      totalLinhas: totalLinhas,
      totalAbas: sheets.length,
      detalhesPolos: detalhes,
      semPolo: semPolo
    };
  }

  function montarTabelaHtml(headers, body, editMap) {
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
            .map(function (h, ci) {
              var val = row[ci] != null ? row[ci] : "";
              var tdCls = editMap[ci]
                ? "setad-planilha-editor__td--edit"
                : "setad-planilha-editor__td--readonly";
              if (editMap[ci]) {
                if (normalizarNomeColuna(h) === "situacao") {
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

    return "<thead>" + thead + "</thead><tbody>" + tbody + "</tbody>";
  }

  function abrirEditorPlanilhaImportacao(host, opts) {
    if (!host) return;
    opts = opts || {};
    var modoCompleto = !!opts.editarCompleto;
    var polos = opts.polos || [];
    var poloId = opts.poloIdDefault || (polos[0] ? polos[0].id : "");

    var sheets = (opts.workbook && opts.workbook.sheets) || [
      {
        name: opts.sheetName || "Planilha",
        headers: (opts.headers || []).slice(),
        body: (opts.body || []).map(function (r) {
          return r.slice();
        })
      }
    ];

    var modoCheckin = !!opts.modoCheckin;
    var idGeral = global.POLO_SETAD_GERAL_ID || "setad-geral";
    if (modoCheckin) {
      poloId = idGeral;
    }
    var estado = {
      sheetAtiva: 0,
      sheets: sheets,
      poloId: poloId,
      checkinOk: false,
      origemLegadoPolo: !!opts.origemLegadoPolo
    };
    var titulo = opts.titulo || "Revisar planilha";
    var descricao =
      opts.descricao ||
      "Selecione o polo de destino. Revise cada aba (cadastro, mensalidades, notas) e aplique para salvar.";
    var resumoCheckin = modoCheckin ? resumoCheckinImportacao(sheets, polos) : null;

    host.hidden = false;
    host.removeAttribute("hidden");
    document.documentElement.classList.add("setad-planilha-editor-aberto");
    if (host.scrollIntoView) {
      try {
        host.scrollIntoView({ block: "nearest" });
      } catch (_e) {
        /* ignorar */
      }
    }

    var opcoesPolo = polos
      .map(function (p) {
        var sel = p.id === estado.poloId ? " selected" : "";
        return (
          '<option value="' + escaparTexto(p.id) + '"' + sel + ">" + escaparTexto(p.nome) + "</option>"
        );
      })
      .join("");

    var abasHtml = sheets
      .map(function (s, i) {
        var cls =
          i === estado.sheetAtiva ? " setad-planilha-editor__aba--ativa" : "";
        return (
          '<button type="button" class="setad-planilha-editor__aba' +
          cls +
          '" data-sheet-ix="' +
          i +
          '">' +
          escaparTexto(s.name || "Aba " + (i + 1)) +
          "</button>"
        );
      })
      .join("");

    var checkinHtml = "";
    if (modoCheckin && resumoCheckin) {
      var listaPolos =
        resumoCheckin.detalhesPolos.length > 0
          ? "<ul class=\"setad-planilha-editor__checkin-lista\">" +
            resumoCheckin.detalhesPolos
              .map(function (item) {
                return "<li>" + escaparTexto(item) + "</li>";
              })
              .join("") +
            "</ul>"
          : '<p class="setad-planilha-editor__checkin-aviso">Nenhum polo_id identificado nas linhas. Inclua a coluna polo_id para desmembrar nos polos.</p>';
      if (resumoCheckin.semPolo > 0) {
        listaPolos +=
          '<p class="setad-planilha-editor__checkin-aviso">' +
          resumoCheckin.semPolo +
          " linha(s) sem polo_id — conferir antes de enviar.</p>";
      }
      checkinHtml =
        '<section class="setad-planilha-editor__checkin" aria-labelledby="setadPlanilhaCheckinTitulo">' +
        '<h3 id="setadPlanilhaCheckinTitulo" class="setad-planilha-editor__checkin-titulo">Check-in de entrada</h3>' +
        '<dl class="setad-planilha-editor__checkin-dl">' +
        "<dt>Arquivo</dt><dd>" +
        escaparTexto(opts.nomeArquivo || "Planilha") +
        "</dd>" +
        "<dt>Abas</dt><dd>" +
        resumoCheckin.totalAbas +
        "</dd>" +
        "<dt>Linhas (todas as abas)</dt><dd>" +
        resumoCheckin.totalLinhas +
        "</dd>" +
        "<dt>Destino</dt><dd>SETAD geral → desmembramento por polo_id</dd>" +
        "</dl>" +
        "<p class=\"setad-planilha-editor__checkin-sub\">Polos detectados na planilha:</p>" +
        listaPolos +
        '<label class="setad-planilha-editor__checkin-conf">' +
        '<input type="checkbox" id="setadPlanilhaCheckinConferi" />' +
        " Conferi os dados e autorizo o envio desta planilha ao site.</label>" +
        "</section>";
    }

    var poloSelectHtml = modoCheckin
      ? '<p class="setad-planilha-editor__polo-fixo"><strong>Polo de destino:</strong> SETAD geral (recepção central)</p>' +
        '<input type="hidden" id="setadPlanilhaPoloSelect" value="' +
        escaparTexto(idGeral) +
        '" />'
      : '<div class="setad-planilha-editor__polo form-group">' +
        '<label for="setadPlanilhaPoloSelect">Polo de destino</label>' +
        '<select id="setadPlanilhaPoloSelect" class="setad-planilha-editor__polo-select">' +
        opcoesPolo +
        "</select></div>";

    var modoEdicaoSite = !!opts.modoEdicaoSite;
    var rotuloAplicar = modoCheckin
      ? "Confirmar envio da planilha ao site"
      : modoEdicaoSite
        ? "Salvar alterações no site"
        : "Salvar no polo selecionado";
    var btnAplicarDisabled = modoCheckin ? " disabled" : "";

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
      checkinHtml +
      poloSelectHtml +
      '<nav class="setad-planilha-editor__abas" id="setadPlanilhaAbas" role="tablist">' +
      abasHtml +
      "</nav>" +
      '<p class="setad-planilha-editor__meta" id="setadPlanilhaMeta"></p>' +
      "</header>" +
      '<div class="setad-planilha-editor__scroll" tabindex="0">' +
      '<table class="setad-planilha-editor__tabela" id="setadPlanilhaEditorTabela"></table>' +
      "</div>" +
      '<footer class="setad-planilha-editor__rodape">' +
      '<button type="button" class="btn btn--secondary" id="setadPlanilhaBtnCancelar">Cancelar</button>' +
      '<button type="button" class="btn btn--secondary" id="setadPlanilhaBtnBaixar">Baixar Excel editado</button>' +
      '<button type="button" class="btn btn--primary" id="setadPlanilhaBtnAplicar"' +
      btnAplicarDisabled +
      ">" +
      escaparTexto(rotuloAplicar) +
      "</button>" +
      "</footer></div></div>";

    function sheetAtual() {
      return estado.sheets[estado.sheetAtiva] || { headers: [], body: [], name: "" };
    }

    function persistirAbaVisivel() {
      var tabela = host.querySelector("#setadPlanilhaEditorTabela");
      var sh = sheetAtual();
      if (!tabela || !sh.headers.length) return;
      estado.sheets[estado.sheetAtiva].body = lerGradeDoDom(tabela, sh.headers.length);
    }

    function pintarAba(ix) {
      persistirAbaVisivel();
      estado.sheetAtiva = ix;
      var sh = sheetAtual();
      var editMap = gradeEditavel(
        sh.headers,
        opts.colunasEditaveis,
        modoCompleto
      );
      var tabela = host.querySelector("#setadPlanilhaEditorTabela");
      if (tabela) tabela.innerHTML = montarTabelaHtml(sh.headers, sh.body, editMap);

      host.querySelectorAll(".setad-planilha-editor__aba").forEach(function (btn) {
        btn.classList.toggle(
          "setad-planilha-editor__aba--ativa",
          Number(btn.getAttribute("data-sheet-ix")) === ix
        );
      });
      var meta = host.querySelector("#setadPlanilhaMeta");
      if (meta) {
        meta.textContent =
          (sh.name || "Aba") +
          " — " +
          sh.body.length +
          " linha(s). Células destacadas podem ser editadas.";
      }
    }

    var elPolo = host.querySelector("#setadPlanilhaPoloSelect");
    if (elPolo && elPolo.tagName === "SELECT") {
      elPolo.addEventListener("change", function (e) {
        estado.poloId = e.target.value;
      });
    }

    var btnAplicar = host.querySelector("#setadPlanilhaBtnAplicar");
    if (modoCheckin) {
      var chk = host.querySelector("#setadPlanilhaCheckinConferi");
      if (chk && btnAplicar) {
        chk.addEventListener("change", function () {
          estado.checkinOk = !!chk.checked;
          btnAplicar.disabled = !estado.checkinOk;
        });
      }
    }

    host.querySelectorAll(".setad-planilha-editor__aba").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pintarAba(Number(btn.getAttribute("data-sheet-ix")));
      });
    });

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
      persistirAbaVisivel();
      if (global.SETADPlanilhaExcel && global.SETADPlanilhaExcel.exportarWorkbookXlsx) {
        global.SETADPlanilhaExcel.exportarWorkbookXlsx(
          estado.sheets.map(function (s) {
            return { name: s.name, headers: s.headers, body: s.body };
          }),
          "setad-contab-revisao-" + new Date().toISOString().slice(0, 10) + ".xlsx"
        );
      }
    });

    function repintarEditorAposMerge(followup) {
      if (!followup || !followup.workbook || !followup.workbook.sheets) return;
      estado.sheets = followup.workbook.sheets;
      if (followup.poloId) estado.poloId = followup.poloId;
      var abasNav = host.querySelector("#setadPlanilhaAbas");
      if (abasNav) {
        abasNav.innerHTML = estado.sheets
          .map(function (s, i) {
            var cls =
              i === estado.sheetAtiva ? " setad-planilha-editor__aba--ativa" : "";
            return (
              '<button type="button" class="setad-planilha-editor__aba' +
              cls +
              '" data-sheet-ix="' +
              i +
              '">' +
              escaparTexto(s.name || "Aba " + (i + 1)) +
              "</button>"
            );
          })
          .join("");
        abasNav.querySelectorAll(".setad-planilha-editor__aba").forEach(function (btn) {
          btn.addEventListener("click", function () {
            pintarAba(Number(btn.getAttribute("data-sheet-ix")));
          });
        });
      }
      pintarAba(estado.sheetAtiva);
      host.hidden = false;
      host.removeAttribute("hidden");
      document.documentElement.classList.add("setad-planilha-editor-aberto");
    }

    btnAplicar.addEventListener("click", function () {
      persistirAbaVisivel();
      var sel = host.querySelector("#setadPlanilhaPoloSelect");
      estado.poloId = sel ? sel.value : idGeral;
      if (modoCheckin && !estado.checkinOk) {
        alert("Marque a confirmação do check-in antes de enviar a planilha.");
        return;
      }
      if (!estado.poloId) {
        alert("Selecione o polo de destino.");
        return;
      }
      if (typeof opts.onAplicar !== "function") return;

      var textoSalvar = btnAplicar.textContent;
      btnAplicar.disabled = true;
      btnAplicar.textContent = "Salvando…";

      var payload = {
        sheets: estado.sheets,
        poloId: estado.poloId,
        origemLegadoPolo: estado.origemLegadoPolo
      };

      function liberarBotao() {
        btnAplicar.disabled = modoCheckin ? true : false;
        btnAplicar.textContent = textoSalvar;
      }

      function aoConcluir(r, followup) {
        liberarBotao();
        if (r && r.ok && followup && followup.manterEditor) {
          repintarEditorAposMerge(followup);
          var msg =
            (r.atualizados ? "Dados gravados: " + r.atualizados : "Alterações salvas.") +
            (r.avisoNome ? "\n\n" + r.avisoNome : "");
          alert(msg);
          if (typeof opts.onSalvo === "function") opts.onSalvo(r);
          return;
        }
        if (r && !r.ok) {
          var erros = [r.erro]
            .concat(r.avisos || [])
            .filter(Boolean)
            .join("\n");
          if (erros) alert(erros || "Não foi possível salvar.");
          if (opts.manterAbertoAposSalvar) {
            if (typeof opts.onSalvo === "function") opts.onSalvo(r);
            return;
          }
        }
        fecharEditor(host);
        if (typeof opts.onSalvo === "function") opts.onSalvo(r);
      }

      try {
        if (opts.onAplicar.length >= 2) {
          opts.onAplicar(payload, aoConcluir);
        } else {
          fecharEditor(host);
          liberarBotao();
          opts.onAplicar(payload);
        }
      } catch (err) {
        liberarBotao();
        alert((err && err.message) || "Erro ao salvar a planilha.");
      }
    });

    pintarAba(0);
  }

  global.SETADContabPlanilhaEditor = {
    abrirEditorPlanilhaImportacao: abrirEditorPlanilhaImportacao,
    fecharEditor: fecharEditor,
    CONTAB_COLUNAS_EDITAVEIS_PADRAO: CONTAB_COLUNAS_EDITAVEIS_PADRAO
  };
})(window);
