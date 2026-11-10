/**
 * Contato institucional SETAD — fonte única para telefone/WhatsApp no site.
 */
(function (g) {
  "use strict";

  /* WhatsApp Business “Setad.” — link correto: 559180582801 (não confundir com 5591980852801). */
  var telefoneE164 = "+559180582801";
  var telefoneExibicao = "+55 91 98058-2801";
  var whatsappNumero = "559180582801";
  var mensagemAtendimentoPadrao =
    "Olá! Vim pelo site do SETAD e gostaria de atendimento.";

  /**
   * Apenas dígitos, formato internacional para wa.me/api.whatsapp (sem "+" na URL).
   */
  function normalizarNumeroWhatsapp(entrada) {
    if (entrada === null || entrada === undefined) return "";
    var numeros = String(entrada).replace(/\D/g, "");
    if (!numeros) return "";

    if (numeros.indexOf("00") === 0) {
      numeros = numeros.slice(2);
    }

    if (numeros === "91980582801" || numeros === "5591980582801") {
      return whatsappNumero;
    }

    if (numeros.length === 11 && numeros.indexOf("55") !== 0) {
      return "55" + numeros;
    }

    if (numeros.length === 10) {
      var ddd = numeros.slice(0, 2);
      var local = numeros.slice(2);
      if (local.length === 8) {
        return "55" + ddd + "9" + local;
      }
    }

    if (numeros.indexOf("55") === 0 && numeros.length >= 12 && numeros.length <= 13) {
      return numeros;
    }

    return numeros;
  }

  function montarUrlWhatsapp(numero, texto) {
    var alvo = normalizarNumeroWhatsapp(numero) || whatsappNumero;
    var url =
      "https://api.whatsapp.com/send?phone=" +
      encodeURIComponent(alvo) +
      "&type=phone_number&app_absent=0";
    if (texto && String(texto).trim()) {
      url += "&text=" + encodeURIComponent(String(texto).trim());
    }
    return url;
  }

  function montarUrlWhatsappCurta(numero, texto) {
    var alvo = normalizarNumeroWhatsapp(numero) || whatsappNumero;
    var url = "https://wa.me/" + alvo;
    if (texto && String(texto).trim()) {
      url += "?text=" + encodeURIComponent(String(texto).trim());
    }
    return url;
  }

  function abrirWhatsappInstitucional(texto, numeroOpcional) {
    var url = montarUrlWhatsapp(numeroOpcional || whatsappNumero, texto);
    var link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  var contato = {
    telefone: telefoneE164,
    telefoneExibicao: telefoneExibicao,
    whatsappNumero: whatsappNumero,
    whatsappUrl: montarUrlWhatsapp(whatsappNumero),
    whatsappUrlCurta: montarUrlWhatsappCurta(whatsappNumero),
    whatsappUrlAtendimento: montarUrlWhatsapp(
      whatsappNumero,
      mensagemAtendimentoPadrao
    ),
    mensagemAtendimentoPadrao: mensagemAtendimentoPadrao,
    telUrl: "tel:" + telefoneE164,
    email: "recepcao@setad.org.br",
    normalizarNumeroWhatsapp: normalizarNumeroWhatsapp,
    montarUrlWhatsapp: montarUrlWhatsapp,
    montarUrlWhatsappCurta: montarUrlWhatsappCurta,
    abrirWhatsappInstitucional: abrirWhatsappInstitucional
  };

  g.SETAD_CONTATO_INSTITUCIONAL = contato;
})(typeof window !== "undefined" ? window : globalThis);
