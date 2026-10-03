# E-mail SETAD — DNS no Registro.br (obrigatório para Gmail rápido)

O SMTP do site (`noreply@setad.org.br`) **só entrega rápido no Gmail** se o domínio publicar **SPF, DKIM e MX** no DNS que o mundo consulta.

Hoje o site `setad.org.br` usa DNS no **Registro.br** (`a.sec.dns.br`). Os registros de e-mail configurados só no hPanel Hostinger **não valem** enquanto o domínio não delegar os nameservers para a Hostinger.

## Como conferir (PowerShell)

```powershell
Resolve-DnsName setad.org.br -Type TXT -Server 8.8.8.8
Resolve-DnsName hostingermail-a._domainkey.setad.org.br -Type CNAME -Server 8.8.8.8
Resolve-DnsName _dmarc.setad.org.br -Type TXT -Server 8.8.8.8
Resolve-DnsName setad.org.br -Type MX -Server 8.8.8.8
```

Se SPF/DKIM/MX não aparecerem, o Gmail pode **demorar minutos** ou colocar em Promoções/Spam.

## O que adicionar no Registro.br

[registro.br](https://registro.br) → **setad.org.br** → **DNS** → **Modo avançado** → inclua (valores iguais aos do hPanel Hostinger → E-mails):

| Tipo | Nome / host | Valor |
|------|-------------|--------|
| **TXT** | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| **MX** | `@` | prioridade **5** → `mx1.hostinger.com` |
| **MX** | `@` | prioridade **10** → `mx2.hostinger.com` |
| **CNAME** | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` |
| **CNAME** | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` |
| **CNAME** | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com` |
| **TXT** | `_dmarc` | `v=DMARC1; p=none` |

Mantenha os registros **A** do site (`@` → IPs da Hostinger) que já existem.

TTL sugerido: 3600. Aguarde propagação (15 min a 48 h).

## Alternativa

Delegar os **servidores DNS** do domínio para a Hostinger (hPanel → nameservers). A zona de e-mail do hPanel passa a valer automaticamente.

## Depois de propagar

1. Teste de novo o primeiro acesso institucional.
2. No Gmail, pesquise: `from:noreply@setad.org.br`.
3. Diretor logado: `GET /api/auth/email/status` — campo `dnsEmail` deve indicar `okEntrega: true`.
