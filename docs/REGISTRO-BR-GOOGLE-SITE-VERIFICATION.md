# Google Search Console — TXT em setad.org.br

Verificação de propriedade do domínio no [Google Search Console](https://search.google.com/search-console).

## Onde cadastrar

1. [registro.br](https://registro.br) → login → **setad.org.br**
2. **DNS** → **Modo avançado** / **Editar zona**
3. **Adicionar** registro (não apague SPF/MX existentes, se já houver)

| Campo (Registro.br) | Valor |
|---------------------|--------|
| **Tipo** | `TXT` |
| **Nome / Host / Entrada** | `@` (ou vazio = raiz do domínio) |
| **Dados / Valor / Conteúdo** | `google-site-verification=4jvuURYzbNyosJ2TVpkE6hej-hjDZGfX5SGdWKqRIxQ` |
| **TTL** | `3600` (padrão) |

4. Salvar a zona e aguardar propagação (15 min a algumas horas).
5. No Search Console → **VERIFICAR**.

## Conferir (PowerShell)

```powershell
Resolve-DnsName setad.org.br -Type TXT -Server 8.8.8.8
```

Deve aparecer uma entrada contendo `google-site-verification=4jvuURYzbNyosJ2TVpkE6hej-hjDZGfX5SGdWKqRIxQ`.

## Observação

Vários registros **TXT** no mesmo host `@` são permitidos (SPF, Google, DMARC etc. ficam em linhas separadas).
