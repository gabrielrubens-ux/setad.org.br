/**
 * Programa Teológico — grade interativa (landing #programa)
 */
(function () {
  "use strict";

  function esc(texto) {
    var el = document.createElement("span");
    el.textContent = texto == null ? "" : String(texto);
    return el.innerHTML;
  }

  function init() {
    var root = document.querySelector("[data-programa-grade]");
    if (!root || !window.SETAD_GRADE_OFICIAL || !window.SETAD_GRADE_OFICIAL.medio) return;

    var grade = window.SETAD_GRADE_OFICIAL.medio;
    var estado = { categoriaId: grade.categorias[0] ? grade.categorias[0].id : "" };

    var intro = root.querySelector("[data-programa-grade-intro]");
    if (intro) {
      intro.textContent = grade.resumo;
    }

    var meta = root.querySelector("[data-programa-grade-meta]");
    if (meta) {
      meta.innerHTML =
        "<span><strong>" +
        esc(grade.carga) +
        "</strong></span>" +
        "<span><strong>" +
        esc(grade.duracao) +
        "</strong></span>" +
        "<span>" +
        esc(grade.aulas) +
        "</span>";
    }

    var tituloEl = root.querySelector("[data-programa-grade-titulo]");
    if (tituloEl) tituloEl.textContent = grade.titulo;

    var linkMat = root.querySelector("[data-programa-grade-matricula]");
    if (linkMat) linkMat.setAttribute("href", grade.matriculaUrl);

    var nav = root.querySelector("[data-programa-grade-nav]");
    var painel = root.querySelector("[data-programa-grade-painel]");
    if (!nav || !painel) return;

    function categoriaAtual() {
      for (var i = 0; i < grade.categorias.length; i++) {
        if (grade.categorias[i].id === estado.categoriaId) return grade.categorias[i];
      }
      return grade.categorias[0];
    }

    function renderNav() {
      nav.innerHTML = "";
      grade.categorias.forEach(function (cat) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "programa-grade__tab" + (cat.id === estado.categoriaId ? " is-active" : "");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", cat.id === estado.categoriaId ? "true" : "false");
        btn.setAttribute("id", "programa-tab-" + cat.id);
        btn.setAttribute("aria-controls", "programa-painel-" + cat.id);
        btn.dataset.categoriaId = cat.id;
        btn.innerHTML =
          '<span class="programa-grade__tab-titulo">' +
          esc(cat.titulo) +
          "</span>" +
          '<span class="programa-grade__tab-qtd">' +
          cat.disciplinas.length +
          "</span>";
        nav.appendChild(btn);
      });
    }

    function renderPainel() {
      var cat = categoriaAtual();
      if (!cat) return;

      painel.innerHTML =
        '<div class="programa-grade__detalhe" id="programa-painel-' +
        esc(cat.id) +
        '" role="tabpanel" aria-labelledby="programa-tab-' +
        esc(cat.id) +
        '">' +
        '<p class="programa-grade__detalhe-desc">' +
        esc(cat.descricao) +
        "</p>" +
        '<ul class="programa-grade__disciplinas">' +
        cat.disciplinas
          .map(function (nome) {
            return "<li>" + esc(nome) + "</li>";
          })
          .join("") +
        "</ul>" +
        "</div>";
    }

    function render() {
      renderNav();
      renderPainel();
    }

    nav.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".programa-grade__tab");
      if (!btn || !nav.contains(btn)) return;
      estado.categoriaId = btn.dataset.categoriaId;
      render();
    });

    nav.addEventListener("keydown", function (ev) {
      var tabs = Array.prototype.slice.call(nav.querySelectorAll(".programa-grade__tab"));
      var idx = tabs.findIndex(function (t) {
        return t.dataset.categoriaId === estado.categoriaId;
      });
      if (idx < 0) return;

      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        idx = (idx + 1) % tabs.length;
        tabs[idx].click();
        tabs[idx].focus();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        idx = (idx - 1 + tabs.length) % tabs.length;
        tabs[idx].click();
        tabs[idx].focus();
      }
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
