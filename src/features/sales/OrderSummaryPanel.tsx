import { memo } from "react";
import { ShoppingCart, Banknote } from "lucide-react";
import { PriceDisplay } from "../../components/ui/PriceDisplay";
import { Button } from "../../components/ui/Button";

interface PaymentMethodOption {
  nombre: string;
  comision: number;
}

interface OrderSummaryPanelProps {
  total: number;
  itemCount: number;
  lineCount: number;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  paymentMethodsList: PaymentMethodOption[];
  isProcessing: boolean;
  canCheckout: boolean;
  onCheckout: () => void;
}

/**
 * Memoizado por el mismo motivo que CartTable: sin memo, este panel (con su
 * cálculo de comisión) se re-renderizaba en cada tecla del buscador aunque
 * ninguno de sus datos (total, método de pago, etc.) hubiera cambiado.
 */
export const OrderSummaryPanel = memo(function OrderSummaryPanel({
  total,
  itemCount,
  lineCount,
  paymentMethod,
  onPaymentMethodChange,
  paymentMethodsList,
  isProcessing,
  canCheckout,
  onCheckout,
}: OrderSummaryPanelProps) {
  const selectedPM = paymentMethodsList.find((m) => m.nombre === paymentMethod);
  const commission = selectedPM?.comision || 0;
  const lossAmount = total * (commission / 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-emerald-600" /> Resumen de Venta
      </h3>

      <div className="flex-1 space-y-3">
        <div className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
          <span>Artículos en carrito</span>
          <span className="font-medium text-gray-900">{itemCount} un.</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 border-b border-gray-50 pb-2">
          <span>Líneas de productos</span>
          <span className="font-medium text-gray-900">{lineCount}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-6">
        <div className="flex justify-between items-end mb-6">
          <span className="text-gray-500 font-medium tracking-wide uppercase text-sm">
            Total a cobrar
          </span>
          <PriceDisplay amount={total} className="text-4xl font-bold text-gray-900" />
        </div>

        <div className="mb-6 space-y-2">
          <label className="text-sm font-medium text-gray-700">Método de Pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => onPaymentMethodChange(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow transition-colors"
            disabled={isProcessing}
          >
            {paymentMethodsList.map((pm) => (
              <option key={pm.nombre} value={pm.nombre}>
                {pm.nombre} {pm.comision > 0 ? `(-${pm.comision}%)` : ""}
              </option>
            ))}
          </select>
        </div>

        {commission > 0 && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-3 flex justify-between items-center text-sm">
            <span className="text-red-700 font-medium">Comisión retención ({commission}%)</span>
            <PriceDisplay amount={-lossAmount} className="text-red-600 font-bold" prefix="" />
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={onCheckout}
          disabled={!canCheckout || isProcessing}
          className="w-full py-4 text-lg flex items-center justify-center gap-2"
        >
          <Banknote className="w-6 h-6" />
          {isProcessing ? "Procesando..." : "Cobrar (F12)"}
        </Button>
      </div>
    </div>
  );
});
