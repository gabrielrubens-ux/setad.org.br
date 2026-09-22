/**
 * Sincronização frontend ↔ API SETAD.
 * Mantém cache em memória e persiste alterações no servidor quando disponível.
 */
(function () {
  "use strict";

  var SYNC_DELAY_MS = 400;
  var syncTimers = {};

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
    lancamentosContabeis: null
  };

  function hydrate(snapshot) {
    cache.matriculas = snapshot.matriculas || [];
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
  }

  function scheduleSync(collection, apiPath) {
    if (!window.SETAD || !SETAD.apiAtivo) return;

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
