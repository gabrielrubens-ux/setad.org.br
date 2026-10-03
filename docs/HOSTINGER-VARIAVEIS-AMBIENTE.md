# Variáveis de ambiente — Hostinger (hPanel)

## Onde configurar

1. [hPanel](https://hpanel.hostinger.com) → **Websites** → site Node.
2. **Node.js** → **Environment variables**.

A API da Hostinger **substitui a lista inteira** ao salvar — sempre envie o conjunto completo (incluindo `JWT_SECRET`).

## Obrigatórias

| Nome | Valor |
|------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | chave aleatória com **32+ caracteres** (ver `.env.hostinger.local` local) |
| `SETAD_PUBLIC_URL` | `https://blue-swan-895519.hostingersite.com` ou `https://setad.org.br` |
| `SETAD_DB_PATH` | `./data/setad.db` (recomendado) |
| `SETAD_UPLOADS_DIR` | `./data/uploads` |

## Quem pode criar senha (primeiro acesso institucional)

| Nome | Valor |
|------|--------|
| `SETAD_STAFF_AUTORIZADOS_JSON` | JSON em **uma linha** — lista atual em `docs/CADASTRO-STAFF-INSTITUCIONAL.md` e em `.env.hostinger.local` (local, não commitar) |

Perfis aceitos: `diretor`, `contador`, `secretaria`. Detalhes: `docs/STAFF-PRIMEIRO-ACESSO.md`.

Depois do primeiro diretor ativo, use a API `/api/auth/staff/autorizados` para manter a lista.

## SMTP (código de verificação — aluno e staff)

| Nome | Exemplo |
|------|---------|
| `SETAD_SMTP_HOST` | `smtp.hostinger.com` (recomendado) |
| `SETAD_SMTP_PORT` | `465` |
| `SETAD_SMTP_SECURE` | `true` |
| `SETAD_SMTP_USER` | `contato@setad.org.br` |
| `SETAD_SMTP_PASS` | senha da caixa |
| `SETAD_EMAIL_FROM` | `SETAD <contato@setad.org.br>` — **igual ao USER** |
| `SETAD_EMAIL_REPLY_TO` | `contato@setad.org.br` (opcional) |

Sem SMTP, o código **não** chega ao usuário em produção (só log no servidor).

Entrega no Gmail (SPF/DKIM/DMARC): `docs/EMAIL-ENTREGA-GMAIL.md`.

## Não usar em produção

- `SETAD_ALLOW_DEMO_SEED`
- Credenciais pessoais commitadas no Git

## Depois de salvar

1. Reiniciar / redeploy o app Node.
2. Testar: `https://…/api/health`
3. Testar primeiro acesso: `…/primeiro-acesso-institucional.html`
