# Auditoria DNS — setad.org.br (2026-10-03)

## Quem responde o DNS hoje (público)

| Item | Valor atual (Google DNS 8.8.8.8) |
|------|-----------------------------------|
| Nameservers | `a.sec.dns.br`, `b.sec.dns.br` (DNS Registro.br) |
| Registro no Hostinger | domínio ativo; NS no WHOIS: `a.auto.dns.br` / `b.auto.dns.br` |
| **A** `@` | `77.37.42.150` (site responde) |
| **TXT** SPF | **não publicado** |
| **MX** | **não publicado** |
| **DKIM** CNAME | **não publicado** |
| **DMARC** | **não publicado** |
| **www** | sem CNAME público (verificar após migração) |

**Conclusão:** e-mail transacional sai pelo SMTP Hostinger, mas o Gmail **não vê** autenticação do domínio → atraso / Promoções.

---

## Zona desejada (já existe no hPanel Hostinger)

Estes registros já estão na API `dns_records_list` da Hostinger. Passam a valer na internet quando o domínio usar **nameservers Hostinger**.

| Tipo | Nome | Conteúdo | Função |
|------|------|----------|--------|
| ALIAS | `@` | `setad.org.br.cdn.hstgr.net.` | Site Node/CDN |
| TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | SPF |
| MX | `@` | `5 mx1.hostinger.com.` | E-mail entrada |
| MX | `@` | `10 mx2.hostinger.com.` | E-mail entrada |
| CNAME | `www` | `www.setad.org.br.cdn.hstgr.net.` | www |
| CNAME | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com.` | DKIM |
| CNAME | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com.` | DKIM |
| CNAME | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com.` | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none` | DMARC |
| CNAME | `autodiscover` | `autodiscover.mail.hostinger.com.` | Clientes e-mail |
| CNAME | `autoconfig` | `autoconfig.mail.hostinger.com.` | Clientes e-mail |

---

## Caminho A — Nameservers Hostinger (não disponível)

A API Hostinger retornou que o domínio **não pode ter NS alterados pela Hostinger** (gestão no Registro.br). Use o **Caminho B** abaixo.

Se no futuro o domínio for delegado à Hostinger (`ns1.hostinger.com` …), a zona da tabela “Zona desejada” já está pronta no hPanel.

### Testar após propagar

```powershell
Resolve-DnsName setad.org.br -Type TXT -Server 8.8.8.8
Resolve-DnsName setad.org.br -Type MX -Server 8.8.8.8
Resolve-DnsName hostingermail-a._domainkey.setad.org.br -Type CNAME -Server 8.8.8.8
```

Ou no servidor: `GET /api/auth/email/status` (diretor) → `dnsEmail.okEntrega: true`.

---

## Caminho B — DNS no Registro.br (ação necessária agora)

Passo a passo com cada campo do painel: **`docs/REGISTRO-BR-COLAR-AGORA.md`**.

Mantenha o **A** `@` → `77.37.42.150`. Adicione SPF, 2× MX, 3× DKIM CNAME e DMARC.

Depois de salvar, rode `npm run verify:dns-email` até `okEntrega: PRONTA`.
