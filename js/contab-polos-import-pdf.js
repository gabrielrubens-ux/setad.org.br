/* Importação de alunos por PDF — contabilidade dos polos (cadastro estilo secretaria / SETADE). */

function usuarioPodeImportarPdfContabPolos(sessao) {
  if (
    typeof usuarioPodeAcessarContabilidadePolos === "function" &&
    !usuarioPodeAcessarContabilidadePolos(sessao)
  ) {
    return false;
  }
  if (
    typeof estaDesbloqueadaContabilidadePolos === "function" &&
    !estaDesbloqueadaContabilidadePolos(sessao)
  ) {
    return false;
  }
  return true;
}

function enviarPdfExtracaoContabPolos(arquivo) {
  var base =
    window.SETADApi && typeof SETADApi.getBase === "function" ? SETADApi.getBase() : "/api";
  var url = (base.startsWith("http") ? base : window.location.origin + base) + "/contab-polos/pdf/extrair";
  var form = new FormData();
  form.append("arquivo", arquivo);

  var headers = {};
  if (window.SETADNative && SETADNative.getToken()) {
    headers.Authorization = "Bearer " + SETADNative.getToken();
  }

  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: headers,
    body: form
  })
    .then(function (res) {
      return res.json().catch(function () {
        return { ok: false, erro: "Resposta inválida do servidor." };
      });
    })
    .catch(function () {
      return { ok: false, erro: "Falha de comunicação ao ler o PDF." };
    });
}

function normalizarModuloImportPdf(modulo, setadeNivel) {
  if (setadeNivel === "medio" || setadeNivel === "avancado") return setadeNivel;
  if (modulo && typeof MODULOS_CURSO !== "undefined" && MODULOS_CURSO[modulo]) return modulo;
  return modulo || "basico";
}

function resolverSalaTurmaIdPorNome(nomeSala, setadeNivel) {
  if (!nomeSala || typeof SALAS_TURMA_SETAD === "undefined") return "";
  var alvo = String(nomeSala).toLowerCase().trim();
  var sala = SALAS_TURMA_SETAD.find(function (s) {
    if (setadeNivel && s.nivel !== setadeNivel) return false;
    var id = (s.id || "").toLowerCase();
    var label =
      typeof obterLabelSalaTurma === "function" ? obterLabelSalaTurma(s.id).toLowerCase() : "";
    return id.indexOf(alvo) >= 0 || label.indexOf(alvo) >= 0 || alvo.indexOf(id) >= 0;
  });
  return sala ? sala.id : "";
}

function montarMatriculaDeLinhaPdf(linha, poloId, sessao) {
  var poloNome =
    typeof obterNomePoloSetad === "function" ? obterNomePoloSetad(poloId) : poloId;
  var setadeNivel = linha.setadeNivel || "";
  var modulo = normalizarModuloImportPdf(linha.modulo, setadeNivel);
  var dados = {
    nomeCompleto: linha.nomeCompleto,
    email: (linha.email || "").trim().toLowerCase(),
    telefone: linha.telefone || "",
    cpf: linha.cpf || "",
    dataNascimento: linha.dataNascimento || "",
    cidade: linha.cidade || "",
    estado: linha.estado || "PA",
    modulo: modulo,
    igreja: linha.igreja || "",
    poloId: poloId,
    poloNome: poloNome,
    origem: "importacao_pdf_polo",
    cadastradoPor: sessao && sessao.email ? sessao.email : null,
    status: "pendente",
    situacaoCurso: "cursando",
    observacoes:
      "Cadastro automático via PDF do polo" +
      (linha.salaTurmaNome ? " · Sala: " + linha.salaTurmaNome : "")
  };

  if (typeof ehPoloSetade === "function" && ehPoloSetade(poloId)) {
    if (!setadeNivel && (modulo === "medio" || modulo === "avancado")) {
      setadeNivel = modulo;
    }
    dados.setadeNivel = setadeNivel || "";
    dados.salaTurmaId = resolverSalaTurmaIdPorNome(linha.salaTurmaNome, dados.setadeNivel);
    dados.salaTurmaNome =
      dados.salaTurmaId && typeof obterLabelSalaTurma === "function"
        ? obterLabelSalaTurma(dados.salaTurmaId)
        : linha.salaTurmaNome || "";
    if (!dados.salaTurmaId) {
      dados.salaTurmaNome = linha.salaTurmaNome || "";
    }
  } else {
    dados.setadeNivel = "";
    dados.salaTurmaId = "";
    dados.salaTurmaNome = "";
  }

  if (typeof aplicarValoresModuloPadraoNaMatricula === "function") {
    aplicarValoresModuloPadraoNaMatricula(dados);
  }
  return dados;
}

function validarLinhaImportacaoPdf(dados) {
  if (!dados.nomeCompleto || dados.nomeCompleto.length < 3) {
    return "Nome incompleto.";
  }
  if (!dados.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    return "E-mail ausente ou inválido.";
  }
  if (
    dados.telefone &&
    dados.telefone.replace(/\D/g, "").length > 0 &&
    dados.telefone.replace(/\D/g, "").length < 10
  ) {
    return "Telefone inválido.";
  }
  if (!dados.poloId) return "Polo não definido.";
  if (typeof ehPoloSetade === "function" && ehPoloSetade(dados.poloId)) {
    if (
      dados.modulo !== "teologia" &&
      dados.setadeNivel !== "medio" &&
      dados.setadeNivel !== "avancado"
    ) {
      return "SETADE: informe nível (Médio/Avançado) no PDF ou módulo.";
    }
    if (!dados.salaTurmaId && !dados.salaTurmaNome) {
      return "SETADE: informe sala/turma no PDF.";
    }
  }
  return null;
}

function renderizarRevisaoImportacaoPdfContab(container, alunos, meta, sessao, aoConfirmar) {
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return String(s || ""); };

  if (!alunos.length) {
    container.innerHTML =
      '<p class="lista-vazia">Nenhum aluno reconhecido no PDF. Confira se o arquivo tem colunas (Nome, E-mail, Telefone…) ou linhas com e-mail.</p>';
    container.hidden = false;
    return;
  }

  var linhas = alunos
    .map(function (a, ix) {
      var dados = montarMatriculaDeLinhaPdf(a, meta.poloId, sessao);
      var erro = validarLinhaImportacaoPdf(dados);
      var sitClass = erro ? "polo-contab__pdf-linha--erro" : "polo-contab__pdf-linha--ok";
      return (
        '<tr class="polo-contab__pdf-linha ' + sitClass + '" data-pdf-ix="' + ix + '">' +
        '<td><input type="checkbox" class="polo-contab__pdf-check" data-pdf-ix="' + ix + '"' +
        (erro ? "" : " checked") +
        (erro ? " disabled" : "") +
        "></td>" +
        "<td>" + esc(dados.nomeCompleto) + "</td>" +
        "<td>" + esc(dados.email) + "</td>" +
        "<td>" + esc(dados.telefone || "—") + "</td>" +
        "<td>" + esc(dados.modulo || "—") + "</td>" +
        "<td>" + esc(erro || "Pronto") + "</td>" +
        "</tr>"
      );
    })
    .join("");

  container.innerHTML =
    '<div class="polo-contab__pdf-revisao">' +
    '<h3 class="polo-contab__pdf-revisao-titulo">Revisão — ' +
    esc(meta.nomeArquivo || "PDF") +
    "</h3>" +
    '<p class="presencial-bloco__hint">Método: <strong>' +
    esc(meta.metodo || "—") +
    "</strong> · " +
    alunos.length +
    " linha(s) · Polo: <strong>" +
    esc(meta.poloNome || meta.poloId) +
    "</strong>. Marque os alunos e clique em cadastrar no site (mesmo fluxo da secretaria, sem pagamento automático).</p>" +
    '<div class="polo-contab__pdf-acoes">' +
    '<button type="button" class="btn btn--primary btn--sm" id="btnContabPolosPdfCadastrar">Cadastrar selecionados no site</button>' +
    '<button type="button" class="btn btn--secondary btn--sm" id="btnContabPolosPdfCancelar">Descartar</button>' +
    "</div>" +
    '<div class="polo-contab__pdf-tabela-wrap">' +
    '<table class="data-table polo-contab__pdf-tabela"><thead><tr>' +
    "<th></th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Módulo</th><th>Status</th>" +
    "</tr></thead><tbody>" +
    linhas +
    "</tbody></table></div>" +
    '<div id="contabPolosPdfRevisaoMsg" class="form-mensagem" role="status"></div>' +
    "</div>";

  container.hidden = false;

  var btnCancel = document.getElementById("btnContabPolosPdfCancelar");
  if (btnCancel) {
    btnCancel.addEventListener("click", function () {
      container.innerHTML = "";
      container.hidden = true;
    });
  }

  document.getElementById("btnContabPolosPdfCadastrar").addEventListener("click", function () {
    var selecionados = [];
    container.querySelectorAll(".polo-contab__pdf-check:checked").forEach(function (cb) {
      var ix = Number(cb.getAttribute("data-pdf-ix"));
      if (!Number.isNaN(ix) && alunos[ix]) selecionados.push(alunos[ix]);
    });
    if (!selecionados.length) {
      var msg0 = document.getElementById("contabPolosPdfRevisaoMsg");
      if (msg0) {
        msg0.className = "form-mensagem form-mensagem--erro visible";
        msg0.textContent = "Selecione ao menos um aluno válido.";
      }
      return;
    }
  if (typeof aoConfirmar === "function") aoConfirmar(selecionados);
  });
}

function aplicarImportacaoPdfAlunos(linhas, poloId, sessao, onProgresso) {
  var cadastrar =
    typeof cadastrarMatriculaAsync === "function"
      ? cadastrarMatriculaAsync
      : function (d) {
          return Promise.resolve(
            typeof cadastrarMatricula === "function" ? cadastrarMatricula(d) : { ok: false }
          );
        };

  var resultados = { ok: 0, erros: [], duplicados: 0 };
  var ix = 0;

  function proximo() {
    if (ix >= linhas.length) {
      return Promise.resolve(resultados);
    }
    var linha = linhas[ix];
    ix += 1;
    if (onProgresso) onProgresso(ix, linhas.length);

    var dados = montarMatriculaDeLinhaPdf(linha, poloId, sessao);
    var erroVal = validarLinhaImportacaoPdf(dados);
    if (erroVal) {
      resultados.erros.push(dados.nomeCompleto + ": " + erroVal);
      return proximo();
    }

    var verificar =
      typeof verificarEmailDisponivelParaMatriculaAsync === "function"
        ? verificarEmailDisponivelParaMatriculaAsync(dados.email)
        : Promise.resolve(
            typeof verificarEmailDisponivelParaMatricula === "function"
              ? verificarEmailDisponivelParaMatricula(dados.email)
              : { ok: true }
          );

    return verificar.then(function (disp) {
      if (!disp.ok) {
        resultados.duplicados += 1;
        return proximo();
      }
      return cadastrar(dados).then(function (r) {
        if (r && r.ok) resultados.ok += 1;
        else {
          resultados.erros.push(
            dados.nomeCompleto + ": " + ((r && r.erro) || "Falha ao cadastrar.")
          );
        }
        return proximo();
      });
    });
  }

  return proximo();
}

function configurarImportacaoPdfContabPolos(container, sessao, obterPoloAtivoId, aoConcluir) {
  var input = document.getElementById("contabPolosPdfInput");
  var revisao = document.getElementById("contabPolosPdfRevisao");
  if (!input || !revisao) return;

  if (!usuarioPodeImportarPdfContabPolos(sessao)) {
    var label = document.getElementById("btnContabPolosPdfLabel");
    if (label) label.hidden = true;
    return;
  }

  var ultimoResultado = null;

  function processarArquivo(file) {
    var msg = document.getElementById("contabPolosMsg");
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      if (msg) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = "Selecione um arquivo PDF.";
      }
      return;
    }
    if (msg) {
      msg.className = "form-mensagem form-mensagem--sucesso visible";
      msg.textContent = "Lendo PDF e reconhecendo alunos…";
    }

    enviarPdfExtracaoContabPolos(file).then(function (r) {
      if (!r.ok) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = r.erro || "Não foi possível ler o PDF.";
        }
        return;
      }
      ultimoResultado = r;
      var poloId = obterPoloAtivoId();
      var poloNome =
        typeof obterNomePoloSetad === "function" ? obterNomePoloSetad(poloId) : poloId;
      renderizarRevisaoImportacaoPdfContab(
        revisao,
        r.alunos || [],
        {
          poloId: poloId,
          poloNome: poloNome,
          metodo: r.metodo,
          nomeArquivo: r.nomeArquivo
        },
        sessao,
        function (selecionados) {
          var btn = document.getElementById("btnContabPolosPdfCadastrar");
          var msgRev = document.getElementById("contabPolosPdfRevisaoMsg");
          if (btn) btn.disabled = true;
          if (msgRev) {
            msgRev.className = "form-mensagem form-mensagem--sucesso visible";
            msgRev.textContent = "Cadastrando alunos…";
          }
          aplicarImportacaoPdfAlunos(selecionados, poloId, sessao).then(function (res) {
            if (btn) btn.disabled = false;
            var texto =
              res.ok +
              " aluno(s) cadastrado(s)." +
              (res.duplicados ? " " + res.duplicados + " já existiam (e-mail)." : "") +
              (res.erros.length ? " Erros: " + res.erros.slice(0, 3).join(" · ") : "");
            if (msgRev) {
              msgRev.className =
                res.erros.length && !res.ok
                  ? "form-mensagem form-mensagem--erro visible"
                  : "form-mensagem form-mensagem--sucesso visible";
              msgRev.textContent = texto;
            }
            if (msg) {
              msg.className = "form-mensagem form-mensagem--sucesso visible";
              msg.textContent = texto;
            }
            if (window.SETAD && SETAD.pullColecoesInstitucionais) {
              SETAD.pullColecoesInstitucionais({ notificar: true, forcar: true });
            }
            if (typeof aoConcluir === "function") aoConcluir(res);
          });
        }
      );
      if (msg) {
        msg.className = "form-mensagem form-mensagem--sucesso visible";
        msg.textContent =
          (r.alunos ? r.alunos.length : 0) +
          " aluno(s) reconhecido(s) no PDF — revise e confirme o cadastro.";
      }
    });
  }

  input.addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    processarArquivo(file);
    e.target.value = "";
  });

}
