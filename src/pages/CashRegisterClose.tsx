import { useEffect, useState, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Plus,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { useCashRegisterStore } from "../store/useCashRegisterStore";

export function CashRegisterClose() {
  const {
    todaySales,
    todayExpenses,
    expenses,
    isLoading,
    fetchTodaySummary,
    fetchExpenses,
    addExpense,
    deleteExpense,
  } = useCashRegisterStore();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const descInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodaySummary();
    fetchExpenses();
  }, [fetchTodaySummary, fetchExpenses]);

  // Atajo: Alt+E para abrir el modal de egreso
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsExpenseModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus del modal
  useEffect(() => {
    if (isExpenseModalOpen) {
      setTimeout(() => descInputRef.current?.focus(), 50);
    } else {
      setExpenseDesc("");
      setExpenseAmount("");
    }
  }, [isExpenseModalOpen]);

  const balance = todaySales.total - todayExpenses.total;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;

    await addExpense({
      descripcion: expenseDesc.trim(),
      monto: Number(expenseAmount),
      id_usuario: 1, // Temporal hasta módulo de auth
    });

    setIsExpenseModalOpen(false);
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm("¿Eliminar este egreso?")) {
      await deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
            Cierre de Caja
          </h1>
          <p className="text-gray-500 mt-1">
            Resumen diario y control de ingresos / egresos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Egreso
            <kbd className="text-[10px] font-mono text-red-400 bg-red-100 px-1.5 py-0.5 rounded border border-red-200 ml-1">
              Alt+E
            </kbd>
          </button>
        </div>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Ingresos de Hoy
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              ${todaySales.total.toFixed(2)}
            </h3>
            <span className="text-sm font-medium text-emerald-600 mt-2 block">
              {todaySales.count} venta{todaySales.count !== 1 ? "s" : ""}{" "}
              registrada{todaySales.count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
              Egresos / Gastos
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              ${todayExpenses.total.toFixed(2)}
            </h3>
            <span className="text-sm font-medium text-red-500 mt-2 block">
              {todayExpenses.count} retiro{todayExpenses.count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl flex items-start gap-4 text-white shadow-lg">
          <div className="p-3 bg-gray-700/50 text-amber-400 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">
              Balance en Caja
            </p>
            <h3
              className={`text-3xl font-bold ${balance >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              ${balance.toFixed(2)}
            </h3>
            <span className="text-sm font-medium text-gray-300 mt-2 block">
              Ingresos − Egresos
            </span>
          </div>
        </div>
      </div>

      {/* Listado de egresos del día */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Egresos de Hoy</h3>
          <span className="text-xs text-gray-500 font-mono">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No hay egresos registrados hoy.</p>
            <p className="text-sm mt-1">
              Presione{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600 font-mono text-xs">
                Alt+E
              </kbd>{" "}
              para registrar uno.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="py-3 px-6">Descripción</th>
                <th className="py-3 px-6 text-right">Monto</th>
                <th className="py-3 px-6 text-right">Hora</th>
                <th className="py-3 px-6 text-right w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map((exp) => (
                <tr
                  key={exp.id_egreso}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-6 font-medium text-gray-800">
                    {exp.descripcion}
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-semibold text-red-600">
                    -${exp.monto.toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-right text-sm text-gray-500 font-mono">
                    {exp.fecha
                      ? new Date(exp.fecha).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id_egreso)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar egreso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Nuevo Egreso */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Registrar Egreso
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="expDesc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Descripción *
                </label>
                <input
                  ref={descInputRef}
                  id="expDesc"
                  type="text"
                  required
                  placeholder="Ej. Pago a proveedor, Retiro de efectivo"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="expAmount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Monto ($) *
                </label>
                <input
                  id="expAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Guardando..." : "Registrar Egreso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
