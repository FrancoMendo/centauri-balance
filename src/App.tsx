import { useState } from "react";
import "./App.css";
import { Sidebar, PageView } from "./components/layout/Sidebar";
import { SalesPanel } from "./pages/SalesPanel";
import { InventoryManagement } from "./pages/InventoryManagement";
import { CashRegisterClose } from "./pages/CashRegisterClose";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("sales");

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      {/* Contenido principal - con margin left para la sidebar fija */}
      <main className="flex-1 ml-64 p-8 max-w-[1400px]">
         {currentPage === "sales" && <SalesPanel />}
         {currentPage === "inventory" && <InventoryManagement />}
         {currentPage === "cash_register" && <CashRegisterClose />}
      </main>
    </div>
  );
}

export default App;
