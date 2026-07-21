import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  Image,
  KeyRound,
  Link2,
  Mail,
  MonitorCog,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { UserAvatar } from "../components/shared/UserAvatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { getOrganizationWorkspaceRequest } from "../services/api";
import { cn } from "../lib/utils";

type Preferences = {
  density: "compacta" | "comoda";
  language: "es" | "en";
  currency: "DOP" | "USD" | "EUR";
  emailAlerts: boolean;
  maintenanceAlerts: boolean;
  productUpdates: boolean;
};

type SettingsModule = "profile" | "organization" | "preferences" | "notifications" | "security" | "integrations";

const PREFERENCES_KEY = "smart_source_preferences";

const defaultPreferences: Preferences = {
  density: "compacta",
  language: "es",
  currency: "DOP",
  emailAlerts: true,
  maintenanceAlerts: true,
  productUpdates: false,
};

const settingsModules: Array<{
  id: SettingsModule;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: "profile",
    label: "Perfil",
    description: "Nombre, correo y foto",
    icon: UserRound,
  },
  {
    id: "organization",
    label: "Organización",
    description: "Plan, workspace y conteos",
    icon: Building2,
  },
  {
    id: "preferences",
    label: "Preferencias",
    description: "Idioma, moneda y densidad",
    icon: SlidersHorizontal,
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Correo, mantenimiento y novedades",
    icon: Bell,
  },
  {
    id: "security",
    label: "Seguridad",
    description: "Sesión, roles y acceso",
    icon: ShieldCheck,
  },
  {
    id: "integrations",
    label: "Integraciones",
    description: "Google y conexiones externas",
    icon: Link2,
  },
];

export function Settings() {
  const { token, user, updateProfile } = useAuth();
  const [activeModule, setActiveModule] = useState<SettingsModule>("profile");
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    company: user?.company ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preferences, setPreferencesState] = useState<Preferences>(() => readPreferences());

  const organizationQuery = useQuery({
    queryKey: ["settings-organization"],
    queryFn: () => getOrganizationWorkspaceRequest(token!),
    enabled: Boolean(token),
  });

  const organization = organizationQuery.data?.organization;
  const previewUser = useMemo(
    () => ({
      name: profile.name || user?.name || "Usuario",
      avatarUrl: profile.avatarUrl || user?.avatarUrl || null,
    }),
    [profile.avatarUrl, profile.name, user?.avatarUrl, user?.name],
  );

  useEffect(() => {
    setProfile({
      name: user?.name ?? "",
      company: user?.company ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    });
  }, [user?.avatarUrl, user?.company, user?.name]);

  async function onSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setMessage("");

    try {
      await updateProfile({
        name: profile.name.trim(),
        company: profile.company.trim(),
        avatarUrl: profile.avatarUrl.trim(),
      });
      setSaveState("saved");
      setMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "No pudimos guardar el perfil.");
    }
  }

  function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferencesState((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">Cuenta</p>
          <h1 className="mt-1 text-lg font-bold text-ink">Configuración</h1>
          <p className="mt-1 text-xs text-slate-600">Ajustes por paneles, limpios y faciles de encontrar.</p>
        </div>
        <Badge tone="green">{user?.role === "SYSTEM_ADMIN" ? "Admin global" : "Workspace activo"}</Badge>
      </div>

      <section className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)]">
        <Card className="self-start overflow-hidden xl:sticky xl:top-14">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Paneles</p>
            <h2 className="mt-0.5 text-xs font-bold text-ink">Ajustes de cuenta</h2>
          </div>
          <div className="space-y-1 p-2.5">
            {settingsModules.map((module) => (
              <SettingsNavButton
                key={module.id}
                module={module}
                isActive={module.id === activeModule}
                onClick={() => setActiveModule(module.id)}
              />
            ))}
          </div>
        </Card>

        <div>
          {activeModule === "profile" ? (
            <ProfilePanel
              profile={profile}
              user={user}
              previewUser={previewUser}
              saveState={saveState}
              message={message}
              onSaveProfile={onSaveProfile}
              onProfileChange={setProfile}
            />
          ) : null}

          {activeModule === "organization" ? (
            <OrganizationPanel organization={organization} userEmail={user?.email ?? ""} />
          ) : null}

          {activeModule === "preferences" ? (
            <PreferencesPanel preferences={preferences} setPreference={setPreference} />
          ) : null}

          {activeModule === "notifications" ? (
            <NotificationsPanel preferences={preferences} setPreference={setPreference} />
          ) : null}

          {activeModule === "security" ? <SecurityPanel user={user} /> : null}

          {activeModule === "integrations" ? <IntegrationsPanel authProvider={user?.authProvider ?? "EMAIL"} /> : null}
        </div>
      </section>
    </div>
  );
}

function SettingsNavButton({
  module,
  isActive,
  onClick,
}: {
  module: (typeof settingsModules)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition",
        isActive
          ? "border-brand-200 bg-brand-50 text-brand-800"
          : "border-transparent text-slate-600 hover:border-border hover:bg-slate-50 hover:text-ink",
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isActive ? "bg-white text-brand-700" : "bg-slate-100 text-slate-500",
        )}
      >
        <module.icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{module.label}</span>
        <span className="block truncate text-[10px] text-slate-500">{module.description}</span>
      </span>
    </button>
  );
}

function ProfilePanel({
  profile,
  user,
  previewUser,
  saveState,
  message,
  onSaveProfile,
  onProfileChange,
}: {
  profile: { name: string; company: string; avatarUrl: string };
  user: ReturnType<typeof useAuth>["user"];
  previewUser: { name: string; avatarUrl: string | null };
  saveState: "idle" | "saving" | "saved" | "error";
  message: string;
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onProfileChange: React.Dispatch<React.SetStateAction<{ name: string; company: string; avatarUrl: string }>>;
}) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Perfil de usuario</h2>
      </CardHeader>
      <CardContent className="p-3">
        <form className="max-w-3xl space-y-3" onSubmit={onSaveProfile}>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-slate-50 p-2.5">
            <UserAvatar user={previewUser} className="h-10 w-10 rounded-xl text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{profile.name || user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone={user?.authProvider === "GOOGLE" ? "blue" : "slate"}>
                  {user?.authProvider === "GOOGLE" ? "Google" : "Correo"}
                </Badge>
                <Badge tone={user?.role === "ADMIN" || user?.role === "SYSTEM_ADMIN" ? "blue" : "slate"}>
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <Input
                className="h-8"
                value={profile.name}
                onChange={(event) => onProfileChange((current) => ({ ...current, name: event.target.value }))}
                placeholder="Tu nombre"
              />
            </Field>
            <Field label="Empresa">
              <Input
                className="h-8"
                value={profile.company}
                onChange={(event) => onProfileChange((current) => ({ ...current, company: event.target.value }))}
                placeholder="Nombre comercial"
              />
            </Field>
          </div>

          <Field label="Foto de perfil">
            <div className="relative">
              <Image className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-8 pl-8"
                value={profile.avatarUrl}
                onChange={(event) => onProfileChange((current) => ({ ...current, avatarUrl: event.target.value }))}
                placeholder="https://..."
              />
            </div>
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Cuando conectemos OAuth, Google llenará esta foto automáticamente.
            </p>
          </Field>

          {message ? (
            <p
              className={cn(
                "rounded-lg border px-3 py-2 text-xs",
                saveState === "error"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {message}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saveState === "saving"}>
              <Save className="h-3.5 w-3.5" />
              {saveState === "saving" ? "Guardando" : "Guardar perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function OrganizationPanel({
  organization,
  userEmail,
}: {
  organization:
    | {
        name: string;
        billingEmail: string | null;
        accountType: "PERSONAL" | "BUSINESS";
        plan: string;
        status: "ACTIVE" | "PAUSED" | "CANCELLED";
        counts: {
          users: number;
          suppliers: number;
          orders: number;
          items: number;
          supportTickets: number;
          openTickets: number;
        };
      }
    | undefined;
  userEmail: string;
}) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Organización activa</h2>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="grid gap-2 md:grid-cols-2">
          <SettingRow icon={Building2} label="Nombre" value={organization?.name ?? "Cargando"} />
          <SettingRow icon={CreditCard} label="Plan" value={organization?.plan ?? "Cargando"} />
          <SettingRow
            icon={ShieldCheck}
            label="Tipo"
            value={organization?.accountType === "BUSINESS" ? "Empresarial" : "Personal"}
          />
          <SettingRow icon={Mail} label="Correo fiscal" value={organization?.billingEmail ?? userEmail ?? "Pendiente"} />
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <MiniStat label="Usuarios" value={organization?.counts.users ?? 0} />
          <MiniStat label="Suplidores" value={organization?.counts.suppliers ?? 0} />
          <MiniStat label="Items" value={organization?.counts.items ?? 0} />
          <MiniStat label="Órdenes" value={organization?.counts.orders ?? 0} />
          <MiniStat label="Tickets" value={organization?.counts.supportTickets ?? 0} />
          <MiniStat label="Abiertos" value={organization?.counts.openTickets ?? 0} />
        </div>

        <InfoBox
          icon={CheckCircle2}
          title="Workspace separado"
          description="Cada organización mantiene sus usuarios, suplidores, tickets y compras en su propio espacio."
          tone="green"
        />
      </CardContent>
    </Card>
  );
}

function PreferencesPanel({
  preferences,
  setPreference,
}: {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Preferencias</h2>
      </CardHeader>
      <CardContent className="max-w-2xl space-y-3 p-3">
        <Field label="Densidad">
          <select
            className={controlClassName}
            value={preferences.density}
            onChange={(event) => setPreference("density", event.target.value as Preferences["density"])}
          >
            <option value="compacta">Compacta</option>
            <option value="comoda">Comoda</option>
          </select>
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Idioma">
            <select
              className={controlClassName}
              value={preferences.language}
              onChange={(event) => setPreference("language", event.target.value as Preferences["language"])}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Moneda base">
            <select
              className={controlClassName}
              value={preferences.currency}
              onChange={(event) => setPreference("currency", event.target.value as Preferences["currency"])}
            >
              <option value="DOP">DOP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsPanel({
  preferences,
  setPreference,
}: {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Notificaciones</h2>
      </CardHeader>
      <CardContent className="max-w-3xl space-y-2 p-3">
        <ToggleRow
          icon={Bell}
          label="Alertas por correo"
          description="Órdenes, tickets y cambios importantes."
          checked={preferences.emailAlerts}
          onChange={(checked) => setPreference("emailAlerts", checked)}
        />
        <ToggleRow
          icon={MonitorCog}
          label="Mantenimiento"
          description="Avisos técnicos y ventanas de servicio."
          checked={preferences.maintenanceAlerts}
          onChange={(checked) => setPreference("maintenanceAlerts", checked)}
        />
        <ToggleRow
          icon={Globe2}
          label="Novedades"
          description="Mejoras del producto y nuevos modulos."
          checked={preferences.productUpdates}
          onChange={(checked) => setPreference("productUpdates", checked)}
        />
      </CardContent>
    </Card>
  );
}

function SecurityPanel({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Seguridad</h2>
      </CardHeader>
      <CardContent className="max-w-3xl space-y-2 p-3">
        <SettingRow icon={KeyRound} label="Sesión" value="Token privado activo" />
        <SettingRow icon={ShieldCheck} label="Rol" value={user?.role ?? "Cliente"} />
        <SettingRow icon={Building2} label="Acceso" value="Datos separados por organización" />
        <InfoBox
          icon={ShieldCheck}
          title="Proteccion de workspace"
          description="Las rutas privadas validan sesión y organización antes de devolver información."
          tone="green"
        />
      </CardContent>
    </Card>
  );
}

function IntegrationsPanel({ authProvider }: { authProvider: "EMAIL" | "GOOGLE" }) {
  return (
    <Card>
      <CardHeader className="px-3 py-2.5">
        <h2 className="text-sm font-bold text-ink">Integraciones</h2>
      </CardHeader>
      <CardContent className="max-w-3xl space-y-2 p-3">
        <SettingRow
          icon={Link2}
          label="Google"
          value={authProvider === "GOOGLE" ? "Conectado" : "Listo para credenciales OAuth"}
        />
        <SettingRow icon={Mail} label="Correo" value="Cuenta principal activa" />
        <InfoBox
          icon={Globe2}
          title="Próximo paso"
          description="Cuando agreguemos credenciales OAuth, login, registro y foto de Google quedarán conectados desde este mismo módulo."
          tone="blue"
        />
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-ink">{label}</span>
      {children}
    </label>
  );
}

function SettingRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border p-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink">{label}</p>
          <p className="truncate text-[11px] text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          checked ? "bg-brand-600" : "bg-slate-300",
        )}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "green" | "blue";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5",
        tone === "green" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-sky-100 bg-sky-50 text-sky-800",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="text-xs font-bold">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4">{description}</p>
      </div>
    </div>
  );
}

function readPreferences(): Preferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);

  if (!stored) {
    return defaultPreferences;
  }

  try {
    return { ...defaultPreferences, ...(JSON.parse(stored) as Partial<Preferences>) };
  } catch {
    localStorage.removeItem(PREFERENCES_KEY);
    return defaultPreferences;
  }
}

const controlClassName =
  "h-8 w-full rounded-lg border border-border bg-white px-2.5 text-xs text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
