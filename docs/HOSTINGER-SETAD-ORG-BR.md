# Publicar em https://setad.org.br (Hostinger)

## Situação verificada

- O código está no GitHub: `https://github.com/gabrielrubens-ux/setad.org.br`
- `package.json` tem `build` e `start` (exigido pelo deploy Node da Hostinger).
- **`setad.org.br` ainda não resolve na internet (DNS)** — sem isso ninguém abre o domínio no navegador, mesmo com o app no ar.

O servidor **no seu PC** já pode rodar em `http://localhost:3456` (só para você / rede local).

---

## Passo 1 — Domínio e DNS (hPanel)

1. hPanel → **Domínios** → `setad.org.br` (registro ativo na Hostinger).
2. **DNS / Zona DNS**:
   - Se usar **hospedagem Node / VPS**: registro **A** `@` → IP do servidor (VPS ou IP que a Hostinger informar para Node).
   - Registro **A** ou **CNAME** `www` → mesmo destino (ou CNAME para `@`).
3. Aguarde propagação (minutos a 48 h). Teste: `nslookup setad.org.br 8.8.8.8`

Sem registro A/CNAME correto, o navegador mostra “não é possível encontrar o servidor”.

---

## Domínio temporário Hostinger

Ex.: `https://blue-swan-895519.hostingersite.com` — já está na lista de CORS do servidor.

Após o deploy com as correções de segurança:

1. Defina `JWT_SECRET` forte no painel (obrigatório com `NODE_ENV=production`).
2. **Não** use `SETAD_ALLOW_DEMO_SEED` em produção.
3. Troque senhas se o banco foi criado com contas de demonstração (`dir123`, etc.).

---

## Passo 2 — Deploy Node (Git)

1. hPanel → **Websites** → site ou **Node.js** (conforme seu plano).
2. **Git**:
   - URL: `https://github.com/gabrielrubens-ux/setad.org.br.git`
   - Branch: `main`
3. **Build command:** `npm run build`
4. **Start command:** `npm start`
5. **Node:** 18 ou 20

### Variáveis de ambiente (painel)

| Nome | Valor |
|------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | chave aleatória com **32+ caracteres** (obrigatório; sem isso o app não inicia) |
| `SETAD_PUBLIC_URL` | `https://setad.org.br` |
| `PORT` | use a porta que o painel definir (se houver) |

Crie pasta persistente `data/uploads` se o painel permitir volume — o banco SQLite ficará em `data/setad.db`.

---

## Passo 3 — SSL

hPanel → **SSL** → ativar **Let's Encrypt** para `setad.org.br` e `www`.

---

## Passo 4 — Testes

- `https://setad.org.br/`
- `https://setad.org.br/api/health` → `{"ok":true,...}`

---

## Uso local (desenvolvimento)

```bash
cd site-projeto-setad
npm start
```

Abra `http://localhost:3456`. Na rede Wi‑Fi: `http://SEU_IP_LOCAL:3456` (não é o domínio público).

---

## Atualizar o site após mudanças no código

```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

No hPanel: **Redeploy** / **Pull** do Git (conforme o plano).
