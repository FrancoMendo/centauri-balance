import { InventoryList } from "./features/inventory/InventoryList";
import "./App.css";

function App() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Centauri Balance
            </h1>
            <p className="text-gray-500 mt-1">Gestión de inventario y caja offline</p>
          </div>
        </header>
        
        {/* Caso de uso inyectado: Feature de Inventario */}
        <InventoryList />
      </div>
    </main>
  );
}

export default App;
