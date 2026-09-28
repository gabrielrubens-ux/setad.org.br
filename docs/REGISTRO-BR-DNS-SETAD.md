# setad.org.br — DNS no Registro.br → Hostinger

O domínio está **registrado no Registro.br** (nameservers `a.auto.dns.br`). A hospedagem Node já está criada na Hostinger com site **`setad.org.br`**, mas o DNS público **ainda não aponta** para a Hostinger — por isso o site pode retornar **503** e o SSL falha com *Domain challenge failed*.

## Passo 1 — Registro.br (obrigatório)

1. Acesse [https://registro.br](https://registro.br) → login → domínio **setad.org.br**.
2. **DNS** / **Editar zona** (DNS do Registro.br, não Hostinger).
3. Crie ou ajuste:

| Tipo | Nome / Host | Valor | TTL |
|------|-------------|--------|-----|
| **A** | `@` (ou vazio) | `77.37.42.143` | 3600 |
| **A** | `@` | `89.116.213.220` | 3600 |
| **CNAME** | `www` | `setad.org.br` | 3600 |

Se o painel só permitir **um** registro A em `@`, use **`77.37.42.143`** (IP da CDN Hostinger usada pelo plano).

4. Salve e aguarde propagação (15 min a 48 h).

### Testar propagação

```powershell
Resolve-DnsName setad.org.br -Server 8.8.8.8 -Type A
```

Deve listar pelo menos um dos IPs acima.

**Alternativa:** no Registro.br, trocar os servidores DNS para os da Hostinger (hPanel → Domínios → setad.org.br → **DNS / Nameservers**). Só faça isso se quiser gerenciar DNS inteiro na Hostinger.

---

## Passo 2 — Código no GitHub

O servidor ainda pode estar no commit antigo. Envie o commit local:

```bash
cd "d:\PROJETOS CURSOR\site-projeto-setad"
git push origin main
```

No hPanel: **Node.js** → **Deploy** / **Rebuild** (ou aguarde auto-deploy do Git).

---

## Passo 3 — Hostinger (hPanel)

1. **Node.js** → variável `SETAD_PUBLIC_URL` = `https://setad.org.br` (mantenha `JWT_SECRET` e demais chaves).
2. **SSL** → instalar Let's Encrypt para `setad.org.br` e `www` (só depois do DNS propagado).
3. Ative **redirecionamento HTTP → HTTPS**.

---

## Passo 4 — Testes

- `https://setad.org.br/`
- `https://setad.org.br/api/health` → `{"ok":true,...}`

---

## Situação verificada (API Hostinger)

| Item | Estado |
|------|--------|
| Site Node | `setad.org.br`, usuário `u378124100` |
| Domínio no portfólio Hostinger | **Não** (registro só Registro.br) |
| SSL | `waiting_for_retry` — *Domain challenge failed* (DNS) |
| Build Git | configurado: `gabrielrubens-ux/setad.org.br`, branch `main` |
