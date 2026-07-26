import {
  ShoppingCart,
  PackageSearch,
  Wallet,
  Orbit,
  History,
  Coins,
  CreditCard,
  LucidePaperclip,
  LogOut,
  Layers,
  ShieldUser,
  IdCard,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

import { useUserStore } from "../../store/userStore";
import { usePerformanceModeStore } from "../../store/usePerformanceModeStore";
import { PageView, OPERADOR_PAGES } from "../../lib/navigation";

interface SidebarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, setCurrentPage, collapsed, onToggleCollapse }: SidebarProps) {
  const { logout, currentUser } = useUserStore();
  const { enabled: performanceMode, toggle: togglePerformanceMode } = usePerformanceModeStore();

  const isAdmin = currentUser?.rol === "admin";
  const pagesOperador = OPERADOR_PAGES;



  const menuItems: { id: PageView; label: string; icon: React.ReactNode; shortcut: string }[] = [
    {
      id: "sales",
      label: "Panel de Ventas",
      icon: <ShoppingCart className="w-5 h-5" />,
      shortcut: "Alt+1",
    },
    {
      id: "sales_history",
      label: "Historial de Ventas",
      icon: <History className="w-5 h-5" />,
      shortcut: "Alt+2",
    },
    {
      id: "inventory",
      label: "Gestión de Inventario",
      icon: <PackageSearch className="w-5 h-5" />,
      shortcut: "Alt+3",
    },
    {
      id: "bulk_edit",
      label: "Edición Múltiple",
      icon: <Layers className="w-5 h-5" />,
      shortcut: "Alt+4",
    },
    {
      id: "cash_register",
      label: "Cierre de Caja",
      icon: <Wallet className="w-5 h-5" />,
      shortcut: "Alt+5",
    },
    {
      id: "expense_management",
      label: "Gestión de Gastos",
      icon: <Coins className="w-5 h-5" />,
      shortcut: "Alt+6",
    },
    {
      id: "payment_methods",
      label: "Métodos de Pago",
      icon: <CreditCard className="w-5 h-5" />,
      shortcut: "Alt+7",
    },
    {
      id: "logs",
      label: "Logs",
      icon: <LucidePaperclip className="w-5 h-5" />,
      shortcut: "Alt+8",
    },
    {
      id: "business_hours",
      label: "Horario del Negocio",
      icon: <Clock className="w-5 h-5" />,
      shortcut: "Alt+9",
    },
  ];

  const menuItemsFiltered = isAdmin ? menuItems : menuItems.filter((item) => pagesOperador.includes(item.id));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 flex h-screen flex-col border-r border-gray-800 bg-gray-900 font-sans text-gray-400 transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-gray-400 shadow-md hover:text-white hover:border-gray-700 z-10"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand Section */}
      <div className={cn(
        "flex items-center gap-4 border-b border-gray-800 p-6",
        collapsed && "justify-center px-0"
      )}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Orbit className="h-7 w-7 text-white" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              Centauri
              <span className="block text-blue-400 text-lg">Balance</span>
            </h1>
            <div className="mt-1 flex items-center gap-1.5 opacity-50">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest">v1.0.41</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-1">
        {!collapsed && (
          <div className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Navegación
          </div>
        )}
        {menuItemsFiltered.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={cn(
              "group relative flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none",
              collapsed && "justify-center px-0",
              currentPage === item.id
                ? "bg-blue-600/10 text-white"
                : "hover:bg-gray-800 hover:text-gray-200"
            )}
            title={`${item.label} (${item.shortcut})`}
          >
            {/* Active Indicator */}
            {currentPage === item.id && (
              <div className="absolute left-0 h-5 w-1 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}

            <div className={cn(
              "shrink-0 transition-colors duration-200",
              currentPage === item.id ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"
            )}>
              {item.icon}
            </div>

            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>

                <kbd className={cn(
                  "hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                  currentPage === item.id
                    ? "border-blue-500/30 text-blue-400 bg-blue-500/5"
                    : "border-gray-700 text-gray-600 bg-gray-800/50"
                )}>
                  {item.shortcut}
                </kbd>
              </>
            )}
          </button>
        ))}
      </nav>

      {/* User & Footer */}
      <div className="border-t border-gray-800 p-4 bg-gray-900">
        <button
          onClick={togglePerformanceMode}
          title="Modo Rendimiento: búsqueda de productos resuelta en memoria en vez de consultar la base de datos en cada tecla. Recomendado para equipos con pocos recursos."
          className={cn(
            "mb-4 flex w-full items-center gap-3 rounded-xl bg-gray-800/50 p-3 hover:bg-gray-800 transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <Zap className={cn("h-4 w-4 shrink-0", performanceMode ? "text-amber-400" : "text-gray-500")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-xs font-semibold text-gray-300">
                Modo Rendimiento
              </span>
              <div
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  performanceMode ? "bg-amber-500" : "bg-gray-700"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    performanceMode ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </div>
            </>
          )}
        </button>

        <div className={cn(
          "mb-4 flex items-center gap-3 rounded-xl bg-gray-800/50 p-3",
          collapsed && "justify-center px-0"
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
            {isAdmin ? <ShieldUser size={20} className="text-blue-400" /> : <IdCard size={20} />}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-white uppercase">{currentUser?.nombre}</span>
              <span className="text-[10px] text-gray-500 font-medium capitalize">{currentUser?.rol}</span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={logout}
          title="Cerrar Sesión"
          className={cn(
            "w-full text-red-500/70 hover:bg-red-500/10 hover:text-red-500 border border-transparent",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="font-semibold">Cerrar Sesión</span>}
        </Button>
      </div>
    </aside>
  );
}



