import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const usuarios = sqliteTable("usuarios", {
  id_usuario: integer("id_usuario").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  password: text("password").notNull(),
  rol: text("rol").notNull().default("user"), // ej. 'admin', 'user'
});

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export const proveedores = sqliteTable("proveedores", {
  id_proveedor: integer("id_proveedor").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  direccion: text("direccion"),
  email: text("email"),
});

export type Proveedor = typeof proveedores.$inferSelect;
export type NewProveedor = typeof proveedores.$inferInsert;

export const productos = sqliteTable("productos", {
  id_producto: integer("id_producto").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  categoria: text("categoria"),
  precio_lista: real("precio_lista").notNull().default(0),
  precio_venta: real("precio_venta").notNull(),
  stock: integer("stock").notNull().default(0),
  codigo_barras: text("codigo_barras").unique(),
  descripcion: text("descripcion"),
  id_proveedor: integer("id_proveedor").references(() => proveedores.id_proveedor),
});

export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;

export const metodos_pago = sqliteTable("metodos_pago", {
  id_metodo: integer("id_metodo").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  comision_porcentaje: real("comision_porcentaje").notNull().default(0),
});

export type MetodoPago = typeof metodos_pago.$inferSelect;
export type NewMetodoPago = typeof metodos_pago.$inferInsert;

export const ventas = sqliteTable("ventas", {
  id_venta: integer("id_venta").primaryKey({ autoIncrement: true }),
  id_operacion: text("id_operacion").notNull().default(""), // Para agrupar productos de una misma venta
  id_producto: integer("id_producto").notNull().references(() => productos.id_producto),
  cantidad: integer("cantidad").notNull(),
  precio_venta: real("precio_venta").notNull(), // Precio al momento de la venta
  metodo_pago: text("metodo_pago").notNull().default("Efectivo"), // Ej. Efectivo, Tarjeta, Transferencia
  comision_porcentaje: real("comision_porcentaje").notNull().default(0), // Snapshot del % de pérdida al vender
  fecha: text("fecha").default(sql`(datetime('now','localtime'))`),
  id_usuario: integer("id_usuario").notNull().references(() => usuarios.id_usuario),
});

export type Venta = typeof ventas.$inferSelect;
export type NewVenta = typeof ventas.$inferInsert;

export const egresos = sqliteTable("egresos", {
  id_egreso: integer("id_egreso").primaryKey({ autoIncrement: true }),
  descripcion: text("descripcion").notNull(),
  categoria: text("categoria").notNull().default("Otros"), // Ej. Servicios, Proveedores, Limpieza
  monto: real("monto").notNull(),
  metodo_pago: text("metodo_pago").notNull().default("Efectivo"), // Ej. Efectivo, Tarjeta, Transferencia
  id_proveedor: integer("id_proveedor").references(() => proveedores.id_proveedor), // Opcional
  fecha: text("fecha").default(sql`(datetime('now','localtime'))`),
  id_usuario: integer("id_usuario").notNull().references(() => usuarios.id_usuario),
});

export type Egreso = typeof egresos.$inferSelect;
export type NewEgreso = typeof egresos.$inferInsert;

export const logs = sqliteTable("logs", {
  id_log: integer("id_log").primaryKey({ autoIncrement: true }),
  descripcion: text("descripcion").notNull(),
  fecha: text("fecha").default(sql`(datetime('now','localtime'))`),
  id_usuario: integer("id_usuario").references(() => usuarios.id_usuario),
});

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;

export const grupos_productos = sqliteTable("grupos_productos", {
  id_grupo: integer("id_grupo").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  ids_productos: text("ids_productos").notNull(), // Almacenaremos un JSON array stringified
});

export type GrupoProducto = typeof grupos_productos.$inferSelect;
export type NewGrupoProducto = typeof grupos_productos.$inferInsert;

export const parametros = sqliteTable("parametros", {
  id_parametro: integer("id_parametro").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  date: text("date").notNull().default(sql`(CURRENT_DATE)`), 
});

export type Parametro = typeof parametros.$inferSelect;
export type NewParametro = typeof parametros.$inferInsert;

