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
      titulo: "Alunos",
      subtitulo: "Inscrições pelo site, WhatsApp e cadastros presenciais."
    },
    "tab-turmas": {
      titulo: "Turmas",
      subtitulo: "Polos em Belém e salas do Médio e do Avançado — vínculo dos alunos."
    },
    "tab-cadastro": {
      titulo: "Cadastro Presencial",
      subtitulo: "Registre alunos que chegam diretamente ao seminário."
    },
    "tab-colaboradores": {
      titulo: "Colaboradores",
      subtitulo: "Cadastro de professores e funcionários — salário, ajuda de custo e benefícios."
    },
    "tab-boletos": {
      titulo: "Boletos bancários",
      subtitulo: "Emissão e impressão de boletos para alunos do seminário."
    },
    "tab-impressao": {
      titulo: "Impressão",
      subtitulo: "Boletos, provas, trabalhos e documentos — rede ou USB."
    },
    "tab-contab-polos": {
      titulo: "Contabilidade dos polos",
      subtitulo: "Lançamentos financeiros dos 17 polos — integrado à contabilidade."
    },
    "tab-whatsapp": {
      titulo: "WhatsApp do Seminário",
      subtitulo: "Conversas integradas — responda e converta contatos em matrículas."
    }
  };

  configurarAbasSecretaria(titulos, sessao);
  if (typeof configurarNavContabilidadePolos === "function") {
    configurarNavContabilidadePolos(sessao);
  }

  inicializarDadosPadrao();
  inicializarDadosFinanceiros();

  renderizarVisaoSecretaria();
  renderizarAlunosSecretaria();
  configurarRestauracaoMatriculasSecretaria();
  if (typeof renderizarPainelTurmasInstitucional === "function") {
    renderizarPainelTurmasInstitucional("turmasSecretariaContainer", {
      intro:
        "O Polo SETADE (sede) concentra as turmas por nível e sala. Os demais polos em Belém aparecem como turmas territoriais.",
      mostrarFiltro: true,
      mostrarAlunosAoClicar: true
    });
  }
  configurarCadastroPresencial(sessao);
  renderizarCadastroColaboradores("colaboradoresSecretariaContainer", sessao);
  if (typeof renderizarEmissaoBoletoSecretaria === "function") {
    renderizarEmissaoBoletoSecretaria("boletosSecretariaContainer", sessao);
  }
  if (typeof renderizarCentralImpressaoSetad === "function") {
    renderizarCentralImpressaoSetad("impressaoSecretariaContainer", sessao);
  }
  renderizarInboxWpp(sessao);
  if (typeof configurarLinkTrocarAreaInstitucional === "function") {
    configurarLinkTrocarAreaInstitucional();
  }
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
      if (tabId === "tab-turmas" && typeof renderizarPainelTurmasInstitucional === "function") {
        var turmasEl =
          document.getElementById("turmasSecretariaContainer") ||
          document.getElementById("turmasCoordenacaoContainer");
        if (turmasEl) {
          renderizarPainelTurmasInstitucional(turmasEl.id, {
            intro:
              "O Polo SETADE (sede) concentra as turmas por nível e sala. Os demais polos em Belém aparecem como turmas territoriais.",
            mostrarFiltro: true,
            mostrarAlunosAoClicar: true
          });
        }
      }
      if (tabId === "tab-colaboradores") {
        renderizarCadastroColaboradores("colaboradoresSecretariaContainer", sessao);
      }
      if (tabId === "tab-boletos" && typeof renderizarEmissaoBoletoSecretaria === "function") {
        renderizarEmissaoBoletoSecretaria("boletosSecretariaContainer", sessao);
      }
      if (tabId === "tab-biblioteca" && typeof renderizarBiblioteca === "function") {
        renderizarBiblioteca("bibliotecaGrid", sessao, "coordenacao");
        if (typeof renderizarFormularioLivro === "function") {
          renderizarFormularioLivro(sessao);
        }
      }
      if (tabId === "tab-impressao" && typeof renderizarCentralImpressaoSetad === "function") {
        renderizarCentralImpressaoSetad("impressaoSecretariaContainer", sessao);
      }
      if (tabId === "tab-contab-polos" && typeof renderizarContabilidadePolos === "function") {
        renderizarContabilidadePolos("contabPolosSecretariaContainer", sessao);
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
  var porOrigem = { site: 0, presencial: 0, quadro: 0, whatsapp: 0 };
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

function obterBackupMatriculasLocalStorage() {
  try {
    var raw = localStorage.getItem("setad_matriculas_alunos");
    if (!raw) return [];
    var lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

function atualizarUiRestauracaoMatriculas(totalServidor) {
  var hint = document.getElementById("restaurarMatriculasHint");
  if (!hint) return;
  var backup = obterBackupMatriculasLocalStorage();
  hint.textContent =
    "No servidor: " +
    totalServidor +
    " cadastro(s)." +
    (backup.length
      ? " Backup neste navegador: " + backup.length + " — use Restaurar se faltar aluno na lista."
      : " Se tiver arquivo JSON exportado, use Importar.");
}

function recarregarMatriculasDoServidor() {
  if (typeof SETADApi === "undefined" || !SETADApi.get) {
    return Promise.resolve();
  }
  return SETADApi.get("/matriculas").then(function (resposta) {
    if (resposta.ok && window.SETAD && window.SETAD.cache) {
      window.SETAD.cache.matriculas = resposta.items || [];
      window.SETAD.cache._matriculasHidratadas = true;
      window.SETAD.cache._matriculasCountServidor = window.SETAD.cache.matriculas.length;
    }
  });
}

function executarRestauracaoMatriculas(items, origemLabel) {
  var msgEl = document.getElementById("restaurarMatriculasMsg");
  if (!items || !items.length) {
    if (msgEl) {
      msgEl.className = "form-mensagem form-mensagem--erro visible";
      msgEl.textContent = "Nenhum cadastro encontrado para restaurar.";
    }
    return;
  }
  if (
    !confirm(
      "Restaurar " +
        items.length +
        " matrícula(s) a partir de " +
        origemLabel +
        "?\n\nOs registros serão mesclados por id (sem apagar os que já existirem)."
    )
  ) {
    return;
  }
  if (typeof SETADApi === "undefined" || !SETADApi.restaurarMergeMatriculas) {
    if (msgEl) {
      msgEl.className = "form-mensagem form-mensagem--erro visible";
      msgEl.textContent = "API indisponível. Faça login no painel com o site em produção.";
    }
    return;
  }
  if (msgEl) {
    msgEl.className = "form-mensagem visible";
    msgEl.textContent = "Restaurando…";
  }
  SETADApi.restaurarMergeMatriculas(items)
    .then(function (resposta) {
      if (!resposta.ok) {
        if (msgEl) {
          msgEl.className = "form-mensagem form-mensagem--erro visible";
          msgEl.textContent = resposta.erro || "Não foi possível restaurar.";
        }
        return;
      }
      return recarregarMatriculasDoServidor().then(function () {
        renderizarAlunosSecretaria();
        renderizarVisaoSecretaria();
        if (msgEl) {
          msgEl.className = "form-mensagem form-mensagem--sucesso visible";
          msgEl.textContent =
            "Restauração concluída. Total no servidor: " +
            resposta.total +
            " (antes: " +
            resposta.anterior +
            ").";
        }
      });
    })
    .catch(function () {
      if (msgEl) {
        msgEl.className = "form-mensagem form-mensagem--erro visible";
        msgEl.textContent = "Erro de comunicação ao restaurar.";
      }
    });
}

function baixarArquivoMatriculasJson(lista) {
  var msgEl = document.getElementById("restaurarMatriculasMsg");
  var itens = Array.isArray(lista) ? lista : [];
  var payload = {
    exportadoEm: new Date().toISOString(),
    origem: "setad.org.br",
    total: itens.length,
    items: itens
  };
  var nomeArquivo =
    "setad-matriculas-" + new Date().toISOString().slice(0, 10) + ".json";
  var blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  if (msgEl) {
    msgEl.className = "form-mensagem form-mensagem--sucesso visible";
    msgEl.textContent =
      "Exportado " + itens.length + " matrícula(s) em " + nomeArquivo + ". Guarde o arquivo em local seguro.";
  }
}

function exportarMatriculasSecretariaJson() {
  if (typeof SETADApi !== "undefined" && window.SETAD && SETAD.apiAtivo && SETADApi.get) {
    SETADApi.get("/matriculas")
      .then(function (resposta) {
        if (resposta.ok && Array.isArray(resposta.items)) {
          baixarArquivoMatriculasJson(resposta.items);
          return;
        }
        baixarArquivoMatriculasJson(obterMatriculas());
      })
      .catch(function () {
        baixarArquivoMatriculasJson(obterMatriculas());
      });
    return;
  }
  baixarArquivoMatriculasJson(obterMatriculas());
}

function extrairListaMatriculasDoJson(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.items)) return parsed.items;
  if (parsed && Array.isArray(parsed.matriculas)) return parsed.matriculas;
  return null;
}

function configurarRestauracaoMatriculasSecretaria() {
  var btnExport = document.getElementById("btnExportarMatriculasJson");
  var btnLocal = document.getElementById("btnRestaurarMatriculasLocal");
  var inputJson = document.getElementById("inputRestaurarMatriculasJson");
  if (btnExport && !btnExport.dataset.bound) {
    btnExport.dataset.bound = "1";
    btnExport.addEventListener("click", exportarMatriculasSecretariaJson);
  }
  if (btnLocal && !btnLocal.dataset.bound) {
    btnLocal.dataset.bound = "1";
    btnLocal.addEventListener("click", function () {
      executarRestauracaoMatriculas(
        obterBackupMatriculasLocalStorage(),
        "backup deste navegador"
      );
    });
  }
  if (inputJson && !inputJson.dataset.bound) {
    inputJson.dataset.bound = "1";
    inputJson.addEventListener("change", function () {
      var arquivo = inputJson.files && inputJson.files[0];
      inputJson.value = "";
      if (!arquivo) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        try {
          var parsed = JSON.parse(String(leitor.result || ""));
          var lista = extrairListaMatriculasDoJson(parsed);
          if (!Array.isArray(lista)) {
            throw new Error("JSON inválido");
          }
          executarRestauracaoMatriculas(lista, "arquivo " + arquivo.name);
        } catch (erro) {
          var msgEl = document.getElementById("restaurarMatriculasMsg");
          if (msgEl) {
            msgEl.className = "form-mensagem form-mensagem--erro visible";
            msgEl.textContent = "Arquivo JSON inválido. Envie um array de matrículas.";
          }
        }
      };
      leitor.readAsText(arquivo, "UTF-8");
    });
  }
}

function renderizarAlunosSecretaria() {
  var container = document.getElementById("alunosSecretariaContainer");
  var filtroEl = document.getElementById("filtroOrigemAlunos");
  var buscaEl = document.getElementById("buscaAlunosSecretaria");
  if (!container) return;

  var filtro = filtroEl ? filtroEl.value : "todos";
  var termoBusca = buscaEl ? buscaEl.value.trim() : "";
  var totalServidor = obterMatriculas().length;
  atualizarUiRestauracaoMatriculas(totalServidor);
  configurarRestauracaoMatriculasSecretaria();

  var matriculas = obterMatriculas().slice().sort(function (a, b) {
    return new Date(b.dataMatricula) - new Date(a.dataMatricula);
  });

  if (filtro !== "todos") {
    matriculas = matriculas.filter(function (m) {
      return (m.origem || "site") === filtro;
    });
  }

  if (
    termoBusca.length >= 2 &&
    typeof filtrarMatriculasPorTermoBusca === "function"
  ) {
    matriculas = filtrarMatriculasPorTermoBusca(matriculas, termoBusca);
  }

  if (matriculas.length === 0) {
    container.innerHTML =
      termoBusca.length >= 2
        ? '<p class="lista-vazia">Nenhum aluno encontrado para esta busca.</p>'
        : '<p class="lista-vazia">Nenhum aluno encontrado para este filtro.</p>';
    configurarFiltrosListaAlunosSecretaria();
    return;
  }

  container.innerHTML =
    '<table class="data-table">' +
      "<thead><tr>" +
        "<th>Nome</th><th>E-mail</th><th>Telefone</th><th>Módulo</th>" +
        "<th>Polo / sala</th><th>Origem</th><th>Data</th><th>Status</th><th>Ações</th>" +
      "</tr></thead><tbody>" +
      matriculas.map(function (aluno) {
        var moduloNome = MODULOS_CURSO[aluno.modulo]
          ? MODULOS_CURSO[aluno.modulo].nome
          : aluno.modulo;
        var direcionamento =
          typeof formatarDirecionamentoAluno === "function"
            ? formatarDirecionamentoAluno(aluno)
            : "—";
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
          "<td>" + escaparHtml(direcionamento) + "</td>" +
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

  configurarFiltrosListaAlunosSecretaria();

  configurarExclusaoAlunosMatricula("alunosSecretariaContainer", function () {
    renderizarAlunosSecretaria();
    renderizarVisaoSecretaria();
  });
}

function configurarFiltrosListaAlunosSecretaria() {
  var filtroEl = document.getElementById("filtroOrigemAlunos");
  var buscaEl = document.getElementById("buscaAlunosSecretaria");

  if (filtroEl && !filtroEl.dataset.listener) {
    filtroEl.dataset.listener = "1";
    filtroEl.addEventListener("change", renderizarAlunosSecretaria);
  }

  if (buscaEl && !buscaEl.dataset.listener) {
    buscaEl.dataset.listener = "1";
    var timer = null;
    buscaEl.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(renderizarAlunosSecretaria, 200);
    });
    buscaEl.addEventListener("search", renderizarAlunosSecretaria);
  }
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
