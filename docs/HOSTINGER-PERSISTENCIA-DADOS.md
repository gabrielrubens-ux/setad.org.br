# Persistência do SQLite e uploads — Hostinger (SETAD)

Cada **deploy Git** na Hostinger substitui os arquivos do aplicativo Node. Se o banco ficar em `./data/setad.db` **dentro** dessa pasta, um deploy pode **apagar ou recriar** o SQLite vazio — e os cadastros somem do site.

## Solução recomendada

Guarde banco e uploads **fora** da pasta que o Git sobrescreve, usando caminhos **absolutos** nas variáveis de ambiente.

### 1. Criar pasta persistente (File Manager ou SSH)

Conta SETAD (`u378124100`), exemplo:

```text
/home/u378124100/.setad-data/
/home/u378124100/.setad-data/uploads/
```

(Ajuste o prefixo `/home/u378124100/` se o hPanel mostrar outro caminho home.)

### 2. Variáveis no hPanel (Node.js → Environment variables)

Envie **a lista completa** de variáveis (a Hostinger substitui tudo ao salvar).

**A partir da versão com `server/persistencia-dados.js`**, se `NODE_ENV=production` e não houver caminho absoluto, o servidor usa automaticamente `~/.setad-data/setad.db` (fora do deploy) e tenta migrar um `data/setad.db` legado na primeira subida.

| Nome | Valor recomendado |
|------|-------------------|
| `SETAD_DB_PATH` | `/home/u378124100/.setad-data/setad.db` (opcional se o padrão `~/.setad-data` já estiver correto) |
| `SETAD_UPLOADS_DIR` | `/home/u378124100/.setad-data/uploads` (opcional; padrão: pasta `uploads` ao lado do `.db`) |
| `SETAD_DATA_DIR` | Alternativa: `/home/u378124100/.setad-data` (define pasta; db = `setad.db` dentro dela) |

Mantenha também `NODE_ENV`, `JWT_SECRET`, `SETAD_PUBLIC_URL`, SMTP, etc. — ver [HOSTINGER-VARIAVEIS-AMBIENTE.md](./HOSTINGER-VARIAVEIS-AMBIENTE.md).

**Evite em produção:** `SETAD_DB_PATH=./data/setad.db` (relativo ao deploy).

### 3. Migrar banco antigo (se ainda existir)

Se ainda houver `setad.db` na pasta do app **antes** de mudar o caminho:

1. Baixe `data/setad.db` pelo Gerenciador de arquivos (backup).
2. Envie/copie para `/home/u378124100/.setad-data/setad.db`.
3. Salve as variáveis e faça **Redeploy**.
4. Confira nos logs do build: linhas `[SETAD] SQLite:` e `[SETAD] Uploads:` com os caminhos absolutos.
5. Backups automáticos ficam em `backups/` ao lado do `.db` (até 20 cópias, a cada 6 h em produção).

### 4. Conferir após redeploy

- Logs Node (hPanel ou build Git): **não** deve aparecer o aviso sobre `SETAD_DB_PATH relativo`.
- `https://setad.org.br/api/health` → `ok: true`
- Secretaria → **Alunos** → total de matrículas esperado.

## Backup operacional (secretaria)

Na aba **Alunos**:

1. **Exportar matrículas (JSON)** — faça semanalmente ou antes de deploy grande.
2. Guarde o arquivo fora do site (Drive, PC da secretaria).
3. Se precisar, **Importar JSON** ou **Restaurar backup deste navegador**.

Formato do export:

```json
{
  "exportadoEm": "2026-10-31T…",
  "origem": "setad.org.br",
  "total": 120,
  "items": [ … ]
}
```

## Desenvolvimento local

Sem variáveis, o padrão continua `data/setad.db` e `data/uploads` na raiz do projeto (conveniente no PC).

## Referências

- [HOSTINGER-VARIAVEIS-AMBIENTE.md](./HOSTINGER-VARIAVEIS-AMBIENTE.md)
- [DEPLOY.md](./DEPLOY.md)
- [HOSTINGER-SETAD-ORG-BR.md](./HOSTINGER-SETAD-ORG-BR.md)
