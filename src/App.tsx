import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Toaster } from 'sonner';
import { Sidebar } from "./components/layout/Sidebar";
import { PageView, canAccessPage } from "./lib/navigation";
import { SalesPanel } from "./pages/SalesPanel";
import { SalesHistory } from "./pages/SalesHistory";
import { ExpenseManagement } from "./pages/ExpenseManagement";
import { PaymentMethodsManagement } from "./pages/PaymentMethodsManagement";
import { InventoryManagement } from "./pages/InventoryManagement";
import { CashRegisterClose } from "./pages/CashRegisterClose";
import { EdicionMultiple } from "./pages/EdicionMultiple";
import Logs from "./pages/Logs";
import { useUserStore } from "./store/userStore";
import Login from "./pages/Login";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("sales");
  const { currentUser } = useUserStore();

  // Atajos de teclado globales para navegación entre páginas

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.altKey || !currentUser) return;

    const pageMap: Record<string, PageView> = {
      "1": "sales",
      "2": "sales_history",
      "3": "inventory",
      "4": "bulk_edit",
      "5": "cash_register",
      "6": "expense_management",
      "7": "payment_methods",
      "8": "logs",
    };

    const targetPage = pageMap[e.key];
    if (targetPage && canAccessPage(targetPage, currentUser.rol)) {
      e.preventDefault();
      setCurrentPage(targetPage);
    }
  }, [currentUser, setCurrentPage]);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {!currentUser ? (
        <Login />
      ) : (
        <>
          <Toaster position="top-right" richColors closeButton />
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

          {/* Contenido principal - con margin left para la sidebar fija */}
          <main className="flex-1 ml-64 p-8 min-w-0 flex justify-center animate-in fade-in duration-500 overflow-y-auto">
            <div className="w-[90%] 2xl:w-[85%] max-w-[1600px]">
              {currentPage === "sales" && <SalesPanel />}
              {currentPage === "sales_history" && <SalesHistory />}
              {currentPage === "inventory" && <InventoryManagement />}

              {/* Rutas Protegidas */}
              {currentPage === "cash_register" && canAccessPage("cash_register", currentUser.rol) && <CashRegisterClose />}
              {currentPage === "expense_management" && canAccessPage("expense_management", currentUser.rol) && <ExpenseManagement />}
              {currentPage === "payment_methods" && canAccessPage("payment_methods", currentUser.rol) && <PaymentMethodsManagement />}
              {currentPage === "logs" && canAccessPage("logs", currentUser.rol) && <Logs />}
              {currentPage === "bulk_edit" && canAccessPage("bulk_edit", currentUser.rol) && <EdicionMultiple />}

              {/* Fallback si intenta entrar a algo prohibido */}
              {!canAccessPage(currentPage, currentUser.rol) && <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
                <span className="text-2xl font-bold">Acceso Denegado</span>
                <p>No tienes permisos para ver esta sección.</p>
              </div>}
            </div>
          </main>
        </>
      )}
    </div>
  );
}


export default App;

