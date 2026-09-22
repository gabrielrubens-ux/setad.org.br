/* ============================================================
   trabalhos.js — Upload e listagem de trabalhos
   Alunos enviam arquivos; professores visualizam entregas.
   ============================================================ */

/**
 * Renderiza a aba de trabalhos do aluno com formulário de upload.
 */
function renderizarTrabalhosAluno(sessao) {
  const container = document.getElementById("trabalhosAlunoContainer");
  if (!container) return;

  const trabalhos = obterTrabalhosAtribuidos();
  const entregas = obterEntregas();

  let html = `
    <div class="upload-box">
      <h3 class="upload-box__title">Enviar trabalho</h3>
      <p class="upload-box__desc">
        Selecione o trabalho e anexe seu arquivo (PDF, DOC ou DOCX — máx. 2 MB).
      </p>
      <form id="formUploadTrabalho" class="upload-form">
        <div class="form-row">
          <div class="form-group">
            <label for="trabalhoSelect">Trabalho</label>
            <select id="trabalhoSelect" required>
              <option value="">Selecione...</option>
              ${trabalhos.map(function (t) {
                const entrega = obterEntregaDoAluno(t.id, sessao.email);
                if (entrega) return "";
                return `<option value="${t.id}">${t.titulo} — ${t.disciplina}</option>`;
              }).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="arquivoTrabalho">Arquivo</label>
            <input type="file" id="arquivoTrabalho" accept=".pdf,.doc,.docx" required>
          </div>
        </div>
        <button type="submit" class="btn btn--primary">Enviar trabalho</button>
        <div id="uploadMensagem" class="form-mensagem" role="status"></div>
      </form>
    </div>
    <h3 class="lista-titulo">Meus trabalhos</h3>
    <div class="trabalhos-list">
  `;

  trabalhos.forEach(function (trabalho) {
    const entrega = entregas.find(function (e) {
      return e.trabalhoId === trabalho.id && e.alunoEmail === sessao.email;
    });

    const status = obterStatusTrabalhoAluno(trabalho, entrega);
    const statusLabel = status === "entregue" ? "Entregue" : obterLabelStatus(status);

    html += `
      <article class="trabalho-item">
        <div class="trabalho-item__info">
          <h3>${trabalho.titulo}</h3>
          <p>${trabalho.disciplina} — Prazo: ${formatarData(trabalho.prazo + "T12:00:00")}</p>
          ${entrega ? `
            <p class="trabalho-item__arquivo">
              Arquivo: ${entrega.arquivoNome} (${formatarTamanhoArquivo(entrega.arquivoTamanho)})
              — Enviado em ${formatarData(entrega.dataEnvio)}
            </p>
          ` : ""}
        </div>
        <span class="trabalho-item__status ${obterClasseStatus(status)}">${statusLabel}</span>
      </article>
    `;
  });

  html += "</div>";
  container.innerHTML = html;

  configurarUploadTrabalho(sessao);
}

/**
 * Configura o envio do formulário de upload do aluno.
 */
function configurarUploadTrabalho(sessao) {
  const form = document.getElementById("formUploadTrabalho");
  const mensagemEl = document.getElementById("uploadMensagem");

  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const trabalhoId = document.getElementById("trabalhoSelect").value;
    const arquivoInput = document.getElementById("arquivoTrabalho");
    const arquivo = arquivoInput.files[0];

    if (!trabalhoId || !arquivo) return;

    if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Arquivo muito grande. O limite é 2 MB.";
      return;
    }

    const extensoesPermitidas = [".pdf", ".doc", ".docx"];
    const nomeLower = arquivo.name.toLowerCase();
    const extensaoValida = extensoesPermitidas.some(function (ext) {
      return nomeLower.endsWith(ext);
    });

    if (!extensaoValida) {
      mensagemEl.className = "form-mensagem form-mensagem--erro visible";
      mensagemEl.textContent = "Formato não permitido. Use PDF, DOC ou DOCX.";
      return;
    }

    const entregas = obterEntregas();
    const novaEntrega = {
      id: gerarId("ent"),
      trabalhoId: trabalhoId,
      alunoEmail: sessao.email,
      alunoNome: sessao.nome,
      arquivoNome: arquivo.name,
      arquivoTipo: arquivo.type,
      arquivoTamanho: arquivo.size,
      dataEnvio: new Date().toISOString()
    };

    entregas.push(novaEntrega);
    salvarEntregas(entregas);

    mensagemEl.className = "form-mensagem form-mensagem--sucesso visible";
    mensagemEl.textContent = "Trabalho enviado com sucesso!";

    setTimeout(function () {
      renderizarTrabalhosAluno(sessao);
    }, 1200);
  });
}

/**
 * Renderiza entregas recebidas — visão do professor/staff.
 */
function renderizarTrabalhosProfessor() {
  const container = document.getElementById("trabalhosProfessorContainer");
  if (!container) return;

  const trabalhos = obterTrabalhosAtribuidos();
  const entregas = obterEntregas();

  let html = `<div class="trabalhos-list">`;

  if (entregas.length === 0) {
    html += `<p class="lista-vazia">Nenhuma entrega recebida ainda.</p>`;
  }

  entregas.slice().reverse().forEach(function (entrega) {
    const trabalho = trabalhos.find(function (t) { return t.id === entrega.trabalhoId; });
    if (!trabalho) return;

    html += `
      <article class="trabalho-item">
        <div class="trabalho-item__info">
          <h3>${trabalho.titulo}</h3>
          <p>${trabalho.disciplina} — Aluno: ${entrega.alunoNome}</p>
          <p class="trabalho-item__arquivo">
            ${entrega.arquivoNome} (${formatarTamanhoArquivo(entrega.arquivoTamanho)})
            — ${formatarData(entrega.dataEnvio)}
          </p>
        </div>
        <span class="trabalho-item__status status--entregue">Recebido</span>
      </article>
    `;
  });

  html += `</div>`;

  html += `<h3 class="lista-titulo lista-titulo--spaced">Resumo por trabalho</h3><div class="trabalhos-list">`;

  trabalhos.forEach(function (trabalho) {
    const totalEntregas = entregas.filter(function (e) {
      return e.trabalhoId === trabalho.id;
    }).length;

    html += `
      <article class="trabalho-item">
        <div class="trabalho-item__info">
          <h3>${trabalho.titulo}</h3>
          <p>${trabalho.disciplina} — Prazo: ${formatarData(trabalho.prazo + "T12:00:00")}</p>
        </div>
        <span class="trabalho-item__status ${totalEntregas > 0 ? "status--avaliando" : "status--pendente"}">
          ${totalEntregas} entrega(s)
        </span>
      </article>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}
