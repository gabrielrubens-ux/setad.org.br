/* Valores de matrícula/mensalidade por aluno e projeção até o término do curso */

function parseNumeroValorCurso(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  var n = parseFloat(String(valor).replace(",", "."));
  if (isNaN(n) || n < 0) return null;
  return n;
}

function obterValorMatriculaMatricula(matricula) {
  var custom = parseNumeroValorCurso(matricula && matricula.valorMatricula);
  if (custom !== null) return custom;
  var mod = matricula && matricula.modulo;
  if (typeof obterTaxaMatriculaModulo === "function") {
    return obterTaxaMatriculaModulo(mod);
  }
  return 50;
}

function obterValorMensalidadeMatricula(matricula) {
  var custom = parseNumeroValorCurso(matricula && matricula.valorMensalidade);
  if (custom !== null) return custom;
  var mod = matricula && matricula.modulo;
  if (typeof obterMensalidadeModulo === "function") {
    return obterMensalidadeModulo(mod);
  }
  return 0;
}

function aplicarValoresModuloPadraoNaMatricula(dados) {
  dados = dados || {};
  var mod = dados.modulo;
  if (!mod) return dados;
  if (parseNumeroValorCurso(dados.valorMatricula) === null) {
    dados.valorMatricula =
      typeof obterTaxaMatriculaModulo === "function"
        ? obterTaxaMatriculaModulo(mod)
        : 50;
  }
  if (parseNumeroValorCurso(dados.valorMensalidade) === null) {
    dados.valorMensalidade =
      typeof obterMensalidadeModulo === "function"
        ? obterMensalidadeModulo(mod)
        : 0;
  }
  return dados;
}

function parseDataLocalCurso(isoOuInput) {
  if (!isoOuInput) return null;
  var s = String(isoOuInput).slice(0, 10);
  var partes = s.split("-");
  if (partes.length !== 3) return null;
  var y = parseInt(partes[0], 10);
  var m = parseInt(partes[1], 10) - 1;
  var d = parseInt(partes[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

function contarMensalidadesPeriodoCurso(dataInicio, dataTermino) {
  var inicio = parseDataLocalCurso(dataInicio);
  var fim = parseDataLocalCurso(dataTermino);
  if (!inicio || !fim || fim < inicio) return null;
  var meses =
    (fim.getFullYear() - inicio.getFullYear()) * 12 +
    (fim.getMonth() - inicio.getMonth()) +
    1;
  return Math.max(1, meses);
}

function calcularResumoFinanceiroCurso(dados) {
  dados = dados || {};
  var valorMatricula = obterValorMatriculaMatricula(dados);
  var valorMensalidade = obterValorMensalidadeMatricula(dados);
  var quantidadeMensalidades = contarMensalidadesPeriodoCurso(
    dados.cursoDataInicio,
    dados.cursoDataTermino
  );
  var totalMensalidades =
    quantidadeMensalidades !== null
      ? quantidadeMensalidades * valorMensalidade
      : null;
  var valorTotalCurso =
    totalMensalidades !== null ? valorMatricula + totalMensalidades : null;

  return {
    valorMatricula: valorMatricula,
    valorMensalidade: valorMensalidade,
    quantidadeMensalidades: quantidadeMensalidades,
    totalMensalidades: totalMensalidades,
    valorTotalCurso: valorTotalCurso
  };
}

function formatarMoedaValorCurso(valor) {
  if (typeof formatarMoeda === "function") {
    return formatarMoeda(valor);
  }
  return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");
}

function montarHtmlResumoFinanceiroCurso(resumo, opcoes) {
  opcoes = opcoes || {};
  var esc =
    typeof escaparHtml === "function" ? escaparHtml : function (s) { return s; };
  resumo = resumo || calcularResumoFinanceiroCurso({});

  var linhas =
    "<p><strong>Matrícula:</strong> " +
    esc(formatarMoedaValorCurso(resumo.valorMatricula)) +
    " &nbsp;·&nbsp; <strong>Mensalidade:</strong> " +
    esc(formatarMoedaValorCurso(resumo.valorMensalidade)) +
    "/mês</p>";

  if (resumo.quantidadeMensalidades !== null) {
    linhas +=
      "<p><strong>Mensalidades no período:</strong> " +
      esc(String(resumo.quantidadeMensalidades)) +
      " &nbsp;·&nbsp; <strong>Subtotal mensalidades:</strong> " +
      esc(formatarMoedaValorCurso(resumo.totalMensalidades)) +
      "</p>" +
      "<p class=\"curso-financeiro-resumo__total\"><strong>Total previsto até o término:</strong> " +
      esc(formatarMoedaValorCurso(resumo.valorTotalCurso)) +
      " <span class=\"presencial-bloco__hint\">(matrícula + mensalidades)</span></p>";
  } else if (opcoes.mostrarAvisoPeriodo !== false) {
    linhas +=
      '<p class="presencial-bloco__hint">Informe início e término do curso para calcular o total até o fim.</p>';
  }

  return '<div class="curso-financeiro-resumo__corpo">' + linhas + "</div>";
}

function lerDadosFinanceirosFormularioPresencial() {
  var moduloEl = document.getElementById("secModulo");
  var inicioEl = document.getElementById("secCursoInicio");
  var terminoEl = document.getElementById("secCursoTermino");
  var matEl = document.getElementById("secValorMatricula");
  var menEl = document.getElementById("secValorMensalidade");
  return {
    modulo: moduloEl ? moduloEl.value : "",
    cursoDataInicio: inicioEl ? inicioEl.value : "",
    cursoDataTermino: terminoEl ? terminoEl.value : "",
    valorMatricula: matEl ? matEl.value : "",
    valorMensalidade: menEl ? menEl.value : ""
  };
}

function aplicarValoresPadraoModuloNosCampos(prefixo) {
  prefixo = prefixo || "sec";
  var moduloEl = document.getElementById(prefixo === "mat" ? "matModulo" : "secModulo");
  var matEl = document.getElementById(
    prefixo === "mat" ? "matValorMatricula" : "secValorMatricula"
  );
  var menEl = document.getElementById(
    prefixo === "mat" ? "matValorMensalidade" : "secValorMensalidade"
  );
  if (!moduloEl || !moduloEl.value) return;
  if (matEl && matEl.dataset.editadoManual !== "1") {
    matEl.value = String(obterTaxaMatriculaModulo(moduloEl.value));
  }
  if (menEl && menEl.dataset.editadoManual !== "1") {
    menEl.value = String(obterMensalidadeModulo(moduloEl.value));
  }
}

function atualizarResumoFinanceiroCursoPresencial() {
  var alvo = document.getElementById("secResumoFinanceiroCurso");
  if (!alvo) return;
  var dados = lerDadosFinanceirosFormularioPresencial();
  alvo.innerHTML = montarHtmlResumoFinanceiroCurso(
    calcularResumoFinanceiroCurso(dados)
  );
}

function anexarValoresFinanceirosPresencialAosDados(dados) {
  var matEl = document.getElementById("secValorMatricula");
  var menEl = document.getElementById("secValorMensalidade");
  dados.valorMatricula =
    matEl && matEl.value !== "" ? parseNumeroValorCurso(matEl.value) : null;
  dados.valorMensalidade =
    menEl && menEl.value !== "" ? parseNumeroValorCurso(menEl.value) : null;
  aplicarValoresModuloPadraoNaMatricula(dados);
  return dados;
}

function preencherCamposValoresFinanceirosPresencial(matricula) {
  var matEl = document.getElementById("secValorMatricula");
  var menEl = document.getElementById("secValorMensalidade");
  if (matEl) {
    matEl.dataset.editadoManual = "";
    matEl.value =
      matricula && matricula.valorMatricula !== undefined && matricula.valorMatricula !== null
        ? String(matricula.valorMatricula)
        : matricula && matricula.modulo
          ? String(obterTaxaMatriculaModulo(matricula.modulo))
          : "";
  }
  if (menEl) {
    menEl.dataset.editadoManual = "";
    menEl.value =
      matricula &&
      matricula.valorMensalidade !== undefined &&
      matricula.valorMensalidade !== null
        ? String(matricula.valorMensalidade)
        : matricula && matricula.modulo
          ? String(obterMensalidadeModulo(matricula.modulo))
          : "";
  }
  atualizarResumoFinanceiroCursoPresencial();
}

function configurarValoresCursoPresencial() {
  var ids = [
    "secModulo",
    "secCursoInicio",
    "secCursoTermino",
    "secValorMatricula",
    "secValorMensalidade"
  ];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.valoresCursoBound === "1") return;
    el.dataset.valoresCursoBound = "1";
    el.addEventListener("change", function () {
      if (id === "secModulo") {
        aplicarValoresPadraoModuloNosCampos("sec");
        var valorPag = document.getElementById("secValorPagamento");
        if (valorPag) valorPag.dataset.editadoManual = "";
        if (typeof atualizarValorSugeridoPresencial === "function") {
          atualizarValorSugeridoPresencial();
        }
      }
      atualizarResumoFinanceiroCursoPresencial();
    });
    if (id === "secValorMatricula" || id === "secValorMensalidade") {
      el.addEventListener("input", function () {
        el.dataset.editadoManual = "1";
        atualizarResumoFinanceiroCursoPresencial();
      });
    }
  });
  aplicarValoresPadraoModuloNosCampos("sec");
  atualizarResumoFinanceiroCursoPresencial();
}

function atualizarResumoFinanceiroMatriculaPublica() {
  var alvo = document.getElementById("matResumoFinanceiroCurso");
  if (!alvo) return;
  var moduloEl = document.getElementById("matModulo");
  var matEl = document.getElementById("matValorMatricula");
  var menEl = document.getElementById("matValorMensalidade");
  var dados = {
    modulo: moduloEl ? moduloEl.value : "",
    valorMatricula: matEl ? matEl.value : "",
    valorMensalidade: menEl ? menEl.value : ""
  };
  alvo.innerHTML = montarHtmlResumoFinanceiroCurso(
    calcularResumoFinanceiroCurso(dados),
    { mostrarAvisoPeriodo: false }
  );
}

function configurarValoresCursoMatriculaPublica() {
  var moduloEl = document.getElementById("matModulo");
  if (!moduloEl) return;

  function bindValor(id) {
    var el = document.getElementById(id);
    if (!el || el.dataset.valoresCursoBound === "1") return;
    el.dataset.valoresCursoBound = "1";
    el.addEventListener("input", function () {
      el.dataset.editadoManual = "1";
      atualizarResumoFinanceiroMatriculaPublica();
    });
  }

  bindValor("matValorMatricula");
  bindValor("matValorMensalidade");

  if (moduloEl.dataset.valoresCursoBound !== "1") {
    moduloEl.dataset.valoresCursoBound = "1";
    moduloEl.addEventListener("change", function () {
      aplicarValoresPadraoModuloNosCampos("mat");
      atualizarResumoFinanceiroMatriculaPublica();
    });
  }

  aplicarValoresPadraoModuloNosCampos("mat");
  atualizarResumoFinanceiroMatriculaPublica();
}

function listarReferenciasMensalidadesPeriodo(dataInicio, dataTermino) {
  var qtd = contarMensalidadesPeriodoCurso(dataInicio, dataTermino);
  if (!qtd) return [];
  var inicio = parseDataLocalCurso(dataInicio);
  if (!inicio) return [];
  var lista = [];
  var y = inicio.getFullYear();
  var m = inicio.getMonth();
  for (var i = 0; i < qtd; i++) {
    var d = new Date(y, m + i, 1);
    var mes = String(d.getMonth() + 1).padStart(2, "0");
    var ano = d.getFullYear();
    lista.push({
      referencia: "Mensalidade " + mes + "/" + ano,
      vencimento: new Date(ano, d.getMonth(), 10, 12, 0, 0).toISOString()
    });
  }
  return lista;
}

function gerarMensalidadesPeriodoCurso(matricula) {
  if (!matricula || !matricula.email) {
    return { ok: false, erro: "Salve o aluno com e-mail antes de gerar mensalidades." };
  }
  if (!matricula.cursoDataInicio || !matricula.cursoDataTermino) {
    return {
      ok: false,
      erro: "Informe início e término do curso no cadastro do aluno."
    };
  }
  if (typeof inicializarDadosFinanceiros !== "function") {
    return { ok: false, erro: "Módulo financeiro indisponível." };
  }
  inicializarDadosFinanceiros();
  var valor = obterValorMensalidadeMatricula(matricula);
  var refs = listarReferenciasMensalidadesPeriodo(
    matricula.cursoDataInicio,
    matricula.cursoDataTermino
  );
  if (!refs.length) {
    return { ok: false, erro: "Período do curso inválido para gerar parcelas." };
  }

  var pagamentos = obterPagamentosAlunos();
  var criadas = 0;
  var atualizadas = 0;

  refs.forEach(function (item) {
    var existente = pagamentos.find(function (p) {
      return (
        p.matriculaId === matricula.id &&
        p.tipo === "mensalidade" &&
        p.referencia === item.referencia
      );
    });
    if (existente) {
      if (existente.valor !== valor) {
        existente.valor = valor;
        atualizadas++;
      }
      return;
    }
    pagamentos.push({
      id: gerarId("pag"),
      matriculaId: matricula.id,
      alunoNome: matricula.nomeCompleto,
      alunoEmail: matricula.email,
      modulo: matricula.modulo,
      tipo: "mensalidade",
      valor: valor,
      referencia: item.referencia,
      vencimento: item.vencimento,
      status: "pendente",
      formaPagamento: null,
      dataPagamento: null,
      criadoEm: new Date().toISOString(),
      canal: "periodo_curso"
    });
    criadas++;
  });

  salvarPagamentosAlunos(pagamentos);

  var pagMat = pagamentos.find(function (p) {
    return p.matriculaId === matricula.id && (!p.tipo || p.tipo === "matricula");
  });
  var taxa = obterValorMatriculaMatricula(matricula);
  if (pagMat) {
    pagMat.valor = taxa;
  } else if (typeof criarRegistroPagamentoMatricula === "function") {
    pagamentos.push(criarRegistroPagamentoMatricula(matricula));
  }

  salvarPagamentosAlunos(pagamentos);

  return {
    ok: true,
    criadas: criadas,
    atualizadas: atualizadas,
    totalReferencias: refs.length
  };
}
