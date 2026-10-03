# Primeiro acesso — direção, contabilidade e secretaria

Fluxo unificado: **e-mail autorizado** → **criar senha** → **código de 6 dígitos** (e-mail ou log sem SMTP) → painel conforme o perfil.

Página: `primeiro-acesso-institucional.html`  
API: `/api/auth/staff/ativacao/*`

Envio do código por e-mail (SMTP): após `POST .../senha`, ao retomar com `POST .../iniciar` (etapa verificação) e em `POST .../reenviar-codigo`. Diagnóstico (diretor): `GET /api/auth/email/status`.

---

## Como o sistema reconhece cada pessoa (opções)

Escolha uma estratégia principal (podem ser combinadas com cuidado):

### A) Lista branca no banco (implementado — recomendado)

Tabela `staff_autorizados`: `email`, `nome`, `perfil` (`diretor` | `contador` | `secretaria`).

- **Prós:** controle total; sem e-mail pessoal fixo no código; diretor cadastra quem entra.
- **Contras:** alguém precisa cadastrar o primeiro diretor (bootstrap).
- **Bootstrap em produção:**
  1. Variável `SETAD_STAFF_AUTORIZADOS_JSON` no painel Hostinger (ver `.env.hostinger.local`), ou
  2. API `POST /api/auth/staff/autorizados` (somente **diretor** já logado), ou
  3. Inserção manual no SQLite (`staff_autorizados`) em emergência.

### B) Domínio institucional (`@setad.org.br`)

Só aceitar e-mails que terminam em `@setad.org.br` e mapear perfil por prefixo (`diretor@`, `contador@`, `secretaria@`).

- **Prós:** simples de operar com caixas Hostinger.
- **Contras:** não cobre Gmail pessoal; prefixos fixos são frágeis; exige política de DNS/e-mail.

### C) Convite com link/token (legado `convites_staff`)

Direção gera link único; quem abre define senha.

- **Prós:** não vaza lista de e-mails na interface.
- **Contras:** mais suporte (“link expirou”); foi removido o fluxo só para contador por e-mail fixo.

### D) Cadastro cruzado com `funcionarios`

E-mail deve existir no cadastro de funcionários (RH); perfil derivado do cargo.

- **Prós:** alinha com folha/RH.
- **Contras:** exige RH sempre atualizado; regra de cargo → perfil precisa ser clara.

### E) Código presencial único

Direção entrega código de uso único (papel/WhatsApp); na ativação o usuário informa código + e-mail.

- **Prós:** bom para quem não tem `@setad.org.br`.
- **Contras:** processo manual; códigos podem vazar se mal geridos.

**Recomendação SETAD:** **A** como base + **SMTP** para o código + diretor gerencia a lista no painel (UI futura; hoje API e JSON de bootstrap).

---

## Perfis e destino após login

| Perfil      | Painel                    |
|------------|---------------------------|
| `diretor`  | `painel-direcao.html`     |
| `contador` | `painel-contador.html`    |
| `secretaria` | `painel-secretaria.html` |

---

## API (diretor)

- `GET /api/auth/staff/autorizados`
- `POST /api/auth/staff/autorizados` — body: `{ "email", "nome", "perfil" }`
- `DELETE /api/auth/staff/autorizados/:email` — desativa (não apaga histórico de convites antigos)

---

## SMTP (opcional)

Sem `SETAD_SMTP_*`, o código de verificação é registrado nos **logs** do Node (adequado só para teste).

Variáveis: ver `docs/HOSTINGER-VARIAVEIS-AMBIENTE.md`.

---

## O que foi removido

- E-mail fixo do contador (`rafaeladmtc@gmail.com`) e variáveis `SETAD_CONTADOR_*` / `SETAD_REENVIAR_CONVITE_CONTADOR`.
- Página `primeiro-acesso-contador.html` e convite automático na subida do servidor.
