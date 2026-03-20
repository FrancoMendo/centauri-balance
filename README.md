<div align="center">
  <img src="https://tauri.app/meta/favicon-96x96.png" alt="Tauri Logo" width="80" />
  <h1>Centauri Balance</h1>
  <p><strong>Punto de Venta e Inventario Offline 100% Nativo</strong></p>
</div>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#tecnologías-utilizadas">Tecnologías</a> •
  <a href="#arquitectura-offline">Arquitectura</a> •
  <a href="#instalación">Instalación</a>
</p>

---

**Centauri Balance** es un moderno sistema de gestión comercial enfocado en pequeños y medianos comercios. Permite la administración integral del inventario, ventas, proveedores y arqueos de caja, asegurando que la información esté disponible y respaldada **siempre**, sin depender de una conexión a internet mediante tecnología de base de datos embebida de alta performance.

## ✨ Características Principales

- 🛒 **Gestión de Stock:** Altas, bajas y actualizaciones en tiempo real.
- ⚡ **Offline First:** Operable sin internet. Todo se almacena de forma persistente y segura en el almacenamiento local del equipo.
- 📦 **Punto de Venta (POS):** Diseño visualmente limpio, enfocado en conversiones rápidas mediante *optimistic UI updates* que garantizan fluidez total al cajero.
- 🔐 **Alimentación de Datos Segura:** Sin depender de `localStorage` de navegadores estándar, el motor subyacente de datos corre sobre un robusto **SQLite Nativo**. 

## 🛠 Tecnologías Utilizadas

Este proyecto es una muestra real de un desarrollo robusto Full-Stack empleando una moderna arquitectura IPC Puente (`Frontend Web` compilado en un WebView + `Backend Rust`).

- **[Tauri v2](https://v2.tauri.app/):** Aplicación de escritorio multiplataforma (Windows/macOS/Linux) ultraliviana gracias a su base escrita en Rust.
- **[React 19](https://react.dev/) + Vite:** UI declarativa y compilación inmediata.
- **[Zustand](https://zustand-demo.pmnd.rs/):** Manejo de estado predecible y performante en lugar de Redux, acelerando enormemente el Time-To-Market.
- **[Drizzle ORM](https://orm.drizzle.team/):** Modelado y query builder SQL 100% fuertemente tipado e inferido con TypeScript.
- **[Tailwind CSS v4](https://tailwindcss.com/):** Personalización de diseño orientada completamente a una User Experience premium y dinámica.

## 🗄 Arquitectura "Tauri Store"

¿Cómo se garantiza que ante una ventana de error sorpresiva el usuario nunca pierda sus mercaderías o ventas cargadas?

1. La UI despacha una acción rápida vía **Zustand**.
2. **Drizzle** intercepta esa validación de estado y encapsula la llamada SQL inyectando un **Proxy** local fuertemente tipado.
3. Un túnel de memoria (`IPC invoke()`) envía la orden hacia el backend nativo de tu computadora dictado por **Rust**.
4. El driver the SQL de Tauri graba la instrucción permanentemente bloqueando el acceso indeseado alojando tu `.db` en tu directorio `AppData` o `Application Support`.

## 🚀 Instalación y Desarrollo Local

**Requerimientos Previos:**
- [Node.js > 18](https://nodejs.org/)
- Construcción y cadena en [Rust (`rustup`)](https://rustup.rs/) Instalado.
- C++ Build Tools de Windows (Solo para Windows O.S).

```bash
# 1. Instalar dependencias JS/TS
npm install

# 2. Correr entorno de desarrollo (Compila Frontend y Backend simultáneamente)
# ⚠️ No correr Vite directo en el navegador (Chrome/Safari) o te dará error de 'invoke'.
npm run tauri dev

# 3. Empaquetar el instalador (exe, msi, app, deb) de liberación para tus clientes:
npm run tauri build
```

---
*Diseñado y codificado con pasión para demostrar habilidades de arquitectura nativa/web sobre Stack tecnológico Moderno.*
