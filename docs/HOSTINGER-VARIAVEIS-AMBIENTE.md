# Variáveis de ambiente — Hostinger (hPanel)

Não foi possível abrir o hPanel automaticamente (login é seu). Siga estes passos.

## Onde configurar

1. Acesse [https://hpanel.hostinger.com](https://hpanel.hostinger.com) e faça login.
2. **Websites** → selecione o site (`blue-swan-895519.hostingersite.com` ou `setad.org.br`).
3. Abra **Node.js** (ou **Aplicações** / **Deploy** → seu app Git).
4. Seção **Environment variables** / **Variáveis de ambiente**.

## Variáveis obrigatórias

| Nome | Valor |
|------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | copie do arquivo `.env.hostinger.local` na raiz do projeto (gerado localmente; não commitar) |
| `SETAD_PUBLIC_URL` | `https://blue-swan-895519.hostingersite.com` (ou `https://setad.org.br` quando o domínio estiver ativo) |

## Não adicionar em produção

- `SETAD_ALLOW_DEMO_SEED` — deixe **ausente** (não crie esta variável).

## Depois de salvar

1. **Redeploy** / **Reimplantar** o app (pull do Git `main`).
2. Teste: `https://blue-swan-895519.hostingersite.com/api/health`
3. Se o app não iniciar, confira os **logs** do Node: quase sempre `JWT_SECRET` curto ou ausente com `NODE_ENV=production`.

## Código no GitHub

O commit de segurança já foi enviado para `main` em `gabrielrubens-ux/setad.org.br`.
