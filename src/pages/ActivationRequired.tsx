import { ShieldAlert, CreditCard, ExternalLink } from "lucide-react";


import Card from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface Props {
  expirationDate: string | null;
  isGracePeriod: boolean;
  onContinue?: () => void;
}

export function ActivationRequired({ expirationDate, isGracePeriod, onContinue }: Props) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-neutral-950 font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-red-900/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[45%] rounded-full bg-orange-400/10 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6">
        <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">
            {isGracePeriod ? "Suscripción Próxima a Vencer" : "Licencia Desactivada"}
          </h1>
          <p className="text-neutral-400 font-medium max-w-md">
            {isGracePeriod
              ? `Tu contrato venció el ${expirationDate}. Tienes un plazo de gracia de 5 días para renovar antes del bloqueo total.`
              : `Tu periodo de gracia ha finalizado. Por favor, contacta con soporte para reactivar tu cuenta y continuar gestionando tu negocio.`}
          </p>
        </div>

        <Card className="w-full border-white/10 bg-white/5 p-8 backdrop-blur-xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                <CreditCard size={24} />
              </div>
              <div className="flex-1">
                <span className="block text-xs font-bold text-neutral-500 uppercase">Fecha de Vencimiento</span>
                <span className="text-lg font-bold text-white">{expirationDate || "Desconocida"}</span>
              </div>
              {isGracePeriod && (
                <div className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-black uppercase text-orange-400 border border-orange-500/30">
                  Modo Gracia
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col gap-3">
              {isGracePeriod && (
                <Button
                  onClick={onContinue}
                  variant="outline"
                  className="w-full h-12 text-lg"
                >
                  Continuar temporalmente
                </Button>
              )}
              <Button
                className="w-full h-12 text-lg bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                onClick={() => window.location.reload()}
              >
                <ExternalLink size={18} className="mr-2" />
                Informar Pago / Reactivar
              </Button>
            </div>
          </div>
        </Card>

        <p className="mt-8 text-sm font-medium text-neutral-600">
          Centauri Balance © 2026 • Sistema de Control de Licencias
        </p>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
