/* Plugin SETAD — impressão institucional (navegador + ponte local para rede/USB). */

var SETAD_IMPRESSAO_STORAGE = "setad_impressao_config";

var SETADImpressao = {
  defaultBridgeUrl: "http://127.0.0.1:9247",
  tiposArquivoPermitidos: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "text/html",
    "text/plain"
  ],

  obterConfig: function () {
    try {
      var raw = localStorage.getItem(SETAD_IMPRESSAO_STORAGE);
      var cfg = raw ? JSON.parse(raw) : {};
      return {
        bridgeUrl: cfg.bridgeUrl || SETADImpressao.defaultBridgeUrl,
        impressora: cfg.impressora || "",
        copias: cfg.copias || 1
      };
    } catch (e) {
      return { bridgeUrl: SETADImpressao.defaultBridgeUrl, impressora: "", copias: 1 };
    }
  },

  salvarConfig: function (parcial) {
    var cfg = SETADImpressao.obterConfig();
    Object.assign(cfg, parcial || {});
    localStorage.setItem(SETAD_IMPRESSAO_STORAGE, JSON.stringify(cfg));
    return cfg;
  },

  usuarioPodeImprimirInterno: function () {
    if (typeof obterSessaoSecretaria === "function" && obterSessaoSecretaria()) return true;
    if (typeof obterSessaoCoordenacao === "function" && obterSessaoCoordenacao()) return true;
    if (typeof obterSessaoDirecao === "function" && obterSessaoDirecao()) return true;
    if (typeof obterSessaoStaff === "function" && obterSessaoStaff()) return true;
    if (typeof obterSessao === "function" && obterSessao("professor")) return true;
    return false;
  },

  pingPonte: function () {
    var cfg = SETADImpressao.obterConfig();
    var url = cfg.bridgeUrl.replace(/\/$/, "") + "/health";
    return fetch(url, { method: "GET", mode: "cors" })
      .then(function (r) {
        if (!r.ok) throw new Error("offline");
        return r.json();
      })
      .then(function (data) {
        return { ok: true, ponte: data };
      })
      .catch(function () {
        return { ok: false };
      });
  },

  listarImpressoras: function () {
    var cfg = SETADImpressao.obterConfig();
    var url = cfg.bridgeUrl.replace(/\/$/, "") + "/printers";
    return fetch(url, { method: "GET", mode: "cors" })
      .then(function (r) {
        if (!r.ok) throw new Error("erro");
        return r.json();
      })
      .then(function (data) {
        return { ok: true, impressoras: data.printers || [] };
      })
      .catch(function () {
        return { ok: false, impressoras: [] };
      });
  },

  imprimirHtml: function (html, opcoes) {
    opcoes = opcoes || {};
    var titulo = opcoes.titulo || "Documento SETAD";
    var completo =
      typeof html === "string" && html.indexOf("<!DOCTYPE") !== -1
        ? html
        : SETADImpressao.montarDocumentoImpressao(html, titulo);

    if (opcoes.enviarPontePdf) {
      return SETADImpressao.imprimirHtmlViaPontePdf(completo, opcoes);
    }

    return SETADImpressao.abrirJanelaImpressao(completo, titulo);
  },

  montarDocumentoImpressao: function (corpoHtml, titulo) {
    return (
      "<!DOCTYPE html><html lang=\"pt-BR\"><head><meta charset=\"UTF-8\">" +
      "<title>" +
      escaparHtml(titulo) +
      "</title>" +
      "<style>" +
      SETADImpressao.cssImpressaoInstitucional() +
      "</style></head><body class=\"setad-print-doc\">" +
      '<header class="setad-print-doc__cabecalho">' +
      "<strong>SETAD</strong> — Seminário Teológico · " +
      escaparHtml(titulo) +
      "</header>" +
      corpoHtml +
      '<footer class="setad-print-doc__rodape no-print-setad">Impresso pelo sistema SETAD · " +
      new Date().toLocaleString("pt-BR") +
      "</footer>" +
      "</body></html>"
    );
  },

  cssImpressaoInstitucional: function () {
    return (
      "body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#111;line-height:1.45}" +
      ".setad-print-doc__cabecalho{border-bottom:2px solid #23406b;padding-bottom:8px;margin-bottom:16px;color:#23406b}" +
      ".setad-print-doc__rodape{margin-top:24px;font-size:0.8rem;color:#666}" +
      "@media print{body{margin:12mm}.no-print-setad{display:none}}"
    );
  },

  abrirJanelaImpressao: function (html, titulo) {
    var janela = window.open("", "_blank", "width=900,height=760");
    if (!janela) {
      return Promise.resolve({
        ok: false,
        erro: "Permita pop-ups neste site para abrir a impressão."
      });
    }
    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    janela.document.title = titulo || "SETAD";
    janela.focus();
    return new Promise(function (resolve) {
      setTimeout(function () {
        try {
          janela.print();
        } catch (e) {
          /* usuário pode imprimir manualmente */
        }
        resolve({ ok: true, modo: "navegador" });
      }, 450);
    });
  },

  imprimirElemento: function (seletor, opcoes) {
    var el = typeof seletor === "string" ? document.querySelector(seletor) : seletor;
    if (!el) {
      return Promise.resolve({ ok: false, erro: "Conteúdo não encontrado para impressão." });
    }
    return SETADImpressao.imprimirHtml(el.innerHTML, opcoes);
  },

  imprimirArquivo: function (arquivo, opcoes) {
    opcoes = opcoes || {};
    if (!arquivo) {
      return Promise.resolve({ ok: false, erro: "Nenhum arquivo selecionado." });
    }
    var tipo = arquivo.type || "";
    if (SETADImpressao.tiposArquivoPermitidos.indexOf(tipo) === -1) {
      return Promise.resolve({
        ok: false,
        erro:
          "Tipo de arquivo não suportado para impressão direta. Use PDF, imagem ou HTML. Para Word/Excel, exporte em PDF."
      });
    }

    if (tipo === "application/pdf") {
      return SETADImpressao.imprimirPdfBlob(arquivo, opcoes);
    }
    if (tipo.indexOf("image/") === 0) {
      return SETADImpressao.imprimirHtml(
        '<figure class="setad-print-img"><img src="' +
          URL.createObjectURL(arquivo) +
          '" alt="" style="max-width:100%"></figure>',
        { titulo: arquivo.name || "Imagem SETAD", enviarPontePdf: opcoes.usarPonte }
      );
    }
    if (tipo === "text/html" || tipo === "text/plain") {
      return arquivo.text().then(function (texto) {
        var corpo =
          tipo === "text/plain"
            ? "<pre>" + escaparHtml(texto) + "</pre>"
            : texto;
        return SETADImpressao.imprimirHtml(corpo, {
          titulo: arquivo.name,
          enviarPontePdf: opcoes.usarPonte
        });
      });
    }
    return Promise.resolve({ ok: false, erro: "Formato não tratado." });
  },

  imprimirPdfBlob: function (arquivoOuBlob, opcoes) {
    opcoes = opcoes || {};
    var blob = arquivoOuBlob instanceof Blob ? arquivoOuBlob : null;
    if (!blob) {
      return Promise.resolve({ ok: false, erro: "PDF inválido." });
    }

    if (opcoes.usarPonte) {
      return blob.arrayBuffer().then(function (buf) {
        return SETADImpressao.enviarPdfParaPonte(buf, opcoes).then(function (res) {
          if (res.ok) return res;
          return SETADImpressao.imprimirPdfBlob(blob, { usarPonte: false });
        });
      });
    }

    var url = URL.createObjectURL(blob);
    var iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    return new Promise(function (resolve) {
      iframe.onload = function () {
        setTimeout(function () {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (e) {
            window.open(url, "_blank");
          }
          setTimeout(function () {
            URL.revokeObjectURL(url);
            iframe.remove();
          }, 2000);
          resolve({ ok: true, modo: "navegador-pdf" });
        }, 500);
      };
    });
  },

  imprimirHtmlViaPontePdf: function (html, opcoes) {
    return SETADImpressao.pingPonte().then(function (ping) {
      if (!ping.ok) {
        return SETADImpressao.abrirJanelaImpressao(html, opcoes.titulo);
      }
      var cfg = SETADImpressao.obterConfig();
      var url = cfg.bridgeUrl.replace(/\/$/, "") + "/print-html";
      return fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: html,
          titulo: opcoes.titulo || "SETAD",
          printer: opcoes.impressora || cfg.impressora || "",
          copies: opcoes.copias || cfg.copias || 1
        })
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data.ok) {
            return SETADImpressao.abrirJanelaImpressao(html, opcoes.titulo);
          }
          return { ok: true, modo: "ponte", detalhe: data };
        })
        .catch(function () {
          return SETADImpressao.abrirJanelaImpressao(html, opcoes.titulo);
        });
    });
  },

  enviarPdfParaPonte: function (arrayBuffer, opcoes) {
    opcoes = opcoes || {};
    var cfg = SETADImpressao.obterConfig();
    var url = cfg.bridgeUrl.replace(/\/$/, "") + "/print-pdf";
    var bytes = new Uint8Array(arrayBuffer);
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var base64 = btoa(bin);

    return fetch(url, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfBase64: base64,
        titulo: opcoes.titulo || "documento-setad.pdf",
        printer: opcoes.impressora || cfg.impressora || "",
        copies: opcoes.copias || cfg.copias || 1
      })
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data.ok) {
          return {
            ok: false,
            erro: data.erro || "A ponte não conseguiu imprimir. Use a impressão do navegador."
          };
        }
        return { ok: true, modo: "ponte-pdf", detalhe: data };
      })
      .catch(function () {
        return {
          ok: false,
          erro: "Ponte de impressão indisponível. Inicie o SETAD Print Bridge neste computador."
        };
      });
  }
};
