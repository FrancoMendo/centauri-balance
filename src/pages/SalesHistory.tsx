import React, { useEffect, useState } from "react";
import { History, CalendarClock, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { getDb } from "../lib/db";
import { ventas, productos as productosTable } from "../lib/schema";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import Pagination from "../components/ui/Pagination";

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

  // Estados de Filtros y Paginación
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOperations, setTotalOperations] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchHistory(1);
    } else {
      setCurrentPage(1);
    }
  };

  const fetchHistory = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const db = await getDb();
      
      const whereClause = and(
        startDate ? gte(ventas.fecha, `${startDate.replace("T", " ")}:00`) : undefined,
        endDate ? lte(ventas.fecha, `${endDate.replace("T", " ")}:59`) : undefined
      );

      // 1. Obtener el conteo total de operaciones únicas en el rango
      const totalRes = await db
        .select({ 
          count: sql<number>`count(distinct ${ventas.id_operacion})` 
        })
        .from(ventas)
        .where(whereClause);
      
      const count = totalRes[0]?.count || 0;
      setTotalOperations(count);

      // 2. Obtener los IDs de operación y metadatos para la página actual
      const opsOnPage = await db
        .select({ 
          id_operacion: ventas.id_operacion,
          fecha: ventas.fecha,
          metodo_pago: ventas.metodo_pago,
          comision_porcentaje: ventas.comision_porcentaje,
        })
        .from(ventas)
        .where(whereClause)
        .groupBy(ventas.id_operacion)
        .orderBy(desc(ventas.fecha))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      if (opsOnPage.length === 0) {
        setOperations([]);
        return;
      }

      const opIds = opsOnPage.map((o: any) => o.id_operacion).filter((id: any) => id !== null) as string[];

      // 3. Obtener todos los items para estas operaciones específicas
      const allItems = await db
        .select({
          id_operacion: ventas.id_operacion,
          cantidad: ventas.cantidad,
          precio_venta: ventas.precio_venta,
          nombre_producto: productosTable.nombre,
        })
        .from(ventas)
        .leftJoin(productosTable, eq(ventas.id_producto, productosTable.id_producto))
        .where(inArray(ventas.id_operacion, opIds));

      // 4. Ensamblar los datos agrupados
      const assembledOperations = opsOnPage.map((op: any) => {
        const opItems = allItems.filter((item: any) => item.id_operacion === op.id_operacion);
        const total = opItems.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_venta), 0);
        
        return {
          id_operacion: op.id_operacion,
          fecha: op.fecha || new Date().toISOString(),
          metodo_pago: op.metodo_pago,
          comision_porcentaje: op.comision_porcentaje,
          total,
          items: opItems.map((i: any) => ({
            nombre_producto: i.nombre_producto || "Producto Desconocido",
            cantidad: i.cantidad,
            precio_venta: i.precio_venta,
            subtotal: i.cantidad * i.precio_venta
          }))
        };
      });

      setOperations(assembledOperations as SaleOperation[]);
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Historial de Ventas
          </h1>
          <p className="text-gray-500 mt-1">
            Visualice y analice todas las ventas registradas
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col">
            <Label htmlFor="start-date">Desde</Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="end-date">Hasta</Label>
            <Input
              id="end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-56"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium h-[45px]"
          >
            Filtrar
          </button>
        </div>
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
                      <td className="py-4 px-6 text-right">
                        <div className="text-right">
                          <PriceDisplay amount={op.total} className="font-bold text-gray-900 block" />
                          {op.comision_porcentaje > 0 && (
                            <div className="text-xs text-red-500 font-medium mt-1">
                              <PriceDisplay amount={-(op.total * (op.comision_porcentaje / 100))} prefix="" /> retención ({op.comision_porcentaje}%)
                            </div>
                          )}
                        </div>
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
                                    <td className="py-2 px-4 text-center">{item.cantidad} un.</td>
                                    <td className="py-2 px-4 text-right text-gray-500">
                                      <PriceDisplay amount={item.precio_venta} />
                                    </td>
                                    <td className="py-2 px-4 text-right font-medium text-gray-700">
                                      <PriceDisplay amount={item.subtotal} />
                                    </td>
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
      
      {!isLoading && operations.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalCount={totalOperations}
          ITEMS_PER_PAGE={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
