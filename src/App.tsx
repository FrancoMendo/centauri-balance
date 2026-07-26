import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import "./App.css";
import { Toaster } from 'sonner';
import { Sidebar } from "./components/layout/Sidebar";
import { PageView, canAccessPage } from "./lib/navigation";
import { cn } from "./lib/utils";

const SalesPanel = lazy(() => import("./pages/SalesPanel").then(m => ({ default: m.SalesPanel })));
const SalesHistory = lazy(() => import("./pages/SalesHistory").then(m => ({ default: m.SalesHistory })));
const ExpenseManagement = lazy(() => import("./pages/ExpenseManagement").then(m => ({ default: m.ExpenseManagement })));
const PaymentMethodsManagement = lazy(() => import("./pages/PaymentMethodsManagement").then(m => ({ default: m.PaymentMethodsManagement })));
const InventoryManagement = lazy(() => import("./pages/InventoryManagement").then(m => ({ default: m.InventoryManagement })));
const CashRegisterClose = lazy(() => import("./pages/CashRegisterClose").then(m => ({ default: m.CashRegisterClose })));
const EdicionMultiple = lazy(() => import("./pages/EdicionMultiple").then(m => ({ default: m.EdicionMultiple })));
const BusinessHoursSettings = lazy(() => import("./pages/BusinessHoursSettings").then(m => ({ default: m.BusinessHoursSettings })));
const Logs = lazy(() => import("./pages/Logs"));
import { useUserStore } from "./store/userStore";
import Login from "./pages/Login";
import { useLicense } from "./hooks/useLicense";
import { ActivationRequired } from "./pages/ActivationRequired";

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>("sales");
  const { currentUser } = useUserStore();
  const { status, expirationDate } = useLicense();
  const [isGraceBypassed, setIsGraceBypassed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem("sidebar_collapsed") === "true"
  );

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  }, []);

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
      "9": "business_hours",
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
      {status === "loading" ? (
        <div className="flex h-screen w-full items-center justify-center bg-neutral-950">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : status === "blocked" ? (
        <ActivationRequired expirationDate={expirationDate} isGracePeriod={false} />
      ) : status === "expired_grace" && !isGraceBypassed ? (
        <ActivationRequired 
          expirationDate={expirationDate} 
          isGracePeriod={true} 
          onContinue={() => setIsGraceBypassed(true)} 
        />
      ) : !currentUser ? (
        <Login />
      ) : (
        <>
          <Toaster position="top-right" richColors closeButton />
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapsed}
          />

          {/* Contenido principal - con margin left para la sidebar fija */}
          <main
            className={cn(
              "flex-1 p-8 min-w-0 flex justify-center overflow-y-auto transition-[margin] duration-300 ease-in-out",
              sidebarCollapsed ? "ml-20" : "ml-64"
            )}
          >
            <div className="w-[90%] 2xl:w-[85%] max-w-[1600px]">
              <Suspense fallback={<div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
                {currentPage === "sales" && <SalesPanel />}
                {currentPage === "sales_history" && <SalesHistory />}
                {currentPage === "inventory" && <InventoryManagement />}

                {/* Rutas Protegidas */}
                {currentPage === "cash_register" && canAccessPage("cash_register", currentUser.rol) && <CashRegisterClose />}
                {currentPage === "expense_management" && canAccessPage("expense_management", currentUser.rol) && <ExpenseManagement />}
                {currentPage === "payment_methods" && canAccessPage("payment_methods", currentUser.rol) && <PaymentMethodsManagement />}
                {currentPage === "logs" && canAccessPage("logs", currentUser.rol) && <Logs />}
                {currentPage === "bulk_edit" && canAccessPage("bulk_edit", currentUser.rol) && <EdicionMultiple />}
                {currentPage === "business_hours" && canAccessPage("business_hours", currentUser.rol) && <BusinessHoursSettings />}

                {/* Fallback si intenta entrar a algo prohibido */}
                {!canAccessPage(currentPage, currentUser.rol) && <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
                  <span className="text-2xl font-bold">Acceso Denegado</span>
                  <p>No tienes permisos para ver esta sección.</p>
                </div>}
              </Suspense>
            </div>
          </main>
        </>
      )}
    </div>
  );
}


export default App;

