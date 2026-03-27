import React, { useState } from "react";
import { useUserStore } from "../store/userStore";
import LogoApp from "../assets/logo-centauri.png";
import { ArrowRight, IdCard, KeyRound, Loader2, ShieldUser } from "lucide-react";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";


export default function Login() {
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState<"operador" | "admin" | null>(null);
  const { login, error, isLoading, setError } = useUserStore();

  const clearError = () => {
    if (error) setError(null);
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) {
      setError("Por favor, ingrese la contraseña");
      return;
    }
    await login("admin", password);
  };

  const handleOperadorLogin = async () => {
    await login("operador", "123");
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-neutral-950 font-sans selection:bg-primary-500/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary-900/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent-400/10 blur-[120px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
        {/* Logo Section */}
        <div className="mb-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-2xl animate-pulse" />
            <img
              src={LogoApp}
              alt="Centauri Logo"
              className="relative h-40 w-40 rounded-full border-2 border-white/10 object-cover shadow-2xl transition-transform hover:scale-105 duration-500"
            />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Centauri <span className="text-primary-400">Balance</span>
          </h1>
          <p className="text-neutral-400 font-medium">Gestión de inventario y ventas</p>
        </div>

        {/* Login Card */}
        <Card className="w-full border-white/10 bg-white/5 p-8 backdrop-blur-xl animate-in zoom-in-95 duration-500">
          {!activeRole ? (
            <div className="flex flex-col space-y-4">
              <h2 className="text-xl font-bold text-white mb-4 text-center">Seleccione su rol</h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleOperadorLogin}
                  disabled={isLoading}
                  className="group flex flex-col items-center justify-center space-y-3 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-primary-500/10 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(48,121,255,0.15)] disabled:opacity-50"
                >
                  <div className="rounded-full bg-primary-500/20 p-4 text-primary-400 transition-transform group-hover:scale-110">
                    <IdCard size={32} />
                  </div>
                  <span className="font-bold text-neutral-200 group-hover:text-white">Operador</span>
                </button>

                <button
                  onClick={() => setActiveRole("admin")}
                  disabled={isLoading}
                  className="group flex flex-col items-center justify-center space-y-3 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-accent-400/10 hover:border-accent-400/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] disabled:opacity-50"
                >
                  <div className="rounded-full bg-accent-400/20 p-4 text-accent-400 transition-transform group-hover:scale-110">
                    <ShieldUser size={32} />
                  </div>
                  <span className="font-bold text-neutral-200 group-hover:text-white">Admin</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col animate-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => { setActiveRole(null); clearError(); }}
                className="mb-6 flex items-center text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Volver a roles
              </button>

              <h2 className="mb-6 text-2xl font-bold text-white">Acceso Administrador</h2>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
                    <Input
                      type="password"
                      variant="dark"
                      icon={<KeyRound />}
                      value={password}
                      onChange={(e) => { clearError(); setPassword(e.target.value) }}
                      placeholder="Contraseña Maestra"
                      className="pl-11 h-12"
                      autoFocus
                    />

                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-500 border border-red-500/20 animate-in shake-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-bold bg-primary-600 hover:bg-primary-500 text-white transition-all shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Acceder al Panel"
                  )}
                </Button>
              </form>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <p className="mt-8 text-sm font-medium text-neutral-600">
          © 2026 Centauri Balance System
        </p>
      </div>

      {/* Glassmorphism Grain Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}

