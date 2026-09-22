/* Balão flutuante WhatsApp — 1º clique expande; 2º clique abre o chat */
(function () {
  const float = document.getElementById("wppFloat");
  const btn = document.getElementById("wppFloatBtn");
  if (!float || !btn) return;

  const WPP_URL = "https://wa.me/5591980852801";
  let expandido = false;

  function recolher() {
    if (!expandido) return;
    expandido = false;
    btn.classList.remove("wpp-float__btn--ativo");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Falar com o SETAD no WhatsApp");
  }

  btn.addEventListener("click", function (event) {
    event.stopPropagation();

    if (!expandido) {
      expandido = true;
      btn.classList.add("wpp-float__btn--ativo");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute(
        "aria-label",
        "QUERO ATENDIMENTO! Clique novamente para abrir o WhatsApp"
      );
      return;
    }

    if (typeof registrarInteresseWppSite === "function") {
      registrarInteresseWppSite();
    }

    window.open(WPP_URL, "_blank", "noopener,noreferrer");
    recolher();
  });

  document.addEventListener("click", function (event) {
    if (!float.contains(event.target)) {
      recolher();
    }
  });
})();
