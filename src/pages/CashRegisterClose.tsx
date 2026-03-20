import { DownloadCloud, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

export function CashRegisterClose() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
            Cierre de Caja
          </h1>
          <p className="text-gray-500 mt-1">Resumen diario y control de ingresos / egresos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <DownloadCloud className="w-4 h-4" />
          Exportar Reporte
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Ingresos de Hoy</p>
             <h3 className="text-2xl font-bold text-gray-900">$0.00</h3>
             <span className="text-sm font-medium text-emerald-600 mt-2 block">0 ventas registradas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Egresos / Gastos</p>
             <h3 className="text-2xl font-bold text-gray-900">$0.00</h3>
             <span className="text-sm font-medium text-red-500 mt-2 block">0 retiros</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl flex items-start gap-4 text-white shadow-lg">
          <div className="p-3 bg-gray-700/50 text-amber-400 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
             <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Balance Físico Estimado</p>
             <h3 className="text-3xl font-bold text-white">$0.00</h3>
             <span className="text-sm font-medium text-gray-300 mt-2 block">Caja inicial: $0.00</span>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <Wallet className="w-16 h-16 text-amber-500 mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">¿Desea cerrar la caja?</h2>
          <p className="text-gray-500 max-w-md">Establecerá el monto actual como cierre diario y sincronizará los registros de logs y egresos si hay red.</p>
          
          <button className="px-8 py-3 text-white font-medium bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-600/20 transition-all transform hover:-translate-y-0.5 mt-4">
             Efectuar Cierre de Caja
          </button>
      </div>

    </div>
  );
}
