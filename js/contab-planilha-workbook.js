/**
 * Exportação/importação completa — cadastro, mensalidades e notas por polo.
 */
(function (global) {
  "use strict";

  function idPoloRecepcaoGeral() {
    return global.POLO_SETAD_GERAL_ID || "setad-geral";
  }

  function modoRecepcaoGeral(poloId) {
    return poloId === idPoloRecepcaoGeral();
  }

  function normCab(n) {
    return String(n || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/"/g, "");
  }

  function poloIdDaLinha(grade, row) {
    var cab = (grade.headers || []).map(normCab);
    var idx = cab.indexOf("polo_id");
    if (idx < 0) return "";
    return String(row[idx] || "").trim();
  }

  function obterMatriculaDaLinhaGrade(grade, row, poloId) {
    if (typeof global.resolverMatriculaLinhaPlanilhaContab === "function") {
      return global.resolverMatriculaLinhaPlanilhaContab(grade.headers, row, poloId);
    }
    var cab = (grade.headers || []).map(normCab);
    var idxId = cab.indexOf("matricula_id");
    var idxEmail = cab.indexOf("email");
    if (idxId >= 0 && row[idxId]) {
      return typeof global.obterMatriculaPorId === "function"
        ? global.obterMatriculaPorId(String(row[idxId]).trim())
        : null;
    }
    if (idxEmail >= 0 && row[idxEmail]) {
      return typeof global.obterMatriculaPorEmail === "function"
        ? global.obterMatriculaPorEmail(String(row[idxEmail]).trim())
        : null;
    }
    return null;
  }

  function matriculaCompativelLinhaPolo(matricula, grade, row, poloDestino) {
    if (!matricula) return false;
    if (modoRecepcaoGeral(poloDestino)) {
      var pid = poloIdDaLinha(grade, row);
      if (!pid) return true;
      if (matricula.poloId && matricula.poloId !== pid) return false;
      return true;
    }
    if (poloDestino && matricula.poloId && matricula.poloId !== poloDestino) {
      return false;
    }
    return true;
  }

  function rotuloMesCabecalhoPlanilha(raw) {
    if (global.SETADContabPlanilhaLegadoPolo && global.SETADContabPlanilhaLegadoPolo.rotuloMesTextoLegado) {
      var rotLegado = global.SETADContabPlanilhaLegadoPolo.rotuloMesTextoLegado(raw);
      if (rotLegado) return rotLegado;
    }
    var n = Number(raw);
    if (!Number.isNaN(n) && n >= 1000 && global.XLSX && global.XLSX.SSF) {
      var d = global.XLSX.SSF.parse_date_code(n);
      if (d && d.y && d.m) {
        return String(d.m).padStart(2, "0") + "/" + d.y;
      }
    }
    var s = String(raw || "").trim();
    if (/^\d{2}\/\d{4}$/.test(s)) return s;
    var m = s.match(/^(\d{1,2})\/(\d{4})$/);
    if (m) return String(m[1]).padStart(2, "0") + "/" + m[2];
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) return String(m[2]).padStart(2, "0") + "/" + m[3];
    return "";
  }

  function classificarAba(nomeAba, headers) {
    var cab = (headers || []).map(normCab);
    var cabRaw = (headers || []).map(function (h) {
      return String(h || "").trim();
    });
    var nome = normCab(nomeAba);
    var mesCol = cabRaw.some(function (c) {
      return !!rotuloMesCabecalhoPlanilha(c);
    });
    if (cab.indexOf("matricula_id") >= 0 && cab.indexOf("disciplina") < 0) {
      if (mesCol) return "mensalidades";
      if (cab.indexOf("situacao") >= 0 || cab.indexOf("forma_pagamento") >= 0) {
        return "cadastro";
      }
    }
    if (cab.indexOf("disciplina") >= 0 && cab.indexOf("nota") >= 0) return "notas";
    if (nome.indexOf("mensal") >= 0) return "mensalidades";
    if (nome.indexOf("nota") >= 0 || nome.indexOf("media") >= 0) return "notas";
    if (nome.indexOf("cadastro") >= 0) return "cadastro";
    if (cab.indexOf("matricula_id") >= 0) return "cadastro";
    return "desconhecido";
  }

  function montarCorpoMensalidadesExportPolo(poloId) {
    if (
      typeof obterMatriculasDoPolo !== "function" ||
      typeof gerarColunasMensalidadePlanilhaTurma !== "function"
    ) {
      return { headers: [], body: [] };
    }
    var linhas = obterMatriculasDoPolo(poloId);
    var colunas = gerarColunasMensalidadePlanilhaTurma({ alunos: linhas });
    var headers = ["matricula_id", "nome", "email", "polo_id", "taxa_matricula"];
    colunas.forEach(function (c) {
      headers.push(c.coluna);
    });
    headers.push("total_pago", "em_aberto");

    var body = linhas.map(function (m) {
      var row = [m.id, m.nomeCompleto || "", m.email || "", m.poloId || "", ""];
      colunas.forEach(function (col) {
        var pag =
          typeof obterPagamentoMensalidadeReferencia === "function"
            ? obterPagamentoMensalidadeReferencia(m, col.referencia)
            : null;
        if (!pag) {
          row.push("");
          return;
        }
        row.push(String(pag.valor || "") + "|" + (pag.status || "pago"));
      });
      var resumo =
        typeof resumoExtratoMatricula === "function"
          ? resumoExtratoMatricula(m)
          : typeof resumoExtratoAluno === "function"
            ? resumoExtratoAluno(m.email)
            : { valorPago: 0, valorPendente: 0, valorAgendado: 0 };
      var emAberto = (resumo.valorPendente || 0) + (resumo.valorAgendado || 0);
      row.push(resumo.valorPago || 0, emAberto);
      return row;
    });

    return { headers: headers, body: body };
  }

  function montarCorpoNotasExportPolo(poloId) {
    if (typeof obterMatriculasDoPolo !== "function") {
      return { headers: [], body: [] };
    }
    var periodo =
      typeof obterPeriodoLetivoAtual === "function"
        ? obterPeriodoLetivoAtual()
        : new Date().getFullYear() + "-1";
    var headers = [
      "matricula_id",
      "nome",
      "email",
      "polo_id",
      "periodo",
      "disciplina",
      "nota",
      "media_manual"
    ];
    var disciplinas =
      typeof DISCIPLINAS_SETAD !== "undefined" ? DISCIPLINAS_SETAD.slice() : [];
    var linhas = obterMatriculasDoPolo(poloId);
    var body = [];

    linhas.forEach(function (m) {
      var media =
        typeof obterMediaExibicaoAluno === "function"
          ? obterMediaExibicaoAluno(m.email, periodo)
          : "";
      disciplinas.forEach(function (disc) {
        var nota =
          typeof obterNotaLancamento === "function"
            ? obterNotaLancamento(m.email, disc, periodo, "prova", "Prova 1")
            : null;
        body.push([
          m.id,
          m.nomeCompleto || "",
          m.email || "",
          m.poloId || "",
          periodo,
          disc,
          nota && nota.valor != null ? nota.valor : "",
          media !== null && media !== undefined ? media : ""
        ]);
      });
    });

    return { headers: headers, body: body };
  }

  function cabIndex(headers, nome) {
    var cab = (headers || []).map(normCab);
    return cab.indexOf(nome);
  }

  function linhaParaHeaders(headersDest, headersSrc, rowSrc) {
    var cabSrc = (headersSrc || []).map(normCab);
    return (headersDest || []).map(function (h) {
      var ix = cabSrc.indexOf(normCab(h));
      return ix >= 0 && rowSrc[ix] != null ? rowSrc[ix] : "";
    });
  }

  function mesclarDuasLinhas(headers, siteRow, headersImp, impRow) {
    var cabImp = (headersImp || []).map(normCab);
    return (headers || []).map(function (h, i) {
      var ixI = cabImp.indexOf(normCab(h));
      var vI = ixI >= 0 ? impRow[ixI] : "";
      var vS = siteRow[i] != null ? siteRow[i] : "";
      if (vI !== "" && vI != null && String(vI).trim() !== "") return vI;
      return vS;
    });
  }

  function normalizarNomeMerge(nome) {
    if (typeof global.normalizarNomePlanilhaContab === "function") {
      return global.normalizarNomePlanilhaContab(nome);
    }
    return String(nome || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function chaveLinhaMerge(tipo, headers, row) {
    var idIx = cabIndex(headers, "matricula_id");
    var id = idIx >= 0 ? String(row[idIx] || "").trim() : "";
    if (!id) {
      var nIx = cabIndex(headers, "nome");
      var nome = nIx >= 0 ? normalizarNomeMerge(row[nIx]) : "";
      if (nome) id = "nome:" + nome;
    }
    if (!id) return "";
    if (tipo === "notas") {
      var dIx = cabIndex(headers, "disciplina");
      var disc = dIx >= 0 ? String(row[dIx] || "").trim() : "";
      return id + "§" + disc;
    }
    return id;
  }

  function extrairColunasMes(headers) {
    return (headers || [])
      .map(function (h) {
        return String(h || "").trim();
      })
      .filter(function (h) {
        return /^\d{2}\/\d{4}$/.test(h);
      });
  }

  function headersMensalidadesUnidos(siteHeaders, impHeaders) {
    var prefixo = ["matricula_id", "nome", "email", "polo_id", "taxa_matricula"];
    var meses = extrairColunasMes(siteHeaders).concat(extrairColunasMes(impHeaders));
    var vistos = {};
    meses = meses.filter(function (m) {
      if (vistos[m]) return false;
      vistos[m] = true;
      return true;
    });
    meses.sort(function (a, b) {
      var pa = a.split("/");
      var pb = b.split("/");
      var ka = Number(pa[1] + pa[0]);
      var kb = Number(pb[1] + pb[0]);
      return ka - kb;
    });
    return prefixo.concat(meses).concat(["total_pago", "em_aberto"]);
  }

  function mesclarGradeImportadaSite(importSheet, siteSheet, tipo, opcoes) {
    opcoes = opcoes || {};
    if (!siteSheet || !siteSheet.headers || !siteSheet.headers.length) {
      return {
        name: importSheet.name || "Planilha",
        headers: (importSheet.headers || []).slice(),
        body: (importSheet.body || []).map(function (r) {
          return r.slice();
        })
      };
    }
    var headers =
      tipo === "mensalidades"
        ? headersMensalidadesUnidos(siteSheet.headers, importSheet.headers)
        : siteSheet.headers.slice();
    var mapImp = {};
    (importSheet.body || []).forEach(function (row) {
      var ch = chaveLinhaMerge(tipo, importSheet.headers, row);
      if (ch) mapImp[ch] = row;
    });

    var body = [];
    var usados = {};

    function linhaNoLayout(headersDest, headersSrc, rowSrc, rowSite) {
      if (opcoes.priorizarImportacao && rowSrc) {
        return linhaParaHeaders(headersDest, headersSrc, rowSrc);
      }
      if (rowSite) {
        return mesclarDuasLinhas(headersDest, rowSite, headersSrc, rowSrc);
      }
      return linhaParaHeaders(headersDest, headersSrc, rowSrc);
    }

    (siteSheet.body || []).forEach(function (siteRow) {
      var ch = chaveLinhaMerge(tipo, headers, siteRow);
      if (ch && mapImp[ch]) {
        body.push(linhaNoLayout(headers, importSheet.headers, mapImp[ch], siteRow));
        usados[ch] = true;
      } else if (!opcoes.priorizarImportacao) {
        body.push(linhaParaHeaders(headers, siteSheet.headers, siteRow));
      }
    });

    Object.keys(mapImp).forEach(function (ch) {
      if (usados[ch]) return;
      body.push(linhaParaHeaders(headers, importSheet.headers, mapImp[ch]));
    });

    return {
      name: siteSheet.name || importSheet.name,
      headers: headers,
      body: body
    };
  }

  function mesclarWorkbooksImportadoSite(workbookImport, poloId, opcoes) {
    opcoes = opcoes || {};
    if (opcoes.priorizarImportacao || (workbookImport && workbookImport.origemLegadoPolo)) {
      opcoes.priorizarImportacao = true;
    }
    var importSheets = (workbookImport && workbookImport.sheets) || [];
    if (typeof global.reconhecerAlunosWorkbookContabPolos === "function") {
      var rec = global.reconhecerAlunosWorkbookContabPolos(workbookImport, poloId);
      importSheets = rec.sheets || importSheets;
    }
    var siteSheets = opcoes.priorizarImportacao ? [] : montarWorkbookExportacaoPolo(poloId);
    var importPorTipo = {};

    importSheets.forEach(function (sh) {
      var t = classificarAba(sh.name, sh.headers);
      if (t !== "desconhecido") importPorTipo[t] = sh;
    });

    var saida = [];
    var tiposSite = {};

    siteSheets.forEach(function (siteSh) {
      var t = classificarAba(siteSh.name, siteSh.headers);
      tiposSite[t] = true;
      var imp = importPorTipo[t];
      if (imp) {
        saida.push(mesclarGradeImportadaSite(imp, siteSh, t, opcoes));
      } else {
        saida.push({
          name: siteSh.name,
          headers: siteSh.headers.slice(),
          body: (siteSh.body || []).map(function (r) {
            return r.slice();
          })
        });
      }
    });

    importSheets.forEach(function (imp) {
      var t = classificarAba(imp.name, imp.headers);
      if (t === "desconhecido") {
        saida.push({
          name: imp.name,
          headers: (imp.headers || []).slice(),
          body: (imp.body || []).map(function (r) {
            return r.slice();
          })
        });
        return;
      }
      if (!tiposSite[t]) {
        saida.push({
          name: imp.name,
          headers: (imp.headers || []).slice(),
          body: (imp.body || []).map(function (r) {
            return r.slice();
          })
        });
      }
    });

    if (!saida.length && importSheets.length) {
      return importSheets.map(function (sh) {
        return {
          name: sh.name,
          headers: (sh.headers || []).slice(),
          body: (sh.body || []).map(function (r) {
            return r.slice();
          })
        };
      });
    }

    if (opcoes.priorizarImportacao && !saida.length) {
      return importSheets.map(function (sh) {
        return {
          name: sh.name,
          headers: (sh.headers || []).slice(),
          body: (sh.body || []).map(function (r) {
            return r.slice();
          })
        };
      });
    }

    return saida;
  }

  function montarWorkbookExportacaoPolo(poloId) {
    var colunasCadastro =
      typeof CONTAB_POLOS_COLUNAS_MODELO !== "undefined"
        ? CONTAB_POLOS_COLUNAS_MODELO
        : [
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
    var cadastro =
      typeof montarCorpoExportacaoContabPolos === "function"
        ? {
            headers: colunasCadastro,
            body: montarCorpoExportacaoContabPolos(poloId)
          }
        : { headers: [], body: [] };
    var mens = montarCorpoMensalidadesExportPolo(poloId);
    var notas = montarCorpoNotasExportPolo(poloId);
    var polo =
      typeof obterPolosParaContabilidade === "function"
        ? obterPolosParaContabilidade().find(function (p) {
            return p.id === poloId;
          })
        : null;
    var meta = [
      "SETAD — polo: " + (polo ? polo.nome : poloId) + " · gerado em " + new Date().toISOString()
    ];
    return [
      {
        name: "Cadastro_contabil",
        headers: cadastro.headers,
        body: cadastro.body,
        metaRow: meta
      },
      { name: "Mensalidades", headers: mens.headers, body: mens.body },
      { name: "Notas_medias", headers: notas.headers, body: notas.body }
    ];
  }

  function exportarWorkbookPolo(poloId) {
    if (!global.SETADPlanilhaExcel || !global.SETADPlanilhaExcel.exportarWorkbookXlsx) {
      if (typeof exportarPlanilhaContabPolosXlsx === "function") {
        exportarPlanilhaContabPolosXlsx(poloId);
      }
      return;
    }
    var abas = montarWorkbookExportacaoPolo(poloId);
    var nome =
      "setad-polo-completo-" + (poloId || "todos") + "-" + new Date().toISOString().slice(0, 10) + ".xlsx";
    global.SETADPlanilhaExcel.exportarWorkbookXlsx(abas, nome);
  }

  function aplicarAbaCadastro(grade, poloId, sessao) {
    if (typeof aplicarGradePlanilhaContabPolos !== "function") {
      return { ok: false, erro: "Módulo de cadastro indisponível.", count: 0 };
    }
    if (poloId && !modoRecepcaoGeral(poloId)) {
      var cab = grade.headers.map(normCab);
      var idxPolo = cab.indexOf("polo_id");
      if (idxPolo >= 0) {
        grade.body = grade.body.filter(function (row) {
          var pid = String(row[idxPolo] || "").trim();
          return !pid || pid === poloId;
        });
      }
    } else if (modoRecepcaoGeral(poloId)) {
      var cabG = grade.headers.map(normCab);
      if (cabG.indexOf("polo_id") < 0) {
        return {
          ok: false,
          erro: "SETAD geral: inclua a coluna polo_id em cada linha para desmembrar.",
          count: 0
        };
      }
    }
    var r = aplicarGradePlanilhaContabPolos(grade, sessao, poloId);
    return {
      ok: r.ok,
      erro: r.erro || r.aviso,
      count: r.atualizados || 0,
      tipo: "cadastro"
    };
  }

  function parseCelulaMensalidade(valor) {
    var s = String(valor || "").trim();
    if (!s) return null;
    var partes = s.split("|");
    var valorNum = Number(String(partes[0]).replace(",", "."));
    var status = (partes[1] || "pago").trim().toLowerCase();
    if (status === "pago_presencial") status = "pago";
    if (!status) status = "pago";
    return { valor: valorNum, status: status };
  }

  function aplicarAbaMensalidades(grade, poloId, sessao) {
    if (typeof registrarOuAtualizarMensalidadeTurma !== "function") {
      return { ok: false, erro: "Módulo de mensalidades indisponível.", count: 0 };
    }
    var cab = grade.headers.map(normCab);
    var idxId = cab.indexOf("matricula_id");
    var idxEmail = cab.indexOf("email");
    var idxNome = cab.indexOf("nome");
    if (idxId < 0 && idxEmail < 0 && idxNome < 0) {
      return {
        ok: false,
        erro: 'Aba Mensalidades: informe "matricula_id", "email" ou "nome".',
        count: 0
      };
    }
    var meses = [];
    (grade.headers || []).forEach(function (c, i) {
      var rotulo = rotuloMesCabecalhoPlanilha(c);
      if (rotulo) {
        meses.push({ ix: i, referencia: "Mensalidade " + rotulo });
      }
    });
    if (!meses.length) {
      return { ok: false, erro: "Aba Mensalidades: nenhuma coluna de mês (ex.: 03/2026).", count: 0 };
    }
    var idxTaxa = cab.indexOf("taxa_matricula");
    var count = 0;
    grade.body.forEach(function (row) {
      var matricula = obterMatriculaDaLinhaGrade(grade, row, poloId);
      if (!matricula) return;
      if (!matriculaCompativelLinhaPolo(matricula, grade, row, poloId)) return;

      if (idxTaxa >= 0 && row[idxTaxa] !== "" && row[idxTaxa] != null) {
        var taxaParsed = parseCelulaMensalidade(row[idxTaxa]);
        if (!taxaParsed) {
          var taxaNum = Number(String(row[idxTaxa]).replace(",", "."));
          if (!Number.isNaN(taxaNum) && taxaNum > 0) {
            taxaParsed = { valor: taxaNum, status: "pago" };
          }
        }
        if (taxaParsed && taxaParsed.valor > 0 && typeof global.aplicarPagamentoAlunoPolo === "function") {
          var regTaxa = global.aplicarPagamentoAlunoPolo(
            matricula,
            {
              tipoCobranca: "matricula",
              situacaoPagamento: "pago_presencial",
              formaPagamento: "PIX",
              valor: taxaParsed.valor,
              observacoes: "Importação Excel — taxa de matrícula"
            },
            sessao
          );
          if (regTaxa && regTaxa.ok) count++;
        }
      }

      meses.forEach(function (mes) {
        var parsed = parseCelulaMensalidade(row[mes.ix]);
        if (!parsed || !parsed.valor) return;
        var reg = registrarOuAtualizarMensalidadeTurma(
          matricula,
          mes.referencia,
          {
            valor: parsed.valor,
            status: parsed.status,
            formaPagamento: "PIX",
            observacoes: "Importação Excel — mensalidades"
          },
          sessao
        );
        if (reg && reg.ok) count++;
      });
    });
    return { ok: true, count: count, tipo: "mensalidades" };
  }

  function aplicarAbaNotas(grade, poloId, sessao) {
    if (typeof salvarNotaAcademica !== "function") {
      return { ok: false, erro: "Módulo de notas indisponível.", count: 0 };
    }
    var cab = grade.headers.map(normCab);
    var idxDisc = cab.indexOf("disciplina");
    var idxNota = cab.indexOf("nota");
    var idxPeriodo = cab.indexOf("periodo");
    var idxMedia = cab.indexOf("media_manual");
    if (idxDisc < 0 || idxNota < 0) {
      return { ok: false, erro: 'Aba Notas: colunas "disciplina" e "nota" são obrigatórias.', count: 0 };
    }
    var count = 0;
    grade.body.forEach(function (row) {
      var matricula = obterMatriculaDaLinhaGrade(grade, row, poloId);
      if (!matricula) return;
      if (!matriculaCompativelLinhaPolo(matricula, grade, row, poloId)) return;

      var periodo =
        idxPeriodo >= 0 && row[idxPeriodo]
          ? String(row[idxPeriodo]).trim()
          : typeof obterPeriodoLetivoAtual === "function"
            ? obterPeriodoLetivoAtual()
            : "";

      var notaVal = String(row[idxNota] || "").trim();
      if (notaVal) {
        var r = salvarNotaAcademica(
          {
            matriculaId: matricula.id,
            alunoEmail: matricula.email,
            periodo: periodo,
            disciplina: String(row[idxDisc]).trim(),
            tipo: "prova",
            avaliacao: "Prova 1",
            valor: notaVal
          },
          sessao
        );
        if (r && r.ok) count++;
      }

      if (idxMedia >= 0 && row[idxMedia] !== "" && row[idxMedia] != null) {
        var rm = salvarNotaAcademica(
          {
            matriculaId: matricula.id,
            alunoEmail: matricula.email,
            periodo: periodo,
            tipo: "media_manual",
            valor: String(row[idxMedia]).trim()
          },
          sessao
        );
        if (rm && rm.ok) count++;
      }
    });
    return { ok: true, count: count, tipo: "notas" };
  }

  function aplicarWorkbookContabPolos(workbook, poloId, sessao) {
    if (!workbook || !workbook.sheets || !workbook.sheets.length) {
      return { ok: false, erro: "Arquivo sem abas reconhecidas." };
    }
    if (
      typeof usuarioPodeSalvarPlanilhaContabPolos === "function" &&
      !usuarioPodeSalvarPlanilhaContabPolos(sessao)
    ) {
      return {
        ok: false,
        erro: "Confirme a senha da contabilidade para salvar alterações no site."
      };
    }
    if (!poloId) {
      return { ok: false, erro: "Selecione o polo de destino antes de aplicar." };
    }

    var resumo = [];
    var erros = [];
    if (modoRecepcaoGeral(poloId)) {
      resumo.push("Recepção SETAD geral — desmembrando por polo_id");
    }

    workbook.sheets.forEach(function (sheet) {
      var tipo = classificarAba(sheet.name, sheet.headers);
      var grade = { headers: sheet.headers, body: sheet.body };
      var r;
      if (tipo === "cadastro") r = aplicarAbaCadastro(grade, poloId, sessao);
      else if (tipo === "mensalidades") r = aplicarAbaMensalidades(grade, poloId, sessao);
      else if (tipo === "notas") r = aplicarAbaNotas(grade, poloId, sessao);
      else return;

      if (r.ok) {
        resumo.push((sheet.name || tipo) + ": " + (r.count || 0) + " lançamento(s)");
      } else if (r.erro) {
        erros.push(r.erro);
      }
    });

    if (!resumo.length && erros.length) {
      return { ok: false, erro: erros.join(" ") };
    }

    if (!resumo.length) {
      return {
        ok: false,
        erro:
          "Nenhuma aba aplicada. Use abas Cadastro_contabil, Mensalidades ou Notas_medias com os cabeçalhos do modelo Excel."
      };
    }

    return {
      ok: true,
      atualizados: resumo.join(" · "),
      resumo: resumo,
      avisos: erros
    };
  }

  global.SETADContabPlanilhaWorkbook = {
    classificarAba: classificarAba,
    montarWorkbookExportacaoPolo: montarWorkbookExportacaoPolo,
    mesclarWorkbooksImportadoSite: mesclarWorkbooksImportadoSite,
    exportarWorkbookPolo: exportarWorkbookPolo,
    aplicarWorkbookContabPolos: aplicarWorkbookContabPolos
  };
})(window);
