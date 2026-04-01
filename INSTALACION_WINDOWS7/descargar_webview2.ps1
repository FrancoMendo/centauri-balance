<#
.SYNOPSIS
    Descarga el WebView2 Fixed Version Runtime v109 x86 y lo copia al proyecto Tauri.
.DESCRIPTION
    Este script descarga la ultima version de WebView2 compatible con Windows 7 (v109)
    desde el Catalogo de Microsoft Update y extrae los binarios al proyecto.
.NOTES
    Ejecutar como Administrador. Requiere internet.
#>

param(
    [string]$ProyectoPath = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$DestinationPath = Join-Path $ProyectoPath "src-tauri\webview2-fixed-x86"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  WebView2 v109 x86 - Descarga y Extraccion" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Crear carpeta destino
if (-not (Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Path $DestinationPath | Out-Null
    Write-Host "[OK] Carpeta destino creada: $DestinationPath" -ForegroundColor Green
} else {
    Write-Host "[OK] Carpeta destino ya existe: $DestinationPath" -ForegroundColor Yellow
}

# URL del instalador standalone x86 v109 desde Microsoft Update Catalog
$installerUrl = "https://catalog.s.download.windowsupdate.com/c/msdownload/update/software/updt/2023/09/microsoftedgestandaloneinstallerx86_179f59bc54d73843d9288a9fd5609de0e507b911.exe"
$installerPath = Join-Path $env:TEMP "WebView2RuntimeInstallerX86_109.exe"
$extractPath   = Join-Path $env:TEMP "WebView2_109_extracted"

Write-Host "Descargando WebView2 v109 x86 (~132 MB)..." -ForegroundColor Yellow
Write-Host "URL: $installerUrl" -ForegroundColor Gray
Write-Host "(Esto puede tardar varios minutos dependiendo de tu conexion...)" -ForegroundColor Gray
Write-Host ""

try {
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($installerUrl, $installerPath)
    $size = [math]::Round((Get-Item $installerPath).Length / 1MB, 2)
    Write-Host "[OK] Descargado: $size MB" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Fallo la descarga: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "ALTERNATIVA MANUAL:" -ForegroundColor Yellow
    Write-Host "1. Abre: https://www.catalog.update.microsoft.com/Search.aspx?q=webview2+109+x86"
    Write-Host "2. Descarga el archivo para x86 (Build 109.0.1518.140)"
    Write-Host "3. Guarda el .exe en: $installerPath"
    Write-Host "4. Vuelve a ejecutar este script"
    exit 1
}

Write-Host ""
Write-Host "Extrayendo archivos del runtime..." -ForegroundColor Yellow

# Limpiar extraccion previa
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
New-Item -ItemType Directory $extractPath | Out-Null

# El installer de WebView2 acepta --extract para extraer sin instalar
try {
    $proc = Start-Process -FilePath $installerPath `
        -ArgumentList "--uncompressed-archive", $extractPath `
        -Wait -PassThru -NoNewWindow
    $exitCode = $proc.ExitCode
} catch {
    $exitCode = -1
}

# Verificar si la extraccion funciono
$files = Get-ChildItem $extractPath -Recurse -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer }
if ($files.Count -gt 0) {
    Write-Host "[OK] Extraidos $($files.Count) archivos" -ForegroundColor Green
    
    # Copiar todo al destino del proyecto
    Write-Host "Copiando a: $DestinationPath" -ForegroundColor Yellow
    Copy-Item "$extractPath\*" $DestinationPath -Recurse -Force
    
    $finalFiles = (Get-ChildItem $DestinationPath -Recurse | Where-Object { -not $_.PSIsContainer }).Count
    Write-Host "[OK] Copiados $finalFiles archivos a webview2-fixed-x86\" -ForegroundColor Green
} else {
    Write-Host "[ADVERTENCIA] La extraccion automatica no funciono (exit code: $exitCode)" -ForegroundColor Yellow
    Write-Host "Probando con expand.exe..." -ForegroundColor Yellow
    
    # Intento alternativo con expand.exe (para archivos CAB)
    $cabPath = Join-Path $env:TEMP "webview2_109.cab"
    try {
        Invoke-WebRequest -Uri "https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/671744ba-8b1f-42e2-878c-d7ae8ee081c4/Microsoft.WebView2.FixedVersionRuntime.109.0.1518.69.x86.cab" `
            -OutFile $cabPath -UseBasicParsing
        
        & expand.exe $cabPath -F:* $DestinationPath
        $finalFiles = (Get-ChildItem $DestinationPath -Recurse | Where-Object { -not $_.PSIsContainer }).Count
        Write-Host "[OK] Extraidos $finalFiles archivos desde CAB" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] No se pudo extraer automaticamente." -ForegroundColor Red
        Write-Host ""
        Write-Host "INSTRUCCION MANUAL:" -ForegroundColor Yellow
        Write-Host "1. Descarga el .CAB desde el Update Catalog (ver LEEME_PRIMERO.md)"
        Write-Host "2. Ejecuta en PowerShell:"
        Write-Host "   expand C:\ruta\al\archivo.cab -F:* `"$DestinationPath`""
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LISTO! Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "  npm run tauri build -- --target i686-pc-windows-msvc" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
