/* Fluxo de cadastro presencial: novo aluno ou quadro + pagamento integrado */

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

function aplicarModoTipoAlunoPresencial() {
  var novo = document.getElementById("secTipoAlunoNovo");
  var busca = document.getElementById("secBuscaQuadro");
  var balaoEmail = document.getElementById("secBalaoEmailQuadro");
  var matriculaId = document.getElementById("secMatriculaId");
  if (!novo || !busca) return;

  var quadro = !novo.checked;
  busca.hidden = !quadro;
  if (balaoEmail) balaoEmail.hidden = !quadro;

  if (!quadro) {
    if (matriculaId) matriculaId.value = "";
    limparMensagemQuadro();
    limparMensagemEmailQuadro();
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

function preencherFormularioComMatricula(matricula) {
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

  var valorEl = document.getElementById("secValorPagamento");
  if (valorEl) {
    valorEl.dataset.editadoManual = "";
    atualizarValorSugeridoPresencial();
  }
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

function configurarCadastroPresencial(sessao) {
  var form = document.getElementById("formCadastroPresencial");
  if (!form || form.dataset.cadastroBound === "1") return;

  form.dataset.cadastroBound = "1";
  aplicarMascaraCpf(document.getElementById("secCpf"));
  aplicarMascaraTelefone(document.getElementById("secTelefone"));
  configurarUiPagamentoPresencial();

  document.querySelectorAll('input[name="secTipoAluno"]').forEach(function (radio) {
    radio.addEventListener("change", aplicarModoTipoAlunoPresencial);
  });
  aplicarModoTipoAlunoPresencial();

  var btnBuscar = document.getElementById("secBtnBuscarQuadro");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", function () {
      var termo = document.getElementById("secBuscaTermo").value.trim();
      var msg = document.getElementById("secQuadroMensagem");
      limparMensagemQuadro();

      if (!termo) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = "Informe o e-mail ou CPF do aluno.";
        return;
      }

      var matricula = obterMatriculaPorCpfOuEmail(termo);
      if (!matricula) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent =
          "Nenhum cadastro digital encontrado. Preencha os dados abaixo e use " +
          "“Salvar aluno do quadro no sistema” para criar o registro com e-mail.";
        return;
      }

      preencherFormularioComMatricula(matricula);
      var emailQuadro = document.getElementById("secEmailQuadroDigital");
      if (emailQuadro && matricula.email) {
        emailQuadro.value = matricula.email;
      }
      msg.className = "form-mensagem form-mensagem--sucesso visible";
      msg.textContent =
        matricula.email
          ? "Aluno localizado: " +
            matricula.nomeCompleto +
            ". Atualize o e-mail se necessário ou registre o pagamento."
          : "Aluno do quadro localizado (sem e-mail no sistema). Informe o e-mail no balão abaixo e salve.";
    });
  }

  var btnSalvarQuadro = document.getElementById("secBtnSalvarQuadroDigital");
  if (btnSalvarQuadro) {
    btnSalvarQuadro.addEventListener("click", function () {
      salvarCadastroDigitalQuadro(sessao);
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

    var tipoCobranca = document.getElementById("secTipoCobranca").value;
    var situacaoPagamento = document.getElementById("secSituacaoPagamento").value;
    var formaPagamento = document.getElementById("secFormaPagamento").value;
    var valorPagamento = Number(document.getElementById("secValorPagamento").value);
    var instituicaoId = document.getElementById("secInstituicaoPagamento").value || null;
    var obsPagamento = document.getElementById("secObsPagamento").value.trim();
    var referenciaOutro = document.getElementById("secReferenciaOutro").value.trim();

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

    if (tipoAluno === "quadro") {
      var matriculaQuadro = matriculaIdExistente
        ? obterMatriculas().find(function (m) {
            return m.id === matriculaIdExistente;
          })
        : obterMatriculaPorCpfOuEmail(dados.email || dados.cpf);

      if (!matriculaQuadro) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent =
          "Salve o aluno em “Cadastro digital do quadro” ou busque pelo CPF/e-mail antes do pagamento.";
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
          apenasPagamento: true
        }
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
          {
            tipoCobranca: tipoCobranca,
            situacaoPagamento: situacaoPagamento,
            formaPagamento: formaPagamento,
            valor: valorPagamento,
            instituicaoId: instituicaoId,
            observacoesPagamento: obsPagamento,
            referenciaOutro: referenciaOutro,
            apenasPagamento: false
          }
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
  if (mensagemForm) {
    mensagemForm.className = "form-mensagem";
    mensagemForm.textContent = "";
  }
  if (sucessoEl) sucessoEl.classList.remove("matricula-sucesso--visivel");

  var emailBalao = document.getElementById("secEmailQuadroDigital");
  var emailForm = document.getElementById("secEmail");
  var email =
    (emailBalao && emailBalao.value.trim()) ||
    (emailForm && emailForm.value.trim().toLowerCase());

  var dados = {
    nomeCompleto: document.getElementById("secNome").value.trim(),
    email: email,
    telefone: document.getElementById("secTelefone").value.trim(),
    cpf: document.getElementById("secCpf").value.trim(),
    dataNascimento: document.getElementById("secNascimento").value,
    cidade: document.getElementById("secCidade").value.trim(),
    estado: document.getElementById("secEstado").value,
    modulo: document.getElementById("secModulo").value,
    igreja: document.getElementById("secIgreja").value.trim(),
    observacoes: document.getElementById("secObservacoes").value.trim()
  };

  if (emailForm && emailBalao && emailBalao.value.trim()) {
    emailForm.value = emailBalao.value.trim().toLowerCase();
  }

  var termoBusca = document.getElementById("secBuscaTermo")
    ? document.getElementById("secBuscaTermo").value.trim()
    : "";

  if (typeof salvarAlunoQuadroSeminario !== "function") {
    msg.className = "form-mensagem form-mensagem--erro visible";
    msg.textContent = "Função de cadastro do quadro indisponível.";
    return;
  }

  var resultado = salvarAlunoQuadroSeminario(dados, sessao, termoBusca);
  if (!resultado.ok) {
    msg.className = "form-mensagem form-mensagem--erro visible";
    msg.textContent = resultado.erro || "Não foi possível salvar o aluno do quadro.";
    return;
  }

  document.getElementById("secMatriculaId").value = resultado.matricula.id;
  if (emailForm) emailForm.value = resultado.matricula.email;

  msg.className = "form-mensagem form-mensagem--sucesso visible";
  msg.textContent =
    resultado.acao === "criado"
      ? "Aluno incluído no sistema com e-mail para acesso ao site."
      : "Cadastro do quadro atualizado com o e-mail informado.";

  if (sucessoEl) {
    sucessoEl.classList.add("matricula-sucesso--visivel");
    sucessoEl.innerHTML =
      "<strong>Quadro digital salvo!</strong><br>" +
      escaparHtml(resultado.matricula.nomeCompleto) +
      " — e-mail <strong>" +
      escaparHtml(resultado.matricula.email) +
      "</strong>. O aluno já pode criar senha em Entrar no site.";
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
      observacoes: dados.observacoes
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

  form.reset();
  document.getElementById("secOrigem").value = "presencial";
  document.getElementById("secMatriculaId").value = "";
  document.getElementById("secTipoAlunoNovo").checked = true;
  aplicarModoTipoAlunoPresencial();
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

  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
}
