import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  Building2,
  Command,
  Headphones,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Network,
  PackageSearch,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  UserPlus,
  X,
} from "lucide-react";
import { SmartSourceLogo } from "../brand/SmartSourceLogo";
import { UserAvatar } from "../shared/UserAvatar";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import type { NavigationItem } from "../../types/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Vista general",
    items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
  },
  {
    label: "Suplidores y catálogo",
    items: [
      { label: "Suplidores", path: "/suppliers", icon: Building2 },
      { label: "Registro", path: "/registration", icon: UserPlus },
      { label: "Catálogo", path: "/catalog", icon: PackageSearch },
      { label: "Búsqueda", path: "/search", icon: Search },
    ],
  },
  {
    label: "Empresa",
    items: [
      { label: "Organizaciones", path: "/organizations", icon: Network },
      { label: "Centro de Atención", path: "/support", icon: Headphones },
    ],
  },
  {
    label: "Compras y análisis",
    items: [
      { label: "Órdenes", path: "/purchase-orders", icon: ShoppingCart },
      { label: "Historial", path: "/purchase-history", icon: History },
      { label: "Precios", path: "/price-history", icon: LineChart },
      { label: "Reportes", path: "/reports", icon: BarChart3 },
      { label: "Consultas IA", path: "/ai-consult", icon: BrainCircuit },
    ],
  },
  {
    label: "Configuración",
    items: [{ label: "Configuración", path: "/settings", icon: Settings }],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-white">
      <div className="flex h-12 items-center border-b border-border px-3">
        <SmartSourceLogo size="sm" />
      </div>

      <nav className="sidebar-scroll flex-1 px-2.5 py-2.5">
        {navigationGroups.map((group) => (
          <div key={group.label} className="pb-3 last:pb-1">
            <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs font-semibold transition",
                      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink",
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-2.5">
        <div className="rounded-lg bg-slate-50 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Módulo actual</p>
          <p className="mt-1 text-xs font-semibold text-ink">Módulos listos</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">Base completa para empezar a pulir detalles.</p>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchRef.current?.value.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2.5 border-b border-border bg-white/90 px-3 backdrop-blur md:px-4">
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} title="Abrir menu">
        <Menu className="h-4 w-4" />
      </Button>

      <form className="relative w-full max-w-3xl flex-1" onSubmit={onSearchSubmit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input ref={searchRef} className="pl-9 pr-20" placeholder="Buscar suplidor, material, servicio o vendedor" />
        <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 sm:flex">
          <Command className="h-3 w-3" />
          K
        </span>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
      <Button type="button" variant="outline" size="icon" title="Centro de Atención" onClick={() => navigate("/support")}>
          <Bell className="h-4 w-4" />
        </Button>
        <Button type="button" size="sm" onClick={() => navigate("/registration")}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
        <button
          type="button"
          className="hidden h-9 max-w-[260px] min-w-0 items-center gap-2 rounded-lg px-2.5 text-left transition hover:bg-slate-50 md:flex"
          onClick={() => navigate("/settings")}
          title="Abrir perfil"
        >
          <UserAvatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink">{user?.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.company ?? user?.email}</p>
          </div>
        </button>
        <Button type="button" variant="ghost" size="icon" title="Cerrar sesion" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export function AppShell() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <Sidebar />
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            aria-label="Cerrar menu"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setSidebarOpen(false)}
            title="Cerrar menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-4 md:px-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
