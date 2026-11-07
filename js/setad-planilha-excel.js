/**
 * Leitura e exportação de planilhas (Excel, ODS, CSV) no navegador — contabilidade SETAD.
 * Usa SheetJS (carregado sob demanda).
 */
(function (global) {
  "use strict";

  var CDN =
    "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";

  var EXTENSOES_PERMITIDAS =
    /\.(xlsx|xls|xlsm|xlsb|xlt|xltx|xla|ods|csv|txt|xml)$/i;

  var MIME_PERMITIDOS = [
    "text/csv",
    "text/plain",
    "application/csv",
    "application/vnd.ms-excel",
    "application/msexcel",
    "application/x-msexcel",
    "application/x-ms-excel",
    "application/x-excel",
    "application/x-dos_ms_excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-excel.template.macroEnabled.12",
    "application/vnd.ms-excel.addin.macroEnabled.12",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/octet-stream"
  ];

  function carregarBiblioteca() {
    if (global.XLSX) return Promise.resolve(global.XLSX);
    if (global.__setadSheetJsPromise) return global.__setadSheetJsPromise;

    global.__setadSheetJsPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = CDN;
      s.async = true;
      s.onload = function () {
        if (global.XLSX) resolve(global.XLSX);
        else reject(new Error("Biblioteca de planilha indisponível."));
      };
      s.onerror = function () {
        global.__setadSheetJsPromise = null;
        reject(new Error("Não foi possível carregar o suporte a Excel."));
      };
      document.head.appendChild(s);
    });

    return global.__setadSheetJsPromise;
  }

  function arquivoPlanilhaPermitido(arquivo) {
    if (!arquivo || !arquivo.name) return false;
    if (EXTENSOES_PERMITIDAS.test(arquivo.name)) return true;
    if (arquivo.type && MIME_PERMITIDOS.indexOf(arquivo.type) >= 0) return true;
    return false;
  }

  function linhasParaGrade(aoa) {
    var limpa = (aoa || []).filter(function (row) {
      return row && row.some(function (c) {
        return String(c != null ? c : "").trim() !== "";
      });
    });
    if (!limpa.length) {
      return { headers: [], body: [], sheetName: "" };
    }
    var headers = (limpa[0] || []).map(function (c) {
      return String(c != null ? c : "").trim();
    });
    var body = limpa.slice(1).map(function (row) {
      return headers.map(function (_h, i) {
        var v = row[i];
        if (v == null) return "";
        if (typeof v === "number" && !Number.isNaN(v)) return String(v);
        if (Object.prototype.toString.call(v) === "[object Date]") {
          return v.toISOString().slice(0, 10);
        }
        return String(v).trim();
      });
    });
    return { headers: headers, body: body, sheetName: "" };
  }

  function lerArquivo(arquivo) {
    if (!arquivo) return Promise.reject(new Error("Nenhum arquivo selecionado."));
    if (!arquivoPlanilhaPermitido(arquivo)) {
      return Promise.reject(
        new Error("Formato não permitido. Use Excel (.xlsx, .xls), ODS ou CSV.")
      );
    }

    return carregarBiblioteca().then(function (XLSX) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        var nome = (arquivo.name || "").toLowerCase();
        var ehTexto = nome.endsWith(".csv") || nome.endsWith(".txt");

        reader.onerror = function () {
          reject(new Error("Não foi possível ler o arquivo."));
        };

        reader.onload = function () {
          try {
            var wb;
            if (ehTexto) {
              var texto = String(reader.result || "");
              wb = XLSX.read(texto, { type: "string", FS: ";" });
              if (!wb.SheetNames.length && texto.indexOf(",") >= 0) {
                wb = XLSX.read(texto, { type: "string", FS: "," });
              }
            } else {
              wb = XLSX.read(new Uint8Array(reader.result), {
                type: "array",
                cellDates: true,
                bookVBA: true
              });
            }
            var completo = workbookParaGrades(wb);
            if (!completo.sheets.length) {
              reject(new Error("Planilha vazia."));
              return;
            }
            resolve(completo.sheets[0]);
          } catch (err) {
            reject(err instanceof Error ? err : new Error("Erro ao interpretar planilha."));
          }
        };

        if (ehTexto) reader.readAsText(arquivo, "UTF-8");
        else reader.readAsArrayBuffer(arquivo);
      });
    });
  }

  function workbookParaGrades(wb) {
    var XLSX = global.XLSX;
    if (!XLSX) return { sheets: [], sheetNames: [] };
    var sheets = [];
    (wb.SheetNames || []).forEach(function (sheetName) {
      var aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
        header: 1,
        defval: "",
        raw: false
      });
      var grade = linhasParaGrade(aoa);
      if (!grade.headers.length) return;
      grade.sheetName = sheetName;
      grade.name = sheetName;
      sheets.push(grade);
    });
    return { sheets: sheets, sheetNames: wb.SheetNames || [] };
  }

  function lerArquivoCompleto(arquivo) {
    if (!arquivo) return Promise.reject(new Error("Nenhum arquivo selecionado."));
    if (!arquivoPlanilhaPermitido(arquivo)) {
      return Promise.reject(
        new Error(
          "Formato não reconhecido. Use Excel (.xls, .xlsx, .xlsm, .xlt…), ODS ou CSV."
        )
      );
    }

    return carregarBiblioteca().then(function (XLSX) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        var nome = (arquivo.name || "").toLowerCase();
        var ehTexto = nome.endsWith(".csv") || nome.endsWith(".txt");

        reader.onerror = function () {
          reject(new Error("Não foi possível ler o arquivo."));
        };

        reader.onload = function () {
          try {
            var wb;
            if (ehTexto) {
              var texto = String(reader.result || "");
              wb = XLSX.read(texto, { type: "string", FS: ";" });
              if (!wb.SheetNames.length && texto.indexOf(",") >= 0) {
                wb = XLSX.read(texto, { type: "string", FS: "," });
              }
            } else {
              wb = XLSX.read(new Uint8Array(reader.result), {
                type: "array",
                cellDates: true,
                bookVBA: true
              });
            }
            var completo = workbookParaGrades(wb);
            if (!completo.sheets.length) {
              reject(new Error("Nenhuma aba com cabeçalho reconhecido."));
              return;
            }
            resolve(completo);
          } catch (err) {
            reject(err instanceof Error ? err : new Error("Erro ao interpretar planilha."));
          }
        };

        if (ehTexto) reader.readAsText(arquivo, "UTF-8");
        else reader.readAsArrayBuffer(arquivo);
      });
    });
  }

  function exportarWorkbookXlsx(abas, nomeArquivo) {
    return carregarBiblioteca().then(function (XLSX) {
      var wb = XLSX.utils.book_new();
      (abas || []).forEach(function (aba, ix) {
        var aoa = [];
        if (aba.metaRow && aba.metaRow.length) aoa.push(aba.metaRow);
        aoa.push(aba.headers || []);
        (aba.body || []).forEach(function (row) {
          aoa.push(row);
        });
        var nome = (aba.name || "Aba" + (ix + 1)).slice(0, 31);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), nome);
      });
      XLSX.writeFile(wb, nomeArquivo || "planilha-setad.xlsx");
    });
  }

  function exportarXlsx(headers, body, nomeArquivo, metaLinha) {
    return carregarBiblioteca().then(function (XLSX) {
      var aoa = [];
      if (metaLinha && metaLinha.length) {
        aoa.push(metaLinha);
      }
      aoa.push(headers);
      (body || []).forEach(function (row) {
        aoa.push(row);
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SETAD");
      XLSX.writeFile(wb, nomeArquivo || "planilha-setad.xlsx");
    });
  }

  function exportarCsv(headers, body, nomeArquivo, separador) {
    var sep = separador || ";";
    var linhas = [headers.join(sep)];
    (body || []).forEach(function (row) {
      linhas.push(
        row
          .map(function (c) {
            var s = String(c != null ? c : "");
            if (s.indexOf(sep) >= 0 || s.indexOf('"') >= 0 || s.indexOf("\n") >= 0) {
              return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
          })
          .join(sep)
      );
    });
    var blob = new Blob(["\ufeff" + linhas.join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo || "planilha-setad.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    return Promise.resolve();
  }

  global.SETADPlanilhaExcel = {
    carregarBiblioteca: carregarBiblioteca,
    arquivoPlanilhaPermitido: arquivoPlanilhaPermitido,
    lerArquivo: lerArquivo,
    lerArquivoCompleto: lerArquivoCompleto,
    exportarXlsx: exportarXlsx,
    exportarWorkbookXlsx: exportarWorkbookXlsx,
    exportarCsv: exportarCsv,
    linhasParaGrade: linhasParaGrade
  };
})(window);
