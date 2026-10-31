const fs = require("fs");
const path = require("path");

function tamanhoArquivoDb(caminho) {
  if (!caminho || !fs.existsSync(caminho)) return 0;
  try {
    const stat = fs.statSync(caminho);
    return stat.isFile() ? stat.size : 0;
  } catch (_e) {
    return 0;
  }
}

function copiarArquivoSqlite(origem, destino) {
  if (!fs.existsSync(origem)) return false;
  if (tamanhoArquivoDb(origem) < 512) return false;

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);

  [origem + "-wal", origem + "-shm"].forEach(function (extra) {
    if (fs.existsSync(extra)) {
      fs.copyFileSync(extra, destino + extra.slice(origem.length));
    }
  });

  return true;
}

function candidatosBancoLegado(repoRoot) {
  const cwd = process.cwd();
  const lista = [
    path.join(repoRoot, "data", "setad.db"),
    path.join(cwd, "data", "setad.db"),
    path.join(cwd, "setad.db"),
    path.join(repoRoot, "setad.db"),
    path.join(cwd, "..", "data", "setad.db")
  ];
  const vistos = {};
  return lista.filter(function (p) {
    const key = path.resolve(p);
    if (vistos[key]) return false;
    vistos[key] = true;
    return true;
  });
}

/**
 * Escolhe o arquivo SQLite mais completo entre destino e cópias legadas (deploy antigo).
 */
function sincronizarBancoPersistenteComLegados(destinoDb, repoRoot) {
  const destinoAbs = path.resolve(destinoDb);
  let melhorCaminho = fs.existsSync(destinoAbs) ? destinoAbs : null;
  let melhorTamanho = tamanhoArquivoDb(melhorCaminho);

  candidatosBancoLegado(repoRoot).forEach(function (origem) {
    const origemAbs = path.resolve(origem);
    if (origemAbs === destinoAbs) return;
    const t = tamanhoArquivoDb(origemAbs);
    if (t > melhorTamanho) {
      melhorTamanho = t;
      melhorCaminho = origemAbs;
    }
  });

  if (!melhorCaminho || melhorCaminho === destinoAbs) return false;
  if (!copiarArquivoSqlite(melhorCaminho, destinoAbs)) return false;

  console.log(
    "[SETAD] Banco restaurado/migrado:",
    melhorCaminho,
    "→",
    destinoAbs,
    "(" + melhorTamanho + " bytes)"
  );
  return true;
}

function diretorioPersistenteProducao(repoRoot, dataDirEnv) {
  if (dataDirEnv) return path.resolve(dataDirEnv);

  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) return path.join(home, ".setad-data");

  const cwd = process.cwd();
  const acimaCwd = path.join(cwd, "..", ".setad-data");
  if (path.resolve(acimaCwd) !== path.resolve(repoRoot)) {
    return acimaCwd;
  }
  return path.join(repoRoot, "..", "setad-data-persistente");
}

/**
 * Em produção, SQLite e uploads ficam fora da pasta sobrescrita pelo deploy Git.
 */
function resolverArmazenamentoSetad(repoRoot) {
  const legadoDb = path.join(repoRoot, "data", "setad.db");
  const legadoUploads = path.join(repoRoot, "data", "uploads");
  const isProd = process.env.NODE_ENV === "production";
  const repoAbs = path.resolve(repoRoot);

  const dbEnv = (process.env.SETAD_DB_PATH || "").trim();
  const uploadsEnv = (process.env.SETAD_UPLOADS_DIR || "").trim();
  const dataDirEnv = (process.env.SETAD_DATA_DIR || "").trim();

  let dbPath;
  let uploadsDir;
  let estrategia = "desenvolvimento";

  if (dbEnv && path.isAbsolute(dbEnv)) {
    dbPath = path.resolve(dbEnv);
    estrategia = "SETAD_DB_PATH";
  } else if (isProd) {
    const dirPersistente = diretorioPersistenteProducao(repoRoot, dataDirEnv);
    dbPath = path.join(dirPersistente, "setad.db");
    estrategia = dbEnv ? "producao_persistente_substituindo_relativo" : "producao_persistente_padrao";
    if (dbEnv && !path.isAbsolute(dbEnv)) {
      console.warn(
        "[SETAD] SETAD_DB_PATH relativo ignorado em produção — usando",
        dbPath
      );
    }
    sincronizarBancoPersistenteComLegados(dbPath, repoRoot);
  } else {
    dbPath = path.resolve(dbEnv || legadoDb);
    estrategia = "desenvolvimento";
  }

  const dbAbs = path.resolve(dbPath);
  const dadosForaDoDeploy =
    isProd && (dbEnv && path.isAbsolute(dbEnv)
      ? true
      : !dbAbs.startsWith(repoAbs + path.sep) && dbAbs !== repoAbs);

  if (uploadsEnv && path.isAbsolute(uploadsEnv)) {
    uploadsDir = path.resolve(uploadsEnv);
  } else if (isProd) {
    uploadsDir = path.join(path.dirname(dbPath), "uploads");
    if (uploadsEnv && !path.isAbsolute(uploadsEnv)) {
      console.warn(
        "[SETAD] SETAD_UPLOADS_DIR relativo ignorado em produção — usando",
        uploadsDir
      );
    }
  } else {
    uploadsDir = path.resolve(uploadsEnv || legadoUploads);
  }

  if (isProd && dadosForaDoDeploy) {
    console.log("[SETAD] Armazenamento persistente (fora do deploy):", path.dirname(dbPath));
  }

  return {
    dbPath,
    uploadsDir,
    legadoDb,
    dadosForaDoDeploy,
    estrategia
  };
}

module.exports = {
  resolverArmazenamentoSetad,
  sincronizarBancoPersistenteComLegados,
  candidatosBancoLegado
};
