# App Android SETAD — JDK, SDK, keystore e Play Store

Guia para build local (Capacitor) e publicação na **Google Play**. Não commite senhas, keystores nem `local.properties`.

Visão geral Play + App Store: **[LOJAS-PLAY-APP-STORE.md](./LOJAS-PLAY-APP-STORE.md)**.

---

## Pré-requisitos no PC

| Ferramenta | Recomendação SETAD |
|------------|-------------------|
| **Node.js** | 18+ (projeto testado com 22.x) |
| **Android Studio** | Versão estável atual |
| **Android SDK** | API **35** (compile/target no `android/variables.gradle`) |
| **JDK para Gradle** | **JDK embutido do Android Studio (JBR)** — Capacitor 7.x exige **Java 21+** na compilação |

### JDK (importante)

- `JAVA_HOME` apontando só para **JDK 17** costuma falhar com: `error: invalid source release: 21`.
- No Android Studio: **Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK** → selecione **Embedded JDK** (pasta `jbr` do Studio).
- Alternativa em variáveis de ambiente (Windows), se usar Gradle no terminal:

  `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`

### Android SDK

- Confirme o caminho real do SDK (ex.: `C:\android\sdk`), não um caminho antigo em `%LOCALAPPDATA%\Android\Sdk` se essa pasta não existir.
- Variáveis opcionais (alinhar com o caminho real):

  - `ANDROID_HOME=C:\android\sdk`
  - `ANDROID_SDK_ROOT=C:\android\sdk`

- Teste no terminal: `adb version` e `sdkmanager --version`.

### `local.properties`

1. Na pasta `android/` (gerada pelo Capacitor, não vai no Git), copie o exemplo versionado:

   ```text
   copy local.properties.example local.properties
   ```

2. Edite `sdk.dir` em `local.properties` com o caminho do seu SDK.

Modelo: [`android/local.properties.example`](../android/local.properties.example).

---

## Sincronizar o app antes do build

Na raiz do repositório:

```bash
npm ci
```

Confira `js/app-config.js`:

- `API_BASE`: `https://setad.org.br/api`
- `SITE_URL`: `https://setad.org.br`

Depois:

```bash
npm run cap:sync
```

Opcional (ícones/splash): `npm run cap:assets`

Abrir no Studio:

```bash
npm run cap:android
```

---

## Checklist — assinatura e AAB para a Play Store

### 1. Keystore de upload (uma vez)

- [ ] Gerar keystore de **upload** (Android Studio: **Build → Generate Signed App Bundle / APK** → criar novo keystore).
- [ ] Guardar em local **seguro** (backup offline): arquivo `.jks` ou `.keystore`, alias, senhas.
- [ ] **Nunca** commitar keystore nem senhas no Git.
- [ ] Anotar alias e validade; Play Console usa **Play App Signing** (Google guarda a chave de distribuição na maioria dos casos).

Exemplo de criação via `keytool` (ajuste alias e caminhos; senhas fora do repositório):

```bash
keytool -genkey -v -keystore setad-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias setad-upload
```

### 2. Configurar assinatura no projeto (recomendado)

- [x] Template no repositório: `android/app/signing-release.gradle` (aplicado se existir `keystore.properties`).
- [x] Exemplo: `android/keystore.properties.example` — copie para `android/keystore.properties` (não commitar).
- [ ] Criar keystore de upload (`keytool` ou Android Studio) e preencher `keystore.properties` com senhas reais.
- [ ] Confirmar que `android/app/build.gradle` termina com o bloco abaixo (após `cap add android`, recole se o Capacitor regenerar o arquivo):

  ```gradle
  def setadKeystoreProps = rootProject.file("keystore.properties")
  if (setadKeystoreProps.exists()) {
      apply from: "signing-release.gradle"
  }
  ```

**Alternativa:** assinar só pelo assistente do Android Studio (**Generate Signed App Bundle**), sem `keystore.properties`.

### 3. Versão do app

Em `android/app/build.gradle` (`defaultConfig`):

- [ ] Aumentar `versionCode` (inteiro, sempre maior que o anterior na Play).
- [ ] Atualizar `versionName` (ex.: `1.0.1`) para usuários.

### 4. Gerar o bundle

- [ ] **Build → Generate Signed App Bundle / APK** → **Android App Bundle**.
- [ ] Ou, com assinatura configurada: `cd android` e `gradlew bundleRelease` (com `JAVA_HOME` e `ANDROID_HOME` corretos).

Artefato esperado:

`android/app/build/outputs/bundle/release/app-release.aab`

- [ ] **Não** enviar à produção um AAB assinado apenas com chave **debug**.

### 5. Testar antes de publicar

- [ ] Instalar build de teste no celular (debug ou internal testing).
- [ ] Login aluno e professor, painéis principais, logout.
- [ ] API em produção: `https://setad.org.br/api/health`

### 6. Google Play Console

- [ ] Conta desenvolvedor ativa.
- [ ] App com pacote `org.setad.seminario` (igual ao `applicationId`).
- [ ] Upload do **AAB** na faixa de teste interno → depois produção.
- [ ] Política de privacidade (URL pública), Data safety, classificação de conteúdo, screenshots, descrições.

---

## Problemas comuns

| Sintoma | Causa provável | Ação |
|--------|----------------|------|
| `invalid source release: 21` | JDK 17 no Gradle | Usar JBR do Android Studio (Java 21+) |
| SDK não encontrado | `ANDROID_HOME` errado ou sem `local.properties` | Corrigir `sdk.dir` |
| Play rejeita o AAB | Assinatura debug | Gerar **Signed** bundle com keystore de upload |
| App sem dados novos | `www/` desatualizado | `npm run cap:sync` antes do build |

---

## O que não vai no Git

- Pasta `android/` inteira (build local), **exceto** `android/local.properties.example`.
- `android/local.properties`, `keystore.properties`, `*.jks`, `*.keystore`.

Ver também: [DEPLOY.md](./DEPLOY.md) (servidor e `app-config`).
