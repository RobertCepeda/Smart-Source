import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import { SmartSourceLogo } from "../../components/brand/SmartSourceLogo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContext";

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@smartsource.local");
  const [password, setPassword] = useState("12345678");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const user = await login({ email, password });

      if (user.role !== "SYSTEM_ADMIN") {
        setMessage("Esta cuenta no tiene acceso al portal privado.");
        return;
      }

      navigate("/admin", { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white p-6 text-ink shadow-soft">
        <div className="mb-6">
          <SmartSourceLogo size="lg" />
          <p className="mt-4 text-[13px] font-semibold text-brand-700">Portal privado interno</p>
          <h1 className="mt-1 text-xl font-bold text-ink">Smart Source Admin</h1>
          <p className="mt-1 text-[13px] text-slate-600">Clientes, acceso y solicitudes en una entrada separada.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Correo admin</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="h-10 pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Contraseña</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="h-10 pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
          </label>

          {message ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              {message}
            </div>
          ) : null}

          <Button type="submit" className="h-10 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar al portal admin"}
          </Button>
        </form>
      </div>
    </main>
  );
}
