const { getMeta, setMeta, listJson, replaceJsonCollection, deleteJson, db } = require("./db");

const META_MANUTENCAO_MAR2026 = "contab_polos_manut_mar2026_guama_setade";

function matriculasDoPolo(poloId) {
  return listJson("matriculas").filter(function (m) {
    return (m.poloId || "") === poloId;
  });
}

function idsEMailsMatriculas(lista) {
  var ids = {};
  var emails = {};
  lista.forEach(function (m) {
    if (m.id) ids[m.id] = true;
    if (m.email) emails[String(m.email).toLowerCase()] = true;
  });
  return { ids: ids, emails: emails };
}

function removerPagamentosVinculados(ids, emails) {
  var pagamentos = listJson("pagamentos");
  var mantidos = [];
  var removidos = 0;
  pagamentos.forEach(function (p) {
    var porId = p.matriculaId && ids[p.matriculaId];
    var porEmail =
      p.alunoEmail && emails[String(p.alunoEmail).toLowerCase()];
    if (porId || porEmail) {
      removidos += 1;
      deleteJson("pagamentos", p.id);
      return;
    }
    mantidos.push(p);
  });
  return { removidos: removidos, mantidos: mantidos.length };
}

function removerLancamentosVinculados(idsMatricula) {
  var lancamentos = listJson("lancamentos_contabeis");
  var removidos = 0;
  lancamentos.forEach(function (l) {
    if (l.vinculoId && idsMatricula[l.vinculoId]) {
      removidos += 1;
      deleteJson("lancamentos_contabeis", l.id);
    }
  });
  return removidos;
}

function removerNotasVinculadas(idsMatricula) {
  var notas = listJson("notas_academicas");
  var removidos = 0;
  notas.forEach(function (n) {
    if (n.matriculaId && idsMatricula[n.matriculaId]) {
      removidos += 1;
      deleteJson("notas_academicas", n.id);
    }
  });
  return removidos;
}

function removerMatriculasPolo(poloId) {
  var alvo = matriculasDoPolo(poloId);
  var vinc = idsEMailsMatriculas(alvo);
  var pag = removerPagamentosVinculados(vinc.ids, vinc.emails);
  var lanc = removerLancamentosVinculados(vinc.ids);
  var notas = removerNotasVinculadas(vinc.ids);

  alvo.forEach(function (m) {
    deleteJson("matriculas", m.id);
    try {
      db.prepare("DELETE FROM users WHERE matricula_id = ?").run(m.id);
    } catch (_e) {
      /* ignore */
    }
  });

  return {
    poloId: poloId,
    matriculasRemovidas: alvo.length,
    pagamentosRemovidos: pag.removidos,
    lancamentosRemovidos: lanc,
    notasRemovidas: notas
  };
}

function zerarPagamentosPolo(poloId) {
  var alvo = matriculasDoPolo(poloId);
  var vinc = idsEMailsMatriculas(alvo);
  var pag = removerPagamentosVinculados(vinc.ids, vinc.emails);
  removerLancamentosVinculados(vinc.ids);
  return {
    poloId: poloId,
    matriculasMantidas: alvo.length,
    pagamentosRemovidos: pag.removidos
  };
}

/**
 * Uma vez por servidor (após deploy): limpa Guamá II e zera lançamentos do SETADE.
 */
function aplicarManutencaoContabPolosMar2026() {
  if (getMeta(META_MANUTENCAO_MAR2026) === "done") {
    return null;
  }

  var rGuama = removerMatriculasPolo("guama-ii");
  var rSetade = zerarPagamentosPolo("setade-sede");

  setMeta(
    META_MANUTENCAO_MAR2026,
    JSON.stringify({
      at: new Date().toISOString(),
      guama: rGuama,
      setade: rSetade
    })
  );

  console.log(
    "[SETAD] Manutenção contab polos: Guamá II —",
    rGuama.matriculasRemovidas,
    "matrícula(s) removida(s); SETADE —",
    rSetade.pagamentosRemovidos,
    "pagamento(s) zerado(s)."
  );

  return { guama: rGuama, setade: rSetade };
}

module.exports = {
  aplicarManutencaoContabPolosMar2026,
  removerMatriculasPolo,
  zerarPagamentosPolo
};
