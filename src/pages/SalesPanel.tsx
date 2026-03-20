import { ShoppingCart, Barcode, Search, Banknote } from "lucide-react";

export function SalesPanel() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
            Punto de Venta
          </h1>
          <p className="text-gray-500 mt-1">Escanee o busque productos para registrar la venta</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Búsqueda y Scanner */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Barcode className="text-gray-400 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Escanear código de barras o buscar producto... (Autofocus)"
              className="w-full bg-transparent outline-none text-lg text-gray-800 placeholder:text-gray-400 font-medium"
              autoFocus
            />
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors">
              <Search className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[500px] flex items-center justify-center">
             <div className="text-center text-gray-400 flex flex-col items-center">
                 <ShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
                 <p className="font-medium text-lg">El carrito está vacío</p>
                 <p className="text-sm mt-1">Ingrese un producto para comenzar p. ej. Alt+B</p>
             </div>
          </div>
        </div>

        {/* Panel derecho: Resumen y Cobro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" /> Resumen de Venta
          </h3>

          <div className="flex-1">
             {/* Listado temporal de cobro - Placeholder */}
             <ul className="space-y-3">
               <li className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
                 <span>Subtotal</span>
                 <span className="font-medium text-gray-900">$0.00</span>
               </li>
               <li className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
                 <span>Descuentos</span>
                 <span className="font-medium text-red-500">-$0.00</span>
               </li>
             </ul>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-6">
             <div className="flex justify-between items-end mb-6">
               <span className="text-gray-500 font-medium tracking-wide uppercase text-sm">Total a cobrar</span>
               <span className="text-4xl font-bold text-gray-900">$0.00</span>
             </div>

             <button className="w-full py-4 text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 relative overflow-hidden group">
                 <span className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></span>
                 <Banknote className="w-6 h-6 relative z-10" />
                 <span className="relative z-10">Cobrar (Enter)</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
