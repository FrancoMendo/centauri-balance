// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKitGTK renderiza por software con alto uso de CPU en varias GPUs
    // (especialmente bajo Wayland/XWayland) cuando usa su compositor DMA-BUF.
    // Desactivarlo antes de crear el webview evita ese consumo constante.
    // OJO: no desactivar además WEBKIT_DISABLE_COMPOSITING_MODE — esa variable
    // apaga el compositor acelerado por completo (no solo DMA-BUF), forzando
    // TODO scroll/hover/repintado a software en el hilo principal. Eso generó
    // una regresión de scroll lento en listados en equipos de pocos núcleos.
    #[cfg(target_os = "linux")]
    unsafe {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    centauri_balance_lib::run()
}
