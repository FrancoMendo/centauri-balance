import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Determinar el path a la db de desarrollo
const dbPath = path.resolve(process.cwd(), './src-tauri/centauri-dev.db');
const sqlFile = path.resolve(process.cwd(), './productos.sql');

console.log(`Conectando a SQLite en: ${dbPath}`);
const db = new Database(dbPath);

console.log(`Leyendo archivo SQL: ${sqlFile}`);
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('Ejecutando sentencias (Esto puede demorar unos segundos debido al tamaño)...');

try {
  // Ejecutamos el archivo masivo. better-sqlite3 procesa múltiples sentencias con .exec
  db.exec(sqlContent);
  console.log('✅ Base de datos cargada localmente con éxito.');
} catch(error) {
  console.error('\n❌ Ocurrió un error al cargar los datos:', error.message);
  if (error.message.includes('database is locked')) {
    console.error('\n⚠️ ATENCIÓN: La base de datos está bloqueada por otro programa.');
    console.error('⚠️ Por favor cierra completamente al aplicación Tauri (la ventana del programa de Windows) o Drizzle Studio, e inténtalo de nuevo.');
  }
} finally {
  db.close();
}
