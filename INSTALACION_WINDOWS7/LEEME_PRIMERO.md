# 🚀 Guía: Distribuir Centauri Balance en Windows 7 (32-bit) SIN INTERNET

## ¿Qué problema resuelve esto?

Las aplicaciones Tauri necesitan **WebView2 Runtime** (el motor de Chromium de Microsoft).
En Windows 7 sin internet, este runtime NO está instalado ni puede descargarse.
Esta guía te muestra cómo **empaquetar el runtime dentro de tu instalador**.

---

## PASO 1 — Descargar el WebView2 Fixed Version Runtime (x86, v109)

> ⚠️ **Hazlo desde una PC CON internet, antes de ir al equipo con Windows 7.**

La versión 109 es la **última compatible con Windows 7 y 8**.

### Opción A: Descargar el .CAB desde Microsoft (recomendada)

1. Abre el **Microsoft Update Catalog**:  
   👉 https://www.catalog.update.microsoft.com/Search.aspx?q=Microsoft+Edge+WebView2+Runtime+109+x86

2. Busca la entrada:  
   **"Microsoft Edge-WebView2 Runtime Version 109 Update for x86 based Editions"**

3. Haz clic en **"Download"** y copia el link del `.exe` que aparece.

4. Descarga el `.exe` (_microsoftedgestandaloneinstallerx86_...exe_).

5. Luego corre el script `extraer_webview2.ps1` (ver PASO 2).

### Opción B: Script automático (requiere internet en tu PC de desarrollo)

Corre el archivo `descargar_webview2.ps1` como administrador en tu PC de desarrollo.

---

## PASO 2 — Extraer los archivos del runtime

Después de descargar el `.exe`, corre el script PowerShell:

```
.\extraer_webview2.ps1 -InstallerPath "ruta\al\instalador.exe"
```

Esto copiará los archivos necesarios a `src-tauri\webview2-fixed-x86\`.

---

## PASO 3 — Agregar el target de 32 bits a Rust

En tu PC de DESARROLLO (la que tiene internet y Rust instalado):

```powershell
rustup target add i686-pc-windows-msvc
```

Verifica que se instaló:
```powershell
rustup target list --installed
```

Debería mostrar tanto `x86_64-pc-windows-msvc` como `i686-pc-windows-msvc`.

---

## PASO 4 — Compilar para Windows 7 / 32-bit

Una vez que `src-tauri\webview2-fixed-x86\` tenga los archivos del runtime,
ejecuta en tu PC de desarrollo:

```powershell
npm run tauri build -- --target i686-pc-windows-msvc
```

El instalador final estará en:
```
src-tauri\target\i686-pc-windows-msvc\release\bundle\msi\
```
o en la carpeta `nsis\` si usas ese bundler.

---

## PASO 5 — Instalar en la PC con Windows 7

### Requisitos mínimos del equipo destino:
- Windows 7 SP1 (Service Pack 1) ← **OBLIGATORIO**
- 400 MB de espacio libre en disco (para el runtime embebido)
- Arquitectura: 32-bit o 64-bit (ambas funcionan con el instalador x86)

### Qué necesitas llevar en un pendrive:
| Archivo | Descripción |
|---------|-------------|
| `centauri-balance_x.x.x_x86_en-US.msi` | El instalador de tu app |
| `VC_redist.x86.exe` (opcional) | Visual C++ Redistributable 2019 por si falla |

### Instalación:
1. Copia el instalador `.msi` al pendrive.
2. En la PC con Windows 7, ejecuta el `.msi` **como Administrador**.
3. Seguir el asistente de instalación normalmente.
4. La app se instala **con el runtime incluido**, sin necesitar internet.

---

## ⚠️ Problemas comunes en Windows 7

| Error | Solución |
|-------|----------|
| "Esta aplicación no puede ejecutarse en este PC" | Asegúrate de usar el instalador `x86`, no el `x64` |
| Error de DLL al iniciar | Instala [VC++ Redistributable 2019 x86](https://aka.ms/vs/17/release/vc_redist.x86.exe) |
| "Windows no puede verificar el editor" | Clic derecho → Propiedades → Desbloquear, o instala como Admin |
| Pantalla negra al abrir | El runtime no se extrajo correctamente, repasar PASO 2 |
| Windows 7 sin SP1 | Instalar SP1 desde Microsoft o llevar KB976932 en el pendrive |

---

## 📦 ¿Qué hace el "Fixed Version" en tauri.conf.json?

En lugar de que el instalador descargue WebView2 de internet durante la instalación,
**empaqueta una copia completa del runtime dentro del instalador**.

Configuración aplicada en `tauri.conf.json`:
```json
"windows": {
  "webviewInstallMode": {
    "type": "fixedRuntime",
    "path": "./webview2-fixed-x86/"
  }
}
```

**Consecuencia:** El instalador será ~180MB más pesado, pero funcionará 100% offline.

---

## 📞 Resumen rápido

```
[PC con internet] → rustup target add i686-pc-windows-msvc
[PC con internet] → Descargar WebView2 CAB/EXE v109 x86
[PC con internet] → Extraer a src-tauri/webview2-fixed-x86/
[PC con internet] → npm run tauri build -- --target i686-pc-windows-msvc
[USB pendrive]    → Copiar el .msi generado
[Windows 7]       → Ejecutar el .msi como Administrador ✅
```
