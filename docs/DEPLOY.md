# Deploy SETAD — Hostinger, Git e produção

Este guia cobre o deploy do **site + PWA + API** (um único processo Node em `server/index.js`).  
Não basta enviar só HTML para `public_html`: é necessário **Node.js**, **SQLite** e pasta `data/` persistente.

---

## Escolha o seu cenário

| Você tem… | Repo… | Siga a seção |
|-----------|--------|----------------|
| **VPS ou Cloud Hostinger** | GitHub/GitLab **público** | [1A](#1a-vps--repositório-público) |
| **VPS ou Cloud Hostinger** | GitHub/GitLab **privado** | [1B](#1b-vps--repositório-privado-deploy-key) |
| **Hospedagem compartilhada** (só PHP / `public_html`) | qualquer | [2](#2-hospedagem-compartilhada-limitação) |
| **Git no hPanel** (sem VPS) | qualquer | [3](#3-git-no-hpanel-hostinger) |
| Deploy automático a cada `git push` | GitHub Actions | [4](#4-deploy-automático-github-actions-opcional) |

**Recomendado para o SETAD completo:** VPS/Cloud + Git por SSH + Nginx + PM2.

---

## Arquitetura em produção

```
Internet → Nginx (443) → proxy → Node :3456
                                    ├── /api/*     (Express)
                                    ├── /uploads/* (data/uploads)
                                    └── /*         (HTML, CSS, JS, PWA)
```

Variáveis lidas pelo código:

| Variável | Arquivo | Obrigatório em produção |
|----------|---------|-------------------------|
| `NODE_ENV=production` | `server/middleware/auth.js` (cookie `secure`) | Sim |
| `PORT` | `server/index.js` (padrão `3456`) | Sim (interno) |
| `JWT_SECRET` | `server/middleware/auth.js` | Sim |
| `SETAD_DB_PATH` | `server/db.js` | Recomendado (caminho absoluto) |
| `SETAD_PUBLIC_URL` | documentação / integrações | Recomendado |
| `SETAD_CORS_ORIGIN` | `server/index.js` (regex extra) | Opcional |

Copie `.env.example` para `.env` no servidor. **Nunca** commite `.env` ou `data/*.db`.

---

## 1A. VPS — repositório público

### No VPS (SSH)

```bash
sudo apt update && sudo apt install -y git nginx certbot python3-certbot-nginx build-essential
# Node 20 LTS — https://github.com/nodesource/distributions
sudo mkdir -p /var/www/setad && sudo chown $USER:$USER /var/www/setad
cd /var/www/setad

git clone https://github.com/SEU_USUARIO/site-projeto-setad.git .
cp .env.example .env
# Edite .env (JWT_SECRET, domínio, caminhos)
nano .env

mkdir -p data/uploads
npm ci --omit=dev

pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Nginx: copie `deploy/nginx-setad.conf.example` para o servidor (ajuste `server_name`) e rode Certbot.

Teste: `curl https://setad.org.br/api/health`

---

## 1B. VPS — repositório privado (deploy key)

A Hostinger **não** acessa o Git sozinha: a **máquina VPS** precisa de uma chave autorizada no GitHub/GitLab.

### Passo 1 — Chave no VPS

```bash
ssh-keygen -t ed25519 -C "setad-deploy-hostinger" -f ~/.ssh/setad_deploy -N ""
cat ~/.ssh/setad_deploy.pub
```

### Passo 2 — GitHub

1. Repositório → **Settings** → **Deploy keys** → **Add deploy key**
2. Cole o conteúdo de `setad_deploy.pub`
3. **Não** marque write access (só leitura para `git pull`)

### Passo 2 — GitLab

1. Repositório → **Settings** → **Repository** → **Deploy keys**
2. Cole a chave pública

### Passo 3 — SSH config no VPS

```bash
nano ~/.ssh/config
```

```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/setad_deploy
  IdentitiesOnly yes

Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/setad_deploy
  IdentitiesOnly yes
```

```bash
chmod 600 ~/.ssh/config
ssh -T git@github.com
# ou: ssh -T git@gitlab.com
```

### Passo 4 — Clone e resto igual à seção 1A

```bash
cd /var/www/setad
git clone git@github.com:SEU_USUARIO/site-projeto-setad.git .
```

**Alternativa privada (HTTPS):** Personal Access Token no GitHub/GitLab como “senha” no `git clone https://...` (menos ideal que deploy key).

### Atualizar produção

```bash
cd /var/www/setad
cp data/setad.db data/setad.db.bak-$(date +%F)   # backup
git pull
npm ci --omit=dev
pm2 restart setad
```

---

## 2. Hospedagem compartilhada (limitação)

Planos que só oferecem **PHP** e pasta `public_html` **não executam** `server/index.js`, `better-sqlite3` nem a API `/api`.

Opções:

1. **Migrar para VPS Hostinger** (ou Cloud) e seguir seção 1 — **recomendado**.
2. Hospedar API em outro serviço com Node e publicar só front estático na Hostinger (exige adaptar `js/api-client.js` / `app-config.js` para URL externa da API).

O projeto atual foi feito para **site + API no mesmo domínio** (`npm start`).

---

## 3. Git no hPanel (Hostinger)

Disponível em alguns planos em **Websites → Git** (ou **Avançado → Git**).

### Conectar repositório

1. hPanel → seu site → **Git**
2. **Create** / **Connect repository**
3. URL:
   - Público: `https://github.com/usuario/repo.git`
   - Privado HTTPS: usuário GitHub + **token** (não use senha da conta)
   - Privado SSH: o hPanel pode gerar uma chave — copie o **.pub** e adicione como **Deploy key** no GitHub/GitLab (igual seção 1B)
4. Branch: `main` (ou a sua)
5. Diretório de publicação: em plano compartilhado costuma ser `public_html` — **insuficiente para o SETAD com API**

### Node no hPanel

Se o seu plano tiver **Node.js** no painel:

1. Aponte o aplicativo para `server/index.js`
2. Variáveis de ambiente no painel (`JWT_SECRET`, `NODE_ENV`, etc.)
3. Confirme se SQLite e uploads em `data/` são persistentes entre reinícios

Na dúvida, use **VPS** com este documento e PM2.

---

## 4. Deploy automático (GitHub Actions, opcional)

Fluxo: push em `main` → SSH no VPS → `git pull` + `npm ci` + `pm2 restart`.

**Secrets no GitHub** (Settings → Secrets → Actions):

| Secret | Conteúdo |
|--------|----------|
| `DEPLOY_HOST` | IP ou hostname do VPS |
| `DEPLOY_USER` | usuário SSH |
| `DEPLOY_SSH_KEY` | chave **privada** (par autorizado em `~/.ssh/authorized_keys` do VPS) |

Exemplo de job (adicione `.github/workflows/deploy.yml` se quiser):

```yaml
name: Deploy SETAD
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /var/www/setad
            git pull
            npm ci --omit=dev
            pm2 restart setad
```

O repositório no VPS continua usando **deploy key** para `git pull`; o Actions usa outra chave só para entrar no servidor.

---

## Nginx + HTTPS

1. Copie `deploy/nginx-setad.conf.example` → `/etc/nginx/sites-available/setad`
2. Ajuste `server_name` para seu domínio
3. `sudo ln -s /etc/nginx/sites-available/setad /etc/nginx/sites-enabled/`
4. `sudo nginx -t && sudo systemctl reload nginx`
5. `sudo certbot --nginx -d setad.org.br -d www.setad.org.br`

A porta `3456` deve ficar **apenas em localhost** (não abra no firewall público).

---

## PM2

Na raiz do projeto no servidor:

```bash
pm2 start ecosystem.config.cjs
pm2 logs setad
pm2 status
```

---

## App Android (Capacitor)

Antes de gerar o APK, confira `js/app-config.js`:

- `API_BASE`: `https://SEU_DOMINIO/api`
- `SITE_URL`: `https://SEU_DOMINIO`

---

## PWA após deploy

- Teste `https://SEU_DOMINIO/api/health`
- Login em HTTPS (cookie `secure` exige `NODE_ENV=production`)
- Se o ícone ou cache não atualizar: limpar dados do site ou reinstalar o atalho PWA

---

## O que não vai no Git

Conforme `.gitignore`:

- `node_modules/`
- `.env`
- `data/` (banco e uploads) — **backup manual** no servidor
- `www/`, `android/` (build local Capacitor)

O servidor serve a **raiz do repositório** (`index.html`, `css/`, `js/`), não é obrigatório publicar `www/` na VPS.

---

## Checklist final

- [ ] VPS com Node 18+ e build tools (para `better-sqlite3`)
- [ ] Repositório clonado; `.env` com `JWT_SECRET` forte
- [ ] `data/uploads` criado; backup de `setad.db` agendado
- [ ] PM2 rodando e `pm2 startup` configurado
- [ ] Nginx + Certbot (HTTPS)
- [ ] `/api/health` OK
- [ ] Senhas demo alteradas após primeiro `seed`
- [ ] `app-config.js` com domínio de produção (APK)

---

## Suporte rápido

| Problema | Verificar |
|----------|-----------|
| 502 Bad Gateway | `pm2 status`, Node na porta `PORT` do `.env` |
| Login não persiste | HTTPS + `NODE_ENV=production` |
| API 401 | JWT / cookie; domínio sem misturar http e https |
| `git pull` negado | Deploy key no GitHub/GitLab; `~/.ssh/config` |
| Upload falha | Permissão em `data/uploads`; `client_max_body_size` no Nginx |
