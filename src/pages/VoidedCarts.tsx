import React, { useEffect, useState, useCallback } from "react";
import { PackageX, CalendarClock, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { getDb } from "../lib/db";
import { carritos_vaciados, usuarios } from "../lib/schema";
import { desc, and, gte, lte, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Button } from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { useBusinessHours, getBusinessDateRange } from "../hooks/useBusinessHours";
import { useUserStore } from "../store/userStore";
import { localTimestamp } from "../lib/localTimestamp";

interface VoidedCartItem {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_venta: number;
  subtotal: number;
}

type EstadoRevision = "pendiente" | "legitimo" | "falta_producto";

interface VoidedCartRow {
  id_carrito_vaciado: number;
  fecha: string;
  cantidad_items: number;
  total: number;
  id_usuario: number;
  estado_revision: EstadoRevision;
  id_usuario_revisor: number | null;
  fecha_revision: string | null;
  items: VoidedCartItem[];
}

const ESTADO_BADGE: Record<EstadoRevision, string> = {
  pendiente: "bg-gray-100 text-gray-600",
  legitimo: "bg-green-100 text-green-700",
  falta_producto: "bg-red-100 text-red-700",
};

const ESTADO_LABEL: Record<EstadoRevision, string> = {
  pendiente: "Pendiente",
  legitimo: "Legítimo",
  falta_producto: "Falta producto",
};

export function VoidedCarts() {
  const { currentUser } = useUserStore();
  const [voidedCarts, setVoidedCarts] = useState<VoidedCartRow[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { hours, isLoading: hoursLoading } = useBusinessHours();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datesReady, setDatesReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!hoursLoading) {
      const range = getBusinessDateRange(hours);
      setStartDate(range.start);
      setEndDate(range.end);
      setDatesReady(true);
    }
  }, [hoursLoading, hours]);

  useEffect(() => {
    async function loadUsers() {
      const db = await getDb();
      const rows = await db.select().from(usuarios);
      const map: Record<number, string> = {};
      rows.forEach((u: any) => { map[u.id_usuario] = u.nombre; });
      setUsersMap(map);
    }
    loadUsers();
  }, []);

  const fetchVoidedCarts = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const db = await getDb();

      const whereClause = and(
        startDate ? gte(carritos_vaciados.fecha, `${startDate.replace("T", " ")}:00`) : undefined,
        endDate ? lte(carritos_vaciados.fecha, `${endDate.replace("T", " ")}:59`) : undefined
      );

      const totalRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(carritos_vaciados)
        .where(whereClause);
      setTotalCount(totalRes[0]?.count || 0);

      const rows = await db
        .select()
        .from(carritos_vaciados)
        .where(whereClause)
        .orderBy(desc(carritos_vaciados.fecha))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const parsed: VoidedCartRow[] = rows.map((r: any) => ({
        id_carrito_vaciado: r.id_carrito_vaciado,
        fecha: r.fecha,
        cantidad_items: r.cantidad_items,
        total: r.total,
        id_usuario: r.id_usuario,
        estado_revision: r.estado_revision,
        id_usuario_revisor: r.id_usuario_revisor,
        fecha_revision: r.fecha_revision,
        items: JSON.parse(r.items_json || "[]"),
      }));

      setVoidedCarts(parsed);
    } catch (error) {
      console.error("Error al cargar carritos cancelados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, pageSize]);

  useEffect(() => {
    if (datesReady) {
      fetchVoidedCarts(currentPage);
    }
  }, [currentPage, datesReady, fetchVoidedCarts]);

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchVoidedCarts(1);
    } else {
      setCurrentPage(1);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSetEstado = async (id: number, estado: EstadoRevision) => {
    try {
      const db = await getDb();
      await db
        .update(carritos_vaciados)
        .set({
          estado_revision: estado,
          id_usuario_revisor: currentUser?.id_usuario ?? null,
          fecha_revision: localTimestamp(),
        })
        .where(eq(carritos_vaciados.id_carrito_vaciado, id));
      await fetchVoidedCarts(currentPage);
    } catch (error) {
      console.error("Error al marcar revisión del carrito cancelado:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-rose-600 to-orange-600 flex items-center gap-3">
            <PackageX className="w-8 h-8 text-rose-600" />
            Carritos Cancelados
          </h1>
          <p className="text-gray-500 mt-1">
            Auditoría de carritos vaciados: revise si cada cancelación fue legítima o si faltan productos
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
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium h-[45px]"
          >
            Filtrar
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
        </div>
      ) : voidedCarts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <PackageX className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No hay carritos cancelados</h3>
          <p className="mt-1">Los carritos vaciados desde el Panel de Ventas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6 font-medium">Fecha y Hora</th>
                  <th className="py-4 px-6 font-medium">Usuario</th>
                  <th className="py-4 px-6 font-medium text-center">Ítems</th>
                  <th className="py-4 px-6 font-medium text-right">Total</th>
                  <th className="py-4 px-6 font-medium">Estado</th>
                  <th className="py-4 px-6 font-medium text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voidedCarts.map((vc) => (
                  <React.Fragment key={vc.id_carrito_vaciado}>
                    <tr
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(vc.id_carrito_vaciado)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <CalendarClock className="w-4 h-4 text-gray-400" />
                          {new Date(vc.fecha).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {usersMap[vc.id_usuario] || `Usuario #${vc.id_usuario}`}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-600">{vc.cantidad_items}</td>
                      <td className="py-4 px-6 text-right">
                        <PriceDisplay amount={vc.total} className="font-bold text-gray-900" />
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_BADGE[vc.estado_revision]}`}>
                          {ESTADO_LABEL[vc.estado_revision]}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-400">
                        {expandedId === vc.id_carrito_vaciado ? (
                          <ChevronUp className="w-5 h-5 mx-auto" />
                        ) : (
                          <ChevronDown className="w-5 h-5 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {expandedId === vc.id_carrito_vaciado && (
                      <tr className="bg-gray-50/80 border-b border-gray-200/60">
                        <td colSpan={6} className="py-4 px-6">
                          <div className="bg-white border text-sm border-gray-200 rounded-lg shadow-sm mb-4">
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
                                {vc.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                    <td className="py-2 px-4 font-medium text-gray-800">{item.nombre}</td>
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

                          {vc.estado_revision === "pendiente" ? (
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="primary"
                                className="bg-green-600 hover:bg-green-500 shadow-green-900/40"
                                onClick={() => handleSetEstado(vc.id_carrito_vaciado, "legitimo")}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Marcar legítimo
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleSetEstado(vc.id_carrito_vaciado, "falta_producto")}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Marcar falta de producto
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Revisado por {vc.id_usuario_revisor ? (usersMap[vc.id_usuario_revisor] || `Usuario #${vc.id_usuario_revisor}`) : "—"}
                              {vc.fecha_revision ? ` el ${new Date(vc.fecha_revision).toLocaleString()}` : ""}
                            </p>
                          )}
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

      {!isLoading && voidedCarts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          ITEMS_PER_PAGE={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
