/**
 * Planilhas de polo no formato manual (ex.: GUAMÁ II — coluna ALUNOS + meses em serial Excel).
 */
(function (global) {
  "use strict";

  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();
  }

  function excelSerialParaMesAno(valor) {
    var n = Number(valor);
    if (!n || Number.isNaN(n) || n < 1000) return "";
    if (global.XLSX && global.XLSX.SSF && global.XLSX.SSF.parse_date_code) {
      var d = global.XLSX.SSF.parse_date_code(n);
      if (d && d.y && d.m) {
        return String(d.m).padStart(2, "0") + "/" + d.y;
      }
    }
    var base = Date.UTC(1899, 11, 30);
    var dt = new Date(base + n * 86400000);
    return (
      String(dt.getUTCMonth() + 1).padStart(2, "0") + "/" + dt.getUTCFullYear()
    );
  }

  function aoaDaAba(sheet) {
    if (!sheet) return [];
    if (sheet.aoaRaw && sheet.aoaRaw.length) return sheet.aoaRaw;
    if (global.XLSX && sheet["!ref"]) {
      return global.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    }
    if (sheet.headers && sheet.body) {
      return [sheet.headers].concat(sheet.body);
    }
    return [];
  }

  function detectarLinhaCabecalhoLegado(aoa) {
    for (var r = 0; r < Math.min(aoa.length, 25); r++) {
      var row = aoa[r] || [];
      for (var c = 0; c < row.length; c++) {
        if (norm(row[c]) === "ALUNOS") return r;
      }
    }
    return -1;
  }

  function detectarPlanilhaLegadaPoloMedio(sheet) {
    var aoa = aoaDaAba(sheet);
    return detectarLinhaCabecalhoLegado(aoa) >= 0;
  }

  function idxColunaLegado(row, titulo) {
    var alvo = norm(titulo);
    for (var i = 0; i < row.length; i++) {
      if (norm(row[i]) === alvo) return i;
    }
    return -1;
  }

  function interpretarCelulaMensalidadeLegado(val) {
    var s = String(val != null ? val : "").trim();
    if (!s) return "";
    if (norm(s) === "TRANCOU") return "";
    if (norm(s) === "ABONADA") return "";
    var n = Number(String(s).replace(",", "."));
    if (!Number.isNaN(n) && n > 0) return String(n) + "|pago";
    return "";
  }

  function linhaTemAluno(row, idxAlunos) {
    var nome = idxAlunos >= 0 ? String(row[idxAlunos] || "").trim() : "";
    return nome.length >= 3;
  }

  function converterPlanilhaLegadaPoloMedio(sheet, poloId) {
    var aoa = aoaDaAba(sheet);
    var linhaCab = detectarLinhaCabecalhoLegado(aoa);
    if (linhaCab < 0) return null;

    var cab = aoa[linhaCab] || [];
    var idxAlunos = idxColunaLegado(cab, "ALUNOS");
    var idxInicio = idxColunaLegado(cab, "INICIO");
    var idxTaxaMat = idxColunaLegado(cab, "MATRICULA");
    if (idxAlunos < 0) return null;

    var colunasMes = [];
    for (var c = 0; c < cab.length; c++) {
      if (c <= idxTaxaMat) continue;
      var rotuloMes = excelSerialParaMesAno(cab[c]);
      if (rotuloMes) colunasMes.push({ ix: c, rotulo: rotuloMes });
    }

    var headersCadastro = [
      "matricula_id",
      "nome",
      "email",
      "polo_id",
      "polo_nome",
      "modulo",
      "situacao",
      "forma_pagamento",
      "valor_sugerido",
      "observacoes"
    ];
    var headersMens = ["matricula_id", "nome", "email", "polo_id", "taxa_matricula"];
    colunasMes.forEach(function (col) {
      headersMens.push(col.rotulo);
    });
    headersMens.push("total_pago", "em_aberto");

    var polo =
      typeof obterPolosParaContabilidade === "function"
        ? (obterPolosParaContabilidade() || []).find(function (p) {
            return p.id === poloId;
          })
        : null;

    var bodyCadastro = [];
    var bodyMens = [];

    for (var r = linhaCab + 1; r < aoa.length; r++) {
      var row = aoa[r] || [];
      if (!linhaTemAluno(row, idxAlunos)) continue;

      var nome = String(row[idxAlunos] || "").trim();
      var inicioRaw = idxInicio >= 0 ? row[idxInicio] : "";
      var obs = [];
      if (norm(inicioRaw) === "ABONADA") {
        obs.push("matrícula abonada");
      } else if (inicioRaw) {
        var ini = excelSerialParaMesAno(inicioRaw);
        if (ini) obs.push("início " + ini);
      }

      var todasTrancou = true;
      var algumPago = false;
      colunasMes.forEach(function (col) {
        var v = row[col.ix];
        if (norm(v) === "TRANCOU") return;
        if (String(v || "").trim() === "") return;
        todasTrancou = false;
        var n = Number(String(v).replace(",", "."));
        if (!Number.isNaN(n) && n > 0) algumPago = true;
      });

      var situacao = todasTrancou && !algumPago ? "pendente" : algumPago ? "em_dia" : "pendente";
      if (colunasMes.some(function (col) { return norm(row[col.ix]) === "TRANCOU"; })) {
        obs.push("mensalidade trancada em planilha");
        if (todasTrancou) situacao = "pendente";
      }

      var taxa =
        idxTaxaMat >= 0 && row[idxTaxaMat] !== "" && !Number.isNaN(Number(row[idxTaxaMat]))
          ? Number(row[idxTaxaMat])
          : "";

      bodyCadastro.push([
        "",
        nome,
        "",
        poloId || "",
        polo ? polo.nome : "",
        "medio",
        situacao,
        algumPago ? "PIX" : "",
        taxa,
        obs.join("; ")
      ]);

      var celTaxa =
        taxa && !Number.isNaN(taxa) ? String(taxa) + "|pago" : "";
      var linhaMens = ["", nome, "", poloId || "", celTaxa];
      var totalPago = 0;
      if (taxa && !Number.isNaN(taxa)) totalPago += taxa;
      colunasMes.forEach(function (col) {
        var cel = interpretarCelulaMensalidadeLegado(row[col.ix]);
        linhaMens.push(cel);
        if (cel) {
          var partes = cel.split("|");
          var val = Number(partes[0]);
          if (!Number.isNaN(val)) totalPago += val;
        }
      });
      linhaMens.push(totalPago, "");

      bodyMens.push(linhaMens);
    }

    return {
      sheets: [
        {
          name: "Cadastro_contabil",
          headers: headersCadastro,
          body: bodyCadastro
        },
        {
          name: "Mensalidades",
          headers: headersMens,
          body: bodyMens
        }
      ],
      origem: "legado_polo_medio",
      alunos: bodyCadastro.length
    };
  }

  function normalizarWorkbookImportadoLegadoPolo(workbook, poloId) {
    if (!workbook || !workbook.sheets || !workbook.sheets.length) return workbook;

    var legado = false;
    var convertido = null;

    workbook.sheets.forEach(function (sh) {
      if (detectarPlanilhaLegadaPoloMedio(sh)) legado = true;
    });

    if (!legado) return workbook;

    workbook.sheets.some(function (sh) {
      if (detectarPlanilhaLegadaPoloMedio(sh)) {
        convertido = converterPlanilhaLegadaPoloMedio(sh, poloId);
        return true;
      }
      return false;
    });

    if (!convertido || !convertido.sheets) return workbook;
    return { sheets: convertido.sheets, origemLegadoPolo: convertido.origem, alunosLegado: convertido.alunos };
  }

  global.SETADContabPlanilhaLegadoPolo = {
    detectarPlanilhaLegadaPoloMedio: detectarPlanilhaLegadaPoloMedio,
    converterPlanilhaLegadaPoloMedio: converterPlanilhaLegadaPoloMedio,
    normalizarWorkbookImportadoLegadoPolo: normalizarWorkbookImportadoLegadoPolo
  };
})(window);
