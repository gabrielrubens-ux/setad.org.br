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

function obterTipoIdentificadorQuadro() {
  var marcado = document.querySelector('input[name="secQuadroTipoId"]:checked');
  return marcado ? marcado.value : "email";
}

function atualizarCampoIdentificadorQuadro() {
  var tipo = obterTipoIdentificadorQuadro();
  var input = document.getElementById("secQuadroIdentificador");
  var label = document.getElementById("secQuadroIdentificadorLabel");
  if (!input || !label) return;

  if (tipo === "cpf") {
    label.textContent = "CPF do aluno *";
    input.type = "text";
    input.inputMode = "numeric";
    input.placeholder = "000.000.000-00";
    input.autocomplete = "off";
    if (input.dataset.mascaraCpf !== "1" && typeof aplicarMascaraCpf === "function") {
      aplicarMascaraCpf(input);
      input.dataset.mascaraCpf = "1";
    }
  } else {
    label.textContent = "E-mail do aluno *";
    input.type = "email";
    input.inputMode = "email";
    input.placeholder = "aluno@email.com";
    input.autocomplete = "email";
  }
  input.value = "";
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
  } else {
    atualizarCampoIdentificadorQuadro();
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
    var emailRadio = document.querySelector('input[name="secQuadroTipoId"][value="email"]');
    if (emailRadio) emailRadio.checked = true;
    atualizarCampoIdentificadorQuadro();
    input.value = matricula.email;
  } else if (matricula.cpf) {
    var cpfRadio = document.querySelector('input[name="secQuadroTipoId"][value="cpf"]');
    if (cpfRadio) cpfRadio.checked = true;
    atualizarCampoIdentificadorQuadro();
    input.value = matricula.cpf;
  }
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

  var poloEl = document.getElementById("secPolo");
  if (poloEl) {
    if (!poloEl.options.length || poloEl.options.length <= 1) {
      popularSelectPolosSetad(poloEl, matricula.poloId || "");
    } else {
      poloEl.value = matricula.poloId || "";
    }
  }
  if (typeof atualizarSelectSalaTurmaPresencial === "function") {
    atualizarSelectSalaTurmaPresencial(matricula.modulo || "", matricula.salaTurmaId || "");
  }

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

function configurarCadastroPresencial(sessao, opcoes) {
  var form = document.getElementById("formCadastroPresencial");
  if (!form || form.dataset.cadastroBound === "1") return;

  opcoes = opcoes || {};
  form.dataset.cadastroBound = "1";
  if (opcoes.omitirPagamento) {
    form.dataset.omitirPagamento = "1";
    var blocoPag = form.querySelector(".presencial-bloco--pagamento");
    if (blocoPag) blocoPag.hidden = true;
    var btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = "Salvar cadastro";
  }
  aplicarMascaraCpf(document.getElementById("secCpf"));
  aplicarMascaraTelefone(document.getElementById("secTelefone"));
  if (!opcoes.omitirPagamento) {
    configurarUiPagamentoPresencial();
  }
  if (typeof configurarDirecionamentoPresencialInterno === "function") {
    configurarDirecionamentoPresencialInterno();
  }

  document.querySelectorAll('input[name="secTipoAluno"]').forEach(function (radio) {
    radio.addEventListener("change", aplicarModoTipoAlunoPresencial);
  });
  document.querySelectorAll('input[name="secQuadroTipoId"]').forEach(function (radio) {
    radio.addEventListener("change", atualizarCampoIdentificadorQuadro);
  });
  aplicarModoTipoAlunoPresencial();

  var btnBuscar = document.getElementById("secBtnBuscarQuadro");
  if (btnBuscar) {
    btnBuscar.addEventListener("click", function () {
      var termo = document.getElementById("secQuadroIdentificador").value.trim();
      var msg = document.getElementById("secQuadroMensagem");
      limparMensagemQuadro();
      limparMensagemEmailQuadro();

      if (!termo) {
        msg.className = "form-mensagem form-mensagem--erro visible";
        msg.textContent = "Informe o e-mail ou o CPF conforme a opção selecionada.";
        return;
      }

      var matricula = obterMatriculaPorCpfOuEmail(termo);
      if (!matricula) {
        msg.className = "form-mensagem visible";
        msg.textContent =
          "Ainda não há cadastro com esse dado. Clique em “Incluir no quadro digital” para lançar o aluno.";
        return;
      }

      preencherFormularioComMatricula(matricula);
      sincronizarIdentificadorQuadroComMatricula(matricula);
      msg.className = "form-mensagem form-mensagem--sucesso visible";
      msg.textContent =
        "Aluno localizado: " +
        matricula.nomeCompleto +
        ". Complete os dados abaixo se necessário ou registre pagamento.";
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
          sucessoEl.classList.add("matricula-sucesso--visivel");
          sucessoEl.innerHTML =
            "<strong>Cadastro salvo.</strong> Os dados ficam disponíveis para a equipe do seminário.";
          form.reset();
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
  limparMensagemQuadro();
  if (mensagemForm) {
    mensagemForm.className = "form-mensagem";
    mensagemForm.textContent = "";
  }
  if (sucessoEl) sucessoEl.classList.remove("matricula-sucesso--visivel");

  var tipoId = obterTipoIdentificadorQuadro();
  var identificador = document.getElementById("secQuadroIdentificador").value.trim();
  var emailForm = document.getElementById("secEmail");

  var dados = {
    nomeCompleto: document.getElementById("secNome").value.trim(),
    email: tipoId === "email" ? identificador.toLowerCase() : (emailForm ? emailForm.value.trim().toLowerCase() : ""),
    telefone: document.getElementById("secTelefone").value.trim(),
    cpf: tipoId === "cpf" ? identificador : document.getElementById("secCpf").value.trim(),
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
    tipoId: tipoId,
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

  form.reset();
  document.getElementById("secOrigem").value = "presencial";
  document.getElementById("secMatriculaId").value = "";
  document.getElementById("secTipoAlunoNovo").checked = true;
  aplicarModoTipoAlunoPresencial();
  if (typeof reinicializarDirecionamentoPresencialAposReset === "function") {
    reinicializarDirecionamentoPresencialAposReset();
  }
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
