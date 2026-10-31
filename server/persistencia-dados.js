const fs = require("fs");
const path = require("path");

function copiarArquivoSqlite(origem, destino) {
  if (!fs.existsSync(origem)) return false;
  try {
    const stat = fs.statSync(origem);
    if (!stat.isFile() || stat.size < 512) return false;
  } catch (_e) {
    return false;
  }

  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);

  [origem + "-wal", origem + "-shm"].forEach(function (extra) {
    if (fs.existsSync(extra)) {
      fs.copyFileSync(extra, destino + extra.slice(origem.length));
    }
  });

  return true;
}

function copiarBancoLegadoSeNecessario(legadoDb, destinoDb) {
  if (fs.existsSync(destinoDb)) return false;
  if (!copiarArquivoSqlite(legadoDb, destinoDb)) return false;
  console.log(
    "[SETAD] Banco migrado para armazenamento persistente:",
    destinoDb,
    "(origem:",
    legadoDb + ")"
  );
  return true;
}

/**
 * Em produção, SQLite e uploads ficam fora da pasta sobrescrita pelo deploy Git.
 * Prioridade: SETAD_DB_PATH absoluto > SETAD_DATA_DIR > ~/.setad-data
 */
function resolverArmazenamentoSetad(repoRoot) {
  const legadoDb = path.join(repoRoot, "data", "setad.db");
  const legadoUploads = path.join(repoRoot, "data", "uploads");
  const isProd = process.env.NODE_ENV === "production";

  const dbEnv = (process.env.SETAD_DB_PATH || "").trim();
  const uploadsEnv = (process.env.SETAD_UPLOADS_DIR || "").trim();
  const dataDirEnv = (process.env.SETAD_DATA_DIR || "").trim();

  let dbPath;
  let uploadsDir;
  let dadosForaDoDeploy = false;
  let estrategia = "desenvolvimento";

  if (dbEnv && path.isAbsolute(dbEnv)) {
    dbPath = path.resolve(dbEnv);
    dadosForaDoDeploy = true;
    estrategia = "SETAD_DB_PATH";
  } else if (isProd) {
    let dirPersistente;
    if (dataDirEnv) {
      dirPersistente = path.resolve(dataDirEnv);
    } else {
      const home = process.env.HOME || process.env.USERPROFILE;
      dirPersistente = home
        ? path.join(home, ".setad-data")
        : path.join(repoRoot, "..", "setad-data-persistente");
    }
    dbPath = path.join(dirPersistente, "setad.db");
    dadosForaDoDeploy = !dbPath.startsWith(path.resolve(repoRoot) + path.sep);
    estrategia = dbEnv ? "producao_persistente_substituindo_relativo" : "producao_persistente_padrao";
    if (dbEnv && !path.isAbsolute(dbEnv)) {
      console.warn(
        "[SETAD] SETAD_DB_PATH relativo ignorado em produção — usando",
        dbPath
      );
    }
    copiarBancoLegadoSeNecessario(legadoDb, dbPath);
  } else {
    dbPath = path.resolve(dbEnv || legadoDb);
    estrategia = "desenvolvimento";
  }

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
  copiarBancoLegadoSeNecessario
};
