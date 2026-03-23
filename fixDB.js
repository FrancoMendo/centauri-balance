import Database from 'better-sqlite3';

const dbPath = './src-tauri/centauri-dev.db';
const db = new Database(dbPath);

console.log("⚙️ Reparando esquema SQLite manualmente sin perder datos...");

try {
  // 1. Añadir nueva columna y renombrar columnas obsoletas ignorando si ya existen
  try { 
    db.exec('ALTER TABLE productos ADD COLUMN precio_lista REAL NOT NULL DEFAULT 0;'); 
    console.log("✅ Columna precio_lista añadida a productos.");
  } catch(e) { }

  try { 
    db.exec('ALTER TABLE productos RENAME COLUMN precio TO precio_venta;'); 
    console.log("✅ Columna precio de productos renombrada a precio_venta.");
  } catch(e) { }

  try { 
    db.exec('ALTER TABLE ventas RENAME COLUMN precio TO precio_venta;'); 
    console.log("✅ Columna precio de ventas renombrada a precio_venta.");
  } catch(e) { }

  // 2. Prevenir el Foreign Key Constraint:
  // Como `ventas` y `logs` requieren de un ID de usuario para registrarse y Drizzle forzó los Foreign Keys,
  // si la tabla `usuarios` está en 0, todo crashaba al registrar una venta o un log.
  // Sembraremos el usuario raíz.
  db.exec("INSERT OR IGNORE INTO usuarios (id_usuario, nombre, password, rol) VALUES (1, 'Administrador Central', '1234', 'admin');");
  console.log("✅ Usurio raíz (ID: 1) asegurado para Foreign Keys.");

  console.log("🚀 Base de datos sincronizada y funcional. Cierre la terminal si lo desea.");
} catch(err) {
  console.error("❌ Error imprevisto al reparar DB:", err);
}

db.close();
