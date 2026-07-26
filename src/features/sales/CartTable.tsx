import { memo } from "react";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { PriceInput } from "../../components/PriceInput";
import { PriceDisplay } from "../../components/ui/PriceDisplay";
import type { CartItem } from "../../store/useSalesStore";

interface CartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdatePrice: (productId: number, newPrice: number) => void;
  onRemove: (productId: number) => void;
}

/**
 * Memoizado: el buscador de arriba actualiza su estado en cada tecla, lo que
 * re-renderiza SalesPanel completo. Sin memo, esta tabla (potencialmente con
 * varios ítems y PriceInput/efectos propios) se re-ejecutaba en cada tecla
 * tipeada, lo cual se sentía como lag de tipeo en equipos de bajos recursos
 * (2 núcleos/3GB RAM). Al memoizar, React la saltea mientras `cart` y los
 * callbacks (referencias estables de Zustand) no cambien.
 */
export const CartTable = memo(function CartTable({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: CartTableProps) {
  if (cart.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400 flex flex-col items-center">
          <ShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
          <p className="font-medium text-lg">El carrito está vacío</p>
          <p className="text-sm mt-1">
            Busque un producto arriba o escanee un código de barras
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
            <th className="py-3 px-4">Producto</th>
            <th className="py-3 px-4 text-center">Cantidad</th>
            <th className="py-3 px-4 text-right">Precio Unit.</th>
            <th className="py-3 px-4 text-right">Subtotal</th>
            <th className="py-3 px-4 text-right w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cart.map((item) => (
            <tr
              key={item.product.id_producto}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="font-medium text-gray-800">
                  {item.product.nombre}
                </span>
                {item.product.codigo_barras && (
                  <span className="block text-xs text-gray-400 font-mono mt-0.5">
                    {item.product.codigo_barras}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id_producto, item.quantity - 1)
                    }
                    className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    className="w-16 text-center font-mono font-semibold text-gray-800 border border-gray-200 rounded-md py-1 outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={item.quantity || ''}
                    onChange={(e) =>
                      onUpdateQuantity(
                        item.product.id_producto,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    onBlur={(e) => {
                      if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                        onUpdateQuantity(item.product.id_producto, 1);
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.product.id_producto, item.quantity + 1)
                    }
                    className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="w-24 ml-auto">
                  <PriceInput
                    value={item.product.precio_venta}
                    onChange={(val) => onUpdatePrice(item.product.id_producto, val)}
                    className={`text-right py-1 px-2 text-sm font-semibold text-gray-700 hover:bg-white w-full transition-colors ${item.product.precio_venta === 0 ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/50 text-amber-900 shadow-sm' : 'bg-gray-50 border-gray-200'}`}
                    placeholder={item.product.precio_venta === 0 ? 'Monto requerido' : undefined}
                  />
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                <PriceDisplay amount={item.subtotal} />
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={() => onRemove(item.product.id_producto)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Quitar del carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
