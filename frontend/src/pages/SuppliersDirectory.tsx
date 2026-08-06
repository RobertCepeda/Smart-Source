import { Copy, Filter, Grid2X2, List, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/shared/PageHeader";
import { SupplierCard } from "../components/shared/SupplierCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { deleteSupplierRequest, listSuppliersRequest, type Supplier, type SupplierFilters } from "../services/api";

export function SuppliersDirectory() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SupplierFilters>(() => ({
    search: searchParams.get("search") ?? searchParams.get("tag") ?? undefined,
  }));
  const [view, setView] = useState<"cards" | "list">("cards");

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? searchParams.get("tag") ?? undefined;
    setFilters((current) => (current.search === urlSearch ? current : { search: urlSearch }));
  }, [searchParams]);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", filters],
    queryFn: () => listSuppliersRequest(token!, filters),
    enabled: Boolean(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (supplier: Supplier) => deleteSupplierRequest(token!, supplier.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const suppliers = useMemo(() => suppliersQuery.data?.suppliers ?? [], [suppliersQuery.data?.suppliers]);

  const stats = useMemo(() => {
    const cities = new Set(suppliers.map((supplier) => supplier.city).filter(Boolean));
    return {
      total: suppliers.length,
      cities: cities.size,
      catalogued: suppliers.filter((supplier) => supplier.catalogItems.length > 0).length,
      contacts: suppliers.reduce((count, supplier) => count + supplier.contacts.length, 0),
    };
  }, [suppliers]);

  function updateSearch(value: string) {
    setFilters({ search: value || undefined });
    if (searchParams.has("search") || searchParams.has("tag")) {
      setSearchParams({});
    }
  }

  function clearFilters() {
    setFilters({});
    setSearchParams({});
  }

  function onDelete(supplier: Supplier) {
    const confirmed = window.confirm(`Desactivar ${supplier.name}? Podras reactivarlo mas adelante desde administracion.`);

    if (confirmed) {
      deleteMutation.mutate(supplier);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={user?.organization?.name ?? "Directorio"}
        title="Suplidores"
        description="Consulta, filtra y administra los suplidores de tu organización desde tarjetas claras y rápidas."
        actions={
          <Link
            to="/registration"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo suplidor
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-slate-500">Suplidores</p>
            <p className="mt-1.5 text-2xl font-bold text-ink">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-slate-500">Contactos</p>
            <p className="mt-1.5 text-2xl font-bold text-ink">{stats.contacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-slate-500">Con catálogo</p>
            <p className="mt-1.5 text-2xl font-bold text-ink">{stats.catalogued}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[13px] font-semibold text-slate-500">Ciudades</p>
            <p className="mt-1.5 text-2xl font-bold text-ink">{stats.cities}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar suplidor, vendedor, material, categoría, ciudad, etiqueta, correo o teléfono"
              value={filters.search ?? ""}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={clearFilters}>
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Resultados</span>
          <Badge tone="green">{suppliers.length}</Badge>
        </div>
        <div className="flex rounded-lg border border-border bg-white p-1" aria-label="Cambiar vista">
          <Button type="button" variant={view === "cards" ? "default" : "ghost"} size="icon" className="h-7 w-7" title="Vista en tarjetas" onClick={() => setView("cards")}>
            <Grid2X2 className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant={view === "list" ? "default" : "ghost"} size="icon" className="h-7 w-7" title="Vista en lista" onClick={() => setView("list")}>
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {suppliersQuery.isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-600">Cargando suplidores...</CardContent>
        </Card>
      ) : suppliersQuery.isError ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-red-600">No se pudieron cargar los suplidores.</CardContent>
        </Card>
      ) : suppliers.length && view === "cards" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onDelete={onDelete} />
          ))}
        </section>
      ) : suppliers.length ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-[13px]">
                <thead className="border-b border-border bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Suplidor</th>
                    <th className="px-4 py-3">RNC / Cédula</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">Ciudad</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {suppliers.map((supplier) => {
                    const contact = supplier.contacts.find((entry) => entry.isPrimary) ?? supplier.contacts[0];
                    const summary = [supplier.name, supplier.rnc, contact?.name, contact?.phone, supplier.phone, supplier.email].filter(Boolean).join(" | ");
                    return (
                      <tr key={supplier.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-ink"><Link to={`/suppliers/${supplier.id}`}>{supplier.name}</Link></td>
                        <td className="px-4 py-3 text-slate-600">{supplier.rnc || "-"}</td>
                        <td className="px-4 py-3"><p className="font-semibold text-ink">{contact?.name || "Sin contacto"}</p><p className="text-xs text-slate-500">{contact?.role || ""}</p></td>
                        <td className="px-4 py-3 text-slate-600">{contact?.phone || supplier.phone || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{supplier.city || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button type="button" variant="outline" size="icon" title="Copiar información" onClick={() => navigator.clipboard.writeText(summary)}><Copy className="h-3.5 w-3.5" /></Button>
                            <Link to={`/registration?edit=${supplier.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white" title="Editar"><Pencil className="h-3.5 w-3.5" /></Link>
                            <Button type="button" variant="outline" size="icon" title="Desactivar" onClick={() => onDelete(supplier)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-base font-bold text-ink">No hay suplidores con esos filtros</p>
            <p className="mt-2 text-sm text-slate-600">Limpia la busqueda o registra uno nuevo para empezar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
