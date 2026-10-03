# Registro.br — colar agora (e-mail SETAD)

**Situação:** só existe **1 registro A** público (`77.37.42.150`). **Faltam** SPF, MX, DKIM e DMARC — por isso o Gmail demora.

**Não apague** o registro **A** existente em `@` (site continua no ar).

Acesse: [registro.br](https://registro.br) → login → **setad.org.br** → **DNS** → **Modo avançado** / **Editar zona**.

Adicione **cada linha abaixo** (se o painel pedir só o “host”, use a coluna **Host**; se pedir FQDN, some `.setad.org.br`).

---

## 1. SPF (obrigatório)

| Campo | Valor |
|-------|--------|
| Tipo | **TXT** |
| Host / Nome | `@` ou vazio |
| Valor / Dados | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| TTL | 3600 |

---

## 2. MX — entrada (2 registros)

**Registro A**

| Campo | Valor |
|-------|--------|
| Tipo | **MX** |
| Host | `@` |
| Prioridade | **5** |
| Destino / Servidor | `mx1.hostinger.com` |

**Registro B**

| Campo | Valor |
|-------|--------|
| Tipo | **MX** |
| Host | `@` |
| Prioridade | **10** |
| Destino | `mx2.hostinger.com` |

---

## 3. DKIM (3 CNAME)

| Tipo | Host | Aponta para |
|------|------|-------------|
| **CNAME** | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` |
| **CNAME** | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` |
| **CNAME** | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com` |

(Com ou sem ponto final no destino, conforme o Registro.br aceitar.)

---

## 4. DMARC

| Campo | Valor |
|-------|--------|
| Tipo | **TXT** |
| Host | `_dmarc` |
| Valor | `v=DMARC1; p=none` |
| TTL | 3600 |

---

## 5. Salvar e testar (15 min – 48 h)

No PowerShell:

```powershell
cd "d:\PROJETOS CURSOR\site-projeto-setad"
npm run verify:dns-email
```

Quando `okEntrega: true`, teste o primeiro acesso institucional e no Gmail: `from:noreply@setad.org.br`.

---

## Opcional — www

Se `www.setad.org.br` não abrir, adicione:

| Tipo | Host | Valor |
|------|------|--------|
| **CNAME** | `www` | `setad.org.br` |

(A CDN Hostinger usa `www.setad.org.br.cdn.hstgr.net` se você migrar DNS inteiro para a Hostinger no futuro.)
