import React, { useEffect, useState } from "react";
import { History, Receipt, CalendarClock, ChevronDown, ChevronUp } from "lucide-react";
import { getDb } from "../lib/db";
import { ventas, productos as productosTable } from "../lib/schema";
import { eq, desc } from "drizzle-orm";

interface SaleOperation {
  id_operacion: string;
  fecha: string;
  metodo_pago: string;
  comision_porcentaje: number;
  total: number;
  items: Array<{
    nombre_producto: string;
    cantidad: number;
    precio_venta: number;
    subtotal: number;
  }>;
}

export function SalesHistory() {
  const [operations, setOperations] = useState<SaleOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOp, setExpandedOp] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const db = await getDb();
      // Obtener todas las ventas uniéndolas con productos para tener el nombre
      const allVentas = await db
        .select({
          id_operacion: ventas.id_operacion,
          fecha: ventas.fecha,
          metodo_pago: ventas.metodo_pago,
          comision_porcentaje: ventas.comision_porcentaje,
          cantidad: ventas.cantidad,
          precio_venta: ventas.precio_venta,
          nombre_producto: productosTable.nombre,
        })
        .from(ventas)
        .leftJoin(productosTable, eq(ventas.id_producto, productosTable.id_producto))
        .orderBy(desc(ventas.id_venta));

      // Agrupar por id_operacion
      type QueryResult = typeof allVentas[0];
      const grouped = allVentas.reduce((acc: Record<string, SaleOperation>, row: QueryResult) => {
        const id_op = row.id_operacion || "Sin ID";
        if (!acc[id_op]) {
          acc[id_op] = {
            id_operacion: id_op,
            fecha: row.fecha || new Date().toISOString(),
            metodo_pago: row.metodo_pago,
            comision_porcentaje: row.comision_porcentaje,
            total: 0,
            items: [],
          };
        }

        const subtotal = row.cantidad * row.precio_venta;
        acc[id_op].total += subtotal;
        acc[id_op].items.push({
          nombre_producto: row.nombre_producto || "Producto Desconocido",
          cantidad: row.cantidad,
          precio_venta: row.precio_venta,
          subtotal: subtotal,
        });

        return acc;
      }, {} as Record<string, SaleOperation>);

      // Convertir a array y ordenar por fecha descendente
      const sortedOperations = (Object.values(grouped) as SaleOperation[]).sort((a: SaleOperation, b: SaleOperation) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setOperations(sortedOperations);
    } catch (error) {
      console.error("Error al cargar el historial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOp(expandedOp === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Historial de Ventas
          </h1>
          <p className="text-gray-500 mt-1">
            Visualice y analice todas las ventas registradas
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          Actualizar Historial
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : operations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No hay ventas registradas</h3>
          <p className="mt-1">Las ventas que realice en el Punto de Venta aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Fecha y Hora</th>
                  <th className="py-4 px-6 font-medium">ID Operación</th>
                  <th className="py-4 px-6 font-medium">Método de Pago</th>
                  <th className="py-4 px-6 font-medium text-right">Monto Total</th>
                  <th className="py-4 px-6 font-medium text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {operations.map((op) => (
                  <React.Fragment key={op.id_operacion}>
                    <tr 
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(op.id_operacion)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <CalendarClock className="w-4 h-4 text-gray-400" />
                          {new Date(op.fecha).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                        {op.id_operacion.split("-")[0] || op.id_operacion}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {op.metodo_pago}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right border-l border-gray-50 bg-gray-50/30">
                        <div className="font-bold text-gray-900">${op.total.toFixed(2)}</div>
                        {op.comision_porcentaje > 0 && (
                          <div className="text-xs text-red-500 font-medium">
                            -${(op.total * (op.comision_porcentaje / 100)).toFixed(2)} retención ({op.comision_porcentaje}%)
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-400">
                        {expandedOp === op.id_operacion ? (
                          <ChevronUp className="w-5 h-5 mx-auto" />
                        ) : (
                          <ChevronDown className="w-5 h-5 mx-auto" />
                        )}
                      </td>
                    </tr>
                    
                    {expandedOp === op.id_operacion && (
                      <tr className="bg-gray-50/80 border-b border-gray-200/60">
                        <td colSpan={5} className="py-4 px-6">
                          <div className="bg-white border text-sm border-gray-200 rounded-lg shadow-sm">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-gray-100 text-gray-500">
                                  <th className="py-2 px-4 font-normal">Producto</th>
                                  <th className="py-2 px-4 font-normal text-center">Cant.</th>
                                  <th className="py-2 px-4 font-normal text-right">Precio</th>
                                  <th className="py-2 px-4 font-normal text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {op.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                    <td className="py-2 px-4 font-medium text-gray-800">{item.nombre_producto}</td>
                                    <td className="py-2 px-4 text-center text-gray-600">{item.cantidad}</td>
                                    <td className="py-2 px-4 text-right text-gray-500">${item.precio_venta.toFixed(2)}</td>
                                    <td className="py-2 px-4 text-right font-medium text-gray-700">${item.subtotal.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
