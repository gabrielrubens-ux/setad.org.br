# Cadastro institucional — primeiro acesso (senha)

Cada pessoa usa **o próprio e-mail** em [primeiro-acesso-institucional.html](../primeiro-acesso-institucional.html) (ou link no [login institucional](../login-direcao.html)).

Fluxo: e-mail autorizado → criar senha → código de 6 dígitos → **escolha da área** (quando há mais de um perfil) → painel.

## Áreas institucionais

| Perfil (`perfil` / `perfis`) | Painel | Observação |
|------------------------------|--------|------------|
| `diretor` | `painel-diretor.html` | Direção (separada da contabilidade) |
| `contador` | `painel-contador.html` | Financeiro, DRE, bancos |
| `secretaria` | `painel-secretaria.html` | Matrículas, boletos, WhatsApp |
| `coordenacao` | `painel-coordenacao.html` | Matrículas e atendimento pedagógico |

Quem tem **vários perfis** (ex.: direção + contabilidade) entra com a **mesma senha** e escolhe a área em [escolher-area-institucional.html](../escolher-area-institucional.html) ou na aba correta do login.

## Equipe autorizada (produção)

| Perfil | Nome | E-mail |
|--------|------|--------|
| Diretor | Enoc Miranda da Silva | enocmiranda26@gmail.com |
| Contador | Rafael Gadelha | rafaeladmtc@gmail.com |
| Secretaria | Laís Santiago da Silva | santiagolais324@gmail.com |
| Secretaria | Ledyanny Maria | ledyannymaria.02@gmail.com |
| Secretaria | Kathlen Santiago | kathlensantiago@gmail.com |
| Direção, contabilidade e secretaria | Gabriel Rubens | gabrielrubens0@gmail.com |

Coordenação pedagógica: cadastrar depois com `perfil: "coordenacao"` (ou em `perfis`) via API / `SETAD_STAFF_AUTORIZADOS_JSON`.

## Manutenção

- Novos e-mails: diretor logado → `POST /api/auth/staff/autorizados` ou `SETAD_STAFF_AUTORIZADOS_JSON` no hPanel (reinicia o app).
- Detalhes: [STAFF-PRIMEIRO-ACESSO.md](STAFF-PRIMEIRO-ACESSO.md).
