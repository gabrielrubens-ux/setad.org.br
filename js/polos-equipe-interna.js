/* Cadastro de professores por polo — visível só para equipe institucional na página de polos. */

function inicializarEquipeInternaPolos() {
  var sessao = typeof obterSessaoEquipePedagogicaPolos === "function"
    ? obterSessaoEquipePedagogicaPolos()
    : null;
  var secao = document.getElementById("equipe-polos");
  if (!secao) return;

  if (!sessao) {
    secao.hidden = true;
    return;
  }

  secao.hidden = false;
  var perfil =
    typeof obterLabelPerfil === "function"
      ? obterLabelPerfil(sessao.perfil)
      : sessao.perfil || "Equipe";

  var tituloPerfil = document.getElementById("polosEquipePerfil");
  if (tituloPerfil) {
    tituloPerfil.textContent = perfil + " — " + (sessao.nome || "SETAD");
  }

  if (secao.dataset.inicializado === "1") {
    renderizarListaProfessoresPolos();
    return;
  }
  secao.dataset.inicializado = "1";

  var selectPolo = document.getElementById("polosProfPolo");
  var selectFiltro = document.getElementById("polosProfFiltroPolo");
  if (selectPolo) popularSelectPolosSetad(selectPolo, "");
  if (selectFiltro) {
    var polosFiltro = listarPolosSetadCatalogo();
    selectFiltro.innerHTML =
      '<option value="">Todos os polos</option>' +
      polosFiltro
        .map(function (polo) {
          return (
            '<option value="' +
            escaparHtml(polo.id) +
            '">' +
            escaparHtml(polo.nome) +
            "</option>"
          );
        })
        .join("");
    selectFiltro.addEventListener("change", renderizarListaProfessoresPolos);
  }

  var form = document.getElementById("formProfessorPolo");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = document.getElementById("polosProfMensagem");
      if (msg) {
        msg.className = "form-mensagem";
        msg.textContent = "";
      }

      var salas = [];
      form.querySelectorAll('input[name="polosProfSala"]:checked').forEach(function (cb) {
        salas.push(cb.value);
      });

      var resultado = cadastrarProfessorPolo(
        {
          poloId: selectPolo ? selectPolo.value : "",
          nome: document.getElementById("polosProfNome").value,
          email: document.getElementById("polosProfEmail").value,
          telefone: document.getElementById("polosProfTelefone").value,
          salasTurma: salas,
          observacoes: document.getElementById("polosProfObs").value
        },
        sessao
      );

      if (!resultado.ok) {
        if (msg) {
          msg.className = "form-mensagem form-mensagem--erro visible";
          msg.textContent = resultado.erro;
        }
        return;
      }

      form.reset();
      if (selectFiltro && selectPolo && selectPolo.value) {
        selectFiltro.value = selectPolo.value;
      }
      renderizarListaProfessoresPolos();
      if (msg) {
        msg.className = "form-mensagem form-mensagem--sucesso visible";
        msg.textContent = "Professor cadastrado no polo com sucesso.";
      }
    });
  }

  var btnToggle = document.getElementById("polosEquipeToggle");
  var painel = document.getElementById("polosEquipePainel");
  if (btnToggle && painel) {
    btnToggle.addEventListener("click", function () {
      var aberto = painel.hidden === false;
      painel.hidden = aberto;
      btnToggle.setAttribute("aria-expanded", aberto ? "false" : "true");
      btnToggle.textContent = aberto
        ? "Abrir cadastro de professores nos polos"
        : "Recolher painel";
    });
  }

  renderizarListaProfessoresPolos();

  if (window.location.hash === "#equipe-polos" && painel && btnToggle) {
    painel.hidden = false;
    btnToggle.setAttribute("aria-expanded", "true");
    btnToggle.textContent = "Recolher painel";
    secao.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderizarListaProfessoresPolos() {
  var listaEl = document.getElementById("polosProfLista");
  var filtro = document.getElementById("polosProfFiltroPolo");
  if (!listaEl) return;

  var poloId = filtro ? filtro.value : "";
  var professores = listarProfessoresPorPolo(poloId);

  if (professores.length === 0) {
    listaEl.innerHTML =
      '<p class="polos-equipe__vazio">Nenhum professor cadastrado' +
      (poloId ? " neste polo." : " ainda.") +
      "</p>";
    return;
  }

  listaEl.innerHTML =
    '<div class="polos-equipe__cards">' +
    professores
      .map(function (prof) {
        var salas =
          prof.salasTurma && prof.salasTurma.length
            ? prof.salasTurma
                .map(function (id) {
                  return obterLabelSalaTurma(id);
                })
                .join(", ")
            : "Todas as salas do polo";
        var contato = [];
        if (prof.email) contato.push(escaparHtml(prof.email));
        if (prof.telefone) contato.push(escaparHtml(prof.telefone));

        return (
          '<article class="polos-equipe__card">' +
          '<div class="polos-equipe__card-topo">' +
          "<h3>" +
          escaparHtml(prof.nome) +
          "</h3>" +
          '<button type="button" class="btn btn--link btn--sm polos-equipe__remover" data-prof-id="' +
          escaparHtml(prof.id) +
          '">Remover</button>' +
          "</div>" +
          '<p class="polos-equipe__polo">' +
          escaparHtml(prof.poloNome || obterNomePoloSetad(prof.poloId)) +
          "</p>" +
          '<p class="polos-equipe__salas"><strong>Salas:</strong> ' +
          escaparHtml(salas) +
          "</p>" +
          (contato.length
            ? '<p class="polos-equipe__contato">' + contato.join(" · ") + "</p>"
            : "") +
          (prof.observacoes
            ? '<p class="polos-equipe__obs">' + escaparHtml(prof.observacoes) + "</p>"
            : "") +
          "</article>"
        );
      })
      .join("") +
    "</div>";

  listaEl.querySelectorAll("[data-prof-id]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-prof-id");
      if (!id) return;
      if (!window.confirm("Remover este cadastro de professor do polo?")) return;
      removerProfessorPolo(id);
      renderizarListaProfessoresPolos();
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  if (typeof configurarDirecionamentoPresencialInterno === "function") {
    /* não chama aqui — só na secretaria */
  }
  inicializarEquipeInternaPolos();
});
