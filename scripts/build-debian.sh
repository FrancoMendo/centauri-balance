#!/usr/bin/env bash
# build-debian.sh
# Genera el instalador .deb de Centauri Balance para Debian 12 (Bookworm).
# Compila dentro de un contenedor Docker con Debian 12 para garantizar
# compatibilidad de glibc y dependencias de sistema.
#
# Uso (desde la raíz del proyecto):
#   ./scripts/build-debian.sh            # Build completo
#   ./scripts/build-debian.sh --clean    # Elimina imágenes Docker previas antes de compilar

set -euo pipefail

# ─── Colores ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[centauri]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
die()  { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ─── Configuración ──────────────────────────────────────────────────────────
IMAGE_NAME="centauri-balance-builder"
CONTAINER_NAME="centauri-build-run"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/dist-debian"

# ─── Argumentos ─────────────────────────────────────────────────────────────
CLEAN=false
for arg in "$@"; do
  case $arg in
    --clean) CLEAN=true ;;
    *) die "Argumento desconocido: $arg" ;;
  esac
done

# ─── Prerequisitos ──────────────────────────────────────────────────────────
log "Verificando prerequisitos..."

if ! command -v docker &>/dev/null; then
  warn "Docker no está instalado."
  echo ""
  echo "Instalá Docker en CachyOS con:"
  echo "  sudo pacman -S docker"
  echo "  sudo systemctl enable --now docker"
  echo "  sudo usermod -aG docker \$USER   # luego cerrá y volvé a abrir sesión"
  echo ""
  die "Docker es necesario para compilar en entorno Debian 12."
fi

if ! docker info &>/dev/null; then
  die "El daemon de Docker no está corriendo. Ejecutá: sudo systemctl start docker"
fi

ok "Docker disponible."

# ─── Limpieza opcional ──────────────────────────────────────────────────────
if $CLEAN; then
  log "Eliminando imagen previa '$IMAGE_NAME'..."
  docker rmi "$IMAGE_NAME" 2>/dev/null || true
fi

# ─── Dockerfile inline ──────────────────────────────────────────────────────
# Se escribe en un tempdir para no ensuciar el proyecto.
TMP_DOCKERFILE="$(mktemp -d)/Dockerfile"

cat > "$TMP_DOCKERFILE" << 'DOCKERFILE'
FROM debian:12

ENV DEBIAN_FRONTEND=noninteractive

# ── Dependencias del sistema ─────────────────────────────────────────────────
# Tauri en Linux requiere WebKit2GTK 4.1, GTK 3, libssl y patchelf (para AppImage).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    build-essential \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    librsvg2-dev \
    patchelf \
    file \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 LTS (via NodeSource) ─────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Rust (via rustup, instalado para root) ───────────────────────────────────
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain stable --profile minimal
ENV PATH="/root/.cargo/bin:${PATH}"

# ── Verificar versiones ──────────────────────────────────────────────────────
RUN node --version && npm --version && cargo --version

WORKDIR /app
DOCKERFILE

# ─── Build de la imagen ──────────────────────────────────────────────────────
log "Construyendo imagen Docker 'debian:12' con dependencias de Tauri..."
log "(La primera vez puede tardar varios minutos por la descarga de Rust y deps)"
docker build \
  --tag "$IMAGE_NAME" \
  --file "$TMP_DOCKERFILE" \
  "$(dirname "$TMP_DOCKERFILE")"

ok "Imagen lista."

# ─── Preparar directorio de salida ──────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"

# ─── Compilar el proyecto dentro del contenedor ─────────────────────────────
log "Compilando Centauri Balance para Debian 12..."
log "Proyecto: $PROJECT_DIR"
log "Salida:   $OUTPUT_DIR"
echo ""

# Montamos el proyecto completo en /app del contenedor.
# node_modules y target se excluyen con volúmenes anónimos para evitar
# contaminar el árbol del host con binarios compilados para otra plataforma.
docker run --rm \
  --name "$CONTAINER_NAME" \
  --volume "$PROJECT_DIR:/app" \
  --volume "/app/node_modules" \
  --volume "/app/src-tauri/target" \
  --volume "$OUTPUT_DIR:/output" \
  --workdir /app \
  "$IMAGE_NAME" \
  bash -c '
    set -euo pipefail
    echo "[container] Instalando dependencias JS..."
    npm install --prefer-offline 2>&1

    echo "[container] Alineando @tauri-apps/api con el crate Rust tauri..."
    TAURI_RUST_VER=$(grep -A1 "^name = \"tauri\"$" src-tauri/Cargo.lock | grep version | grep -oP "\"\\K[^\"]+")
    TAURI_MINOR=$(echo "$TAURI_RUST_VER" | cut -d. -f1,2)
    echo "[container] Rust tauri: ${TAURI_RUST_VER} → instalando @tauri-apps/api@~${TAURI_MINOR}.0"
    npm install "@tauri-apps/api@~${TAURI_MINOR}.0" --no-save 2>&1

    echo "[container] Compilando (npm run tauri build --bundles deb)..."
    # Compilamos solo .deb para reducir tiempo. Quitá --bundles deb
    # si también querés AppImage o .rpm
    npm run tauri build -- --bundles deb 2>&1

    echo "[container] Buscando .deb generado..."
    DEB_FILE=$(find src-tauri/target/release/bundle/deb -name "*.deb" 2>/dev/null | head -1)

    if [ -z "$DEB_FILE" ]; then
      echo "[error] No se encontró ningún .deb en src-tauri/target/release/bundle/deb/"
      exit 1
    fi

    cp "$DEB_FILE" /output/
    echo "[container] Copiado: $DEB_FILE → /output/"
  '

# ─── Resultado ──────────────────────────────────────────────────────────────
echo ""
DEB_RESULT=$(find "$OUTPUT_DIR" -name "*.deb" | sort -r | head -1)

if [ -z "$DEB_RESULT" ]; then
  die "El build finalizó pero no se encontró ningún .deb en $OUTPUT_DIR"
fi

ok "Instalador generado exitosamente:"
echo ""
echo "  📦 $(basename "$DEB_RESULT")"
echo "  📁 $DEB_RESULT"
echo ""
echo "Para instalar en la PC con Debian 12:"
echo "  sudo dpkg -i '$(basename "$DEB_RESULT")'"
echo "  sudo apt-get install -f   # resuelve dependencias faltantes si las hay"
echo ""
