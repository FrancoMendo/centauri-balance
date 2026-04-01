@echo off
echo ==========================================================
echo   Preparacion: Centauri Balance para Windows 7 (32-bit)
echo ==========================================================
echo.

echo [PASO 1] Agregando target Rust para 32-bit (i686)...
rustup target add i686-pc-windows-msvc
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo rustup. Asegurate de tener Rust instalado.
    pause
    exit /b 1
)
echo [OK] Target i686 listo.
echo.

echo [PASO 2] Compilando para Windows 7 / 32-bit...
echo (Esto puede tardar 5-15 minutos la primera vez)
echo.
cd /d "%~dp0.."
npm run tauri build -- --target i686-pc-windows-msvc

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El build fallo.
    echo.
    echo Posibles causas:
    echo   1. Falta la carpeta src-tauri\webview2-fixed-x86\
    echo      -> Corre primero: INSTALACION_WINDOWS7\descargar_webview2.ps1
    echo   2. Falta el target Rust i686
    echo      -> Corre: rustup target add i686-pc-windows-msvc
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================================
echo   BUILD EXITOSO!
echo   Instalador generado en:
echo   src-tauri\target\i686-pc-windows-msvc\release\bundle\
echo ==========================================================
pause
