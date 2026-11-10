/* Balão flutuante WhatsApp — 1º clique expande; 2º clique abre o chat */
(function () {
  const float = document.getElementById("wppFloat");
  const btn = document.getElementById("wppFloatBtn");
  if (!float || !btn) return;

  function obterUrlAtendimento() {
    var inst = window.SETAD_CONTATO_INSTITUCIONAL;
    if (inst) {
      if (typeof inst.montarUrlWhatsapp === "function") {
        return inst.montarUrlWhatsapp(
          inst.whatsappNumero,
          inst.mensagemAtendimentoPadrao
        );
      }
      if (inst.whatsappUrlAtendimento) {
        return inst.whatsappUrlAtendimento;
      }
      if (inst.whatsappUrl) {
        return inst.whatsappUrl;
      }
    }
    return (
      "https://api.whatsapp.com/send?phone=559180582801&type=phone_number&app_absent=0" +
      "&text=" +
      encodeURIComponent("Olá! Vim pelo site do SETAD e gostaria de atendimento.")
    );
  }

  function abrirWhatsapp() {
    var inst = window.SETAD_CONTATO_INSTITUCIONAL;
    if (inst && typeof inst.abrirWhatsappInstitucional === "function") {
      inst.abrirWhatsappInstitucional(inst.mensagemAtendimentoPadrao);
      return;
    }

    var link = document.createElement("a");
    link.href = obterUrlAtendimento();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

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

    abrirWhatsapp();
    recolher();
  });

  document.addEventListener("click", function (event) {
    if (!float.contains(event.target)) {
      recolher();
    }
  });
})();
