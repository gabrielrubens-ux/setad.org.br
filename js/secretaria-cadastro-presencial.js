/* Fluxo de cadastro presencial: novo aluno ou quadro (pagamentos na Ficha do aluno). */

function preencherSelectInstituicoesPresencial() {
  var select = document.getElementById("secInstituicaoPagamento");
  if (!select || select.dataset.preenchido === "1") return;
  if (typeof obterInstituicoesFinanceiras !== "function") return;

  var instituicoes = obterInstituicoesFinanceiras();
  instituicoes.forEach(function (inst) {
    var opt = document.createElement("option");
    opt.value = inst.id;
    opt.textContent = inst.nome || inst.id;
    select.appendChild(opt);
  });
  select.dataset.preenchido = "1";
}

function atualizarValorSugeridoPresencial() {
  var modulo = document.getElementById("secModulo");
  var tipoCobranca = document.getElementById("secTipoCobranca");
  var valorEl = document.getElementById("secValorPagamento");
  if (!modulo || !tipoCobranca || !valorEl) return;
  if (valorEl.dataset.editadoManual === "1") return;

  var mod = modulo.value;
  if (!mod) return;

  var tipo = tipoCobranca.value;
  if (tipo === "matricula" && typeof obterTaxaMatriculaModulo === "function") {
    valorEl.value = String(obterTaxaMatriculaModulo(mod));
  } else if (tipo === "mensalidade" && typeof obterMensalidadeModulo === "function") {
    valorEl.value = String(obterMensalidadeModulo(mod));
  }
}

var CAMPOS_OBRIGATORIOS_PRESENCIAL = [
  "secNome",
  "secEmail",
  "secTelefone",
  "secCpf",
  "secNascimento",
  "secModulo",
  "secPolo",
  "secCidade",
  "secEstado"
];

function alternarObrigatoriedadeFormPresencial(quadro) {
  CAMPOS_OBRIGATORIOS_PRESENCIAL.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.required = !quadro;
  });
}

function ocultarResultadosBuscaQuadro() {
  var lista = document.getElementById("secQuadroResultados");
  var input = document.getElementById("secQuadroIdentificador");
  if (lista) {
    lista.hidden = true;
    lista.innerHTML = "";
  }
  if (input) input.setAttribute("aria-expanded", "false");
}

function formatarRotuloResultadoQuadro(matricula) {
  var partes = [matricula.nomeCompleto || "Sem nome"];
  if (matricula.email) partes.push(matricula.email);
  if (matricula.cpf) partes.push(matricula.cpf);
  return partes.join(" · ");
}

function selecionarMatriculaQuadroPresencial(matricula) {
  if (!matricula) return;
  var msg = document.getElementById("secQuadroMensagem");
  limparMensagemQuadro();
  limparMensagemEmailQuadro();
  preencherFormularioComMatricula(matricula);
  sincronizarIdentificadorQuadroComMatricula(matricula);
  ocultarResultadosBuscaQuadro();
  if (msg) {
    msg.className = "form-mensagem form-mensagem--sucesso visible";
    msg.textContent =
      "Aluno localizado: " +
      matricula.nomeCompleto +
      ". Complete os dados abaixo e use a <strong>Ficha do aluno</strong> para mensalidades e pagamentos.";
  }
}

function renderizarResultadosBuscaQuadro(termo) {
  var lista = document.getElementById("secQuadroResultados");
  var input = document.getElementById("secQuadroIdentificador");
  if (!lista || !input) return;

  if (typeof buscarMatriculasQuadroPorTermo !== "function") {
    ocultarResultadosBuscaQuadro();
    return;
  }

  var resultados = buscarMatriculasQuadroPorTermo(termo, 12);
  lista.innerHTML = "";

  if (!termo || termo.trim().length < 2 || !resultados.length) {
    ocultarResultadosBuscaQuadro();
    return;
  }

  resultados.forEach(function (matricula) {
    var item = document.createElement("li");
    item.className = "presencial-busca-quadro__item";
    item.setAttribute("role", "option");
    item.tabIndex = 0;
    item.textContent = formatarRotuloResultadoQuadro(matricula);
    item.addEventListener("mousedown", function (evento) {
      evento.preventDefault();
      selecionarMatriculaQuadroPresencial(matricula);
    });
    item.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        selecionarMatriculaQuadroPresencial(matricula);
      }
    });
    lista.appendChild(item);
  });

  lista.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function configurarBuscaQuadroPresencial() {
  var input = document.getElementById("secQuadroIdentificador");
  if (!input || input.dataset.buscaQuadroBound === "1") return;
  input.dataset.buscaQuadroBound = "1";

  input.type = "search";
  input.inputMode = "search";
  input.placeholder = "Nome, e-mail ou CPF";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-controls", "secQuadroResultados");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-autocomplete", "list");

  var timer = null;
  input.addEventListener("input", function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      renderizarResultadosBuscaQuadro(input.value);
    }, 180);
  });

  input.addEventListener("focus", function () {
    renderizarResultadosBuscaQuadro(input.value);
  });

  input.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      var termo = input.value.trim();
      var exato =
        typeof obterMatriculaPorCpfOuEmail === "function"
          ? obterMatriculaPorCpfOuEmail(termo)
          : null;
      if (exato) {
        selecionarMatriculaQuadroPresencial(exato);
        return;
      }
      if (typeof buscarMatriculasQuadroPorTermo === "function") {
        var unico = buscarMatriculasQuadroPorTermo(termo, 2);
        if (unico.length === 1) {
          selecionarMatriculaQuadroPresencial(unico[0]);
          return;
        }
      }
      var lista = document.getElementById("secQuadroResultados");
      var primeiro = lista && lista.querySelector(".presencial-busca-quadro__item");
      if (primeiro && !lista.hidden) {
        primeiro.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
        return;
      }
      var msg = document.getElementById("secQuadroMensagem");
      limparMensagemQuadro();
      if (msg && termo) {
        msg.className = "form-mensagem visible";
        msg.textContent =
          "Nenhum aluno encontrado. Ajuste a busca ou clique em “Incluir no quadro digital”.";
      }
    }
    if (evento.key === "Escape") {
      ocultarResultadosBuscaQuadro();
    }
  });

  input.addEventListener("blur", function () {
    window.setTimeout(ocultarResultadosBuscaQuadro, 200);
  });
}

function aplicarModoTipoAlunoPresencial() {
  var novo = document.getElementById("secTipoAlunoNovo");
  var balaoEmail = document.getElementById("secBalaoEmailQuadro");
  var matriculaId = document.getElementById("secMatriculaId");
  if (!novo) return;

  var quadro = !novo.checked;
  if (balaoEmail) balaoEmail.hidden = !quadro;
  alternarObrigatoriedadeFormPresencial(quadro);

  if (!quadro) {
    if (matriculaId) matriculaId.value = "";
    limparMensagemQuadro();
    limparMensagemEmailQuadro();
    ocultarResultadosBuscaQuadro();
  } else {
    configurarBuscaQuadroPresencial();
  }
}

function limparMensagemEmailQuadro() {
  var msg = document.getElementById("secEmailQuadroMensagem");
  if (!msg) return;
  msg.className = "form-mensagem";
  msg.textContent = "";
}

function limparMensagemQuadro() {
  var msg = document.getElementById("secQuadroMensagem");
  if (!msg) return;
  msg.className = "form-mensagem";
  msg.textContent = "";
}

function sincronizarIdentificadorQuadroComMatricula(matricula) {
  var input = document.getElementById("secQuadroIdentificador");
  if (!input || !matricula) return;

  if (matricula.email) {
    input.value = matricula.email;
  } else if (matricula.cpf) {
    input.value = matricula.cpf;
  } else {
    input.value = matricula.nomeCompleto || "";
  }
}

function preencherFormularioComMatricula(matricula, opcoes) {
  opcoes = opcoes || {};
  document.getElementById("secMatriculaId").value = matricula.id;
  document.getElementById("secNome").value = matricula.nomeCompleto || "";
  document.getElementById("secEmail").value = matricula.email || "";
  document.getElementById("secTelefone").value = matricula.telefone || "";
  document.getElementById("secCpf").value = matricula.cpf || "";
  document.getElementById("secNascimento").value = matricula.dataNascimento || "";
  document.getElementById("secModulo").value = matricula.modulo || "";
  document.getElementById("secCidade").value = matricula.cidade || "";
  document.getElementById("secEstado").value = matricula.estado || "";
  document.getElementById("secIgreja").value = matricula.igreja || "";

  var poloEl = document.getElementById("secPolo");
  if (poloEl) {
    if (!poloEl.options.length || poloEl.options.length <= 1) {
      popularSelectPolosSetad(poloEl, matricula.poloId || "");
    } else {
      poloEl.value = matricula.poloId || "";
    }
  }
  var nivelEl = document.getElementById("secSetadeNivel");
  if (nivelEl && matricula.setadeNivel) {
    nivelEl.value = matricula.setadeNivel;
  } else if (nivelEl && ehPoloSetade(matricula.poloId)) {
    if (matricula.modulo === "medio" || matricula.modulo === "avancado") {
      nivelEl.value = matricula.modulo;
    }
  }
  if (typeof alternarUiPoloSetadePresencial === "function") {
    alternarUiPoloSetadePresencial();
  }
  if (typeof atualizarSelectSalaTurmaPresencial === "function") {
    var nivel =
      nivelEl && nivelEl.value
        ? nivelEl.value
        : matricula.modulo || "";
    atualizarSelectSalaTurmaPresencial(nivel, matricula.salaTurmaId || "");
  }

  var valorEl = document.getElementById("secValorPagamento");
  if (valorEl) {
    valorEl.dataset.editadoManual = "";
    if (typeof atualizarValorSugeridoPresencial === "function") {
      atualizarValorSugeridoPresencial();
    }
  }

  var blocoAcad = document.getElementById("secBlocoAcademicoAluno");
  if (blocoAcad && matricula.id) {
    blocoAcad.hidden = false;
  }

  if (!opcoes.omitirPainelAcademico) {
    if (typeof renderizarPainelCadastroAlunoAcademico === "function") {
      var sessaoPainel =
        typeof obterSessaoOperacionalListaAlunos === "function"
          ? obterSessaoOperacionalListaAlunos()
          : typeof obterSessaoSecretaria === "function"
            ? obterSessaoSecretaria()
            : null;
      renderizarPainelCadastroAlunoAcademico("secPainelAcademicoAluno", matricula, sessaoPainel, {
        abaInicial: opcoes.abaInicial || "notas"
      });
    } else if (typeof renderizarPlanilhaMensalidadesCadastroAluno === "function") {
      renderizarPlanilhaMensalidadesCadastroAluno(matricula);
    }
  }
}

function limparFormularioCadastroPresencial(form, sessao, opcoes) {
  opcoes = opcoes || {};
  if (!form) return;

  form.reset();
  var origemEl = document.getElementById("secOrigem");
  if (origemEl) origemEl.value = "presencial";
  var matriculaIdEl = document.getElementById("secMatriculaId");
  if (matriculaIdEl) matriculaIdEl.value = "";

  var tipoNovo = document.getElementById("secTipoAlunoNovo");
  if (tipoNovo) tipoNovo.checked = true;

  var quadroInput = document.getElementById("secQuadroIdentificador");
  if (quadroInput) quadroInput.value = "";

  limparMensagemQuadro();
  limparMensagemEmailQuadro();
  ocultarResultadosBuscaQuadro();

  if (typeof reinicializarDirecionamentoPresencialAposReset === "function") {
    reinicializarDirecionamentoPresencialAposReset();
  }
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }

  var estadoEl = document.getElementById("secEstado");
  if (estadoEl) estadoEl.value = "PA";

  var valorEl = document.getElementById("secValorPagamento");
  if (valorEl) valorEl.dataset.editadoManual = "";
  if (typeof atualizarValorSugeridoPresencial === "function") {
    atualizarValorSugeridoPresencial();
  }

  var blocoAcad = document.getElementById("secBlocoAcademicoAluno");
  if (blocoAcad) blocoAcad.hidden = true;

  if (
    document.getElementById("secPainelAcademicoAluno") &&
    typeof renderizarPainelCadastroAlunoAcademico === "function" &&
    sessao
  ) {
    renderizarPainelCadastroAlunoAcademico("secPainelAcademicoAluno", null, sessao, {
      abaInicial: "notas"
    });
  }

  if (opcoes.manterSucesso !== true) {
    var sucessoEl = document.getElementById("cadastroPresencialSucesso");
    if (sucessoEl) {
      sucessoEl.classList.remove("matricula-sucesso--visivel");
      sucessoEl.innerHTML = "";
    }
  }

  var camposLimpar = [
    "secNome",
    "secEmail",
    "secTelefone",
    "secCpf",
    "secNascimento",
    "secCidade",
    "secIgreja",
    "secObservacoes",
    "secModulo"
  ];
  camposLimpar.forEach(function (idCampo) {
    var el = document.getElementById(idCampo);
    if (!el) return;
    if (el.tagName === "SELECT") {
      el.value = "";
    } else {
      el.value = "";
    }
  });

  if (typeof atualizarSelectSalaTurmaPresencial === "function") {
    atualizarSelectSalaTurmaPresencial("", "");
  }

  if (opcoes.focar !== false) {
    var nomeEl = document.getElementById("secNome");
    if (nomeEl) nomeEl.focus();
  }
}

function concluirCadastroPresencialSemPagamento(form, sessao, mensagemEl, mensagemSucesso) {
  mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
  mensagemEl.textContent = mensagemSucesso;
  if (typeof renderizarVisaoSecretaria === "function") {
    renderizarVisaoSecretaria();
  }
  if (typeof renderizarAlunosSecretaria === "function") {
    renderizarAlunosSecretaria();
  }
  limparFormularioCadastroPresencial(form, sessao);
}

function configurarUiPagamentoPresencial() {
  var tipoCobranca = document.getElementById("secTipoCobranca");
  var situacao = document.getElementById("secSituacaoPagamento");
  var grupoForma = document.getElementById("secGrupoFormaPagamento");
  var grupoInst = document.getElementById("secGrupoInstituicao");
  var grupoRefOutro = document.getElementById("secGrupoRefOutro");
  var valorEl = document.getElementById("secValorPagamento");
  var modulo = document.getElementById("secModulo");

  if (tipoCobranca) {
    tipoCobranca.addEventListener("change", function () {
      if (grupoRefOutro) {
        grupoRefOutro.hidden = tipoCobranca.value !== "outro";
      }
      if (valorEl) valorEl.dataset.editadoManual = "";
      atualizarValorSugeridoPresencial();
    });
  }

  if (modulo) {
    modulo.addEventListener("change", function () {
      if (valorEl) valorEl.dataset.editadoManual = "";
      atualizarValorSugeridoPresencial();
    });
  }

  if (valorEl) {
    valorEl.addEventListener("input", function () {
      valorEl.dataset.editadoManual = "1";
    });
  }

  if (situacao) {
    situacao.addEventListener("change", function () {
      var pago = situacao.value === "pago_presencial";
      if (grupoForma) grupoForma.hidden = !pago;
      if (grupoInst) grupoInst.hidden = !pago;
      var forma = document.getElementById("secFormaPagamento");
      if (forma) forma.required = pago;
    });
  }

  preencherSelectInstituicoesPresencial();
  atualizarValorSugeridoPresencial();
}

function configurarCadastroPresencial(sessao, opcoes) {
  var form = document.getElementById("formCadastroPresencial");
  if (!form || form.dataset.cadastroBound === "1") return;

  opcoes = opcoes || {};
  form.dataset.cadastroBound = "1";
  if (opcoes.omitirPagamento !== false) {
    form.dataset.omitirPagamento = "1";
    var blocoPag = form.querySelector(".presencial-bloco--pagamento");
    if (blocoPag) blocoPag.hidden = true;
    var btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = "Salvar cadastro";
  }
  aplicarMascaraCpf(document.getElementById("secCpf"));
  aplicarMascaraTelefone(document.getElementById("secTelefone"));
  if (opcoes.omitirPagamento === false) {
    configurarUiPagamentoPresencial();
    if (typeof configurarPlanilhaMensalidadesCadastro === "function") {
      configurarPlanilhaMensalidadesCadastro();
    }
  } else if (
    document.getElementById("secPainelAcademicoAluno") &&
    typeof renderizarPainelCadastroAlunoAcademico === "function"
  ) {
    renderizarPainelCadastroAlunoAcademico("secPainelAcademicoAluno", null, sessao, {
      abaInicial: "notas"
    });
  }
  if (typeof configurarDirecionamentoPresencialInterno === "function") {
    configurarDirecionamentoPresencialInterno();
  }

  document.querySelectorAll('input[name="secTipoAluno"]').forEach(function (radio) {
    radio.addEventListener("change", aplicarModoTipoAlunoPresencial);
  });
  aplicarModoTipoAlunoPresencial();

  var btnSalvarQuadro = document.getElementById("secBtnSalvarQuadroDigital");
  if (btnSalvarQuadro) {
    btnSalvarQuadro.addEventListener("click", function () {
      salvarCadastroDigitalQuadro(sessao);
    });
  }

  var btnNovoAluno = document.getElementById("secBtnNovoAlunoPresencial");
  if (btnNovoAluno && btnNovoAluno.dataset.bound !== "1") {
    btnNovoAluno.dataset.bound = "1";
    btnNovoAluno.addEventListener("click", function () {
      var msg = document.getElementById("cadastroPresencialMensagem");
      if (msg) {
        msg.className = "form-mensagem";
        msg.textContent = "";
      }
      limparFormularioCadastroPresencial(form, sessao);
    });
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (form.dataset.enviando === "1") return;

    var mensagemEl = document.getElementById("cadastroPresencialMensagem");
    var sucessoEl = document.getElementById("cadastroPresencialSucesso");

    mensagemEl.className = "form-mensagem";
    mensagemEl.textContent = "";
    sucessoEl.classList.remove("matricula-sucesso--visivel");

    var tipoAluno =
      document.getElementById("secTipoAlunoQuadro") &&
      document.getElementById("secTipoAlunoQuadro").checked
        ? "quadro"
        : "novo";
    var matriculaIdExistente = document.getElementById("secMatriculaId").value.trim();

    var dados = {
      nomeCompleto: document.getElementById("secNome").value.trim(),
      email: document.getElementById("secEmail").value.trim().toLowerCase(),
      telefone: document.getElementById("secTelefone").value.trim(),
      cpf: document.getElementById("secCpf").value.trim(),
      dataNascimento: document.getElementById("secNascimento").value,
      cidade: document.getElementById("secCidade").value.trim(),
      estado: document.getElementById("secEstado").value,
      modulo: document.getElementById("secModulo").value,
      igreja: document.getElementById("secIgreja").value.trim(),
      origem: document.getElementById("secOrigem").value || "presencial",
      cadastradoPor: sessao.email,
      observacoes: document.getElementById("secObservacoes").value.trim()
    };
    if (typeof anexarDirecionamentoInternoAosDados === "function") {
      anexarDirecionamentoInternoAosDados(dados);
    }

    if (form.dataset.omitirPagamento === "1") {
      var erroSemPag = validarMatricula(dados);
      if (erroSemPag) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = erroSemPag;
        return;
      }
      var erroDir =
        typeof validarDirecionamentoInternoMatricula === "function"
          ? validarDirecionamentoInternoMatricula(dados)
          : null;
      if (erroDir) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = erroDir;
        return;
      }
      form.dataset.enviando = "1";

      if (matriculaIdExistente) {
        var verificacaoEdicao = verificarEmailDisponivelParaMatricula(
          dados.email,
          matriculaIdExistente
        );
        if (!verificacaoEdicao.ok) {
          form.dataset.enviando = "0";
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = verificacaoEdicao.erro;
          return;
        }
        var patchEdicao = Object.assign({}, dados, {
          email: normalizarEmailMatricula(dados.email)
        });
        var resultadoEdicao = atualizarDadosMatricula(matriculaIdExistente, patchEdicao);
        form.dataset.enviando = "0";
        if (!resultadoEdicao.ok) {
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = resultadoEdicao.erro || "Não foi possível atualizar o cadastro.";
          return;
        }
        concluirCadastroPresencialSemPagamento(
          form,
          sessao,
          mensagemEl,
          "Cadastro atualizado. Formulário liberado para o próximo aluno."
        );
        return;
      }

      var cadastrarSimples =
        typeof cadastrarMatriculaAsync === "function"
          ? cadastrarMatriculaAsync
          : function (d) {
              return Promise.resolve(cadastrarMatricula(d));
            };
      cadastrarSimples(dados)
        .then(function (resultado) {
          form.dataset.enviando = "0";
          if (!resultado.ok) {
            mensagemEl.className = "form-mensagem form-mensagem--erro visible";
            mensagemEl.textContent = resultado.erro || "Não foi possível cadastrar.";
            return;
          }
          concluirCadastroPresencialSemPagamento(
            form,
            sessao,
            mensagemEl,
            "Cadastro salvo. Use a Ficha do aluno para mensalidades. Formulário liberado para o próximo aluno."
          );
        })
        .catch(function () {
          form.dataset.enviando = "0";
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = "Erro ao salvar. Tente novamente.";
        });
      return;
    }

    var tipoCobranca = document.getElementById("secTipoCobranca").value;
    var situacaoPagamento = document.getElementById("secSituacaoPagamento").value;
    var formaPagamento = document.getElementById("secFormaPagamento").value;
    var valorPagamento = Number(document.getElementById("secValorPagamento").value);
    var instituicaoId = document.getElementById("secInstituicaoPagamento").value || null;
    var obsPagamento = document.getElementById("secObsPagamento").value.trim();
    var referenciaOutro = document.getElementById("secReferenciaOutro").value.trim();
    var referenciaMensalidade =
      typeof obterMesReferenciaPagamentoPresencial === "function"
        ? obterMesReferenciaPagamentoPresencial()
        : null;
    var opcoesPagamentoForm = {
      tipoCobranca: tipoCobranca,
      situacaoPagamento: situacaoPagamento,
      formaPagamento: formaPagamento,
      valor: valorPagamento,
      instituicaoId: instituicaoId,
      observacoesPagamento: obsPagamento,
      referenciaOutro: referenciaOutro,
      referenciaMensalidade: referenciaMensalidade
    };

    if (tipoCobranca === "outro" && !referenciaOutro) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Descreva o recebimento em “Outro recebimento”.";
      return;
    }

    if (situacaoPagamento === "pago_presencial" && !formaPagamento) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Selecione a forma de pagamento.";
      return;
    }

    if (!valorPagamento || valorPagamento <= 0) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Informe o valor do pagamento.";
      return;
    }

    var erro = validarMatricula(dados);
    if (erro) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = erro;
      return;
    }

    var erroDirecionamento =
      typeof validarDirecionamentoInternoMatricula === "function"
        ? validarDirecionamentoInternoMatricula(dados)
        : null;
    if (erroDirecionamento) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = erroDirecionamento;
      return;
    }

    if (tipoAluno === "quadro") {
      var matriculaQuadro = matriculaIdExistente
        ? obterMatriculas().find(function (m) {
            return m.id === matriculaIdExistente;
          })
        : obterMatriculaPorCpfOuEmail(dados.email || dados.cpf);

      if (!matriculaQuadro) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent =
          "Salve o aluno em “Cadastro digital do quadro” ou busque pelo nome, CPF ou e-mail antes do pagamento.";
        return;
      }

      form.dataset.enviando = "1";
      finalizarCadastroPresencialComPagamento(
        form,
        mensagemEl,
        sucessoEl,
        sessao,
        matriculaQuadro,
        dados,
        {
          tipoCobranca: tipoCobranca,
          situacaoPagamento: situacaoPagamento,
          formaPagamento: formaPagamento,
          valor: valorPagamento,
          instituicaoId: instituicaoId,
          observacoesPagamento: obsPagamento,
          referenciaOutro: referenciaOutro,
          referenciaMensalidade: referenciaMensalidade,
          apenasPagamento: true
        }
      );
      return;
    }

    if (matriculaIdExistente) {
      var matriculaSalva = obterMatriculas().find(function (m) {
        return m.id === matriculaIdExistente;
      });
      if (!matriculaSalva) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = "Matrícula não encontrada. Busque o aluno novamente.";
        return;
      }
      form.dataset.enviando = "1";
      finalizarCadastroPresencialComPagamento(
        form,
        mensagemEl,
        sucessoEl,
        sessao,
        matriculaSalva,
        dados,
        Object.assign({}, opcoesPagamentoForm, {
          apenasPagamento: true,
          manterCadastro: true
        })
      );
      return;
    }

    var verificacaoEmail = verificarEmailDisponivelParaMatricula(dados.email);
    if (!verificacaoEmail.ok) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = verificacaoEmail.erro;
      return;
    }

    form.dataset.enviando = "1";

    var cadastrarFn =
      typeof cadastrarMatriculaAsync === "function"
        ? cadastrarMatriculaAsync
        : function (d) {
            return Promise.resolve(cadastrarMatricula(d));
          };

    cadastrarFn(dados)
      .then(function (resultado) {
        if (!resultado.ok) {
          form.dataset.enviando = "0";
          mensagemEl.className = "form-mensagem form-mensagem--erro visible";
          mensagemEl.textContent = resultado.erro || "Não foi possível cadastrar o aluno.";
          return;
        }

        finalizarCadastroPresencialComPagamento(
          form,
          mensagemEl,
          sucessoEl,
          sessao,
          resultado.matricula,
          dados,
          Object.assign({}, opcoesPagamentoForm, {
            apenasPagamento: false,
            manterCadastro: true
          })
        );
      })
      .catch(function () {
        form.dataset.enviando = "0";
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = "Erro de comunicação ao cadastrar. Tente novamente.";
      });
  });
}

function salvarCadastroDigitalQuadro(sessao) {
  var msg = document.getElementById("secEmailQuadroMensagem");
  var sucessoEl = document.getElementById("cadastroPresencialSucesso");
  var mensagemForm = document.getElementById("cadastroPresencialMensagem");
  limparMensagemEmailQuadro();
  limparMensagemQuadro();
  if (mensagemForm) {
    mensagemForm.className = "form-mensagem";
    mensagemForm.textContent = "";
  }
  if (sucessoEl) sucessoEl.classList.remove("matricula-sucesso--visivel");

  var identificador = document.getElementById("secQuadroIdentificador").value.trim();
  var emailForm = document.getElementById("secEmail");
  var tipoAuto =
    typeof detectarTipoIdentificadorQuadro === "function"
      ? detectarTipoIdentificadorQuadro(identificador)
      : null;

  var dados = {
    nomeCompleto: document.getElementById("secNome").value.trim(),
    email:
      tipoAuto === "email"
        ? identificador.toLowerCase()
        : emailForm
          ? emailForm.value.trim().toLowerCase()
          : "",
    telefone: document.getElementById("secTelefone").value.trim(),
    cpf:
      tipoAuto === "cpf"
        ? identificador
        : document.getElementById("secCpf").value.trim(),
    dataNascimento: document.getElementById("secNascimento").value,
    cidade: document.getElementById("secCidade").value.trim(),
    estado: document.getElementById("secEstado").value,
    modulo: document.getElementById("secModulo").value,
    igreja: document.getElementById("secIgreja").value.trim(),
    observacoes: document.getElementById("secObservacoes").value.trim()
  };
  if (typeof anexarDirecionamentoInternoAosDados === "function") {
    anexarDirecionamentoInternoAosDados(dados);
  }

  if (typeof salvarAlunoQuadroSeminario !== "function") {
    msg.className = "form-mensagem form-mensagem--erro visible";
    msg.textContent = "Função de cadastro do quadro indisponível.";
    return;
  }

  var resultado = salvarAlunoQuadroSeminario(dados, sessao, {
    tipoId: "auto",
    identificador: identificador
  });
  if (!resultado.ok) {
    msg.className = "form-mensagem form-mensagem--erro visible";
    msg.textContent = resultado.erro || "Não foi possível salvar o aluno do quadro.";
    return;
  }

  document.getElementById("secMatriculaId").value = resultado.matricula.id;
  preencherFormularioComMatricula(resultado.matricula);
  sincronizarIdentificadorQuadroComMatricula(resultado.matricula);

  msg.className = "form-mensagem form-mensagem--sucesso visible";
  if (resultado.modo === "cpf" && !resultado.matricula.email) {
    msg.textContent =
      "Aluno lançado no quadro pelo CPF. Complete os dados abaixo e vincule o e-mail quando o aluno for criar acesso ao site.";
  } else {
    msg.textContent =
      resultado.acao === "criado"
        ? "Aluno incluído no quadro digital. Ele já pode finalizar o cadastro em Entrar no site ou no app."
        : "Cadastro do quadro atualizado.";
  }

  if (sucessoEl) {
    sucessoEl.classList.add("matricula-sucesso--visivel");
    var detalheAcesso = resultado.matricula.email
      ? "E-mail <strong>" + escaparHtml(resultado.matricula.email) + "</strong> — oriente o aluno a criar a senha em <strong>Entrar</strong> (site ou app)."
      : "CPF registrado — quando houver e-mail, inclua no cadastro para liberar o acesso à área do aluno.";
    sucessoEl.innerHTML =
      "<strong>Quadro digital salvo!</strong><br>" +
      escaparHtml(resultado.matricula.nomeCompleto) +
      "<br>" +
      detalheAcesso;
  }

  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
}

function finalizarCadastroPresencialComPagamento(
  form,
  mensagemEl,
  sucessoEl,
  sessao,
  matricula,
  dados,
  opcoesPagamento
) {
  if (opcoesPagamento.apenasPagamento && typeof atualizarDadosMatricula === "function") {
    atualizarDadosMatricula(matricula.id, {
      telefone: dados.telefone,
      cidade: dados.cidade,
      estado: dados.estado,
      igreja: dados.igreja,
      observacoes: dados.observacoes,
      modulo: dados.modulo,
      poloId: dados.poloId,
      poloNome: dados.poloNome,
      salaTurmaId: dados.salaTurmaId,
      salaTurmaNome: dados.salaTurmaNome
    });
    matricula = obterMatriculas().find(function (m) {
      return m.id === matricula.id;
    }) || matricula;
  }

  var pagamentoResult =
    typeof registrarPagamentoPresencialSecretaria === "function"
      ? registrarPagamentoPresencialSecretaria(matricula, opcoesPagamento, sessao)
      : { ok: false, erro: "Módulo financeiro indisponível." };

  form.dataset.enviando = "0";

  if (!pagamentoResult.ok) {
    mensagemEl.className = "form-mensagem form-mensagem--erro visible";
    mensagemEl.textContent = pagamentoResult.erro || "Não foi possível registrar o pagamento.";
    return;
  }

  var formSemPagamento = form && form.dataset.omitirPagamento === "1";
  var tipoNovoSalvo =
    document.getElementById("secTipoAlunoNovo") &&
    document.getElementById("secTipoAlunoNovo").checked;
  var manterCadastro =
    !formSemPagamento &&
    !tipoNovoSalvo &&
    (opcoesPagamento.manterCadastro || opcoesPagamento.apenasPagamento);
  matricula =
    obterMatriculas().find(function (m) {
      return m.id === matricula.id;
    }) || matricula;

  if (manterCadastro) {
    document.getElementById("secMatriculaId").value = matricula.id;
    document.getElementById("secOrigem").value = matricula.origem || "presencial";
    preencherFormularioComMatricula(matricula);
    document.getElementById("secObsPagamento").value = "";
    document.getElementById("secReferenciaOutro").value = "";
    if (document.getElementById("secSituacaoPagamento")) {
      document.getElementById("secSituacaoPagamento").value = "pago_presencial";
    }
  } else {
    limparFormularioCadastroPresencial(form, sessao, { manterSucesso: true });
  }

  form.dataset.enviando = "0";

  var valorEl = document.getElementById("secValorPagamento");
  if (valorEl) valorEl.dataset.editadoManual = "";
  atualizarValorSugeridoPresencial();

  var pag = pagamentoResult.pagamento;
  var statusTxt =
    pag.status === "pago"
      ? "Pagamento registrado como <strong>pago</strong> (" +
        escaparHtml(pag.formaPagamento || "") +
        ")."
      : "Pagamento registrado como <strong>pendente</strong>.";

  sucessoEl.classList.add("matricula-sucesso--visivel");
  sucessoEl.innerHTML =
    "<strong>Atendimento salvo com sucesso!</strong><br>" +
    escaparHtml(dados.nomeCompleto) +
    " — " +
    statusTxt +
    "<br>Valor: " +
    (typeof formatarMoeda === "function" ? formatarMoeda(pag.valor) : pag.valor) +
    ". Disponível para contabilidade e direção.";

  if (typeof renderizarPlanilhaMensalidadesCadastroAluno === "function") {
    renderizarPlanilhaMensalidadesCadastroAluno(matricula);
  }

  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
}

function abrirCadastroAlunoTurmaFromLista(matriculaId) {
  if (typeof abrirFichaAlunoTurmaFromLista === "function") {
    abrirFichaAlunoTurmaFromLista(matriculaId);
    return;
  }

  var matricula = obterMatriculas().find(function (m) {
    return m.id === matriculaId;
  });
  if (!matricula) return;

  var tab = document.querySelector('[data-tab="tab-cadastro"]');
  if (tab) tab.click();

  var tipoNovo = document.getElementById("secTipoAlunoNovo");
  if (tipoNovo) tipoNovo.checked = true;
  if (typeof aplicarModoTipoAlunoPresencial === "function") {
    aplicarModoTipoAlunoPresencial();
  }
  if (typeof preencherFormularioComMatricula === "function") {
    preencherFormularioComMatricula(matricula);
  }

  var bloco = document.getElementById("secBlocoTurmaCadastro");
  if (bloco) {
    bloco.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
