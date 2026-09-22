/* ============================================================
   secretaria.js — Painel da secretaria do seminário
   ============================================================ */

var conversaWppAtiva = null;

function inicializarPainelSecretaria() {
  var sessao = protegerPainelSecretaria();
  if (!sessao) return;

  document.getElementById("usuarioNome").textContent = sessao.nome;
  document.getElementById("usuarioPerfil").textContent = obterLabelPerfil(sessao.perfil);

  var badgeWpp = document.getElementById("badgeWppNaoLidas");
  if (badgeWpp) {
    var naoLidas = contarConversasWppNaoLidas();
    badgeWpp.textContent = naoLidas;
    badgeWpp.hidden = naoLidas === 0;
  }

  var titulos = {
    "tab-visao": {
      titulo: "Visão Geral",
      subtitulo: "Resumo de matrículas e atendimentos do seminário."
    },
    "tab-alunos": {
      titulo: "Novos Alunos",
      subtitulo: "Inscrições pelo site, WhatsApp e cadastros presenciais."
    },
    "tab-cadastro": {
      titulo: "Cadastro Presencial",
      subtitulo: "Registre alunos que chegam diretamente ao seminário."
    },
    "tab-colaboradores": {
      titulo: "Colaboradores",
      subtitulo: "Cadastro de professores e funcionários — salário, ajuda de custo e benefícios."
    },
    "tab-whatsapp": {
      titulo: "WhatsApp do Seminário",
      subtitulo: "Conversas integradas — responda e converta contatos em matrículas."
    }
  };

  configurarAbasSecretaria(titulos, sessao);

  inicializarDadosPadrao();
  inicializarDadosFinanceiros();

  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
  configurarCadastroPresencial(sessao);
  renderizarCadastroColaboradores("colaboradoresSecretariaContainer", sessao);
  renderizarInboxWpp(sessao);
}

function configurarAbasSecretaria(titulosMap, sessao) {
  var nav = document.querySelector(".painel__nav");
  if (!nav || nav.dataset.tabsBound === "true") return;
  nav.dataset.tabsBound = "true";

  var navLinks = nav.querySelectorAll("[data-tab]");
  var tabs = document.querySelectorAll(".painel__tab");

  navLinks.forEach(function (link) {
    if (!link.type) link.type = "button";
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var tabId = link.getAttribute("data-tab");

      navLinks.forEach(function (l) { l.classList.remove("active"); });
      tabs.forEach(function (t) { t.classList.remove("active"); });

      link.classList.add("active");
      var tabAtiva = document.getElementById(tabId);
      if (tabAtiva) tabAtiva.classList.add("active");

      var config = titulosMap[tabId];
      if (config) {
        document.getElementById("painelTitulo").textContent = config.titulo;
        document.getElementById("painelSubtitulo").textContent = config.subtitulo;
      }

      if (tabId === "tab-alunos") renderizarAlunosSecretaria();
      if (tabId === "tab-colaboradores") {
        renderizarCadastroColaboradores("colaboradoresSecretariaContainer", sessao);
      }
      if (tabId === "tab-whatsapp") renderizarInboxWpp(sessao);
      if (tabId === "tab-visao") renderizarVisaoSecretaria();
    });
  });

  configurarLogoutPainelInstitucional("login-direcao.html#secretaria");
}

function renderizarVisaoSecretaria() {
  var container = document.getElementById("visaoSecretariaContainer");
  if (!container) return;

  var matriculas = obterMatriculas();
  var porOrigem = { site: 0, presencial: 0, whatsapp: 0 };
  var pendentes = 0;

  matriculas.forEach(function (m) {
    var origem = m.origem || "site";
    if (porOrigem[origem] !== undefined) porOrigem[origem]++;
    if (m.status === "pendente") pendentes++;
  });

  var conversas = obterConversasWpp();
  var naoLidas = contarConversasWppNaoLidas();

  container.innerHTML =
    '<div class="modulos-resumo">' +
      '<article class="modulo-card-resumo modulo-card-resumo--medio">' +
        '<span class="modulo-card-resumo__numero">' + matriculas.length + "</span>" +
        '<span class="modulo-card-resumo__nome">Total de matrículas</span>' +
      "</article>" +
      '<article class="modulo-card-resumo modulo-card-resumo--avancado">' +
        '<span class="modulo-card-resumo__numero">' + pendentes + "</span>" +
        '<span class="modulo-card-resumo__nome">Pendentes</span>' +
      "</article>" +
      '<article class="modulo-card-resumo modulo-card-resumo--teologia">' +
        '<span class="modulo-card-resumo__numero">' + conversas.length + "</span>" +
        '<span class="modulo-card-resumo__nome">Conversas WhatsApp</span>' +
      "</article>" +
      '<article class="modulo-card-resumo modulo-card-resumo--basico">' +
        '<span class="modulo-card-resumo__numero">' + naoLidas + "</span>" +
        '<span class="modulo-card-resumo__nome">Mensagens não lidas</span>' +
      "</article>" +
    "</div>" +
    '<div class="secretaria-resumo-origens">' +
      "<p><strong>Site:</strong> " + porOrigem.site + " matrículas</p>" +
      "<p><strong>Presencial:</strong> " + porOrigem.presencial + " matrículas</p>" +
      "<p><strong>WhatsApp:</strong> " + porOrigem.whatsapp + " matrículas</p>" +
    "</div>" +
    '<p class="secretaria-aviso">Integração WhatsApp em modo demonstração. ' +
    "Em produção, conecte a API oficial do WhatsApp Business para sincronizar mensagens em tempo real.</p>";
}

function renderizarAlunosSecretaria() {
  var container = document.getElementById("alunosSecretariaContainer");
  var filtroEl = document.getElementById("filtroOrigemAlunos");
  if (!container) return;

  var filtro = filtroEl ? filtroEl.value : "todos";
  var matriculas = obterMatriculas().slice().sort(function (a, b) {
    return new Date(b.dataMatricula) - new Date(a.dataMatricula);
  });

  if (filtro !== "todos") {
    matriculas = matriculas.filter(function (m) {
      return (m.origem || "site") === filtro;
    });
  }

  if (matriculas.length === 0) {
    container.innerHTML = '<p class="lista-vazia">Nenhum aluno encontrado para este filtro.</p>';
    return;
  }

  container.innerHTML =
    '<table class="data-table">' +
      "<thead><tr>" +
        "<th>Nome</th><th>E-mail</th><th>Telefone</th><th>Módulo</th>" +
        "<th>Origem</th><th>Data</th><th>Status</th><th>Ações</th>" +
      "</tr></thead><tbody>" +
      matriculas.map(function (aluno) {
        var moduloNome = MODULOS_CURSO[aluno.modulo]
          ? MODULOS_CURSO[aluno.modulo].nome
          : aluno.modulo;
        var wppBtn = aluno.telefone
          ? '<a class="btn btn--secondary btn--sm" href="https://wa.me/' +
            normalizarTelefoneWpp(aluno.telefone) +
            '" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
          : "";

        return "<tr>" +
          "<td>" + escaparHtml(aluno.nomeCompleto) + "</td>" +
          "<td>" + escaparHtml(aluno.email) + "</td>" +
          "<td>" + escaparHtml(aluno.telefone) + "</td>" +
          "<td>" + escaparHtml(moduloNome) + "</td>" +
          '<td><span class="origem-badge origem-badge--' + escaparHtml(aluno.origem || "site") + '">' +
            escaparHtml(obterLabelOrigemMatricula(aluno.origem)) + "</span></td>" +
          "<td>" + formatarData(aluno.dataMatricula) + "</td>" +
          "<td>" +
            (typeof renderizarBadgeSolicitacaoExclusao === "function"
              ? renderizarBadgeSolicitacaoExclusao(aluno.id)
              : "") +
            '<span class="trabalho-item__status status--pendente">' +
              escaparHtml(aluno.status) + "</span>" +
          "</td>" +
          '<td><div class="matricula-acoes">' + wppBtn +
            renderizarBotaoExcluirMatricula(aluno) + "</div></td>" +
        "</tr>";
      }).join("") +
      "</tbody></table>";

  if (filtroEl && !filtroEl.dataset.listener) {
    filtroEl.dataset.listener = "1";
    filtroEl.addEventListener("change", renderizarAlunosSecretaria);
  }

  configurarExclusaoAlunosMatricula("alunosSecretariaContainer", function () {
    renderizarAlunosSecretaria();
    renderizarVisaoSecretaria();
  });
}

function configurarCadastroPresencial(sessao) {
  var form = document.getElementById("formCadastroPresencial");
  if (!form || form.dataset.cadastroBound === "1") return;

  form.dataset.cadastroBound = "1";
  aplicarMascaraCpf(document.getElementById("secCpf"));
  aplicarMascaraTelefone(document.getElementById("secTelefone"));

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (form.dataset.enviando === "1") return;

    var mensagemEl = document.getElementById("cadastroPresencialMensagem");
    var sucessoEl = document.getElementById("cadastroPresencialSucesso");

    mensagemEl.className = "form-mensagem";
    mensagemEl.textContent = "";
    sucessoEl.classList.remove("matricula-sucesso--visivel");

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

    var erro = validarMatricula(dados);
    if (erro) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = erro;
      return;
    }

    var verificacaoEmail = verificarEmailDisponivelParaMatricula(dados.email);
    if (!verificacaoEmail.ok) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = verificacaoEmail.erro;
      return;
    }

    form.dataset.enviando = "1";

    var resultado = cadastrarMatricula(dados);
    if (!resultado.ok) {
      form.dataset.enviando = "0";
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = resultado.erro || "Não foi possível cadastrar o aluno.";
      return;
    }

    var matricula = resultado.matricula;
    if (typeof criarPagamentoDeMatricula === "function") {
      criarPagamentoDeMatricula(matricula);
    }

    form.reset();
    form.dataset.enviando = "0";
    document.getElementById("secOrigem").value = "presencial";
    sucessoEl.classList.add("matricula-sucesso--visivel");
    sucessoEl.innerHTML =
      "<strong>Aluno cadastrado com sucesso!</strong><br>" +
      escaparHtml(dados.nomeCompleto) + " foi registrado como matrícula presencial.";

    renderizarVisaoSecretaria();
    renderizarAlunosSecretaria();
  });
}

function renderizarInboxWpp(sessao) {
  var listaEl = document.getElementById("wppListaConversas");
  var threadEl = document.getElementById("wppThread");
  if (!listaEl || !threadEl) return;

  var conversas = obterConversasWpp().slice().sort(function (a, b) {
    return new Date(b.ultimaAtualizacao) - new Date(a.ultimaAtualizacao);
  });

  if (conversas.length === 0) {
    listaEl.innerHTML = '<p class="lista-vazia">Nenhuma conversa registrada ainda.</p>';
    threadEl.innerHTML =
      '<p class="lista-vazia">Quando visitantes clicarem no WhatsApp do site ou houver novas matrículas, as conversas aparecerão aqui.</p>';
    return;
  }

  listaEl.innerHTML = conversas.map(function (c) {
    var ultima = c.mensagens[c.mensagens.length - 1];
    var preview = ultima ? ultima.texto : "Sem mensagens";
    var ativa = conversaWppAtiva === c.id ? " wpp-conversa--ativa" : "";

    return (
      '<button type="button" class="wpp-conversa' + ativa + '" data-conversa-id="' + c.id + '">' +
        '<span class="wpp-conversa__topo">' +
          '<strong class="wpp-conversa__nome">' + escaparHtml(c.nome) + "</strong>" +
          (c.naoLidas > 0
            ? '<span class="wpp-conversa__badge">' + c.naoLidas + "</span>"
            : "") +
        "</span>" +
        '<span class="wpp-conversa__preview">' + escaparHtml(preview) + "</span>" +
        '<span class="wpp-conversa__meta">' + formatarData(c.ultimaAtualizacao) + "</span>" +
      "</button>"
    );
  }).join("");

  listaEl.querySelectorAll("[data-conversa-id]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      conversaWppAtiva = btn.getAttribute("data-conversa-id");
      marcarConversaWppComoLida(conversaWppAtiva);
      renderizarInboxWpp(sessao);
      renderizarThreadWpp(sessao, conversaWppAtiva);
    });
  });

  if (!conversaWppAtiva && conversas[0]) {
    conversaWppAtiva = conversas[0].id;
    marcarConversaWppComoLida(conversaWppAtiva);
    renderizarInboxWpp(sessao);
  }

  if (conversaWppAtiva) {
    renderizarThreadWpp(sessao, conversaWppAtiva);
  }
}

function renderizarThreadWpp(sessao, conversaId) {
  var threadEl = document.getElementById("wppThread");
  var conversa = obterConversaWppPorId(conversaId);
  if (!threadEl || !conversa) return;

  var telefoneLabel = conversa.telefone
    ? "+" + conversa.telefone
    : "Telefone não informado (contato via site)";

  threadEl.innerHTML =
    '<header class="wpp-thread__header">' +
      "<div>" +
        "<h3 class=\"wpp-thread__titulo\">" + escaparHtml(conversa.nome) + "</h3>" +
        '<p class="wpp-thread__sub">' + escaparHtml(telefoneLabel) + "</p>" +
      "</div>" +
      '<div class="wpp-thread__acoes">' +
        '<button type="button" class="btn btn--secondary btn--sm" id="btnAbrirWppExterno">Abrir no WhatsApp</button>' +
        (conversa.matriculaId
          ? '<span class="wpp-thread__vinculo">Matrícula vinculada</span>'
          : '<button type="button" class="btn btn--primary btn--sm" id="btnConverterMatricula">Registrar como aluno</button>') +
      "</div>" +
    "</header>" +
    '<div class="wpp-thread__mensagens">' +
      conversa.mensagens.map(function (msg) {
        return (
          '<article class="wpp-msg wpp-msg--' + msg.direcao + '">' +
            '<p class="wpp-msg__texto">' + escaparHtml(msg.texto) + "</p>" +
            '<footer class="wpp-msg__meta">' +
              escaparHtml(msg.autor) + " · " + formatarData(msg.data) +
            "</footer>" +
          "</article>"
        );
      }).join("") +
    "</div>" +
    '<form id="formRespostaWpp" class="wpp-thread__form">' +
      '<label class="visually-hidden" for="wppRespostaTexto">Resposta</label>' +
      '<textarea id="wppRespostaTexto" rows="3" placeholder="Digite a resposta para o contato..." required></textarea>' +
      '<button type="submit" class="btn btn--primary">Enviar pelo WhatsApp</button>' +
    "</form>";

  var btnAbrir = document.getElementById("btnAbrirWppExterno");
  if (btnAbrir) {
    btnAbrir.addEventListener("click", function () {
      var url = conversa.telefone
        ? "https://wa.me/" + conversa.telefone
        : "https://wa.me/" + WPP_SEMINARIO_NUMERO;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  var btnConverter = document.getElementById("btnConverterMatricula");
  if (btnConverter) {
    btnConverter.addEventListener("click", function () {
      document.querySelector('[data-tab="tab-cadastro"]').click();
      if (conversa.telefone) {
        document.getElementById("secTelefone").value = conversa.telefone.replace(/^55/, "");
      }
      document.getElementById("secNome").value =
        conversa.nome.indexOf("Interesse") === -1 ? conversa.nome : "";
      document.getElementById("secOrigem").value = "whatsapp";
      document.getElementById("secObservacoes").value =
        "Contato originado do WhatsApp — conversa " + conversa.id;
    });
  }

  var formResposta = document.getElementById("formRespostaWpp");
  if (formResposta) {
    formResposta.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var texto = document.getElementById("wppRespostaTexto").value;
      enviarRespostaWpp(conversaId, texto, sessao.nome);
      document.getElementById("wppRespostaTexto").value = "";
      renderizarInboxWpp(sessao);
      renderizarThreadWpp(sessao, conversaId);
    });
  }
}
