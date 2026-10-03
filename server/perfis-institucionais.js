const PERFIS_INSTITUCIONAIS = ["diretor", "contador", "secretaria", "coordenacao"];

const ORDEM_PERFIL = { diretor: 4, contador: 3, secretaria: 2, coordenacao: 2 };

/** Perfis com painel operacional (sem contabilidade/bancário). */
const PERFIS_OPERACIONAIS_SEM_FINANCEIRO = ["secretaria", "coordenacao"];

function perfilInstitucionalValido(perfil) {
  return PERFIS_INSTITUCIONAIS.includes(perfil);
}

function normalizarListaPerfis(perfis, perfilPrincipal) {
  const lista = [];
  if (Array.isArray(perfis)) {
    perfis.forEach(function (p) {
      if (perfilInstitucionalValido(p) && !lista.includes(p)) lista.push(p);
    });
  }
  if (perfilPrincipal && perfilInstitucionalValido(perfilPrincipal) && !lista.includes(perfilPrincipal)) {
    lista.push(perfilPrincipal);
  }
  if (!lista.length && perfilPrincipal) lista.push(perfilPrincipal);
  return lista.sort(function (a, b) {
    return (ORDEM_PERFIL[b] || 0) - (ORDEM_PERFIL[a] || 0);
  });
}

function perfilPrincipalDaLista(perfis) {
  const lista = normalizarListaPerfis(perfis, null);
  return lista[0] || "secretaria";
}

function parsePerfisJson(texto) {
  if (!texto) return [];
  try {
    const parsed = JSON.parse(texto);
    return normalizarListaPerfis(parsed, null);
  } catch (_erro) {
    return [];
  }
}

function perfisDoRegistro(registro) {
  if (!registro) return [];
  const doJson = parsePerfisJson(registro.perfis_json || registro.perfis_institucionais_json);
  if (doJson.length) return doJson;
  if (registro.perfil) return [registro.perfil];
  return [];
}

function usuarioTemAlgumPerfil(usuario, perfisAceitos) {
  const lista = perfisDoUsuario(usuario);
  return perfisAceitos.some(function (p) {
    return lista.includes(p);
  });
}

function perfisDoUsuario(usuario) {
  if (!usuario) return [];
  if (usuario.perfisInstitucionais && usuario.perfisInstitucionais.length) {
    return normalizarListaPerfis(usuario.perfisInstitucionais, usuario.perfil);
  }
  const doJson = parsePerfisJson(usuario.perfis_institucionais_json);
  if (doJson.length) return doJson;
  if (usuario.perfil) return [usuario.perfil];
  return [];
}

module.exports = {
  PERFIS_INSTITUCIONAIS,
  PERFIS_OPERACIONAIS_SEM_FINANCEIRO,
  perfilInstitucionalValido,
  normalizarListaPerfis,
  perfilPrincipalDaLista,
  parsePerfisJson,
  perfisDoRegistro,
  perfisDoUsuario,
  usuarioTemAlgumPerfil
};
