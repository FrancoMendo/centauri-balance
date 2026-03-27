import { useState } from "react";
import { useUserStore } from "../store/userStore";
import LogoApp from "../assets/logo-centauri.png";
import { IdCard, Shield, ShieldUser } from "lucide-react";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Login() {
  const [password, setPassword] = useState("");
  const { login, error, isLoading, setError } = useUserStore();

  const clearError = () => {
    if (error) setError(null);
  };

  const iniciarSesionAdmin = async () => {
    await login("admin", password);
  };

  const iniciarSesionOperador = async () => {
    await login("operador", "123");
  };

  return (
    <div className="flex flex-1 min-h-screen bg-dark-900  text-gray-900 font-sans">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col w-full justify-center items-center">
          <div className="flex justify-center mb-8">
            <img src={LogoApp} alt="Logo" className="w-80 h-80 rounded-full shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-8 text-white">Iniciar Sesión</h1>
          {error && <p className="text-red-500 text-center mb-2">{error}</p>}

          <div className="flex flex-row gap-15">
            <Card className="bg-blue-950 w-50 flex flex-col cursor-pointer items-center gap-2 rounded-lg p-4 hover:bg-blue-900 justify-center" onClick={iniciarSesionOperador}>
              <IdCard className="text-white" size={30} /><h2 className="text-white">Operador</h2>
            </Card>

            <Card className="bg-blue-950 flex flex-col cursor-pointer items-center gap-2 rounded-lg p-4 ">
              <ShieldUser className="text-white" size={30} /><h2 className="text-white">Administrador</h2>
              <div className="flex flex-col w-xs">
                <Input type="password" value={password} onChange={(e) => { clearError(); setPassword(e.target.value) }} placeholder="Contraseña" />
                <Button className="mt-3" variant="dark" onClick={iniciarSesionAdmin}>Iniciar Sesión</Button>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
