import { CheckCircle2, Database, LockKeyhole, Search } from "lucide-react";
import type { ReactNode } from "react";
import { SmartSourceLogo } from "../brand/SmartSourceLogo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const highlights = [
  { label: "Suplidores organizados", icon: Database },
  { label: "Búsqueda rápida", icon: Search },
  { label: "Acceso protegido", icon: LockKeyhole },
];

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-white shadow-soft lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-ink p-6 text-white sm:p-7 lg:p-9">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-sky-400 to-amber-400" />
          <div className="relative">
            <SmartSourceLogo size="lg" tone="light" />

            <div className="mt-10 max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-100">{eyebrow}</p>
              <h1 className="mt-3 text-2xl font-bold leading-tight">{title}</h1>
              <p className="mt-3 max-w-lg text-[13px] leading-6 text-slate-300">{description}</p>
            </div>
          </div>

          <div className="relative mt-9 grid gap-3">
            {highlights.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-100">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-semibold text-slate-100">{item.label}</p>
                <CheckCircle2 className="ml-auto h-4 w-4 text-brand-100" />
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-5 sm:p-7 lg:p-9">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
