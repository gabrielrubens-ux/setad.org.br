/* Hub de áreas institucionais (direção, contabilidade, secretaria, coordenação). */

const STORAGE_AREA_INSTITUCIONAL = "setad_area_institucional_ativa";

const AREAS_INSTITUCIONAIS = {
  diretor: {
    perfil: "diretor",
    titulo: "Direção",
    descricao: "Visão geral acadêmica e institucional, matrículas, equipe e aprovações.",
    redirect: "painel-diretor.html"
  },
  contador: {
    perfil: "contador",
    titulo: "Contabilidade",
    descricao: "Financeiro, DRE, folha, instituições bancárias e pagamentos dos alunos.",
    redirect: "painel-contador.html"
  },
  secretaria: {
    perfil: "secretaria",
    titulo: "Secretaria",
    descricao: "Cadastro presencial, matrículas, boletos e WhatsApp do seminário.",
    redirect: "painel-secretaria.html"
  },
  coordenacao: {
    perfil: "coordenacao",
    titulo: "Coordenação pedagógica",
    descricao: "Matrículas e atendimento pedagógico — sem dados bancários ou valores financeiros.",
    redirect: "painel-coordenacao.html"
  }
};

const ORDEM_AREAS_INSTITUCIONAIS = ["diretor", "contador", "secretaria", "coordenacao"];

function listarAreasInstitucionaisPermitidas(sessao) {
  return ORDEM_AREAS_INSTITUCIONAIS.filter(function (perfil) {
    return sessaoTemPerfilInstitucional(sessao, perfil);
  });
}

function definirAreaInstitucionalAtiva(perfil) {
  if (!perfil) return;
  try {
    sessionStorage.setItem(STORAGE_AREA_INSTITUCIONAL, perfil);
  } catch (_erro) {
    /* ignore */
  }
}

function obterAreaInstitucionalAtiva() {
  try {
    return sessionStorage.getItem(STORAGE_AREA_INSTITUCIONAL) || "";
  } catch (_erro) {
    return "";
  }
}

function limparAreaInstitucionalAtiva() {
  try {
    sessionStorage.removeItem(STORAGE_AREA_INSTITUCIONAL);
  } catch (_erro) {
    /* ignore */
  }
}

function redirectDaAreaInstitucional(perfil) {
  const cfg = AREAS_INSTITUCIONAIS[perfil];
  return cfg ? cfg.redirect : "login-direcao.html";
}

/**
 * Após login API: redireciona para o painel ou para a tela de escolha de área.
 * areaPreferida: perfil sugerido pela aba do login (diretor, contador, …).
 */
function redirecionarAposLoginInstitucional(user, areaPreferida) {
  const areas = listarAreasInstitucionaisPermitidas(user);
  if (!areas.length) {
    return false;
  }

  if (areas.length === 1) {
    definirAreaInstitucionalAtiva(areas[0]);
    window.location.href = redirectDaAreaInstitucional(areas[0]);
    return true;
  }

  if (areaPreferida && areas.indexOf(areaPreferida) !== -1 && areas.length === 1) {
    definirAreaInstitucionalAtiva(areaPreferida);
    window.location.href = redirectDaAreaInstitucional(areaPreferida);
    return true;
  }

  window.location.href = "escolher-area-institucional.html";
  return true;
}

function exigirAreaInstitucionalAtiva(perfilRequerido) {
  const ativa = obterAreaInstitucionalAtiva();
  if (ativa === perfilRequerido) {
    return true;
  }
  const sessao =
    typeof window !== "undefined" && window.SETAD && window.SETAD.session
      ? window.SETAD.session
      : null;
  const areas = sessao ? listarAreasInstitucionaisPermitidas(sessao) : [];
  if (areas.length > 1) {
    window.location.href = "escolher-area-institucional.html";
    return false;
  }
  if (areas.length === 1 && areas[0] === perfilRequerido) {
    definirAreaInstitucionalAtiva(perfilRequerido);
    return true;
  }
  window.location.href = "escolher-area-institucional.html";
  return false;
}

function configurarHubAreasInstitucionais() {
  const container = document.getElementById("hubAreasInstitucionais");
  if (!container) return;

  const sessao =
    authApiAtivo() && window.SETAD && window.SETAD.session
      ? window.SETAD.session
      : obterSessaoInstitucionalHub();

  if (!sessao) {
    window.location.href = "login-direcao.html";
    return;
  }

  const areas = listarAreasInstitucionaisPermitidas(sessao);
  if (!areas.length) {
    window.location.href = "login-direcao.html";
    return;
  }

  if (areas.length === 1) {
    definirAreaInstitucionalAtiva(areas[0]);
    window.location.href = redirectDaAreaInstitucional(areas[0]);
    return;
  }

  const nomeEl = document.getElementById("hubUsuarioNome");
  if (nomeEl) nomeEl.textContent = sessao.nome || sessao.email || "";

  container.innerHTML = "";
  areas.forEach(function (perfil) {
    const cfg = AREAS_INSTITUCIONAIS[perfil];
    if (!cfg) return;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "hub-area-card";
    card.innerHTML =
      "<strong class=\"hub-area-card__titulo\">" +
      cfg.titulo +
      "</strong><span class=\"hub-area-card__desc\">" +
      cfg.descricao +
      "</span>";
    card.addEventListener("click", function () {
      definirAreaInstitucionalAtiva(perfil);
      window.location.href = cfg.redirect;
    });
    container.appendChild(card);
  });

  const btnSair = document.getElementById("hubSair");
  if (btnSair && !btnSair.dataset.bound) {
    btnSair.dataset.bound = "1";
    btnSair.addEventListener("click", function () {
      limparAreaInstitucionalAtiva();
      encerrarSessaoInstitucionalCompleta();
      window.location.href = "login-direcao.html";
    });
  }
}

function obterSessaoInstitucionalHub() {
  const dir = localStorage.getItem(STORAGE_SESSAO_DIRECAO);
  if (dir) {
    try {
      return JSON.parse(dir);
    } catch (_e) {
      /* ignore */
    }
  }
  const sec = localStorage.getItem(STORAGE_SESSAO_SECRETARIA);
  if (sec) {
    try {
      return JSON.parse(sec);
    } catch (_e2) {
      /* ignore */
    }
  }
  const coord = localStorage.getItem(STORAGE_SESSAO_COORDENACAO);
  if (coord) {
    try {
      return JSON.parse(coord);
    } catch (_e3) {
      /* ignore */
    }
  }
  return null;
}

function encerrarSessaoInstitucionalCompleta() {
  limparAreaInstitucionalAtiva();
  encerrarSessaoDirecao();
  encerrarSessaoSecretaria();
  if (typeof encerrarSessaoCoordenacao === "function") {
    encerrarSessaoCoordenacao();
  }
}
