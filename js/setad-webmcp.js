/**
 * WebMCP — ferramentas registradas para agentes no navegador (quando suportado).
 */
(function (global) {
  "use strict";

  function textoResumoSetad() {
    return (
      "SETAD — Seminário Teológico (setad.org.br). Formação teológica em Belém/PA e polos. " +
      "Matrícula: /matricula/ · Contato: recepcao@setad.org.br · Tel: +55 91 98085-2801. " +
      "Markdown: /index.md · llms.txt: /llms.txt"
    );
  }

  function registrarFerramentasWebMcp() {
    var mc = global.navigator && global.navigator.modelContext;
    if (!mc || typeof mc.registerTool !== "function") return;

    mc.registerTool({
      name: "setad_institucional_resumo",
      description:
        "Resumo institucional do SETAD: cursos, matrícula, contato e URLs públicas para agentes.",
      inputSchema: {
        type: "object",
        properties: {
          topico: {
            type: "string",
            description: "Opcional: matricula, polos, contato ou geral"
          }
        }
      },
      execute: async function (input) {
        var topico = input && input.topico ? String(input.topico).toLowerCase() : "geral";
        var texto = textoResumoSetad();
        if (topico === "matricula") {
          texto += " Matrícula online: https://setad.org.br/matricula/";
        } else if (topico === "polos") {
          texto += " Polos: https://setad.org.br/polos/";
        } else if (topico === "contato") {
          texto += " Contato: https://setad.org.br/contato.html";
        }
        return { content: [{ type: "text", text: texto }] };
      }
    });

    mc.registerTool({
      name: "setad_buscar_pagina_markdown",
      description: "Retorna a URL Markdown pública da home do SETAD.",
      inputSchema: { type: "object", properties: {} },
      execute: async function () {
        return {
          content: [
            {
              type: "text",
              text: "https://setad.org.br/index.md (envie Accept: text/markdown em GET /)"
            }
          ]
        };
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registrarFerramentasWebMcp);
  } else {
    registrarFerramentasWebMcp();
  }
})(window);
