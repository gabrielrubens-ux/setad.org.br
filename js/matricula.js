/* ============================================================
   matricula.js — Formulário de matrícula e listagem administrativa
   Alunos se inscrevem pelo site; dados ficam no localStorage
   organizados por módulo: básico, médio e avançado.
   ============================================================ */

/**
 * Inicializa o formulário de matrícula na subpágina matricula/.
 */
function inicializarFormularioMatricula() {
  const form = document.getElementById("formMatricula");
  if (!form || form.dataset.matriculaBound === "1") return;

  form.dataset.matriculaBound = "1";
  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (form.dataset.enviando === "1") return;
    processarMatricula(form);
  });
}

/**
 * Valida e salva os dados do formulário.
 */
function processarMatricula(form) {
  const mensagemEl = document.getElementById("matriculaMensagem");
  const sucessoEl = document.getElementById("matriculaSucesso");

  mensagemEl.className = "form-mensagem";
  mensagemEl.textContent = "";
  sucessoEl.classList.remove("matricula-sucesso--visivel");

  const dados = {
    nomeCompleto: document.getElementById("matNome").value.trim(),
    email: document.getElementById("matEmail").value.trim().toLowerCase(),
    telefone: document.getElementById("matTelefone").value.trim(),
    cpf: document.getElementById("matCpf").value.trim(),
    dataNascimento: document.getElementById("matNascimento").value,
    cidade: document.getElementById("matCidade").value.trim(),
    estado: document.getElementById("matEstado").value,
    modulo: document.getElementById("matModulo").value,
    igreja: document.getElementById("matIgreja").value.trim(),
    origem: "site"
  };

  const erro = validarMatricula(dados);
  if (erro) {
    mensagemEl.className = "form-mensagem form-mensagem--erro visible";
    mensagemEl.textContent = erro;
    return;
  }

  form.dataset.enviando = "1";

  function concluirMatricula(resultado) {
    if (!resultado.ok) {
      form.dataset.enviando = "0";
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = resultado.erro || "Não foi possível concluir a matrícula.";
      return;
    }

    const matricula = resultado.matricula;
    if (!resultado.pagamento && typeof criarPagamentoDeMatricula === "function") {
      criarPagamentoDeMatricula(matricula);
    }
    finalizarSucessoMatricula(form, dados, matricula, mensagemEl, sucessoEl);
  }

  const fluxo = (window.SETAD && SETAD.ready) ? SETAD.ready : Promise.resolve();

  fluxo.then(function () {
    return verificarEmailDisponivelParaMatriculaAsync(dados.email);
  }).then(function (verificacaoEmail) {
    if (!verificacaoEmail.ok) {
      form.dataset.enviando = "0";
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = verificacaoEmail.erro;
      return null;
    }
    return cadastrarMatriculaAsync(dados);
  }).then(function (resultado) {
    if (resultado) concluirMatricula(resultado);
  }).catch(function () {
    form.dataset.enviando = "0";
    mensagemEl.className = "form-mensagem form-mensagem--erro visible";
    mensagemEl.textContent = "Erro de conexão com o servidor. Tente novamente.";
  });

  return;
}

function finalizarSucessoMatricula(form, dados, matricula, mensagemEl, sucessoEl) {
  const moduloNome = MODULOS_CURSO[dados.modulo].nome;
  const taxaMatricula = obterTaxaMatriculaModulo(dados.modulo);

  form.reset();
  form.dataset.enviando = "0";
  sucessoEl.classList.add("matricula-sucesso--visivel");
  sucessoEl.innerHTML =
    "<strong>Matrícula enviada com sucesso!</strong><br>" +
    escaparHtml(dados.nomeCompleto) + ", sua inscrição no módulo <strong>" +
    escaparHtml(moduloNome) + "</strong> foi registrada.<br>" +
    "Redirecionando para a área de pagamento da taxa de matrícula (" +
    formatarMoeda(taxaMatricula) + ")...";

  sucessoEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

  setTimeout(function () {
    window.location.href = obterUrlPagamentoMatricula(matricula.id, dados.email);
  }, 2200);
}

function obterUrlPagamentoMatricula(matriculaId, email) {
  const base = window.location.pathname.indexOf("/teologia/") !== -1
    ? "../pagamento.html"
    : "pagamento.html";

  return base +
    "?matricula=" + encodeURIComponent(matriculaId) +
    "&email=" + encodeURIComponent(email);
}

/**
 * Regras de validação dos campos obrigatórios.
 */
function validarMatricula(dados) {
  if (!dados.nomeCompleto || dados.nomeCompleto.length < 3) {
    return "Informe seu nome completo.";
  }

  if (!dados.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
    return "Informe um e-mail válido.";
  }

  if (!dados.telefone || dados.telefone.replace(/\D/g, "").length < 10) {
    return "Informe um telefone válido com DDD.";
  }

  if (!dados.cpf || !validarCpf(dados.cpf)) {
    return "Informe um CPF válido.";
  }

  if (!dados.dataNascimento) {
    return "Informe sua data de nascimento.";
  }

  if (!dados.cidade) {
    return "Informe sua cidade.";
  }

  if (!dados.estado) {
    return "Selecione seu estado.";
  }

  if (!dados.modulo || !MODULOS_CURSO[dados.modulo]) {
    return "Selecione o módulo do curso.";
  }

  return null;
}

/**
 * Validação básica de CPF (dígitos verificadores).
 */
function validarCpf(cpf) {
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10), 10)) return false;

  return true;
}

/**
 * Máscara simples de CPF enquanto o usuário digita.
 */
function aplicarMascaraCpf(input) {
  if (!input) return;

  input.addEventListener("input", function () {
    let valor = input.value.replace(/\D/g, "").slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
    valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    input.value = valor;
  });
}

/**
 * Máscara simples de telefone.
 */
function aplicarMascaraTelefone(input) {
  if (!input) return;

  input.addEventListener("input", function () {
    let valor = input.value.replace(/\D/g, "").slice(0, 11);
    if (valor.length <= 10) {
      valor = valor.replace(/(\d{2})(\d)/, "($1) $2");
      valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      valor = valor.replace(/(\d{2})(\d)/, "($1) $2");
      valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
    }
    input.value = valor;
  });
}

/**
 * Lê ?modulo=basico|medio|avancado da URL e pré-seleciona no formulário.
 */
function preencherModuloDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const modulo = params.get("modulo");
  const select = document.getElementById("matModulo");

  if (select && modulo && MODULOS_CURSO[modulo]) {
    select.value = modulo;
    destacarModuloSelecionado(modulo);
  }
}

/**
 * Destaca visualmente o card do módulo escolhido.
 */
function destacarModuloSelecionado(moduloId) {
  document.querySelectorAll(".plano-card[data-modulo], .modulo-card[data-modulo]").forEach(function (card) {
    const ativo = card.dataset.modulo === moduloId;
    card.classList.toggle("plano-card--ativo", ativo);
    card.classList.toggle("modulo-card--ativo", ativo);
  });
}

/**
 * Seleciona o módulo no formulário e destaca o card correspondente.
 */
function selecionarModulo(moduloId) {
  const select = document.getElementById("matModulo");
  if (!select || !MODULOS_CURSO[moduloId]) return;

  select.value = moduloId;
  destacarModuloSelecionado(moduloId);
}

/**
 * Permite clicar nos cards de plano para preencher o select automaticamente.
 */
function inicializarSelecaoModulos() {
  const cards = document.querySelectorAll(".plano-card[data-modulo], .modulo-card[data-modulo]");
  const select = document.getElementById("matModulo");
  const formulario = document.getElementById("formulario");

  if (!cards.length || !select) return;

  cards.forEach(function (card) {
    card.addEventListener("click", function (evento) {
      if (evento.target.closest(".plano-card__btn")) return;
      selecionarModulo(card.dataset.modulo);
    });

    const botao = card.querySelector(".plano-card__btn");
    if (botao) {
      botao.addEventListener("click", function (evento) {
        evento.stopPropagation();
        selecionarModulo(card.dataset.modulo);
        if (formulario) {
          formulario.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        select.focus();
      });
    }
  });

  select.addEventListener("change", function () {
    destacarModuloSelecionado(select.value);
  });
}

function renderizarBotaoExcluirMatricula(aluno) {
  const isSecretaria = document.body.classList.contains("painel-secretaria");
  const label = isSecretaria ? "Solicitar exclusão" : "Excluir";
  const title = isSecretaria
    ? "Solicitar exclusão à direção — " + aluno.nomeCompleto
    : "Excluir com auditoria da direção — " + aluno.nomeCompleto;

  return (
    '<button type="button" class="btn btn--danger btn--sm btn-excluir-matricula" ' +
      'data-matricula-id="' + escaparHtml(aluno.id) + '" ' +
      'data-matricula-nome="' + escaparHtml(aluno.nomeCompleto) + '" ' +
      'title="' + escaparHtml(title) + '">' +
      label +
    "</button>"
  );
}

function configurarExclusaoAlunosMatricula(containerId, aoAtualizar) {
  if (typeof configurarFluxoExclusaoAlunos === "function") {
    configurarFluxoExclusaoAlunos(containerId, aoAtualizar);
  }
}

/**
 * Renderiza o arquivo de alunos por módulo — painel do professor/diretor.
 */
function renderizarMatriculasProfessor() {
  const container = document.getElementById("matriculasProfessorContainer");
  if (!container) return;

  const podeExcluirMatricula =
    document.body.classList.contains("painel-direcao") ||
    document.body.classList.contains("painel-secretaria");

  const contagem = contarMatriculasPorModulo();
  const modulos = ["basico", "medio", "avancado", "teologia"];

  let html = `
    <div class="modulos-resumo">
      ${modulos.map(function (id) {
        const mod = MODULOS_CURSO[id];
        return `
          <div class="modulo-card-resumo modulo-card-resumo--${id}">
            <span class="modulo-card-resumo__numero">${contagem[id]}</span>
            <span class="modulo-card-resumo__nome">Módulo ${mod.nome}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  modulos.forEach(function (moduloId) {
    const mod = MODULOS_CURSO[moduloId];
    const alunos = obterMatriculasPorModulo(moduloId);

    html += `
      <div class="modulo-secao">
        <h3 class="modulo-secao__titulo">Módulo ${escaparHtml(mod.nome)}</h3>
        <p class="modulo-secao__desc">${escaparHtml(mod.descricao)}</p>
    `;

    if (alunos.length === 0) {
      html += `<p class="lista-vazia">Nenhum aluno matriculado neste módulo.</p>`;
    } else {
      html += `
        <table class="data-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th>Data</th>
              <th>Origem</th>
              <th>Status</th>
              ${podeExcluirMatricula ? "<th>Ações</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${alunos.map(function (aluno) {
              return `
                <tr>
                  <td>${renderizarMiniaturaAluno(aluno.email, aluno.nomeCompleto)}</td>
                  <td>${escaparHtml(aluno.nomeCompleto)}</td>
                  <td>${escaparHtml(aluno.email)}</td>
                  <td>${escaparHtml(aluno.telefone)}</td>
                  <td>${escaparHtml(aluno.cidade)}/${escaparHtml(aluno.estado)}</td>
                  <td>${formatarData(aluno.dataMatricula)}</td>
                  <td>${escaparHtml(typeof obterLabelOrigemMatricula === "function" ? obterLabelOrigemMatricula(aluno.origem) : (aluno.origem || "site"))}</td>
                  <td><span class="trabalho-item__status status--pendente">${escaparHtml(aluno.status)}</span></td>
                  ${podeExcluirMatricula
                    ? "<td><div class=\"matricula-acoes\">" + renderizarBotaoExcluirMatricula(aluno) + "</div></td>"
                    : ""}
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `;
    }

    html += `</div>`;
  });

  container.innerHTML = html;

  if (podeExcluirMatricula) {
    configurarExclusaoAlunosMatricula("matriculasProfessorContainer", function () {
      renderizarMatriculasProfessor();
    });
  }

  if (document.body.classList.contains("painel-direcao")) {
    const sessao = typeof obterSessaoPainelInstitucional === "function"
      ? obterSessaoPainelInstitucional()
      : null;

    if (sessao && typeof renderizarPainelExclusaoDiretor === "function") {
      renderizarPainelExclusaoDiretor(sessao);
    }
    if (typeof renderizarAuditoriaExclusaoAlunos === "function") {
      renderizarAuditoriaExclusaoAlunos();
    }
  }
}

/* Inicialização na subpágina de matrícula */
document.addEventListener("DOMContentLoaded", function () {
  inicializarFormularioMatricula();
  aplicarMascaraCpf(document.getElementById("matCpf"));
  aplicarMascaraTelefone(document.getElementById("matTelefone"));
  preencherModuloDaUrl();
  inicializarSelecaoModulos();
});
