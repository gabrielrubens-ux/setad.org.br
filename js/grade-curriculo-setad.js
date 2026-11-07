/**
 * Grade oficial SETAD — fonte para site (Programa Teológico) e referência acadêmica.
 * Manter alinhado com MATERIAIS_NOTAS_POR_MODULO.medio em js/notas-academicas.js
 */
(function () {
  "use strict";

  var GRADE_MEDIO = {
    id: "medio",
    titulo: "Curso Médio em Teologia e Ciências Bíblicas",
    resumo:
      "Formação ministerial presencial com base bíblica, doutrina, prática pastoral e ferramentas de estudo.",
    duracao: "18 meses",
    carga: "29 disciplinas",
    aulas: "Sábados, 14h30",
    matriculaUrl: "matricula/?modulo=medio",
    categorias: [
      {
        id: "biblia",
        titulo: "Bíblia e interpretação",
        descricao: "Fundamentos para ler, contextualizar e ensinar as Escrituras.",
        disciplinas: [
          "Bibliologia",
          "Hermenêutica",
          "Panorama do Antigo Testamento",
          "Panorama do Novo Testamento",
          "Geografia bíblica",
          "Arqueologia bíblica",
          "Noções de exegese bíblica",
        ],
      },
      {
        id: "doutrina",
        titulo: "Teologia sistemática",
        descricao: "Doutrinas centrais da fé cristã organizadas de forma didática.",
        disciplinas: [
          "Teontologia",
          "Cristologia",
          "Pneumatologia",
          "Antropologia bíblica",
          "Hamartiologia",
          "Soteriologia",
          "Eclesiologia",
          "Angelologia",
          "Escatologia",
          "Ética cristã",
        ],
      },
      {
        id: "ministerio",
        titulo: "Ministério e igreja",
        descricao: "Pastoral, pregação, liderança e vida congregacional.",
        disciplinas: [
          "Aconselhamento pastoral",
          "Homilética",
          "Teologia pastoral",
          "Evangelismo e discipulado",
          "Liderança eclesiástica",
          "Implantação de novas igrejas",
          "Direito eclesial, ética e cidadania",
          "Didática e metodologia do ensino cristão",
        ],
      },
      {
        id: "historia",
        titulo: "História",
        descricao: "Panorama da caminhada do cristianismo.",
        disciplinas: ["História do cristianismo"],
      },
      {
        id: "idiomas",
        titulo: "Línguas e manuscritos",
        descricao: "Introdução ao estudo dos textos bíblicos originais.",
        disciplinas: [
          "Noções de hebraico bíblico",
          "Noções de grego bíblico",
          "Manuscritologia e tradução da Bíblia",
        ],
      },
    ],
  };

  function listaPlanaMedio() {
    var lista = [];
    GRADE_MEDIO.categorias.forEach(function (cat) {
      cat.disciplinas.forEach(function (nome) {
        lista.push(nome);
      });
    });
    return lista;
  }

  window.SETAD_GRADE_OFICIAL = {
    medio: GRADE_MEDIO,
    listarDisciplinasMedio: listaPlanaMedio,
  };
})();
