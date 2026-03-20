import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Sidebar, PageView } from "./components/layout/Sidebar";
import { SalesPanel } from "./pages/SalesPanel";
import { InventoryManagement } from "./pages/InventoryManagement";
import { CashRegisterClose } from "./pages/CashRegisterClose";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("sales");

  // Atajos de teclado globales para navegación entre páginas
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) return;

    const pageMap: Record<string, PageView> = {
      "1": "sales",
      "2": "inventory",
      "3": "cash_register",
    };

    const targetPage = pageMap[e.key];
    if (targetPage) {
      e.preventDefault();
      setCurrentPage(targetPage);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

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

