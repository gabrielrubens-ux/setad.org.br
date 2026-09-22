/* ============================================================
   perfil-aluno.js — Foto de identificação do aluno no painel
   ============================================================ */

const FOTO_ALUNO_MAX_BYTES = 512000;

/**
 * Gera avatar com a inicial do nome quando não há foto.
 */
function gerarAvatarPlaceholder(nome) {
  const inicial = (nome || "A").trim().charAt(0).toUpperCase() || "A";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">' +
    '<circle cx="80" cy="80" r="80" fill="#23406b"/>' +
    '<text x="80" y="98" text-anchor="middle" font-size="64" font-family="Arial,sans-serif" fill="#ffffff">' +
    inicial +
    "</text></svg>";

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

/**
 * Atualiza a pré-visualização da foto do aluno na barra lateral.
 */
function atualizarPreviewFotoAluno(sessao) {
  const preview = document.getElementById("fotoAlunoPreview");
  if (!preview || !sessao) return;

  const foto = obterFotoAluno(sessao.email);
  preview.src = foto ? foto.dataUrl : gerarAvatarPlaceholder(sessao.nome);
  preview.classList.toggle("painel__foto-preview--placeholder", !foto);
}

/**
 * Configura o upload da foto de identificação do aluno.
 */
function inicializarPerfilAluno(sessao) {
  const input = document.getElementById("fotoAlunoInput");
  const mensagemEl = document.getElementById("fotoAlunoMensagem");

  if (!input) return;

  atualizarPreviewFotoAluno(sessao);

  input.addEventListener("change", function () {
    const arquivo = input.files[0];

    if (mensagemEl) {
      mensagemEl.className = "painel__foto-mensagem";
      mensagemEl.textContent = "";
    }

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      if (mensagemEl) {
        mensagemEl.textContent = "Envie apenas imagens (JPG, PNG ou WebP).";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
      input.value = "";
      return;
    }

    if (arquivo.size > FOTO_ALUNO_MAX_BYTES) {
      if (mensagemEl) {
        mensagemEl.textContent = "A imagem deve ter no máximo 500 KB.";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
      input.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = function () {
      salvarFotoAluno(sessao.email, leitor.result);
      atualizarPreviewFotoAluno(sessao);

      if (mensagemEl) {
        mensagemEl.textContent = "Foto salva com sucesso!";
        mensagemEl.classList.add("painel__foto-mensagem--sucesso");
      }
    };

    leitor.onerror = function () {
      if (mensagemEl) {
        mensagemEl.textContent = "Não foi possível carregar a imagem. Tente novamente.";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
    };

    leitor.readAsDataURL(arquivo);
    input.value = "";
  });
}

/**
 * Retorna HTML da miniatura da foto do aluno (painel do professor).
 */
function renderizarMiniaturaAluno(email, nome) {
  const foto = obterFotoAluno(email);

  if (foto) {
    return (
      '<img src="' + foto.dataUrl + '" alt="Foto de ' + escaparHtml(nome) + '" class="aluno-foto-thumb">'
    );
  }

  return (
    '<img src="' + gerarAvatarPlaceholder(nome) + '" alt="Sem foto de ' + escaparHtml(nome) + '" class="aluno-foto-thumb aluno-foto-thumb--placeholder">'
  );
}

/**
 * Atualiza a pré-visualização da foto do professor na barra lateral.
 */
function atualizarPreviewFotoProfessor(sessao) {
  const preview = document.getElementById("fotoProfessorPreview");
  if (!preview || !sessao) return;

  const foto = obterFotoStaff(sessao.email);
  preview.src = foto ? foto.dataUrl : gerarAvatarPlaceholder(sessao.nome);
  preview.classList.toggle("painel__foto-preview--placeholder", !foto);
}

/**
 * Configura o upload da foto de identificação do professor.
 */
function inicializarPerfilProfessor(sessao) {
  const input = document.getElementById("fotoProfessorInput");
  const mensagemEl = document.getElementById("fotoProfessorMensagem");

  if (!input) return;

  atualizarPreviewFotoProfessor(sessao);

  input.addEventListener("change", function () {
    const arquivo = input.files[0];

    if (mensagemEl) {
      mensagemEl.className = "painel__foto-mensagem";
      mensagemEl.textContent = "";
    }

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      if (mensagemEl) {
        mensagemEl.textContent = "Envie apenas imagens (JPG, PNG ou WebP).";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
      input.value = "";
      return;
    }

    if (arquivo.size > FOTO_ALUNO_MAX_BYTES) {
      if (mensagemEl) {
        mensagemEl.textContent = "A imagem deve ter no máximo 500 KB.";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
      input.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = function () {
      salvarFotoStaff(sessao.email, leitor.result);
      atualizarPreviewFotoProfessor(sessao);

      if (mensagemEl) {
        mensagemEl.textContent = "Foto salva com sucesso!";
        mensagemEl.classList.add("painel__foto-mensagem--sucesso");
      }
    };

    leitor.onerror = function () {
      if (mensagemEl) {
        mensagemEl.textContent = "Não foi possível carregar a imagem. Tente novamente.";
        mensagemEl.classList.add("painel__foto-mensagem--erro");
      }
    };

    leitor.readAsDataURL(arquivo);
    input.value = "";
  });
}
