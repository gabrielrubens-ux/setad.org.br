# Criar keystore de upload (SETAD → Google Play)

A Google Play exige um **Android App Bundle (.aab)** assinado com uma chave de **upload**. Na maioria dos casos você ativa também o **Play App Signing** (a Google guarda a chave de distribuição; você só renova a chave de upload se precisar).

**Nunca** commite: `*.jks`, `*.keystore`, `android/keystore.properties` (já estão no `.gitignore`).

---

## Antes de começar

1. Escolha **duas senhas fortes** (anote em cofre de senhas, ex. Bitwarden):
   - **Senha do keystore** (`storePassword`)
   - Pode usar a **mesma** para **senha da chave** (`keyPassword`) — o exemplo do projeto assume isso.
2. **Alias** sugerido pelo projeto: `setad-upload`.
3. Local do arquivo sugerido: **`D:\PROJETOS CURSOR\site-projeto-setad\setad-upload.jks`**  
   (equivale a `storeFile=../setad-upload.jks` dentro de `android/keystore.properties`).

Faça **backup** do `.jks` em pendrive ou nuvem criptografada. **Se perder o keystore e não usar Play App Signing com recuperação, não poderá atualizar o app.**

---

## Opção A — Android Studio (mais visual)

1. `npm run cap:android` (abre o projeto).
2. **Build → Generate Signed App Bundle / APK…**
3. Selecione **Android App Bundle** → **Next**.
4. Em **Key store path**, clique **Create new…**
   - **Key store path:** `D:\PROJETOS CURSOR\site-projeto-setad\setad-upload.jks`
   - **Password / Confirm:** sua senha do keystore
   - **Alias:** `setad-upload`
   - **Key password:** mesma senha (ou outra — anote)
   - **Validity (years):** 25 ou mais (ex.: 30)
   - **Certificate:** preencha com dados da SETAD (ex.):
     - First and Last Name: `SETAD Seminario Teologico`
     - Organizational Unit: `TI` ou `Administracao`
     - Organization: `SETAD`
     - City / State / Country Code: cidade, UF, `BR`
5. Conclua a criação. O Studio pode já gerar o AAB na mesma janela (útil para o 1º teste).
6. Pule para [Configurar `keystore.properties`](#configurar-keystoreproperties).

---

## Opção B — `keytool` no PowerShell (linha de comando)

Abra **PowerShell** e cole o bloco abaixo. O `keytool` vai **perguntar** a senha do keystore e os dados do certificado (nome, organização, etc.) — **não** cole senhas neste chat.

```powershell
cd "D:\PROJETOS CURSOR\site-projeto-setad"

& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" `
  -genkeypair -v `
  -storetype JKS `
  -keystore ".\setad-upload.jks" `
  -alias setad-upload `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Durante as perguntas:

| Pergunta | Sugestão |
|----------|----------|
| Senha do keystore | Sua senha forte (mín. ~8 caracteres; misture tipos) |
| Repetir senha | Igual |
| Nome, unidade, organização… | Dados institucionais SETAD |
| `CN=…` correto? | `yes` |

Confirme que o arquivo existe:

```powershell
Test-Path ".\setad-upload.jks"
```

Deve retornar `True`.

---

## Configurar `keystore.properties`

1. Copie o exemplo:

   ```powershell
   cd "D:\PROJETOS CURSOR\site-projeto-setad\android"
   Copy-Item .\keystore.properties.example .\keystore.properties
   ```

2. Edite `android/keystore.properties` (só na sua máquina):

   ```properties
   storeFile=../setad-upload.jks
   storePassword=SUA_SENHA_AQUI
   keyAlias=setad-upload
   keyPassword=SUA_SENHA_AQUI
   ```

3. Salve. **Não** commitar este arquivo.

---

## Testar se o Gradle enxerga a assinatura

Com **JDK 21** no `JAVA_HOME` (evite Java 25 só no CLI — ver [CHECKLIST-PLAY-PC.md](./CHECKLIST-PLAY-PC.md)):

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"   # ajuste se o caminho for outro
cd "D:\PROJETOS CURSOR\site-projeto-setad\android"
.\gradlew.bat bundleRelease
```

Ou no Android Studio: **Build → Generate Signed App Bundle / APK** → keystore existente → **release**.

AAB esperado:

`android\app\build\outputs\bundle\release\app-release.aab`

---

## Play Console (primeira vez)

1. Ao subir o primeiro AAB, aceite **Play App Signing** (recomendado).
2. A Google pode pedir o certificado de upload — o Studio/`keytool` já embute isso no bundle assinado.
3. Guarde anotação: data de criação, alias, caminho do `.jks`, local do backup.

---

## Checklist rápido

- [ ] `setad-upload.jks` criado e com backup
- [ ] `android/keystore.properties` preenchido (não no Git)
- [ ] `bundleRelease` ou Signed Bundle no Studio sem erro
- [ ] AAB assinado **release** (não debug)

Próximo passo: [CHECKLIST-PLAY-PC.md](./CHECKLIST-PLAY-PC.md) → teste no celular e upload na Play Console.
