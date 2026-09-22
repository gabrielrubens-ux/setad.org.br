/* ============================================================
   biblioteca.js — Acervo teológico com permissões
   Alunos: consulta para estudo (sem download).
   Autorizados: cadastrar, editar e excluir livros.
   ============================================================ */

let sessaoBibliotecaAtual = null;
let modoBibliotecaAtual = "aluno";

/**
 * Renderiza o grid de livros conforme o perfil do usuário.
 */
function renderizarBiblioteca(containerId, sessao, modoPainel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  sessaoBibliotecaAtual = sessao;
  modoBibliotecaAtual = modoPainel;

  const livros = obterLivros();
  const podeGerenciar = modoPainel !== "aluno" && podeGerenciarLivros(sessao);

  if (livros.length === 0) {
    container.innerHTML = `<p class="lista-vazia">Nenhum livro cadastrado ainda.</p>`;
    return;
  }

  container.innerHTML = livros.map(function (livro) {
    const acoesAluno = `
      <button type="button" class="btn btn--secondary btn--small btn-estudo" data-livro-id="${livro.id}">
        Consultar para estudo
      </button>
      <p class="livro-card__aviso">Somente leitura — download não permitido</p>
    `;

    const acoesStaff = podeGerenciar ? `
      <div class="livro-card__acoes">
        <button type="button" class="btn btn--secondary btn--small btn-editar" data-livro-id="${livro.id}">
          Editar
        </button>
        <button type="button" class="btn btn--danger btn--small btn-excluir" data-livro-id="${livro.id}">
          Excluir
        </button>
      </div>
    ` : "";

    return `
      <article class="livro-card" data-livro-id="${livro.id}">
        <div
          class="livro-card__cover"
          style="background-image: url('${escaparHtml(livro.capaUrl)}')"
        ></div>
        <div class="livro-card__body">
          <p class="livro-card__tag">${escaparHtml(livro.categoria)}</p>
          <h3 class="livro-card__title">${escaparHtml(livro.titulo)}</h3>
          <p class="livro-card__author">${escaparHtml(livro.autor)}</p>
          ${renderizarBadgeFormatoLivro(livro)}
          <p class="livro-card__meta">Cadastrado por ${escaparHtml(livro.cadastradoPor)}</p>
          ${modoPainel === "aluno" ? acoesAluno : acoesStaff}
        </div>
      </article>
    `;
  }).join("");

  configurarEventosBiblioteca(container, sessao, modoPainel);
}

/**
 * Vincula cliques nos botões de estudo, editar e excluir.
 */
function configurarEventosBiblioteca(container, sessao, modoPainel) {
  container.querySelectorAll(".btn-estudo").forEach(function (btn) {
    btn.addEventListener("click", function () {
      abrirConsultaEstudo(btn.getAttribute("data-livro-id"));
    });
  });

  if (modoPainel !== "aluno" && podeGerenciarLivros(sessao)) {
    container.querySelectorAll(".btn-editar").forEach(function (btn) {
      btn.addEventListener("click", function () {
        abrirEditarLivro(btn.getAttribute("data-livro-id"), sessao);
      });
    });

    container.querySelectorAll(".btn-excluir").forEach(function (btn) {
      btn.addEventListener("click", function () {
        confirmarExclusaoLivro(btn.getAttribute("data-livro-id"), sessao);
      });
    });
  }
}

function renderizarBadgeFormatoLivro(livro) {
  if (!livroPossuiArquivoDigital(livro)) return "";

  const arquivo = livro.arquivo;
  const label = arquivo.label || (arquivo.formato || "digital").toUpperCase();
  const tamanho = arquivo.tamanho
    ? " · " + formatarTamanhoArquivo(arquivo.tamanho)
    : "";

  return (
    '<p class="livro-formato-badge" title="Arquivo digital disponível">' +
      escaparHtml(label) + " digital" + escaparHtml(tamanho) +
    "</p>"
  );
}

function renderizarCamposArquivoLivro(prefix, arquivoAtual, isEdicao) {
  const accept = obterExtensoesLivroAccept();
  const formatos = obterListaFormatosLivroLabel();
  const arquivoInfo = arquivoAtual
    ? '<p class="livro-arquivo-atual">Arquivo atual: <strong>' +
        escaparHtml(arquivoAtual.nome) + "</strong>" +
        (arquivoAtual.tamanho ? " (" + formatarTamanhoArquivo(arquivoAtual.tamanho) + ")" : "") +
        (arquivoAtual.origem === "url" && arquivoAtual.url
          ? '<br><span class="livro-arquivo-atual__url">' + escaparHtml(arquivoAtual.url) + "</span>"
          : "") +
      "</p>"
    : "";

  return (
    '<div class="livro-arquivo-upload">' +
      "<h4>Arquivo digital do livro</h4>" +
      '<p class="livro-arquivo-upload__desc">Envie o material em formatos usados em bibliotecas online: ' +
        escaparHtml(formatos) + ". Tamanho máximo: " +
        formatarTamanhoArquivo(TAMANHO_MAX_ARQUIVO_LIVRO) + ".</p>" +
      arquivoInfo +
      '<div class="form-group">' +
        '<label for="' + prefix + 'ArquivoUrl">Link do arquivo (opcional)</label>' +
        '<input type="url" id="' + prefix + 'ArquivoUrl" placeholder="https://servidor/arquivo.pdf" ' +
          'value="' + escaparHtml(arquivoAtual && arquivoAtual.url ? arquivoAtual.url : "") + '">' +
        "<small>Use para arquivos hospedados externamente (servidor, nuvem, etc.).</small>" +
      "</div>" +
      '<div class="form-group">' +
        '<label for="' + prefix + 'Arquivo">Ou carregar arquivo do computador</label>' +
        '<input type="file" id="' + prefix + 'Arquivo" accept="' + escaparHtml(accept) + '">' +
        "<small>" + (isEdicao
          ? "Deixe em branco para manter o arquivo atual."
          : "Opcional — você também pode informar apenas o link acima.") +
        "</small>" +
      "</div>" +
      '<div id="' + prefix + 'ArquivoPreview" class="livro-arquivo-preview" hidden></div>' +
    "</div>"
  );
}

function configurarPreviewArquivoLivro(prefix) {
  const input = document.getElementById(prefix + "Arquivo");
  const preview = document.getElementById(prefix + "ArquivoPreview");
  if (!input || !preview) return;

  input.addEventListener("change", function () {
    const arquivo = input.files[0];
    if (!arquivo) {
      preview.hidden = true;
      preview.textContent = "";
      return;
    }

    const validacao = validarArquivoLivroBiblioteca(arquivo);
    if (!validacao.ok) {
      preview.hidden = false;
      preview.className = "livro-arquivo-preview livro-arquivo-preview--erro";
      preview.textContent = validacao.erro;
      return;
    }

    preview.hidden = false;
    preview.className = "livro-arquivo-preview livro-arquivo-preview--ok";
    preview.textContent =
      validacao.formato.label + " selecionado: " + arquivo.name +
      " (" + formatarTamanhoArquivo(arquivo.size) + ")";
  });
}

function processarArquivoLivroFormulario(prefix, arquivoAtual) {
  const input = document.getElementById(prefix + "Arquivo");
  const urlInput = document.getElementById(prefix + "ArquivoUrl");
  const arquivo = input && input.files[0];
  const url = urlInput ? urlInput.value.trim() : "";

  if (arquivo) {
    const validacao = validarArquivoLivroBiblioteca(arquivo);
    if (!validacao.ok) {
      return Promise.reject(new Error(validacao.erro));
    }

    return lerArquivoComoDataUrl(arquivo).then(function (dataUrl) {
      return criarMetadadosArquivoLivro(arquivo, dataUrl);
    });
  }

  if (url) {
    const validacaoUrl = validarUrlArquivoLivroBiblioteca(url);
    if (!validacaoUrl.ok) {
      return Promise.reject(new Error(validacaoUrl.erro));
    }

    if (arquivoAtual && arquivoAtual.origem === "url" && arquivoAtual.url === url) {
      return Promise.resolve(arquivoAtual);
    }

    return Promise.resolve(criarArquivoLivroDeUrl(url));
  }

  return Promise.resolve(arquivoAtual || null);
}

function renderizarVisualizadorLivro(livro) {
  const arquivo = livro.arquivo;
  const fonte = obterFonteArquivoLivro(livro);

  if (fonte && arquivo) {
    const formato = (arquivo.formato || "").toLowerCase();

    if (formato === "pdf" || arquivo.tipo === "application/pdf") {
      return (
        '<div class="livro-visualizador livro-visualizador--pdf" oncontextmenu="return false">' +
          '<iframe src="' + escaparHtml(fonte) + '" title="Leitura: ' + escaparHtml(livro.titulo) + '" ' +
            'class="livro-visualizador__frame"></iframe>' +
        "</div>"
      );
    }

    if (formato === "txt" || arquivo.tipo === "text/plain") {
      return (
        '<div class="livro-visualizador livro-visualizador--texto" id="livroTextoContainer" ' +
          'data-src="' + escaparHtml(fonte) + '" oncontextmenu="return false">' +
          '<p class="livro-visualizador__carregando">Carregando texto...</p>' +
        "</div>"
      );
    }

    if (formato === "html" || formato === "htm" || arquivo.tipo === "text/html") {
      return (
        '<div class="livro-visualizador livro-visualizador--html" oncontextmenu="return false">' +
          '<iframe sandbox="" src="' + escaparHtml(fonte) + '" title="Leitura: ' +
            escaparHtml(livro.titulo) + '" class="livro-visualizador__frame"></iframe>' +
        "</div>"
      );
    }

    return (
      '<div class="livro-visualizador livro-visualizador--meta">' +
        "<p><strong>Formato " + escaparHtml(arquivo.label || formato.toUpperCase()) + "</strong></p>" +
        "<p>Arquivo: " + escaparHtml(arquivo.nome) +
          (arquivo.tamanho ? " (" + formatarTamanhoArquivo(arquivo.tamanho) + ")" : "") +
        "</p>" +
        "<p>Este formato está registrado no acervo. A visualização integrada no navegador " +
          "está disponível para PDF, TXT e HTML. Para EPUB, MOBI, DOC e similares, " +
          "consulte o material em sala de estudo presencial ou pelo link institucional.</p>" +
      "</div>"
    );
  }

  const conteudo = livro.conteudoEstudo || livro.descricao;
  if (!conteudo) {
    return '<p class="lista-vazia">Nenhum conteúdo digital cadastrado para este livro.</p>';
  }

  return (
    '<div class="modal-biblioteca__leitura" oncontextmenu="return false">' +
      "<h3>Conteúdo para estudo</h3>" +
      "<p>" + escaparHtml(conteudo) + "</p>" +
    "</div>"
  );
}

function carregarTextoLivroNoVisualizador(modal) {
  const container = modal.querySelector("#livroTextoContainer");
  if (!container) return;

  const fonte = container.getAttribute("data-src");
  if (!fonte) return;

  fetch(fonte)
    .then(function (resposta) { return resposta.text(); })
    .then(function (texto) {
      container.innerHTML =
        '<pre class="livro-visualizador__texto">' + escaparHtml(texto) + "</pre>";
    })
    .catch(function () {
      container.innerHTML =
        '<p class="livro-arquivo-preview livro-arquivo-preview--erro">Não foi possível carregar o texto.</p>';
    });
}

/**
 * Modal de consulta para alunos — leitura na tela, sem download.
 */
function abrirConsultaEstudo(livroId) {
  const livro = obterLivroPorId(livroId);
  if (!livro) return;

  const modal = obterOuCriarModal();

  modal.innerHTML =
    '<div class="modal-biblioteca__overlay" data-fechar="true"></div>' +
    '<div class="modal-biblioteca__conteudo modal-biblioteca__conteudo--estudo" role="dialog" aria-labelledby="modalTitulo">' +
      '<button type="button" class="modal-biblioteca__fechar" aria-label="Fechar">&times;</button>' +
      '<p class="livro-card__tag">' + escaparHtml(livro.categoria) + "</p>" +
      '<h2 id="modalTitulo" class="modal-biblioteca__titulo">' + escaparHtml(livro.titulo) + "</h2>" +
      '<p class="modal-biblioteca__autor">' + escaparHtml(livro.autor) + "</p>" +
      renderizarBadgeFormatoLivro(livro) +
      '<div class="modal-biblioteca__alerta">' +
        "Consulta exclusiva para estudo. É proibido baixar, copiar ou distribuir este material." +
      "</div>" +
      (livro.descricao ? '<p class="modal-biblioteca__descricao">' + escaparHtml(livro.descricao) + "</p>" : "") +
      renderizarVisualizadorLivro(livro) +
      (livro.conteudoEstudo && livroPossuiArquivoDigital(livro)
        ? '<div class="modal-biblioteca__leitura modal-biblioteca__leitura--complemento" oncontextmenu="return false">' +
            "<h3>Resumo / notas de estudo</h3>" +
            "<p>" + escaparHtml(livro.conteudoEstudo) + "</p>" +
          "</div>"
        : "") +
    "</div>";

  modal.classList.add("modal-biblioteca--aberto");
  configurarFecharModal(modal);
  carregarTextoLivroNoVisualizador(modal);
}

/**
 * Modal de edição — apenas perfis autorizados.
 */
function abrirEditarLivro(livroId, sessao) {
  if (!podeGerenciarLivros(sessao)) return;

  const livro = obterLivroPorId(livroId);
  if (!livro) return;

  const optionsCategoria = CATEGORIAS_LIVRO.map(function (cat) {
    const selected = cat === livro.categoria ? "selected" : "";
    return `<option value="${cat}" ${selected}>${cat}</option>`;
  }).join("");

  const modal = obterOuCriarModal();

  modal.innerHTML = `
    <div class="modal-biblioteca__overlay" data-fechar="true"></div>
    <div class="modal-biblioteca__conteudo modal-biblioteca__conteudo--cadastro" role="dialog" aria-labelledby="modalEditarTitulo">
      <button type="button" class="modal-biblioteca__fechar" aria-label="Fechar">&times;</button>
      <h2 id="modalEditarTitulo" class="modal-biblioteca__titulo">Editar livro</h2>

      <form id="formEditarLivro" class="upload-form">
        <input type="hidden" id="editLivroId" value="${livro.id}">

        <div class="form-row">
          <div class="form-group">
            <label for="editTitulo">Título *</label>
            <input type="text" id="editTitulo" value="${escaparHtml(livro.titulo)}" required>
          </div>
          <div class="form-group">
            <label for="editAutor">Autor / Editora *</label>
            <input type="text" id="editAutor" value="${escaparHtml(livro.autor)}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="editCategoria">Categoria *</label>
            <select id="editCategoria" required>${optionsCategoria}</select>
          </div>
          <div class="form-group">
            <label for="editCapa">URL da capa</label>
            <input type="url" id="editCapa" value="${escaparHtml(livro.capaUrl || "")}">
          </div>
        </div>

        <div class="form-group">
          <label for="editDescricao">Descrição</label>
          <textarea id="editDescricao" rows="2">${escaparHtml(livro.descricao || "")}</textarea>
        </div>

        <div class="form-group">
          <label for="editConteudo">Resumo / notas para estudo (texto complementar)</label>
          <textarea id="editConteudo" rows="4">${escaparHtml(livro.conteudoEstudo || "")}</textarea>
        </div>

        ${renderizarCamposArquivoLivro("edit", livro.arquivo, true)}

        <button type="submit" class="btn btn--primary">Salvar alterações</button>
        <div id="editLivroMensagem" class="form-mensagem" role="status"></div>
      </form>
    </div>
  `;

  modal.classList.add("modal-biblioteca--aberto");
  configurarFecharModal(modal);
  configurarPreviewArquivoLivro("edit");

  const formEditar = document.getElementById("formEditarLivro");
  const mensagemEditar = document.getElementById("editLivroMensagem");

  formEditar.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!podeGerenciarLivros(sessao)) return;

    const capaPadrao = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80";
    const capaUrl = document.getElementById("editCapa").value.trim();
    const botao = formEditar.querySelector('button[type="submit"]');

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Salvando...";
    }

    processarArquivoLivroFormulario("edit", livro.arquivo)
      .then(function (arquivoAtualizado) {
        atualizarLivro(livroId, {
          titulo: document.getElementById("editTitulo").value.trim(),
          autor: document.getElementById("editAutor").value.trim(),
          categoria: document.getElementById("editCategoria").value,
          capaUrl: capaUrl || capaPadrao,
          descricao: document.getElementById("editDescricao").value.trim(),
          conteudoEstudo: document.getElementById("editConteudo").value.trim(),
          arquivo: arquivoAtualizado,
          atualizadoPor: sessao.nome
        });

        fecharModalBiblioteca();
        renderizarBiblioteca("bibliotecaGrid", sessao, modoBibliotecaAtual);
      })
      .catch(function (erro) {
        if (mensagemEditar) {
          mensagemEditar.className = "form-mensagem form-mensagem--erro visible";
          mensagemEditar.textContent = erro.message || "Não foi possível salvar o arquivo.";
        }
        if (botao) {
          botao.disabled = false;
          botao.textContent = "Salvar alterações";
        }
      });
  });
}

/**
 * Exclui livro após confirmação — apenas autorizados.
 */
function confirmarExclusaoLivro(livroId, sessao) {
  if (!podeGerenciarLivros(sessao)) return;

  const livro = obterLivroPorId(livroId);
  if (!livro) return;

  const confirmar = window.confirm(
    "Excluir o livro \"" + livro.titulo + "\"?\n\nEsta ação não pode ser desfeita."
  );

  if (!confirmar) return;

  excluirLivro(livroId);
  renderizarBiblioteca("bibliotecaGrid", sessao, modoBibliotecaAtual);
}

function obterOuCriarModal() {
  let modal = document.getElementById("modalBiblioteca");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalBiblioteca";
    modal.className = "modal-biblioteca";
    document.body.appendChild(modal);
  }

  return modal;
}

function configurarFecharModal(modal) {
  modal.querySelector(".modal-biblioteca__fechar").addEventListener("click", fecharModalBiblioteca);
  modal.querySelector(".modal-biblioteca__overlay").addEventListener("click", fecharModalBiblioteca);
}

function fecharModalBiblioteca() {
  const modal = document.getElementById("modalBiblioteca");
  if (modal) {
    modal.classList.remove("modal-biblioteca--aberto");
    modal.innerHTML = "";
  }
}

/**
 * Formulário de cadastro — somente perfis autorizados.
 */
function renderizarFormularioLivro(sessao) {
  const container = document.getElementById("formLivroContainer");
  if (!container) return;

  if (!podeGerenciarLivros(sessao)) {
    container.innerHTML = `
      <p class="biblioteca-aviso">
        O cadastro de livros é restrito a professores, diretores e pessoas autorizadas.
      </p>
    `;
    return;
  }

  const optionsCategoria = CATEGORIAS_LIVRO.map(function (cat) {
    return `<option value="${cat}">${cat}</option>`;
  }).join("");

  container.innerHTML = `
    <div class="cadastro-box">
      <h3 class="upload-box__title">Cadastrar livro na biblioteca</h3>
      <p class="upload-box__desc">
        Acesso autorizado como <strong>${obterLabelPerfil(sessao.perfil)}</strong>.
        Cadastre livros com arquivo digital (PDF, EPUB, DOC, TXT, HTML e outros formatos de biblioteca online)
        ou com link externo para o material.
      </p>

      <form id="formCadastroLivro" class="upload-form">
        <div class="form-row">
          <div class="form-group">
            <label for="livroTitulo">Título do livro *</label>
            <input type="text" id="livroTitulo" placeholder="Ex: Teologia Sistemática — Grudem" required>
          </div>
          <div class="form-group">
            <label for="livroAutor">Autor / Editora *</label>
            <input type="text" id="livroAutor" placeholder="Ex: Wayne Grudem" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="livroCategoria">Categoria *</label>
            <select id="livroCategoria" required>
              <option value="">Selecione...</option>
              ${optionsCategoria}
            </select>
          </div>
          <div class="form-group">
            <label for="livroCapa">URL da capa (opcional)</label>
            <input type="url" id="livroCapa" placeholder="https://...">
          </div>
        </div>

        <div class="form-group">
          <label for="livroDescricao">Descrição breve</label>
          <textarea id="livroDescricao" rows="2" placeholder="Resumo do livro..."></textarea>
        </div>

        <div class="form-group">
          <label for="livroConteudo">Resumo / notas para estudo (texto complementar)</label>
          <textarea id="livroConteudo" rows="4" placeholder="Trecho introdutório ou notas exibidas junto ao arquivo..."></textarea>
        </div>

        ${renderizarCamposArquivoLivro("livro", null, false)}

        <button type="submit" class="btn btn--primary">Cadastrar livro</button>
        <div id="livroMensagem" class="form-mensagem" role="status"></div>
      </form>
    </div>
  `;

  configurarCadastroLivro(sessao);
  configurarPreviewArquivoLivro("livro");
}

function configurarCadastroLivro(sessao) {
  const form = document.getElementById("formCadastroLivro");
  const mensagemEl = document.getElementById("livroMensagem");

  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    if (!podeGerenciarLivros(sessao)) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Você não tem permissão para cadastrar livros.";
      return;
    }

    const capaPadrao = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80";
    const capaUrl = document.getElementById("livroCapa").value.trim();
    const botao = form.querySelector('button[type="submit"]');

    if (botao) {
      botao.disabled = true;
      botao.textContent = "Cadastrando...";
    }

    processarArquivoLivroFormulario("livro", null)
      .then(function (arquivo) {
        const novoLivro = {
          id: gerarId("liv"),
          titulo: document.getElementById("livroTitulo").value.trim(),
          autor: document.getElementById("livroAutor").value.trim(),
          categoria: document.getElementById("livroCategoria").value,
          capaUrl: capaUrl || capaPadrao,
          descricao: document.getElementById("livroDescricao").value.trim(),
          conteudoEstudo: document.getElementById("livroConteudo").value.trim(),
          arquivo: arquivo,
          cadastradoPor: sessao.nome,
          perfilCadastro: sessao.perfil,
          dataCadastro: new Date().toISOString()
        };

        const livros = obterLivros();
        livros.unshift(novoLivro);
        salvarLivros(livros);

        mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
        mensagemEl.textContent = arquivo
          ? "Livro e arquivo digital cadastrados com sucesso!"
          : "Livro cadastrado com sucesso!";

        form.reset();
        const preview = document.getElementById("livroArquivoPreview");
        if (preview) {
          preview.hidden = true;
          preview.textContent = "";
        }
        renderizarBiblioteca("bibliotecaGrid", sessao, modoBibliotecaAtual);

        setTimeout(function () {
          mensagemEl.className = "form-mensagem";
          mensagemEl.textContent = "";
        }, 3000);
      })
      .catch(function (erro) {
        mensagemEl.className = "form-mensagem form-mensagem--erro visible";
        mensagemEl.textContent = erro.message || "Não foi possível carregar o arquivo.";
      })
      .finally(function () {
        if (botao) {
          botao.disabled = false;
          botao.textContent = "Cadastrar livro";
        }
      });
  });
}
