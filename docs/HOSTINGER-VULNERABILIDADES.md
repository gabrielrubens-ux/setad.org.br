# Vulnerabilidades npm na Hostinger

O painel **Node.js → Vulnerabilities** escaneia o `package-lock.json` instalado no site. Os 17 avisos típicos deste projeto vinham de:

| Pacote | Origem | Risco no servidor SETAD |
|--------|--------|-------------------------|
| `tar` | `@capacitor/cli` / `@capacitor/assets` (dev) | Baixo em produção se **não** extrair tar de usuários |
| `sharp` | ícones PWA / Capacitor (dev) | Baixo se o servidor **não** processa imagens com sharp |
| `uuid` | cadeia Capacitor (dev) | Baixo em runtime da API |
| `nodemailer` | SMTP (produção) | Manter ≥ **10.3.1** (addressparser / SMTP AUTH) |

A Hostinger **não** aplicou patch automático: todos os itens estavam com `is_patchable: false` (correção via PR só quando a plataforma marca como patchável).

## Correção no repositório (feito no `package.json`)

1. **`nodemailer`** → `^10.3.1` (produção).
2. **Express** (transitivo): `body-parser` ≥ 1.20.9, `qs` ≥ 6.16.1 — via `npm audit fix` no lockfile.
3. **Capacitor + `sharp`** em `devDependencies`; **`@capacitor/assets`** ≥ **4.0.0** (remove cadeia antiga `@capacitor/cli` 5.x dentro do pacote de ícones).
4. **`overrides`** forçam versões corrigidas nas dependências aninhadas:
   - `tar` → `^7.5.22`
   - `uuid` → `^11.1.1`
   - `glob` → `^14.0.3`, `minimatch` → `^11.0.3` (cadeia `@capacitor/cli` / rimraf)
   - `sharp` → `^0.35.5` (via `@capacitor/assets`)

## O que você precisa rodar localmente

```bash
cd site-projeto-setad
npm install
npm audit
git add package.json package-lock.json
git commit -m "fix: atualizar dependências e overrides de segurança npm"
git push origin main
```

No hPanel: **Redeploy** / pull do Git.

## Produção na Hostinger (importante)

Configure o build para **não instalar devDependencies** no servidor:

- Comando de instalação: `npm ci --omit=dev` (ou `npm install --omit=dev`)

Assim o runtime em produção só carrega: Express, SQLite, JWT, nodemailer, etc. — sem Capacitor/tar/sharp do ambiente de desenvolvimento.

## Verificar após o deploy

1. hPanel → Node.js → **Vulnerabilities** (o scan pode levar algumas horas para atualizar).
2. `curl https://SEU_DOMINIO/api/health`

## App Android (sua máquina)

Para `npm run cap:android` e ícones, use `npm install` **completo** (com devDependencies) apenas no PC de desenvolvimento, não no servidor.
