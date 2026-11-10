/**
 * Contato institucional SETAD — fonte única para telefone/WhatsApp no site.
 */
(function (g) {
  "use strict";

  var telefoneE164 = "+5591980852801";
  var whatsappNumero = "5591980852801";

  g.SETAD_CONTATO_INSTITUCIONAL = {
    telefone: telefoneE164,
    telefoneExibicao: telefoneE164,
    whatsappNumero: whatsappNumero,
    whatsappUrl: "https://wa.me/" + whatsappNumero,
    telUrl: "tel:" + telefoneE164,
    email: "recepcao@setad.org.br"
  };
})(typeof window !== "undefined" ? window : globalThis);
