# Publicar o app SETAD — Google Play e App Store

O app é **Capacitor** (WebView do portal) com `appId` **`org.setad.seminario`**, bundle em `www/` e API em produção (`js/app-config.js`).

| Plataforma | ID do pacote | Build local |
|------------|--------------|-------------|
| Android | `org.setad.seminario` | Windows — Android Studio |
| iOS | `org.setad.seminario` | **Mac** — Xcode (obrigatório para enviar à Apple) |

Detalhes de JDK, SDK, keystore e AAB: **[ANDROID-PLAY-STORE.md](./ANDROID-PLAY-STORE.md)**.

---

## Scripts npm (raiz do projeto)

| Comando | Uso |
|---------|-----|
| `npm run build:app` | Copia o site para `www/` |
| `npm run cap:sync` | `build:app` + sincroniza `android/` e `ios/` |
| `npm run cap:android` | Sync + abre Android Studio |
| `npm run cap:ios` | Sync + abre Xcode (só no Mac) |
| `npm run cap:add:android` | Primeira vez: cria pasta `android/` |
| `npm run cap:add:ios` | Primeira vez: cria pasta `ios/` (Mac) |
| `npm run cap:assets` | Ícones/splash Android **e** iOS |
| `npm run cap:assets:android` | Só Android |
| `npm run cap:assets:ios` | Só iOS |

Antes de qualquer build de loja:

```bash
npm ci
# Confira API_BASE e SITE_URL em js/app-config.js
npm run cap:sync
```

---

## Checklist comum (ambas as lojas)

- [ ] `https://setad.org.br/api/health` responde `ok: true`
- [ ] Login aluno (e-mail + código) e fluxos principais testados no celular
- [ ] **Política de privacidade** em URL pública (obrigatório)
- [ ] Conta de suporte / e-mail institucional na ficha da loja
- [ ] Contas **demo** para revisão (Apple costuma pedir login de teste)
- [ ] Textos, screenshots e ícone 1024×1024
- [ ] Aumentar versão nativa a cada envio (`versionCode` Android; `CFBundleVersion` iOS)

---

## Google Play Store

### Conta e custo

- [Google Play Console](https://play.google.com/console) — taxa única (~US$ 25)
- Perfil da organização (SETAD — sem fins lucrativos)

### Build

1. Android Studio com JDK do Studio (Java 21+) e SDK API 35 — ver [ANDROID-PLAY-STORE.md](./ANDROID-PLAY-STORE.md).
2. `copy android\local.properties.example android\local.properties` e ajuste `sdk.dir`.
3. **Keystore de upload** — nunca commitar (ver checklist de assinatura no guia Android).
4. **Generate Signed App Bundle** → enviar **AAB** (não APK simples para produção).

### Play Console

- [ ] Criar app; pacote `org.setad.seminario`
- [ ] Faixa **teste interno** → depois produção
- [ ] Data safety, classificação de conteúdo, descrições PT
- [ ] Feature graphic 1024×500, screenshots de telefone

---

## Apple App Store

### Conta e custo

- [Apple Developer Program](https://developer.apple.com/programs/) — ~US$ 99/ano
- Entidade: pode exigir D-U-N-S e documentos da organização

### Ambiente (só Mac)

- [ ] Xcode instalado (versão compatível com Capacitor 7)
- [ ] `npm run cap:add:ios` (se ainda não existir `ios/`)
- [ ] `npm run cap:ios` → abrir projeto no Xcode
- [ ] **Signing & Capabilities**: Team da conta Apple, Bundle ID `org.setad.seminario`
- [ ] Criar o App ID no [Apple Developer](https://developer.apple.com/account) se o Xcode pedir

### Build e envio

1. No Xcode: selecionar **Any iOS Device** → **Product → Archive**
2. **Distribute App** → **App Store Connect**
3. Ou enviar via **TestFlight** para testes internos antes da revisão

### App Store Connect

- [ ] Novo app, bundle `org.setad.seminario`
- [ ] Metadados, screenshots (tamanhos exigidos por modelo de iPhone)
- [ ] **App Privacy** (nutrition labels): login, e-mail, dados acadêmicos, etc.
- [ ] URL de política de privacidade
- [ ] Credenciais de teste na nota para o revisor

---

## O que não vai no Git

Conforme `.gitignore`:

- `www/`, `android/**` (exceto `android/local.properties.example`), `ios/`
- Keystores (`*.jks`, `*.keystore`), `keystore.properties`, `.env*`

---

## Referências no repositório

- `capacitor.config.json` — `appId`, splash, status bar
- `js/app-config.js` — `API_BASE` / `SITE_URL` para o app nativo
- `js/native-bridge.js` + `js/api-client.js` — token Bearer no app
- `scripts/prepare-www.mjs` — páginas copiadas para o bundle
- [DEPLOY.md](./DEPLOY.md) — servidor e site em produção
