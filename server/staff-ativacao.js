const bcrypt = require("bcryptjs");
const { db } = require("./db");
function gerarId(prefixo) {
  return prefixo + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}
const { enviarCodigoVerificacaoInstitucional } = require("./services/email");
const {
  PERFIS_INSTITUCIONAIS,
  perfilInstitucionalValido,
  normalizarListaPerfis,
  perfilPrincipalDaLista,
  perfisDoRegistro
} = require("./perfis-institucionais");

const REDIRECT_POR_PERFIL = {
  diretor: "painel-direcao.html",
  contador: "painel-contador.html",
  secretaria: "painel-secretaria.html"
};

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findUserByEmail(email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(normalizarEmail(email));
}

function buscarAutorizado(email) {
  return db
    .prepare("SELECT * FROM staff_autorizados WHERE email = ? COLLATE NOCASE AND ativo = 1")
    .get(normalizarEmail(email));
}

function buscarAtivacaoPendente(email) {
  return db
    .prepare("SELECT * FROM ativacoes_staff_pendentes WHERE email = ? COLLATE NOCASE")
    .get(normalizarEmail(email));
}

function gerarCodigoVerificacao() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function redirectPorPerfil(perfil) {
  return REDIRECT_POR_PERFIL[perfil] || "login-direcao.html";
}

function listarAutorizados() {
  return db
    .prepare(
      "SELECT email, nome, perfil, perfis_json, ativo, criado_em FROM staff_autorizados ORDER BY perfil, nome"
    )
    .all()
    .map(function (row) {
      const perfis = perfisDoRegistro(row);
      return {
        email: row.email,
        nome: row.nome,
        perfil: row.perfil,
        perfis: perfis,
        ativo: row.ativo,
        criado_em: row.criado_em
      };
    });
}

function upsertAutorizado(email, nome, perfil, perfisOpcional) {
  const emailNorm = normalizarEmail(email);
  const listaPerfis = normalizarListaPerfis(perfisOpcional, perfil);
  const perfilPrincipal = perfilPrincipalDaLista(listaPerfis);

  if (!emailNorm || !nome || !perfilInstitucionalValido(perfilPrincipal)) {
    return { ok: false, erro: "Informe e-mail, nome e perfil válido (diretor, contador ou secretaria)." };
  }

  const perfisJson = JSON.stringify(listaPerfis);
  const agora = new Date().toISOString();
  db.prepare(`
    INSERT INTO staff_autorizados (email, nome, perfil, perfis_json, ativo, criado_em)
    VALUES (?, ?, ?, ?, 1, ?)
    ON CONFLICT(email) DO UPDATE SET
      nome = excluded.nome,
      perfil = excluded.perfil,
      perfis_json = excluded.perfis_json,
      ativo = 1
  `).run(emailNorm, nome.trim(), perfilPrincipal, perfisJson, agora);

  const usuario = findUserByEmail(emailNorm);
  if (usuario) {
    db.prepare(
      "UPDATE users SET perfis_institucionais_json = ?, perfil = ? WHERE email = ? COLLATE NOCASE"
    ).run(perfisJson, perfilPrincipal, emailNorm);
  }

  return {
    ok: true,
    email: emailNorm,
    nome: nome.trim(),
    perfil: perfilPrincipal,
    perfis: listaPerfis
  };
}

function desativarAutorizado(email) {
  const emailNorm = normalizarEmail(email);
  const resultado = db
    .prepare("UPDATE staff_autorizados SET ativo = 0 WHERE email = ? COLLATE NOCASE")
    .run(emailNorm);
  if (!resultado.changes) {
    return { ok: false, erro: "E-mail não encontrado na lista de autorizados." };
  }
  return { ok: true };
}

function iniciarAtivacao(email) {
  const emailNorm = normalizarEmail(email);
  if (!emailNorm) {
    return { ok: false, erro: "Informe um e-mail válido." };
  }

  const autorizado = buscarAutorizado(emailNorm);
  if (!autorizado) {
    return {
      ok: false,
      erro: "Este e-mail não está autorizado para acesso institucional. Solicite à direção do SETAD."
    };
  }

  const usuario = findUserByEmail(emailNorm);
  if (usuario && usuario.verificado) {
    return {
      ok: false,
      erro: "Já existe uma conta ativa com este e-mail. Use a opção Entrar.",
      jaAtivo: true
    };
  }

  const pendente = buscarAtivacaoPendente(emailNorm);
  let etapa = "senha";
  let codigoExpirado = false;

  if (pendente && pendente.password_hash && pendente.codigo && pendente.codigo_expira_em) {
    if (new Date() > new Date(pendente.codigo_expira_em)) {
      codigoExpirado = true;
      etapa = "senha";
    } else {
      etapa = "verificacao";
    }
  } else if (pendente && pendente.password_hash) {
    etapa = "senha";
    codigoExpirado = true;
  }

  return {
    ok: true,
    email: emailNorm,
    nome: autorizado.nome,
    perfil: autorizado.perfil,
    redirect: redirectPorPerfil(autorizado.perfil),
    etapa: etapa,
    codigoExpirado: codigoExpirado || undefined,
    avisoEtapa:
      codigoExpirado
        ? "O código anterior expirou. Crie a senha novamente para receber um novo código por e-mail."
        : undefined
  };
}

function definirSenhaAtivacao(email, senha) {
  const emailNorm = normalizarEmail(email);
  const autorizado = buscarAutorizado(emailNorm);
  if (!autorizado) {
    return { ok: false, erro: "E-mail não autorizado." };
  }

  if (!senha || senha.length < 6) {
    return { ok: false, erro: "A senha deve ter no mínimo 6 caracteres." };
  }

  const codigo = gerarCodigoVerificacao();
  const agora = new Date().toISOString();
  const codigoExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const passwordHash = bcrypt.hashSync(senha, 10);

  db.prepare(`
    INSERT INTO ativacoes_staff_pendentes (
      email, nome, perfil, password_hash, codigo, codigo_expira_em, senha_definida_em, criado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      nome = excluded.nome,
      perfil = excluded.perfil,
      password_hash = excluded.password_hash,
      codigo = excluded.codigo,
      codigo_expira_em = excluded.codigo_expira_em,
      senha_definida_em = excluded.senha_definida_em
  `).run(
    emailNorm,
    autorizado.nome,
    autorizado.perfil,
    passwordHash,
    codigo,
    codigoExpira,
    agora,
    agora
  );

  return {
    ok: true,
    email: emailNorm,
    nome: autorizado.nome,
    perfil: autorizado.perfil,
    codigo: codigo
  };
}

function verificarCodigoAtivacao(email, codigoInformado) {
  const emailNorm = normalizarEmail(email);
  const pendente = buscarAtivacaoPendente(emailNorm);
  const autorizado = buscarAutorizado(emailNorm);

  if (!autorizado || !pendente) {
    return { ok: false, erro: "Nenhuma ativação pendente para este e-mail." };
  }

  if (!pendente.password_hash) {
    return { ok: false, erro: "Defina sua senha antes de verificar o código." };
  }

  if (!pendente.codigo || !pendente.codigo_expira_em) {
    return { ok: false, erro: "Nenhum código pendente. Defina a senha novamente." };
  }

  if (new Date() > new Date(pendente.codigo_expira_em)) {
    return { ok: false, erro: "O código expirou. Defina a senha novamente para receber um novo código." };
  }

  if (String(codigoInformado || "").trim() !== pendente.codigo) {
    return { ok: false, erro: "Código incorreto. Verifique os 6 dígitos enviados ao seu e-mail." };
  }

  const agora = new Date().toISOString();
  const userId = gerarId("user");
  const perfisJson = autorizado.perfis_json || JSON.stringify(perfisDoRegistro(autorizado));

  db.prepare(`
    INSERT INTO users (id, email, password_hash, nome, perfil, perfis_institucionais_json, modulo, matricula_id, verificado, created_at, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 1, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      nome = excluded.nome,
      perfil = excluded.perfil,
      perfis_institucionais_json = excluded.perfis_institucionais_json,
      verificado = 1,
      verified_at = excluded.verified_at
  `).run(
    userId,
    emailNorm,
    pendente.password_hash,
    pendente.nome,
    pendente.perfil,
    perfisJson,
    agora,
    agora
  );

  db.prepare("DELETE FROM ativacoes_staff_pendentes WHERE email = ? COLLATE NOCASE").run(emailNorm);

  const user = findUserByEmail(emailNorm);
  return {
    ok: true,
    user: user,
    redirect: redirectPorPerfil(pendente.perfil)
  };
}

function reenviarCodigoAtivacao(email) {
  const emailNorm = normalizarEmail(email);
  const pendente = buscarAtivacaoPendente(emailNorm);
  const autorizado = buscarAutorizado(emailNorm);

  if (!autorizado || !pendente || !pendente.password_hash) {
    return { ok: false, erro: "Não há verificação pendente. Informe o e-mail e crie a senha novamente." };
  }

  const codigo = gerarCodigoVerificacao();
  const codigoExpira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE ativacoes_staff_pendentes
    SET codigo = ?, codigo_expira_em = ?
    WHERE email = ? COLLATE NOCASE
  `).run(codigo, codigoExpira, emailNorm);

  return { ok: true, email: emailNorm, nome: autorizado.nome, codigo: codigo };
}

async function enviarCodigoSePossivel(email, nome, codigo) {
  return enviarCodigoVerificacaoInstitucional(email, nome, codigo);
}

function obterCodigoPendenteParaEnvio(email) {
  const emailNorm = normalizarEmail(email);
  const pendente = buscarAtivacaoPendente(emailNorm);
  const autorizado = buscarAutorizado(emailNorm);

  if (!autorizado || !pendente || !pendente.password_hash) {
    return {
      ok: false,
      erro: "Não há verificação pendente. Informe o e-mail e crie a senha novamente."
    };
  }

  if (!pendente.codigo || !pendente.codigo_expira_em) {
    return { ok: false, codigoExpirado: true, erro: "Defina a senha novamente para receber um código." };
  }

  if (new Date() > new Date(pendente.codigo_expira_em)) {
    return {
      ok: false,
      codigoExpirado: true,
      erro: "O código expirou. Crie a senha novamente para receber um novo código por e-mail."
    };
  }

  return {
    ok: true,
    email: emailNorm,
    nome: autorizado.nome,
    codigo: pendente.codigo
  };
}

async function enviarCodigoPendenteInstitucional(email) {
  const dados = obterCodigoPendenteParaEnvio(email);
  if (!dados.ok) {
    return { ok: false, erro: dados.erro, codigoExpirado: dados.codigoExpirado };
  }

  const envio = await enviarCodigoSePossivel(dados.email, dados.nome, dados.codigo);
  return {
    ok: true,
    email: dados.email,
    nome: dados.nome,
    codigo: dados.codigo,
    envio: envio
  };
}

function importarAutorizadosIniciais(lista) {
  if (!Array.isArray(lista)) return;
  lista.forEach(function (item) {
    if (!item || !item.email || !item.nome) return;
    const perfil = item.perfil || (item.perfis && item.perfis[0]) || null;
    if (!perfil) return;
    upsertAutorizado(item.email, item.nome, perfil, item.perfis);
  });
}

module.exports = {
  PERFIS_INSTITUCIONAIS,
  buscarAutorizado,
  iniciarAtivacao,
  definirSenhaAtivacao,
  verificarCodigoAtivacao,
  reenviarCodigoAtivacao,
  enviarCodigoSePossivel,
  enviarCodigoPendenteInstitucional,
  obterCodigoPendenteParaEnvio,
  listarAutorizados,
  upsertAutorizado,
  desativarAutorizado,
  redirectPorPerfil,
  importarAutorizadosIniciais
};
