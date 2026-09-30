# setad.org.br — DNS no Registro.br → Hostinger

O domínio está **registrado no Registro.br** (nameservers `a.auto.dns.br`). A hospedagem Node já está criada na Hostinger com site **`setad.org.br`**, mas o DNS público **ainda não aponta** para a Hostinger — por isso o site pode retornar **503** e o SSL falha com *Domain challenge failed*.

## Não confundir: “Servidores DNS” × “Registro A”

No Registro.br existem **duas telas diferentes**:

| Tela no Registro.br | O que colocar | Exemplo |
|---------------------|---------------|---------|
| **Alterar servidores DNS** / delegação | Só **nomes** (hostname), **nunca IP** | `ns1.hostinger.com`, `ns2.hostinger.com` |
| **DNS → Modo avançado** / **Editar zona** | **Registros** do site: tipo **A**, **CNAME**, etc. | A `@` → IPs da CDN (veja tabela abaixo) |

A mensagem *“endereço IP não pode ser usado como servidores DNS”* aparece quando você coloca `77.37.42.xxx` no campo **Servidor DNS**. IP vai só no **registro tipo A** (abaixo).

---

## Caminho A — Manter DNS no Registro.br (recomendado se o domínio ficou no Registro.br)

1. [registro.br](https://registro.br) → **setad.org.br** → **DNS**.
2. Use **DNS do Registro.br** (não troque servidores DNS por IP).
3. Abra **Modo avançado** / **Configurar endereçamento** → **Modo avançado** / **Editar zona**.
4. **Remova** qualquer registro **A** em `@` que aponte para **`200.160.2.95`** (hoje o domínio cai em página errada / WhatsApp, não na Hostinger).
5. **Adicione** (não altere os servidores `a.auto.dns.br` / `b.auto.dns.br`):

| Tipo | Nome / Host | Valor | TTL |
|------|-------------|--------|-----|
| **A** | `@` (ou vazio) | `147.79.105.195` | 3600 |
| **A** | `@` | `91.108.127.233` | 3600 (se permitir 2º A) |
| **CNAME** | `www` | `setad.org.br` | 3600 |

IPs conferidos em `setad.org.br.cdn.hstgr.net` (CDN Hostinger do site). Podem mudar com o tempo — confira no hPanel ou com `Resolve-DnsName setad.org.br.cdn.hstgr.net`. Se só puder um A, use o primeiro.

6. Salve e aguarde propagação.

---

## Caminho B — Delegar DNS inteiro para a Hostinger

Só se quiser gerenciar DNS no **hPanel** da Hostinger:

1. hPanel → **Websites** → **setad.org.br** → **DNS** / **Nameservers** — copie os **4 nameservers** exibidos (costumam ser):
   - `ns1.dns-parking.com`
   - `ns2.dns-parking.com`  
   ou, em contas novas:
   - `ns1.hostinger.com`
   - `ns2.hostinger.com`
   - `ns3.hostinger.com`
   - `ns4.hostinger.com`  
   **Use os que o hPanel mostrar para o seu site** (podem variar).

2. No Registro.br → **setad.org.br** → **Alterar servidores DNS**:
   - Servidor 1: `ns1.hostinger.com` (ou o 1º do hPanel)
   - Servidor 2: `ns2.hostinger.com` (ou o 2º do hPanel)
   - Servidor 3 e 4: se o Registro.br pedir, preencha com o 3º e 4º do hPanel.

3. **Não** coloque IP nesses campos — só hostnames.

4. Na Hostinger, a zona DNS do site deve ter os registros A/CNAME criados automaticamente ou você adiciona no hPanel.

---

## Passo 1 (resumo caminho A) — Registro.br

1. Acesse [https://registro.br](https://registro.br) → login → domínio **setad.org.br**.
2. **DNS** → **Modo avançado** (não “servidores DNS” com IP).
3. Crie ou ajuste:

| Tipo | Nome / Host | Valor | TTL |
|------|-------------|--------|-----|
| **A** | `@` (ou vazio) | `147.79.105.195` | 3600 |
| **A** | `@` | `91.108.127.233` | 3600 |
| **CNAME** | `www` | `setad.org.br` | 3600 |

Remova o A antigo `200.160.2.95`. Se o painel só permitir **um** registro A em `@`, use **`147.79.105.195`**.

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
