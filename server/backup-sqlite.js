const fs = require("fs");
const path = require("path");
const { getMeta, setMeta } = require("./db");

const META_ULTIMO_BACKUP = "ultimo_backup_sqlite_em";
const INTERVALO_MS = 6 * 60 * 60 * 1000;
const MAX_BACKUPS = 20;

function criarBackupAutomaticoSqlite(dbPath) {
  if (process.env.SETAD_DISABLE_AUTO_BACKUP === "true") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!dbPath || !fs.existsSync(dbPath)) return;

  let stat;
  try {
    stat = fs.statSync(dbPath);
  } catch (_e) {
    return;
  }
  if (!stat.isFile() || stat.size < 2048) return;

  const agora = Date.now();
  const ultimo = getMeta(META_ULTIMO_BACKUP);
  if (ultimo && agora - new Date(ultimo).getTime() < INTERVALO_MS) {
    return;
  }

  const backupDir = path.join(path.dirname(dbPath), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destino = path.join(backupDir, "setad-" + stamp + ".db");

  try {
    fs.copyFileSync(dbPath, destino);
    [dbPath + "-wal", dbPath + "-shm"].forEach(function (extra) {
      if (fs.existsSync(extra)) {
        fs.copyFileSync(extra, destino + extra.slice(dbPath.length));
      }
    });
    setMeta(META_ULTIMO_BACKUP, new Date().toISOString());
    console.log("[SETAD] Backup automático do banco:", destino);

    const arquivos = fs
      .readdirSync(backupDir)
      .filter(function (f) {
        return f.startsWith("setad-") && f.endsWith(".db");
      })
      .sort()
      .reverse();
    arquivos.slice(MAX_BACKUPS).forEach(function (nome) {
      try {
        fs.unlinkSync(path.join(backupDir, nome));
      } catch (_err) {
        /* ignore */
      }
    });
  } catch (erro) {
    console.warn("[SETAD] Falha no backup automático:", erro.message);
  }
}

module.exports = { criarBackupAutomaticoSqlite };
