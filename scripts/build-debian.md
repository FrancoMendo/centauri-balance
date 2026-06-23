# Guía: build-debian.sh

Genera un instalador `.deb` de Centauri Balance compatible con **Debian 12 (Bookworm)**.

## Por qué se necesita este script

Compilar la app directamente en CachyOS produce un binario enlazado contra `glibc 2.41+`. Debian 12 solo tiene `glibc 2.36`, por lo que al intentar abrir la app en esa PC aparece:

```
error while loading shared libraries: version 'GLIBC_2.38' not found
```

El script compila dentro de un contenedor **Docker con Debian 12**, garantizando que el binario resultante sea compatible.

---

## Prerequisitos

### 1. Instalar Docker

```bash
sudo pacman -S docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker   # aplica el grupo sin cerrar sesión
```

### 2. Verificar que Docker esté corriendo

```bash
sudo systemctl status docker
```

---

## Uso

Ejecutar desde la raíz del proyecto:

```bash
# Build normal
./scripts/build-debian.sh

# Reconstruir la imagen Docker desde cero (si cambiaron dependencias del sistema)
./scripts/build-debian.sh --clean
```

El instalador `.deb` queda en `dist-debian/`.

---

## Instalar en la PC con Debian 12

Copiar el `.deb` a la máquina destino y ejecutar:

```bash
sudo dpkg -i centauri-balance_0.1.0_amd64.deb
sudo apt-get install -f
```

`apt-get install -f` resuelve automáticamente cualquier dependencia del sistema que falte (WebKit2GTK, GTK3, etc.).

---

## Qué hace el script internamente

1. Verifica que Docker esté disponible y corriendo.
2. Construye una imagen `debian:12` con las dependencias de Tauri (`libwebkit2gtk-4.1`, `libgtk-3`, `libssl`, `librsvg2`, etc.), Node.js 20 LTS y Rust stable.
3. Corre un contenedor que monta el proyecto y ejecuta:
   - `npm install`
   - Ajuste de versión: lee el minor de `tauri` desde `Cargo.lock` y reinstala `@tauri-apps/api` en ese mismo minor, evitando errores por desfase entre el crate Rust y el paquete npm.
   - `npm run tauri build -- --bundles deb`
4. Copia el `.deb` a `dist-debian/`.
5. El contenedor se destruye automáticamente.

> `node_modules` y `src-tauri/target` se compilan dentro de volúmenes anónimos de Docker, sin afectar los archivos del host.
