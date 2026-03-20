import { InventoryList } from "../features/inventory/InventoryList";

export function InventoryManagement() {
  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-8 border-b border-gray-200 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Gestión de Inventario
          </h1>
          <p className="text-gray-500 mt-1">Administre sus productos, precios y stock disponible.</p>
        </div>
      </header>
      
      {/* Reutilizamos el potente feature que ya armaste previamente */}
      <InventoryList />
    </div>
  );
}
