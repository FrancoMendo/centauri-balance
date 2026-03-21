import { ShoppingCart, PackageSearch, Wallet, Orbit, History, Coins, CreditCard } from "lucide-react";
import clsx from "clsx";

export type PageView = "sales" | "sales_history" | "inventory" | "cash_register" | "expense_management" | "payment_methods";

interface SidebarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

export function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
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
      id: "cash_register",
      label: "Cierre de Caja",
      icon: <Wallet className="w-5 h-5" />,
      shortcut: "Alt+4",
    },
    {
      id: "expense_management",
      label: "Gestión de Gastos",
      icon: <Coins className="w-5 h-5" />,
      shortcut: "Alt+5",
    },
    {
      id: "payment_methods",
      label: "Métodos de Pago",
      icon: <CreditCard className="w-5 h-5" />,
      shortcut: "Alt+6",
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800 flex items-start gap-4">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 text-white shrink-0">
          <Orbit className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide leading-tight text-white">
            Centauri
            <span className="block text-blue-400">Balance</span>
          </h1>
          <p className="text-[10px] text-gray-400 mt-1.5 font-mono uppercase tracking-[0.2em] font-semibold">POS v1.0</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none",
              currentPage === item.id 
                ? "bg-blue-600/10 text-blue-400 font-semibold" 
                : "hover:bg-gray-800 hover:text-white"
            )}
            title={`${item.label} (${item.shortcut})`}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            <kbd className={clsx(
              "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors",
              currentPage === item.id
                ? "border-blue-500/30 text-blue-400/70 bg-blue-500/5"
                : "border-gray-700 text-gray-600 bg-gray-800/50"
            )}>
              {item.shortcut}
            </kbd>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 flex justify-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} Centauri Software
      </div>
    </aside>
  );
}

