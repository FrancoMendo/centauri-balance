import React, { useEffect, useState } from "react";
import { CreditCard, PlusCircle, Trash2, Edit2, Check, X } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { getDb } from "../lib/db";
import { metodos_pago as pmTable } from "../lib/schema";
import { eq, desc } from "drizzle-orm";

interface PaymentMethod {
  id_metodo: number;
  nombre: string;
  comision_porcentaje: number;
}

export function PaymentMethodsManagement() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nombreInput, setNombreInput] = useState("");
  const [comisionInput, setComisionInput] = useState("");

  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editComision, setEditComision] = useState("");

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const db = await getDb();
      const rows = await db.select().from(pmTable).orderBy(desc(pmTable.id_metodo));
      setMethods(rows);
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInput.trim() || !comisionInput) return;

    setIsSubmitting(true);
    try {
      const db = await getDb();
      await db.insert(pmTable).values({
        nombre: nombreInput.trim(),
        comision_porcentaje: parseFloat(comisionInput),
      });

      setNombreInput("");
      setComisionInput("");
      await fetchMethods();
    } catch (error) {
      console.error("Error al crear método de pago:", error);
      alert("❌ Error al guardar el método de pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (method: PaymentMethod) => {
    setEditingId(method.id_metodo);
    setEditNombre(method.nombre);
    setEditComision(method.comision_porcentaje.toString());
  };

  const handleUpdate = async (id: number) => {
    if (!editNombre.trim() || !editComision) return;

    try {
      const db = await getDb();
      await db.update(pmTable)
        .set({
          nombre: editNombre.trim(),
          comision_porcentaje: parseFloat(editComision),
        })
        .where(eq(pmTable.id_metodo, id));

      setEditingId(null);
      await fetchMethods();
    } catch (error) {
      console.error("Error al actualizar método de pago:", error);
      alert("❌ Error al actualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este método de pago? (No afectará ventas pasadas)")) return;
    try {
      const db = await getDb();
      await db.delete(pmTable).where(eq(pmTable.id_metodo, id));
      await fetchMethods();
    } catch (error) {
      console.error("Error al eliminar método de pago:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-purple-600" />
            Métodos de Pago
          </h1>
          <p className="text-gray-500 mt-1">
            Administre las formas de cobro y sus porcentajes de retención / pérdida
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-500" /> Agregar Método
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input 
                type="text"
                required
                value={nombreInput}
                onChange={(e) => setNombreInput(e.target.value)}
                placeholder="Ej. Billetera Virtual X"
                className="focus:ring-purple-500/50"
              />
            </div>
            
            <div>
              <Label>Comisión / Pérdida (%)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={comisionInput}
                onChange={(e) => setComisionInput(e.target.value)}
                placeholder="Ej. 15.5"
                className="focus:ring-purple-500/50"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              size="lg"
            >
              {isSubmitting ? "Guardando..." : "Guardar Método"}
            </Button>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" /> Métodos Registrados
            </h3>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : methods.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <CreditCard className="w-12 h-12 mb-3 text-gray-200" />
              <p>No hay métodos de pago registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6 font-medium">Nombre</th>
                    <th className="py-4 px-6 font-medium text-right">Porcentaje Pérdida</th>
                    <th className="py-4 px-6 text-center w-[120px]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {methods.map((method) => (
                    <tr key={method.id_metodo} className="hover:bg-gray-50/50 transition-colors">
                      {editingId === method.id_metodo ? (
                        <>
                          <td className="py-3 px-6">
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                              value={editNombre}
                              onChange={(e) => setEditNombre(e.target.value)}
                            />
                          </td>
                          <td className="py-3 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input 
                                type="number" 
                                step="0.01"
                                className="w-20 border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-right"
                                value={editComision}
                                onChange={(e) => setEditComision(e.target.value)}
                              />
                              <span className="text-gray-500 text-sm">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleUpdate(method.id_metodo)}
                                className="text-green-600 hover:bg-green-50 p-1.5 rounded transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-4 px-6 font-medium text-gray-800">
                            {method.nombre}
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            <span className={method.comision_porcentaje > 0 ? "text-red-600 font-bold bg-red-50 px-2 py-1 rounded" : "text-green-600 font-bold bg-green-50 px-2 py-1 rounded"}>
                              {method.comision_porcentaje}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => startEditing(method)}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(method.id_metodo)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
