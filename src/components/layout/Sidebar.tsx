import { ShoppingCart, PackageSearch, Wallet } from "lucide-react";
import clsx from "clsx";

export type PageView = "sales" | "inventory" | "cash_register";

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
      id: "inventory",
      label: "Gestión de Inventario",
      icon: <PackageSearch className="w-5 h-5" />,
      shortcut: "Alt+2",
    },
    {
      id: "cash_register",
      label: "Cierre de Caja",
      icon: <Wallet className="w-5 h-5" />,
      shortcut: "Alt+3",
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white tracking-wide">
          <span className="text-blue-500">C</span>entauri<br />
          Balance
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">POS System v1.0</p>
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

