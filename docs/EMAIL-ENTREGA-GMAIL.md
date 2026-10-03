# Entrega de e-mail no Gmail (código de verificação SETAD)

O site envia o código de 6 dígitos por SMTP quando `SETAD_SMTP_*` está configurado no hPanel. A **demora** ou cair em **Spam/Promoções** quase sempre é configuração de domínio e remetente, não só código.

## Recomendado (Hostinger + setad.org.br)

1. Crie uma caixa institucional no hPanel → **E-mails** (ex.: `contato@setad.org.br` ou `noreply@setad.org.br`).
2. Use **essa mesma conta** nas variáveis:

| Variável | Valor |
|----------|--------|
| `SETAD_SMTP_HOST` | `smtp.hostinger.com` |
| `SETAD_SMTP_PORT` | `465` |
| `SETAD_SMTP_SECURE` | `true` |
| `SETAD_SMTP_USER` | `contato@setad.org.br` (exemplo) |
| `SETAD_SMTP_PASS` | senha da caixa |
| `SETAD_EMAIL_FROM` | `SETAD <contato@setad.org.br>` — **mesmo endereço do USER** |
| `SETAD_EMAIL_REPLY_TO` | `contato@setad.org.br` (opcional) |

3. No hPanel → **E-mails** → domínio `setad.org.br`, ative **DKIM** (e confira **SPF** já sugerido pela Hostinger).
4. Configure **DMARC** no DNS (registro TXT `_dmarc.setad.org.br`), por exemplo política inicial `p=none` para monitorar, depois `quarantine`/`reject` quando estiver estável.

## Evitar Gmail pessoal como remetente

Enviar com `smtp.gmail.com` e `From: algo@setad.org.br` **não autentica** o domínio SETAD e piora entrega. Prefira caixa `@setad.org.br` na Hostinger.

## Conferência no painel (diretor)

Com sessão de diretor ativa:

`GET /api/auth/email/status`

Retorna se o SMTP está ativo, remetente configurado, aviso de alinhamento `FROM` × `USER` e a lista de e-mails em `staff_autorizados`.

## Fluxos que enviam código

| Público | Rotas |
|---------|--------|
| Aluno (matrícula) | `POST /api/auth/aluno/register`, `POST /api/auth/aluno/resend-code` |
| Staff (direção, contador, secretaria) | `POST /api/auth/staff/ativacao/senha`, `POST /api/auth/staff/ativacao/reenviar-codigo` |

Lista de quem pode ativar acesso institucional: tabela `staff_autorizados` + `SETAD_STAFF_AUTORIZADOS_JSON` (ver `docs/CADASTRO-STAFF-INSTITUCIONAL.md`).

## Depois de alterar DNS ou variáveis

1. Salvar variáveis no Node (lista completa).
2. Redeploy / reiniciar o app.
3. Testar primeiro acesso e olhar os logs `[SETAD e-mail]` se `emailEnviado: false` na resposta da API.
