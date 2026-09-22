/* ============================================================
   exclusao-alunos.js — API local de exclusão com permissões,
   auditoria e notificação à direção (demonstração).
   ============================================================ */

const EXCLUSAO_ALUNOS_KEYS = {
  solicitacoes: "setad_solicitacoes_exclusao_alunos",
  auditoria: "setad_auditoria_exclusao_alunos",
  emails: "setad_notificacoes_email_exclusao"
};

/*
  OBS — Produção:
  Cadastre aqui o e-mail institucional do diretor quando a API
  de envio estiver configurada no servidor (SMTP / serviço transacional).
  Enquanto null, o sistema usa o e-mail de demonstração do login.
*/
const EMAIL_DIRETOR_INSTITUCIONAL = null;

const PERMISSOES_EXCLUSAO_ALUNOS = {
  solicitar: ["secretaria", "diretor"],
  aprovar: ["diretor"],
  executar_direto: ["diretor"]
};

function obterEmailDiretorInstitucional() {
  if (EMAIL_DIRETOR_INSTITUCIONAL) {
    return EMAIL_DIRETOR_INSTITUCIONAL;
  }

  try {
    const config = localStorage.getItem("setad_config_diretoria");
    if (config) {
      const dados = JSON.parse(config);
      if (dados.emailDiretor) return dados.emailDiretor;
    }
  } catch (erro) {
    /* ignora config inválida */
  }

  return CREDENCIAIS.diretor.email;
}

function obterObservacaoEmailDiretor() {
  if (EMAIL_DIRETOR_INSTITUCIONAL) {
    return "Notificações enviadas para o e-mail institucional do diretor cadastrado.";
  }

  return "OBS: cadastre futuramente o e-mail institucional do diretor em " +
    "EMAIL_DIRETOR_INSTITUCIONAL (js/exclusao-alunos.js) ou em setad_config_diretoria " +
    "no localStorage. Atualmente em modo demonstração: " + obterEmailDiretorInstitucional();
}

function perfilPodeExclusao(perfil, acao) {
  const permitidos = PERMISSOES_EXCLUSAO_ALUNOS[acao];
  return permitidos && permitidos.indexOf(perfil) !== -1;
}

function exclusaoApiAtivo() {
  return typeof window !== "undefined" && window.SETAD && window.SETAD.apiAtivo;
}

function obterSolicitacoesExclusao() {
  if (exclusaoApiAtivo() && window.SETAD.cache.exclusoesSolicitacoes) {
    return window.SETAD.cache.exclusoesSolicitacoes.slice();
  }
  const dados = localStorage.getItem(EXCLUSAO_ALUNOS_KEYS.solicitacoes);
  return dados ? JSON.parse(dados) : [];
}

function salvarSolicitacoesExclusao(lista) {
  if (exclusaoApiAtivo()) {
    window.SETAD.setCache("exclusoesSolicitacoes", lista, "exclusoes/solicitacoes");
    return;
  }
  localStorage.setItem(EXCLUSAO_ALUNOS_KEYS.solicitacoes, JSON.stringify(lista));
}

function obterAuditoriaExclusao() {
  if (exclusaoApiAtivo() && window.SETAD.cache.exclusoesAuditoria) {
    return window.SETAD.cache.exclusoesAuditoria.slice();
  }
  const dados = localStorage.getItem(EXCLUSAO_ALUNOS_KEYS.auditoria);
  return dados ? JSON.parse(dados) : [];
}

function salvarAuditoriaExclusao(lista) {
  if (exclusaoApiAtivo()) {
    window.SETAD.setCache("exclusoesAuditoria", lista, "exclusoes/auditoria");
    return;
  }
  localStorage.setItem(EXCLUSAO_ALUNOS_KEYS.auditoria, JSON.stringify(lista));
}

function obterNotificacoesEmailExclusao() {
  if (exclusaoApiAtivo() && window.SETAD.cache.exclusoesEmails) {
    return window.SETAD.cache.exclusoesEmails.slice();
  }
  const dados = localStorage.getItem(EXCLUSAO_ALUNOS_KEYS.emails);
  return dados ? JSON.parse(dados) : [];
}

function salvarNotificacoesEmailExclusao(lista) {
  if (exclusaoApiAtivo()) {
    window.SETAD.setCache("exclusoesEmails", lista, "exclusoes/emails");
    return;
  }
  localStorage.setItem(EXCLUSAO_ALUNOS_KEYS.emails, JSON.stringify(lista));
}

function registrarAuditoriaExclusao(entrada) {
  const auditoria = obterAuditoriaExclusao();
  auditoria.unshift(Object.assign({
    id: gerarId("aud-exc"),
    criadoEm: new Date().toISOString()
  }, entrada));
  salvarAuditoriaExclusao(auditoria.slice(0, 200));
}

function obterSolicitacaoExclusaoPorId(solicitacaoId) {
  return obterSolicitacoesExclusao().find(function (s) {
    return s.id === solicitacaoId;
  }) || null;
}

function obterSolicitacaoPendentePorMatricula(matriculaId) {
  return obterSolicitacoesExclusao().find(function (s) {
    return s.matriculaId === matriculaId && s.status === "pendente";
  }) || null;
}

function limparVinculosExclusaoPorMatricula(matriculaId, email) {
  const emailNorm = typeof normalizarEmailMatricula === "function"
    ? normalizarEmailMatricula(email)
    : (email || "").trim().toLowerCase();

  const solicitacoes = obterSolicitacoesExclusao().filter(function (s) {
    if (s.matriculaId === matriculaId) return false;
    if (emailNorm && s.alunoEmail && normalizarEmailMatricula(s.alunoEmail) === emailNorm) {
      return false;
    }
    return true;
  });
  salvarSolicitacoesExclusao(solicitacoes);
}

function notificarDiretorSolicitacaoExclusao(solicitacao) {
  const destino = obterEmailDiretorInstitucional();
  const assunto = "[SETAD] Solicitação de exclusão de aluno — aprovação necessária";
  const corpo =
    "Prezado(a) Diretor(a),\n\n" +
    "A secretaria solicitou a exclusão de um aluno matriculado.\n\n" +
    "Aluno: " + solicitacao.alunoNome + "\n" +
    "E-mail: " + solicitacao.alunoEmail + "\n" +
    "Módulo: " + solicitacao.moduloNome + "\n" +
    "Motivo informado: " + solicitacao.motivo + "\n" +
    "Solicitante: " + solicitacao.solicitadoPor.nome + " (" + solicitacao.solicitadoPor.perfil + ")\n" +
    "Data: " + formatarData(solicitacao.solicitadoEm) + "\n\n" +
    "Acesse o painel da Direção > Matrículas para aprovar ou rejeitar.\n\n" +
    "SETAD — Seminário Teológico";

  const notificacao = {
    id: gerarId("mail-exc"),
    destino: destino,
    assunto: assunto,
    corpo: corpo,
    tipo: "solicitacao_exclusao_aluno",
    solicitacaoId: solicitacao.id,
    enviadoEm: new Date().toISOString(),
    simulado: true
  };

  const emails = obterNotificacoesEmailExclusao();
  emails.unshift(notificacao);
  salvarNotificacoesEmailExclusao(emails.slice(0, 100));

  registrarAuditoriaExclusao({
    acao: "email_notificado",
    matriculaId: solicitacao.matriculaId,
    alunoNome: solicitacao.alunoNome,
    alunoEmail: solicitacao.alunoEmail,
    solicitacaoId: solicitacao.id,
    usuario: solicitacao.solicitadoPor,
    detalhes: "E-mail de notificação enviado para " + destino + " (simulado)."
  });

  return notificacao;
}

function solicitarExclusaoAluno(matriculaId, sessao, motivo) {
  if (!sessao || !perfilPodeExclusao(sessao.perfil, "solicitar")) {
    return { ok: false, erro: "Sem permissão para solicitar exclusão de alunos." };
  }

  const motivoLimpo = (motivo || "").trim();
  if (motivoLimpo.length < 8) {
    return { ok: false, erro: "Informe o motivo da exclusão (mínimo 8 caracteres)." };
  }

  const matricula = obterMatriculaPorId(matriculaId);
  if (!matricula) {
    return { ok: false, erro: "Matrícula não encontrada." };
  }

  if (obterSolicitacaoPendentePorMatricula(matriculaId)) {
    return {
      ok: false,
      erro: "Já existe uma solicitação de exclusão pendente para este aluno."
    };
  }

  const moduloNome = MODULOS_CURSO[matricula.modulo]
    ? MODULOS_CURSO[matricula.modulo].nome
    : matricula.modulo;

  const solicitacao = {
    id: gerarId("sol-exc"),
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: matricula.email,
    modulo: matricula.modulo,
    moduloNome: moduloNome,
    motivo: motivoLimpo,
    status: "pendente",
    solicitadoPor: {
      email: sessao.email,
      nome: sessao.nome,
      perfil: sessao.perfil
    },
    solicitadoEm: new Date().toISOString(),
    analisadoPor: null,
    analisadoEm: null,
    observacaoDiretor: null
  };

  const solicitacoes = obterSolicitacoesExclusao();
  solicitacoes.unshift(solicitacao);
  salvarSolicitacoesExclusao(solicitacoes);

  registrarAuditoriaExclusao({
    acao: "solicitacao_criada",
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: matricula.email,
    solicitacaoId: solicitacao.id,
    usuario: solicitacao.solicitadoPor,
    detalhes: "Motivo: " + motivoLimpo
  });

  const email = notificarDiretorSolicitacaoExclusao(solicitacao);

  return {
    ok: true,
    solicitacao: solicitacao,
    emailDestino: email.destino,
    mensagem:
      "Solicitação registrada. A direção foi notificada por e-mail em " + email.destino + "."
  };
}

function aprovarExclusaoAluno(solicitacaoId, sessao, observacaoDiretor) {
  if (!sessao || !perfilPodeExclusao(sessao.perfil, "aprovar")) {
    return { ok: false, erro: "Apenas a direção pode aprovar exclusões de alunos." };
  }

  const solicitacoes = obterSolicitacoesExclusao();
  const indice = solicitacoes.findIndex(function (s) {
    return s.id === solicitacaoId;
  });

  if (indice === -1) {
    return { ok: false, erro: "Solicitação não encontrada." };
  }

  const solicitacao = solicitacoes[indice];
  if (solicitacao.status !== "pendente") {
    return { ok: false, erro: "Esta solicitação já foi analisada." };
  }

  const resultado = excluirMatricula(solicitacao.matriculaId);
  if (!resultado.ok) {
    return resultado;
  }

  solicitacoes[indice].status = "aprovada";
  solicitacoes[indice].analisadoPor = {
    email: sessao.email,
    nome: sessao.nome,
    perfil: sessao.perfil
  };
  solicitacoes[indice].analisadoEm = new Date().toISOString();
  solicitacoes[indice].observacaoDiretor = (observacaoDiretor || "").trim() || null;
  salvarSolicitacoesExclusao(solicitacoes);

  registrarAuditoriaExclusao({
    acao: "aprovada",
    matriculaId: solicitacao.matriculaId,
    alunoNome: solicitacao.alunoNome,
    alunoEmail: solicitacao.alunoEmail,
    solicitacaoId: solicitacao.id,
    usuario: solicitacoes[indice].analisadoPor,
    detalhes: "Exclusão aprovada e executada pela direção."
  });

  return { ok: true, nome: solicitacao.alunoNome };
}

function rejeitarExclusaoAluno(solicitacaoId, sessao, motivoRejeicao) {
  if (!sessao || !perfilPodeExclusao(sessao.perfil, "aprovar")) {
    return { ok: false, erro: "Apenas a direção pode rejeitar solicitações." };
  }

  const motivo = (motivoRejeicao || "").trim();
  if (motivo.length < 5) {
    return { ok: false, erro: "Informe o motivo da rejeição." };
  }

  const solicitacoes = obterSolicitacoesExclusao();
  const indice = solicitacoes.findIndex(function (s) {
    return s.id === solicitacaoId;
  });

  if (indice === -1) {
    return { ok: false, erro: "Solicitação não encontrada." };
  }

  if (solicitacoes[indice].status !== "pendente") {
    return { ok: false, erro: "Esta solicitação já foi analisada." };
  }

  solicitacoes[indice].status = "rejeitada";
  solicitacoes[indice].analisadoPor = {
    email: sessao.email,
    nome: sessao.nome,
    perfil: sessao.perfil
  };
  solicitacoes[indice].analisadoEm = new Date().toISOString();
  solicitacoes[indice].observacaoDiretor = motivo;
  salvarSolicitacoesExclusao(solicitacoes);

  registrarAuditoriaExclusao({
    acao: "rejeitada",
    matriculaId: solicitacoes[indice].matriculaId,
    alunoNome: solicitacoes[indice].alunoNome,
    alunoEmail: solicitacoes[indice].alunoEmail,
    solicitacaoId: solicitacoes[indice].id,
    usuario: solicitacoes[indice].analisadoPor,
    detalhes: "Motivo da rejeição: " + motivo
  });

  return { ok: true };
}

function executarExclusaoDiretorImediata(matriculaId, sessao, motivo) {
  if (!sessao || !perfilPodeExclusao(sessao.perfil, "executar_direto")) {
    return { ok: false, erro: "Apenas a direção pode excluir alunos diretamente." };
  }

  const motivoLimpo = (motivo || "").trim();
  if (motivoLimpo.length < 8) {
    return { ok: false, erro: "Informe o motivo da exclusão (mínimo 8 caracteres)." };
  }

  const matricula = obterMatriculaPorId(matriculaId);
  if (!matricula) {
    return { ok: false, erro: "Matrícula não encontrada." };
  }

  const pendente = obterSolicitacaoPendentePorMatricula(matriculaId);
  if (pendente) {
    aprovarExclusaoAluno(pendente.id, sessao, "Exclusão direta pela direção.");
    return { ok: true, nome: matricula.nomeCompleto, viaSolicitacao: true };
  }

  const resultado = excluirMatricula(matriculaId);
  if (!resultado.ok) return resultado;

  registrarAuditoriaExclusao({
    acao: "exclusao_direta",
    matriculaId: matricula.id,
    alunoNome: matricula.nomeCompleto,
    alunoEmail: matricula.email,
    usuario: {
      email: sessao.email,
      nome: sessao.nome,
      perfil: sessao.perfil
    },
    detalhes: "Exclusão executada diretamente pela direção. Motivo: " + motivoLimpo
  });

  return { ok: true, nome: matricula.nomeCompleto, viaSolicitacao: false };
}

function obterSessaoPainelInstitucional() {
  if (document.body.classList.contains("painel-secretaria")) {
    return typeof obterSessaoSecretaria === "function" ? obterSessaoSecretaria() : null;
  }

  if (document.body.classList.contains("painel-direcao")) {
    return typeof obterSessaoDirecao === "function" ? obterSessaoDirecao() : null;
  }

  return null;
}

function abrirModalMotivoExclusao(titulo, textoBotao, callback) {
  var existente = document.getElementById("modalExclusaoAluno");
  if (existente) existente.remove();

  var modal = document.createElement("div");
  modal.id = "modalExclusaoAluno";
  modal.className = "modal-exclusao-aluno modal-exclusao-aluno--aberto";
  modal.innerHTML =
    '<div class="modal-exclusao-aluno__overlay" data-fechar-modal="1"></div>' +
    '<div class="modal-exclusao-aluno__conteudo" role="dialog" aria-modal="true">' +
      '<button type="button" class="modal-exclusao-aluno__fechar" data-fechar-modal="1" aria-label="Fechar">&times;</button>' +
      "<h3>" + escaparHtml(titulo) + "</h3>" +
      "<p>Informe o motivo para registro em auditoria. A exclusão pela secretaria exige aprovação da direção.</p>" +
      '<label class="form-group form-group--full" for="motivoExclusaoAluno">' +
        "Motivo *" +
        '<textarea id="motivoExclusaoAluno" rows="4" placeholder="Descreva o motivo da exclusão..." required></textarea>' +
      "</label>" +
      '<div id="modalExclusaoAlunoErro" class="form-mensagem form-mensagem--erro" hidden></div>' +
      '<div class="modal-exclusao-aluno__acoes">' +
        '<button type="button" class="btn btn--secondary" data-fechar-modal="1">Cancelar</button>' +
        '<button type="button" class="btn btn--danger" id="btnConfirmarModalExclusao">' +
          escaparHtml(textoBotao) +
        "</button>" +
      "</div>" +
    "</div>";

  document.body.appendChild(modal);

  var conteudo = modal.querySelector(".modal-exclusao-aluno__conteudo");
  var textarea = document.getElementById("motivoExclusaoAluno");
  var btnConfirmar = document.getElementById("btnConfirmarModalExclusao");
  var erroEl = document.getElementById("modalExclusaoAlunoErro");

  function fechar() {
    modal.remove();
  }

  function mostrarErroModal(mensagem) {
    erroEl.textContent = mensagem;
    erroEl.hidden = false;
    erroEl.classList.add("visible");
  }

  function limparErroModal() {
    erroEl.textContent = "";
    erroEl.hidden = true;
    erroEl.classList.remove("visible");
  }

  modal.querySelectorAll("[data-fechar-modal]").forEach(function (el) {
    el.addEventListener("click", fechar);
  });

  if (conteudo) {
    conteudo.addEventListener("click", function (evento) {
      evento.stopPropagation();
    });
  }

  function confirmarEnvio() {
    if (btnConfirmar.disabled) return;

    var motivo = textarea.value.trim();
    limparErroModal();

    if (motivo.length < 8) {
      mostrarErroModal("Informe o motivo com pelo menos 8 caracteres.");
      textarea.focus();
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando...";

    var enviado = false;

    try {
      enviado = callback(motivo, fechar) !== false;
    } catch (erro) {
      mostrarErroModal(
        "Não foi possível enviar a solicitação. Atualize a página e tente novamente."
      );
      if (typeof console !== "undefined" && console.error) {
        console.error("Erro ao enviar solicitação à direção:", erro);
      }
    }

    if (!enviado && modal.isConnected) {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = textoBotao;
    }
  }

  btnConfirmar.addEventListener("click", function (evento) {
    evento.preventDefault();
    evento.stopPropagation();
    confirmarEnvio();
  });

  if (textarea) {
    textarea.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
        evento.preventDefault();
        confirmarEnvio();
      }
    });
    textarea.focus();
  }
}

function renderizarBadgeSolicitacaoExclusao(matriculaId) {
  var pendente = obterSolicitacaoPendentePorMatricula(matriculaId);
  if (!pendente) return "";

  return '<span class="status-badge status-badge--pendente" title="Aguardando aprovação da direção">' +
    "Exclusão pendente" +
  "</span>";
}

function renderizarPainelExclusaoDiretor(sessao) {
  var container = document.getElementById("exclusaoAlunosDiretorContainer");
  if (!container || !sessao) return;

  var pendentes = obterSolicitacoesExclusao().filter(function (s) {
    return s.status === "pendente";
  });
  var ultimoEmail = obterNotificacoesEmailExclusao()[0];

  container.innerHTML =
    '<section class="exclusao-diretor-painel">' +
      '<div class="exclusao-diretor-aviso">' +
        "<strong>Controle de exclusão com auditoria</strong>" +
        "<p>" + escaparHtml(obterObservacaoEmailDiretor()) + "</p>" +
        (ultimoEmail
          ? "<p class=\"exclusao-diretor-email\">Última notificação simulada: <strong>" +
              escaparHtml(ultimoEmail.assunto) + "</strong> → " +
              escaparHtml(ultimoEmail.destino) + " · " +
              formatarData(ultimoEmail.enviadoEm) +
            "</p>"
          : "") +
      "</div>" +
      "<h3>Solicitações pendentes da secretaria (" + pendentes.length + ")</h3>" +
      (pendentes.length
        ? '<table class="data-table">' +
            "<thead><tr>" +
              "<th>Aluno</th><th>E-mail</th><th>Módulo</th><th>Motivo</th><th>Solicitante</th><th>Data</th><th>Ações</th>" +
            "</tr></thead><tbody>" +
            pendentes.map(function (sol) {
              return "<tr>" +
                "<td>" + escaparHtml(sol.alunoNome) + "</td>" +
                "<td>" + escaparHtml(sol.alunoEmail) + "</td>" +
                "<td>" + escaparHtml(sol.moduloNome) + "</td>" +
                "<td>" + escaparHtml(sol.motivo) + "</td>" +
                "<td>" + escaparHtml(sol.solicitadoPor.nome) + "</td>" +
                "<td>" + formatarData(sol.solicitadoEm) + "</td>" +
                '<td><div class="matricula-acoes">' +
                  '<button type="button" class="btn btn--primary btn--sm btn-aprovar-exclusao" data-solicitacao-id="' +
                    escaparHtml(sol.id) + '">Aprovar</button>' +
                  '<button type="button" class="btn btn--secondary btn--sm btn-rejeitar-exclusao" data-solicitacao-id="' +
                    escaparHtml(sol.id) + '">Rejeitar</button>' +
                "</div></td>" +
              "</tr>";
            }).join("") +
          "</tbody></table>"
        : '<p class="lista-vazia">Nenhuma solicitação de exclusão aguardando aprovação.</p>') +
    "</section>";

  container.querySelectorAll(".btn-aprovar-exclusao").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-solicitacao-id");
      var sol = obterSolicitacaoExclusaoPorId(id);
      if (!sol) return;

      var obs = window.prompt(
        "Aprovar exclusão de \"" + sol.alunoNome + "\"?\n\nObservação opcional da direção:",
        ""
      );
      if (obs === null) return;

      var resultado = aprovarExclusaoAluno(id, sessao, obs);
      if (!resultado.ok) {
        window.alert(resultado.erro);
        return;
      }

      window.alert("Exclusão aprovada e executada para " + resultado.nome + ".");
      renderizarPainelExclusaoDiretor(sessao);
      renderizarAuditoriaExclusaoAlunos();
      if (typeof renderizarMatriculasProfessor === "function") {
        renderizarMatriculasProfessor();
      }
    });
  });

  container.querySelectorAll(".btn-rejeitar-exclusao").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-solicitacao-id");
      var sol = obterSolicitacaoExclusaoPorId(id);
      if (!sol) return;

      var motivo = window.prompt(
        "Rejeitar exclusão de \"" + sol.alunoNome + "\".\n\nInforme o motivo da rejeição:"
      );
      if (!motivo) return;

      var resultado = rejeitarExclusaoAluno(id, sessao, motivo);
      if (!resultado.ok) {
        window.alert(resultado.erro);
        return;
      }

      renderizarPainelExclusaoDiretor(sessao);
      renderizarAuditoriaExclusaoAlunos();
      if (typeof renderizarAlunosSecretaria === "function") {
        renderizarAlunosSecretaria();
      }
    });
  });
}

function renderizarAuditoriaExclusaoAlunos() {
  var container = document.getElementById("auditoriaExclusaoAlunosContainer");
  if (!container) return;

  var registros = obterAuditoriaExclusao().slice(0, 15);

  container.innerHTML =
    '<section class="exclusao-auditoria">' +
      "<h3>Auditoria de exclusões (últimos registros)</h3>" +
      (registros.length
        ? '<table class="data-table data-table--compact">' +
            "<thead><tr><th>Data</th><th>Ação</th><th>Aluno</th><th>Usuário</th><th>Detalhes</th></tr></thead><tbody>" +
            registros.map(function (item) {
              return "<tr>" +
                "<td>" + formatarData(item.criadoEm) + "</td>" +
                "<td>" + escaparHtml(item.acao) + "</td>" +
                "<td>" + escaparHtml(item.alunoNome || "—") + "</td>" +
                "<td>" + escaparHtml(item.usuario ? item.usuario.nome : "—") + "</td>" +
                "<td>" + escaparHtml(item.detalhes || "—") + "</td>" +
              "</tr>";
            }).join("") +
          "</tbody></table>"
        : '<p class="lista-vazia">Nenhum registro de auditoria ainda.</p>') +
    "</section>";
}

function configurarFluxoExclusaoAlunos(containerId, aoAtualizar) {
  var container = document.getElementById(containerId);
  if (!container || container.dataset.exclusaoFluxoBound === "1") return;

  container.dataset.exclusaoFluxoBound = "1";
  container.addEventListener("click", function (evento) {
    var botao = evento.target.closest(".btn-excluir-matricula");
    if (!botao) return;

    var matriculaId = botao.getAttribute("data-matricula-id");
    var nome = botao.getAttribute("data-matricula-nome") || "este aluno";
    var sessao = obterSessaoPainelInstitucional();
    if (!matriculaId || !sessao) return;

    if (sessao.perfil === "secretaria") {
      if (obterSolicitacaoPendentePorMatricula(matriculaId)) {
        window.alert("Já existe uma solicitação de exclusão pendente para este aluno.");
        return;
      }

      abrirModalMotivoExclusao(
        "Solicitar exclusão — " + nome,
        "Enviar à direção",
        function (motivo, fecharModal) {
          var sessaoAtual = obterSessaoPainelInstitucional() || sessao;
          var resultado = solicitarExclusaoAluno(matriculaId, sessaoAtual, motivo);
          if (!resultado.ok) {
            window.alert(resultado.erro);
            return false;
          }

          fecharModal();
          window.alert(resultado.mensagem);
          if (typeof aoAtualizar === "function") aoAtualizar();
          return true;
        }
      );
      return;
    }

    if (sessao.perfil === "diretor") {
      abrirModalMotivoExclusao(
        "Excluir aluno — " + nome,
        "Confirmar exclusão",
        function (motivo, fecharModal) {
          var sessaoAtual = obterSessaoPainelInstitucional() || sessao;
          var resultado = executarExclusaoDiretorImediata(matriculaId, sessaoAtual, motivo);
          if (!resultado.ok) {
            window.alert(resultado.erro);
            return false;
          }

          fecharModal();
          window.alert("Aluno excluído com registro em auditoria: " + resultado.nome + ".");
          if (typeof renderizarPainelExclusaoDiretor === "function") {
            renderizarPainelExclusaoDiretor(sessaoAtual);
          }
          if (typeof renderizarAuditoriaExclusaoAlunos === "function") {
            renderizarAuditoriaExclusaoAlunos();
          }
          if (typeof aoAtualizar === "function") aoAtualizar();
          return true;
        }
      );
    }
  });
}
