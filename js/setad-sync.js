/**
 * Sincronização frontend ↔ API SETAD.
 * Mantém cache em memória e persiste alterações no servidor quando disponível.
 */
(function () {
  "use strict";

  var SYNC_DELAY_MS = 400;
  var PULL_INTERVAL_MS = 20000;
  var syncTimers = {};
  var pullTimer = null;
  var pullEmAndamento = null;
  var tempoRealIniciado = false;

  var MERGE_BEFORE_PUT = {
    matriculas: "matriculas",
    pagamentos: "pagamentos",
    notasAcademicas: "notas-academicas"
  };

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

  function uniaoRegistrosPorId(baseServidor, overlayLocal) {
    var porId = {};
    (baseServidor || []).forEach(function (reg) {
      if (reg && reg.id) porId[reg.id] = reg;
    });
    (overlayLocal || []).forEach(function (reg) {
      if (!reg || !reg.id) return;
      porId[reg.id] = Object.assign({}, porId[reg.id] || {}, reg);
    });
    return Object.values(porId);
  }

  function mesclarContagemAlterada(antes, depois) {
    if ((antes || []).length !== (depois || []).length) return true;
    var idsAntes = {};
    (antes || []).forEach(function (r) {
      if (r && r.id) idsAntes[r.id] = true;
    });
    for (var i = 0; i < (depois || []).length; i++) {
      var reg = depois[i];
      if (reg && reg.id && !idsAntes[reg.id]) return true;
    }
    return false;
  }

  function atualizarMetaContagemServidor(collection) {
    var metaKey = BLOCK_EMPTY_SYNC[collection];
    if (!metaKey) return;
    var lista = cache[collection] || [];
    cache[metaKey] = Math.max(cache[metaKey] || 0, lista.length);
  }

  function notificarDadosInstitucionaisAtualizados() {
    if (typeof window.dispatchEvent !== "function") return;
    window.dispatchEvent(new CustomEvent("setad-dados-atualizados"));
  }

  function sessaoDeveSincronizarTempoReal() {
    if (!SETAD.session || !SETAD.session.perfil) return false;
    var perfis = [
      "secretaria",
      "coordenacao",
      "diretor",
      "contador",
      "professor",
      "autorizado"
    ];
    return perfis.indexOf(SETAD.session.perfil) >= 0;
  }

  function pullColecoesInstitucionaisDoServidor(opcoes) {
    opcoes = opcoes || {};
    if (!window.SETAD || !SETAD.apiAtivo || !SETADApi) {
      return Promise.resolve(false);
    }
    if (!sessaoDeveSincronizarTempoReal() && !opcoes.forcar) {
      return Promise.resolve(false);
    }
    if (pullEmAndamento) return pullEmAndamento;

    pullEmAndamento = Promise.all([
      SETADApi.get("/matriculas"),
      SETADApi.get("/pagamentos"),
      SETADApi.get("/notas-academicas")
    ])
      .then(function (respostas) {
        var alterou = false;
        var matRes = respostas[0];
        var pagRes = respostas[1];
        var notasRes = respostas[2];

        if (matRes.ok && Array.isArray(matRes.items)) {
          var matAntes = cache.matriculas || [];
          var matMesclada = uniaoRegistrosPorId(matAntes, matRes.items);
          if (mesclarContagemAlterada(matAntes, matMesclada)) alterou = true;
          cache.matriculas = matMesclada;
          cache._matriculasHidratadas = true;
          cache._matriculasCountServidor = Math.max(
            cache._matriculasCountServidor || 0,
            matRes.items.length,
            matMesclada.length
          );
        }

        if (pagRes.ok && Array.isArray(pagRes.items)) {
          var pagAntes = cache.pagamentos || [];
          var pagMesclada = uniaoRegistrosPorId(pagAntes, pagRes.items);
          if (mesclarContagemAlterada(pagAntes, pagMesclada)) alterou = true;
          cache.pagamentos = pagMesclada;
          cache._pagamentosCountServidor = Math.max(
            cache._pagamentosCountServidor || 0,
            pagRes.items.length,
            pagMesclada.length
          );
        }

        if (notasRes.ok && Array.isArray(notasRes.items)) {
          var notasAntes = cache.notasAcademicas || [];
          var notasMesclada = uniaoRegistrosPorId(notasAntes, notasRes.items);
          if (mesclarContagemAlterada(notasAntes, notasMesclada)) alterou = true;
          cache.notasAcademicas = notasMesclada;
          cache._notasCountServidor = Math.max(
            cache._notasCountServidor || 0,
            notasRes.items.length,
            notasMesclada.length
          );
        }

        if (alterou || opcoes.notificar) {
          notificarDadosInstitucionaisAtualizados();
        }
        return alterou;
      })
      .catch(function (erro) {
        console.warn("[SETAD] Falha ao atualizar dados do servidor:", erro);
        return false;
      })
      .finally(function () {
        pullEmAndamento = null;
      });

    return pullEmAndamento;
  }

  function iniciarSincronizacaoTempoReal() {
    if (tempoRealIniciado || !SETAD.apiAtivo) return;
    if (!sessaoDeveSincronizarTempoReal()) return;
    tempoRealIniciado = true;

    pullColecoesInstitucionaisDoServidor({ notificar: true });

    if (pullTimer) clearInterval(pullTimer);
    pullTimer = setInterval(function () {
      pullColecoesInstitucionaisDoServidor({ notificar: true });
    }, PULL_INTERVAL_MS);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) {
        pullColecoesInstitucionaisDoServidor({ notificar: true });
      }
    });
  }

  function enviarColecaoComMerge(collection, apiPath, listaLocal) {
    listaLocal = listaLocal || [];
    return SETADApi.get("/" + apiPath)
      .then(function (resposta) {
        var servidor = resposta.ok && Array.isArray(resposta.items) ? resposta.items : [];
        var mesclada = uniaoRegistrosPorId(servidor, listaLocal);
        cache[collection] = mesclada;
        atualizarMetaContagemServidor(collection);
        return SETADApi.syncCollection(apiPath, mesclada);
      })
      .then(function () {
        notificarDadosInstitucionaisAtualizados();
      });
  }

  function sincronizarColecaoAgora(collection) {
    if (!window.SETAD || !SETAD.apiAtivo) return Promise.resolve(false);
    if (syncTimers[collection]) {
      clearTimeout(syncTimers[collection]);
      syncTimers[collection] = null;
    }
    var listaLocal = cache[collection] || [];
    var mergePath = MERGE_BEFORE_PUT[collection];
    if (mergePath) {
      return enviarColecaoComMerge(collection, mergePath, listaLocal).then(function () {
        return true;
      });
    }
    return Promise.resolve(false);
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
      var listaLocal = cache[collection] || [];
      var mergePath = MERGE_BEFORE_PUT[collection];

      if (mergePath) {
        enviarColecaoComMerge(collection, mergePath, listaLocal).catch(function (error) {
          console.warn("[SETAD] Falha ao sincronizar " + collection + ":", error);
        });
        return;
      }

      SETADApi.syncCollection(apiPath, listaLocal).catch(function (error) {
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
            iniciarSincronizacaoTempoReal();
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
    sincronizarColecaoAgora: sincronizarColecaoAgora,
    recuperarDadosLocais: recuperarDadosLocaisParaServidor,
    pullColecoesInstitucionais: pullColecoesInstitucionaisDoServidor,
    iniciarSincronizacaoTempoReal: iniciarSincronizacaoTempoReal,
    notificarDadosAtualizados: notificarDadosInstitucionaisAtualizados,
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
