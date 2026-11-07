# Checklist Play Store — este PC (Rubens)

Atualizado após `npm run cap:sync` em **07/11/2026**. Use junto com [ANDROID-PLAY-STORE.md](./ANDROID-PLAY-STORE.md).

---

## Já OK nesta máquina

| Item | Estado |
|------|--------|
| `npm run cap:sync` | OK — `www/` gerado e copiado para `android/app/src/main/assets` |
| `js/app-config.js` | Produção: `https://setad.org.br/api` e site |
| API produção | `GET https://setad.org.br/api/health` → `ok: true` |
| Projeto Android Capacitor | `android/app/build.gradle` presente |
| `applicationId` | `org.setad.seminario` (igual ao `capacitor.config.json`) |
| SDK compile/target | API **35** (`android/variables.gradle`) |
| Versão atual no Gradle | `versionCode 1`, `versionName "1.0"` |
| Assinatura release no Gradle | Bloco no fim de `build.gradle` aplica `signing-release.gradle` se existir `keystore.properties` |
| `android/local.properties` | Existe — `sdk.dir=C:\android\sdk` |
| Android SDK | `C:\android\sdk` e `%LOCALAPPDATA%\Android\Sdk` existem |
| Android Studio + JBR | Instalado em `C:\Program Files\Android\Android Studio\jbr` |
| Política privacidade (loja) | `https://setad.org.br/privacidade.html` |

---

## Falta neste PC (bloqueia ou atrasa a Play)

### 1. Keystore e assinatura (obrigatório para AAB de loja)

Passo a passo: **[CRIAR-KEYSTORE-ANDROID.md](./CRIAR-KEYSTORE-ANDROID.md)**.

- [ ] Criar keystore de upload (ex.: `setad-upload.jks` na raiz do projeto ou pasta segura **fora** do Git).
- [ ] Copiar `android/keystore.properties.example` → `android/keystore.properties` e preencher senhas/alias.
- [ ] Confirmar que o caminho `storeFile` no `keystore.properties` aponta para o `.jks` real.

**Hoje:** `keystore.properties` **não** existe; nenhum `.jks` encontrado no projeto.

### 2. Gerar o `.aab` assinado

- [ ] Gerar **Android App Bundle** assinado (release, não debug).

**Atalho recomendado agora:** Android Studio → **Build → Generate Signed App Bundle / APK** (o Studio costuma usar JDK compatível com o AGP).

**Terminal:** `gradlew bundleRelease` **falhou** neste PC com:

`Unsupported class file major version 69`

Causa: JBR do Studio é **Java 25**, enquanto o wrapper usa **Gradle 8.11.1** (ainda não roda bem com Java 25 no CLI).

**Correção para usar o terminal:**

- [ ] Instalar **JDK 21 LTS** (ex.: Temurin 21) **ou** apontar o Gradle no Studio em **Settings → Gradle → Gradle JDK** para um JDK 21 se estiver listado.
- [ ] Antes de `gradlew`, no PowerShell:

  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.x.x-hotspot"   # ajuste o caminho
  cd android
  .\gradlew.bat bundleRelease
  ```

**Java no PATH hoje:** `java -version` → **17** (serve para Node; para Gradle CLI prefira 21).

Artefato esperado:

`android/app/build/outputs/bundle/release/app-release.aab`

### 3. Teste no celular

- [ ] Abrir com `npm run cap:android` e rodar **debug** no aparelho, ou instalar build de **teste interno** depois do primeiro upload.
- [ ] Validar login aluno/professor, painéis principais e logout com API em produção.

### 4. Google Play Console (conta e loja)

- [ ] Conta desenvolvedor Google Play ativa (taxa única).
- [ ] Criar app com pacote `org.setad.seminario`.
- [ ] Upload do AAB na faixa **teste interno** → depois produção.
- [ ] Data safety, classificação de conteúdo, descrições PT.
- [ ] Screenshots de telefone + **feature graphic** 1024×500.
- [ ] Ícone 512×512 na loja (gerar/atualizar: `npm run cap:assets:android` se precisar refresh dos mipmaps).

### 5. Antes de cada novo envio à Play

- [ ] `npm run cap:sync`
- [ ] Subir `versionCode` (inteiro, sempre maior) e `versionName` em `android/app/build.gradle`
- [ ] Novo AAB assinado → upload na Play Console

---

## Revisão rápida do `build.gradle` (app)

Trecho relevante (sem alteração necessária agora):

- `applicationId "org.setad.seminario"` — correto para a loja.
- `versionCode 1` / `versionName "1.0"` — OK para o **primeiro** envio; incremente a partir do segundo.
- `release { minifyEnabled false }` — comum em Capacitor; assinatura virá do `keystore.properties` + `signing-release.gradle`.
- Hook de assinatura no final do arquivo — **presente e correto**.

---

## Comandos úteis (raiz do repo)

```powershell
npm run cap:sync
npm run cap:android
```

---

## Referências

- [LOJAS-PLAY-APP-STORE.md](./LOJAS-PLAY-APP-STORE.md) — visão geral
- [ANDROID-PLAY-STORE.md](./ANDROID-PLAY-STORE.md) — JDK, erros comuns, keystore
