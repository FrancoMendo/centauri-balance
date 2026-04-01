import React, { useEffect, useState } from "react";
import { Receipt, Plus, Trash2, DollarSign } from "lucide-react";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { PriceInput } from "../components/PriceInput";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { getDb } from "../lib/db";
import { egresos } from "../lib/schema";
import { eq, desc } from "drizzle-orm";
import { localTimestamp } from "../lib/localTimestamp";

interface Expense {
  id_egreso: number;
  descripcion: string;
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string | null;
}

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Nuevo Gasto Formulario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descInput, setDescInput] = useState("");
  const [catInput, setCatInput] = useState("Servicios");
  const [montoInput, setMontoInput] = useState<number>(0);
  const [metodoPagoInput, setMetodoPagoInput] = useState("Efectivo");

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const db = await getDb();
      const rows = await db
        .select()
        .from(egresos)
        .orderBy(desc(egresos.id_egreso));
      
      setExpenses(rows);
    } catch (error) {
      console.error("Error al cargar egresos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descInput.trim() || montoInput <= 0) return;

    setIsSubmitting(true);
    try {
      const db = await getDb();
      await db.insert(egresos).values({
        descripcion: descInput,
        categoria: catInput,
        monto: montoInput,
        metodo_pago: metodoPagoInput,
        fecha: localTimestamp(),
        id_usuario: 1,
      });

      // Limpiar formulario
      setDescInput("");
      setMontoInput(0);
      
      alert("✅ Gasto registrado con éxito.");
      await fetchExpenses();
    } catch (error) {
      console.error("Error al guardar gasto:", error);
      alert("❌ Error al guardar el gasto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este gasto?")) return;
    try {
      const db = await getDb();
      await db.delete(egresos).where(eq(egresos.id_egreso, id));
      await fetchExpenses();
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-600" />
            Gestión de Gastos
          </h1>
          <p className="text-gray-500 mt-1">
            Controle los egresos, servicios, proveedores y otros gastos operativos
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel Izquierdo: Formulario de Nuevo Gasto */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-fit">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-red-500" /> Registrar Nuevo Gasto
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Monto ($)</Label>
              <PriceInput 
                required
                value={montoInput}
                onChange={(val) => setMontoInput(val)}
                className="w-full text-lg"
              />
            </div>
            
            <div>
              <Label>Descripción</Label>
              <Input 
                type="text"
                required
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                placeholder="Ej. Pago de factura de luz..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select 
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                >
                  <option value="Servicios">Servicios (Luz, Agua, etc.)</option>
                  <option value="Proveedores">Pago a Proveedores</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Sueldos">Sueldos / Empleados</option>
                  <option value="Otros">Otros</option>
                </Select>
              </div>
              
              <div>
                <Label>Método de Pago</Label>
                <Select 
                  value={metodoPagoInput}
                  onChange={(e) => setMetodoPagoInput(e.target.value)}
                >
                  <option value="Efectivo">Efectivo 💵</option>
                  <option value="Transferencia">Transferencia 🏦</option>
                  <option value="Tarjeta">Tarjeta 💳</option>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting}
              className="w-full mt-4"
              size="lg"
            >
              {isSubmitting ? "Guardando..." : "Guardar Gasto"}
            </Button>
          </form>
        </div>

        {/* Panel Derecho: Lista de Gastos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400" /> Historial Reciente
            </h3>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Receipt className="w-12 h-12 mb-3 text-gray-200" />
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">Descripción</th>
                    <th className="py-3 px-4 font-medium">Categoría</th>
                    <th className="py-3 px-4 font-medium">Método</th>
                    <th className="py-3 px-4 font-medium text-right">Monto</th>
                    <th className="py-3 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id_egreso} className="hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="py-3 px-4 text-gray-600">
                        {expense.fecha ? new Date(expense.fecha).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {expense.descripcion}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          {expense.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {expense.metodo_pago}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-red-600 bg-red-50/20 border-l border-red-50">
                        <PriceDisplay amount={expense.monto} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => deleteExpense(expense.id_egreso)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
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
