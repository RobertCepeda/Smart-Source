import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Eye, LockKeyhole, Mail, User } from "lucide-react";
import { AuthShell } from "../../components/auth/AuthShell";
import { GoogleButton } from "../../components/auth/GoogleButton";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS">("BUSINESS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await register({ name, company: company || undefined, email, password, accountType });
      navigate("/", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Nueva cuenta"
      title="Crea tu espacio para registrar suplidores sin enredos."
      description="Empieza con una cuenta limpia para centralizar contactos, materiales, servicios y compras de tu negocio."
    >
      <div>
        <div className="mb-6">
          <p className="text-[13px] font-semibold text-brand-700">Registro sencillo</p>
          <h2 className="mt-2 text-xl font-bold text-ink">Crear cuenta</h2>
          <p className="mt-2 text-[13px] leading-6 text-slate-600">Solo pedimos lo necesario para entrar y empezar.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <span className="mb-2 block text-[13px] font-semibold text-slate-700">Tipo de cuenta</span>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border p-3 text-left transition ${
                  accountType === "PERSONAL" ? "border-brand-500 bg-brand-50" : "border-border bg-white hover:bg-slate-50"
                }`}
                onClick={() => setAccountType("PERSONAL")}
              >
                <p className="text-[13px] font-bold text-ink">Personal</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Para una persona o negocio pequeno.</p>
              </button>
              <button
                type="button"
                className={`rounded-lg border p-3 text-left transition ${
                  accountType === "BUSINESS" ? "border-brand-500 bg-brand-50" : "border-border bg-white hover:bg-slate-50"
                }`}
                onClick={() => setAccountType("BUSINESS")}
              >
                <p className="text-[13px] font-bold text-ink">Empresarial</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Mas usuarios, permisos y soporte ampliado.</p>
              </button>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Nombre</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 pl-9"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Empresa</span>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-10 pl-9"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder={accountType === "BUSINESS" ? "Nombre de la empresa" : "Nombre comercial opcional"}
                required={accountType === "BUSINESS"}
              />
            </div>
          </label>

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
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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
            {isSubmitting ? "Creando..." : "Crear cuenta"}
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
          Ya tienes cuenta?{" "}
          <Link className="font-bold text-brand-700 hover:text-brand-600" to="/login">
            Iniciar sesion
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
