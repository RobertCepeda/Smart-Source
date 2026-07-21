import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "../../components/auth/AuthShell";
import { GoogleButton } from "../../components/auth/GoogleButton";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
  const [email, setEmail] = useState("prueba01@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Bienvenido"
      title="Entra a tu centro de compras con calma y control."
      description="Organiza suplidores, contactos, catálogos y compras desde una interfaz limpia, rápida y fácil de entender."
    >
      <div>
        <div className="mb-6">
          <p className="text-[13px] font-semibold text-brand-700">Acceso seguro</p>
          <h2 className="mt-2 text-xl font-bold text-ink">Iniciar sesion</h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">Usa tu cuenta para continuar trabajando en Smart Source.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Correo</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 pl-9"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@empresa.com"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Contraseña</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 pl-9 pr-10"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-ink"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Mostrar contraseña"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </label>

          {message ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              {message}
            </div>
          ) : null}

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar a Smart Source"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-4">
          <GoogleButton
            onClick={() =>
              setMessage("Google esta listo en pantalla; para activarlo conectamos las credenciales de Google Cloud.")
            }
          />
        </div>

        <p className="mt-5 text-center text-[13px] text-slate-600">
          No tienes cuenta?{" "}
          <Link className="font-bold text-brand-700 hover:text-brand-600" to="/register">
            Crear cuenta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
