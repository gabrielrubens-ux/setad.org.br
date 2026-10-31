/**
 * Sincronização frontend ↔ API SETAD.
 * Mantém cache em memória e persiste alterações no servidor quando disponível.
 */
(function () {
  "use strict";

  var SYNC_DELAY_MS = 400;
  var syncTimers = {};

  var BLOCK_EMPTY_SYNC = {
    matriculas: "_matriculasCountServidor",
    pagamentos: "_pagamentosCountServidor",
    notasAcademicas: "_notasCountServidor"
  };

  var cache = {
    matriculas: null,
    livros: null,
    entregas: null,
    pagamentos: null,
    funcionarios: null,
    folha: null,
    instituicoes: null,
    exclusoesSolicitacoes: null,
    exclusoesAuditoria: null,
    exclusoesEmails: null,
    wppConversas: null,
    fotosAlunos: null,
    fotosStaff: null,
    contasAlunos: null,
    verificacoesPendentes: null,
    relatoriosContabeis: null,
    lancamentosContabeis: null,
    notasAcademicas: null
  };

  function hydrate(snapshot) {
    cache.matriculas = snapshot.matriculas || [];
    cache._matriculasHidratadas = true;
    cache._matriculasCountServidor = (snapshot.matriculas || []).length;
    cache.livros = snapshot.livros || [];
    cache.entregas = snapshot.entregas || [];
    cache.pagamentos = snapshot.pagamentos || [];
    cache.funcionarios = snapshot.funcionarios || [];
    cache.folha = snapshot.folha || [];
    cache.instituicoes = snapshot.instituicoes || [];
    cache.exclusoesSolicitacoes = snapshot.exclusoesSolicitacoes || [];
    cache.exclusoesAuditoria = snapshot.exclusoesAuditoria || [];
    cache.exclusoesEmails = snapshot.exclusoesEmails || [];
    cache.wppConversas = snapshot.wppConversas || [];
    cache.fotosAlunos = snapshot.fotosAlunos || {};
    cache.fotosStaff = snapshot.fotosStaff || {};
    cache.verificacoesPendentes = snapshot.verificacoesPendentes || [];
    cache.relatoriosContabeis = snapshot.relatoriosContabeis || [];
    cache.lancamentosContabeis = snapshot.lancamentosContabeis || [];
    cache.notasAcademicas = snapshot.notasAcademicas || [];
    cache._pagamentosCountServidor = (snapshot.pagamentos || []).length;
    cache._notasCountServidor = (snapshot.notasAcademicas || []).length;
  }

  function lerJsonLocalStorage(chave) {
    try {
      var raw = localStorage.getItem(chave);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (erro) {
      return [];
    }
  }

  function recuperarDadosLocaisParaServidor() {
    if (!SETADApi || !SETAD.session) {
      return Promise.resolve();
    }

    var jobs = [];

    if ((cache.matriculas || []).length === 0) {
      var matLocal = lerJsonLocalStorage("setad_matriculas_alunos");
      if (matLocal.length > 0 && SETADApi.restaurarMergeMatriculas) {
        jobs.push(
          SETADApi.restaurarMergeMatriculas(matLocal).then(function (resposta) {
            if (!resposta.ok) return;
            console.log(
              "[SETAD] Matrículas do navegador enviadas ao servidor:",
              resposta.total
            );
            return SETADApi.get("/matriculas").then(function (lista) {
              if (lista.ok) {
                cache.matriculas = lista.items || [];
                cache._matriculasCountServidor = cache.matriculas.length;
              }
            });
          })
        );
      }
    }

    if ((cache.pagamentos || []).length === 0) {
      var pagLocal = lerJsonLocalStorage("setad_pagamentos_alunos");
      if (pagLocal.length > 0 && SETADApi.restaurarMergePagamentos) {
        jobs.push(
          SETADApi.restaurarMergePagamentos(pagLocal).then(function (resposta) {
            if (!resposta.ok) return;
            console.log(
              "[SETAD] Pagamentos do navegador enviados ao servidor:",
              resposta.total
            );
            return SETADApi.get("/pagamentos").then(function (lista) {
              if (lista.ok) {
                cache.pagamentos = lista.items || [];
                cache._pagamentosCountServidor = cache.pagamentos.length;
              }
            });
          })
        );
      }
    }

    if ((cache.notasAcademicas || []).length === 0) {
      var notasLocal = lerJsonLocalStorage("setad_notas_academicas");
      if (notasLocal.length > 0 && SETADApi.restaurarMergeNotasAcademicas) {
        jobs.push(
          SETADApi.restaurarMergeNotasAcademicas(notasLocal).then(function (resposta) {
            if (!resposta.ok) return;
            console.log(
              "[SETAD] Notas do navegador enviadas ao servidor:",
              resposta.total
            );
            return SETADApi.get("/notas-academicas").then(function (lista) {
              if (lista.ok) {
                cache.notasAcademicas = lista.items || [];
                cache._notasCountServidor = cache.notasAcademicas.length;
              }
            });
          })
        );
      }
    }

    return Promise.all(jobs);
  }

  function scheduleSync(collection, apiPath) {
    if (!window.SETAD || !SETAD.apiAtivo) return;

    var metaKey = BLOCK_EMPTY_SYNC[collection];
    if (metaKey) {
      var listaProtegida = cache[collection] || [];
      var totalServidor = cache[metaKey] || 0;
      if (listaProtegida.length === 0 && totalServidor > 0) {
        console.warn(
          "[SETAD] Bloqueada sincronização vazia de " + collection + " com o servidor."
        );
        return;
      }
    }

    if (collection === "matriculas") {
      var lista = cache[collection] || [];
      if (
        lista.length === 0 &&
        cache._matriculasHidratadas &&
        cache._matriculasCountServidor > 0
      ) {
        console.warn("[SETAD] Bloqueada sincronização de matrículas vazia com o servidor.");
        return;
      }
    }

    if (syncTimers[collection]) {
      clearTimeout(syncTimers[collection]);
    }

    syncTimers[collection] = setTimeout(function () {
      SETADApi.syncCollection(apiPath, cache[collection] || [])
        .catch(function (error) {
          console.warn("[SETAD] Falha ao sincronizar " + collection + ":", error);
        });
    }, SYNC_DELAY_MS);
  }

  function init() {
    if (typeof SETADApi === "undefined") {
      SETAD.apiAtivo = false;
      return Promise.resolve(false);
    }

    if (window.SETADNative && SETADNative.isNative() && !SETADNative.getApiBase()) {
      console.warn("[SETAD] App nativo sem API_BASE configurada em js/app-config.js");
      SETAD.apiAtivo = false;
      return Promise.resolve(false);
    }

    return SETADApi.health().then(function (health) {
      if (!health || !health.ok) {
        SETAD.apiAtivo = false;
        return false;
      }

      SETAD.apiAtivo = true;

      return SETADApi.me().then(function (sessionData) {
        if (sessionData.ok && sessionData.user) {
          SETAD.session = sessionData.user;
          return SETADApi.snapshot().then(function (snap) {
            if (snap.ok) hydrate(snap.snapshot);
            return recuperarDadosLocaisParaServidor();
          }).then(function () {
            return true;
          });
        }
        return true;
      }).catch(function () {
        return true;
      });
    }).catch(function () {
      SETAD.apiAtivo = false;
      return false;
    });
  }

  window.SETAD = {
    apiAtivo: false,
    session: null,
    ready: null,
    cache: cache,
    init: init,
    hydrate: hydrate,
    scheduleSync: scheduleSync,
    recuperarDadosLocais: recuperarDadosLocaisParaServidor,
    setSession: function (user) {
      SETAD.session = user;
    },
    clearSession: function () {
      SETAD.session = null;
    },
    getCache: function (key) {
      return cache[key];
    },
    setCache: function (key, value, apiPath) {
      cache[key] = value;
      if (apiPath) scheduleSync(key, apiPath);
    }
  };

  SETAD.ready = init();
})();
