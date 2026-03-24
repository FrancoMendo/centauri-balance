import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Toaster } from 'sonner';
import { Sidebar, PageView } from "./components/layout/Sidebar";
import { SalesPanel } from "./pages/SalesPanel";
import { SalesHistory } from "./pages/SalesHistory";
import { ExpenseManagement } from "./pages/ExpenseManagement";
import { PaymentMethodsManagement } from "./pages/PaymentMethodsManagement";
import { InventoryManagement } from "./pages/InventoryManagement";
import { CashRegisterClose } from "./pages/CashRegisterClose";
import Logs from "./pages/Logs";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("sales");

  // Atajos de teclado globales para navegación entre páginas
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) return;

    const pageMap: Record<string, PageView> = {
      "1": "sales",
      "2": "sales_history",
      "3": "inventory",
      "4": "cash_register",
      "5": "expense_management",
      "6": "payment_methods",
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
      <Toaster position="top-right" richColors closeButton />
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Contenido principal - con margin left para la sidebar fija */}
      <main className="flex-1 ml-64 p-8 min-w-0 flex justify-center">
        <div className="w-[90%] 2xl:w-[85%] max-w-[1600px]">
          {currentPage === "sales" && <SalesPanel />}
          {currentPage === "sales_history" && <SalesHistory />}
          {currentPage === "inventory" && <InventoryManagement />}
          {currentPage === "cash_register" && <CashRegisterClose />}
          {currentPage === "expense_management" && <ExpenseManagement />}
          {currentPage === "payment_methods" && <PaymentMethodsManagement />}
          {currentPage === "logs" && <Logs />}
        </div>
      </main>
    </div>
  );
}

export default App;

