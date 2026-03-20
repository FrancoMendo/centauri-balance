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
  precio: real("precio").notNull(),
  stock: integer("stock").notNull().default(0),
  codigo_barras: text("codigo_barras").unique(),
  descripcion: text("descripcion"),
  id_proveedor: integer("id_proveedor").references(() => proveedores.id_proveedor),
});

export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;

export const ventas = sqliteTable("ventas", {
  id_venta: integer("id_venta").primaryKey({ autoIncrement: true }),
  id_producto: integer("id_producto").notNull().references(() => productos.id_producto),
  cantidad: integer("cantidad").notNull(),
  precio: real("precio").notNull(), // Precio al momento de la venta
  fecha: text("fecha").default(sql`(CURRENT_TIMESTAMP)`),
  id_usuario: integer("id_usuario").notNull().references(() => usuarios.id_usuario),
});

export type Venta = typeof ventas.$inferSelect;
export type NewVenta = typeof ventas.$inferInsert;

export const egresos = sqliteTable("egresos", {
  id_egreso: integer("id_egreso").primaryKey({ autoIncrement: true }),
  descripcion: text("descripcion").notNull(),
  monto: real("monto").notNull(),
  fecha: text("fecha").default(sql`(CURRENT_TIMESTAMP)`),
  id_usuario: integer("id_usuario").notNull().references(() => usuarios.id_usuario),
});

export type Egreso = typeof egresos.$inferSelect;
export type NewEgreso = typeof egresos.$inferInsert;

export const logs = sqliteTable("logs", {
  id_log: integer("id_log").primaryKey({ autoIncrement: true }),
  descripcion: text("descripcion").notNull(),
  fecha: text("fecha").default(sql`(CURRENT_TIMESTAMP)`),
  id_usuario: integer("id_usuario").references(() => usuarios.id_usuario),
});

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
