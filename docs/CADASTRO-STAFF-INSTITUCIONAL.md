# Cadastro institucional — primeiro acesso (senha)

Cada pessoa usa **o próprio e-mail** em [primeiro-acesso-institucional.html](../primeiro-acesso-institucional.html) (ou link no [login institucional](../login-direcao.html)).

Fluxo: e-mail autorizado → criar senha → código de 6 dígitos (e-mail com SMTP ou log do servidor em teste) → painel conforme o perfil.

## Equipe autorizada (produção)

| Perfil | Nome | E-mail |
|--------|------|--------|
| Diretor | Enoc Miranda da Silva | enocmiranda26@gmail.com |
| Contador | Rafael Gadelha | rafaeladmtc@gmail.com |
| Secretaria | Laís Santiago da Silva | santiagolais324@gmail.com |
| Secretaria | Ledyanny Maria | ledyannymaria.02@gmail.com |
| Secretaria | Kathlen Santiago | kathlensantiago@gmail.com |
| Direção, contabilidade e secretaria | Gabriel Rubens | gabrielrubens0@gmail.com |

Gabriel está autorizado com **três perfis** (`diretor`, `contador`, `secretaria`): um login no [primeiro acesso institucional](primeiro-acesso-institucional.html) permite abrir `painel-diretor.html`, `painel-contador.html` e `painel-secretaria.html`.

## Destino após ativação

| Perfil | Painel |
|--------|--------|
| `diretor` | `painel-direcao.html` |
| `contador` | `painel-contador.html` |
| `secretaria` | `painel-secretaria.html` |

## Manutenção

- Novos e-mails: diretor logado → API `POST /api/auth/staff/autorizados` ou variável `SETAD_STAFF_AUTORIZADOS_JSON` no hPanel (reinicia o app).
- Detalhes técnicos: [STAFF-PRIMEIRO-ACESSO.md](STAFF-PRIMEIRO-ACESSO.md).
