import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  FolderTree,
  PackageSearch,
  Plus,
  RotateCcw,
  Search,
  Tags,
  type LucideIcon,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  listBrandsRequest,
  listCatalogItemsRequest,
  listCategoriesRequest,
  listSubcategoriesRequest,
  listUnitsRequest,
  smartSearchRequest,
  type CatalogFilters,
  type SmartSearchResult,
} from "../services/api";

const resultIcons: Record<SmartSearchResult["type"], LucideIcon> = {
  supplier: Building2,
  contact: UserRound,
  item: PackageSearch,
  category: FolderTree,
  brand: BadgeCheck,
  tag: Tags,
};

export function SmartSearch() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [type, setType] = useState<CatalogFilters["type"] | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => {
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery.trim());
  }, [urlQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["smart-search", debouncedQuery],
    queryFn: () => smartSearchRequest(token!, debouncedQuery),
    enabled: Boolean(token && debouncedQuery.length >= 2),
  });
  const categoriesQuery = useQuery({ queryKey: ["categories", "search-filters"], queryFn: () => listCategoriesRequest(token!), enabled: Boolean(token) });
  const subcategoriesQuery = useQuery({ queryKey: ["subcategories", "search-filters", categoryId], queryFn: () => listSubcategoriesRequest(token!, categoryId || undefined), enabled: Boolean(token) });
  const brandsQuery = useQuery({ queryKey: ["brands", "search-filters"], queryFn: () => listBrandsRequest(token!), enabled: Boolean(token) });
  const unitsQuery = useQuery({ queryKey: ["units", "search-filters"], queryFn: () => listUnitsRequest(token!), enabled: Boolean(token) });
  const catalogQuery = useQuery({
    queryKey: ["catalog-items", "search", debouncedQuery, type, categoryId, subcategoryId, brandId, unit],
    queryFn: () => listCatalogItemsRequest(token!, {
      search: debouncedQuery || undefined,
      type: type || undefined,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      brandId: brandId || undefined,
      unit: unit || undefined,
    }),
    enabled: Boolean(token),
  });

  const groups = useMemo(() => searchQuery.data?.groups ?? [], [searchQuery.data?.groups]);
  const visibleGroups = useMemo(() => groups.filter((group) => group.results.length), [groups]);
  const total = searchQuery.data?.total ?? 0;
  const isTooShort = query.trim().length > 0 && query.trim().length < 2;
  const catalogItems = catalogQuery.data?.items ?? [];
  const hasCatalogFilters = Boolean(query || type || categoryId || subcategoryId || brandId || unit);

  function clearFilters() {
    setQuery("");
    setDebouncedQuery("");
    setType("");
    setCategoryId("");
    setSubcategoryId("");
    setBrandId("");
    setUnit("");
    setSearchParams({});
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Búsqueda"
        description="Encuentra suplidores, contactos, ciudades, insumos, servicios y clasificaciones desde un solo lugar."
        actions={<Link to="/catalog" className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-bold text-white"><Plus className="h-4 w-4" />Crear insumo</Link>}
      />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 pl-9 pr-24"
              placeholder="Buscar en Smart Source"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              {catalogItems.length} visibles
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[150px_1fr_1fr_1fr_1fr_auto]">
            <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-ink" value={type} onChange={(event) => setType(event.target.value as CatalogFilters["type"] | "")}>
              <option value="">Todos los tipos</option>
              <option value="MATERIAL">Insumos</option>
              <option value="SERVICIO">Servicios</option>
            </select>
            <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-ink" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }}>
              <option value="">Todas las categorías</option>
              {(categoriesQuery.data?.categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-ink" value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}>
              <option value="">Todas las subcategorías</option>
              {(subcategoriesQuery.data?.subcategories ?? []).map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
            <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-ink" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
              <option value="">Todas las marcas</option>
              {(brandsQuery.data?.brands ?? []).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-ink" value={unit} onChange={(event) => setUnit(event.target.value)}>
              <option value="">Todas las unidades</option>
              {(unitsQuery.data?.units ?? []).map((entry) => <option key={entry.id} value={entry.name}>{entry.name}{entry.abbreviation ? ` (${entry.abbreviation})` : ""}</option>)}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters} disabled={!hasCatalogFilters} title="Limpiar filtros">
              <RotateCcw className="h-4 w-4" />Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Vista rápida de insumos y servicios</h2>
            <p className="mt-1 text-xs text-slate-500">{catalogItems.length} resultados con los filtros seleccionados</p>
          </div>
          <PackageSearch className="h-4 w-4 text-brand-700" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="border-y border-border bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-2.5">Insumo</th><th className="px-4 py-2.5">Clasificación</th><th className="px-4 py-2.5">Marca</th><th className="px-4 py-2.5">Unidad</th><th className="px-4 py-2.5 text-right">Suplidores</th></tr></thead>
              <tbody className="divide-y divide-border">
                {catalogItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3"><Link to={`/catalog/${item.id}`} className="font-bold text-ink hover:text-brand-700">{item.name}</Link><p className="mt-1 text-xs text-slate-500">{item.type === "MATERIAL" ? "Insumo" : "Servicio"}</p></td>
                    <td className="px-4 py-3 text-slate-600">{item.category?.name || "Sin categoría"}{item.subcategory ? ` / ${item.subcategory.name}` : ""}</td>
                    <td className="px-4 py-3 text-slate-600">{item.brand?.name || "Sin marca"}</td>
                    <td className="px-4 py-3 text-slate-600">{item.unit || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{item.supplierCount}</td>
                  </tr>
                ))}
                {!catalogQuery.isLoading && !catalogItems.length ? <tr><td colSpan={5} className="p-6 text-center text-slate-500">No hay registros con esos criterios.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isTooShort ? (
        <Card>
          <CardContent className="p-6 text-center text-[13px] text-slate-600">
            Escribe al menos 2 caracteres para buscar.
          </CardContent>
        </Card>
      ) : null}

      {searchQuery.isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-[13px] text-slate-600">Buscando...</CardContent>
        </Card>
      ) : null}

      {searchQuery.isError ? (
        <Card>
          <CardContent className="p-6 text-center text-[13px] text-red-600">
            No pudimos completar la busqueda. Intenta de nuevo.
          </CardContent>
        </Card>
      ) : null}

      {!searchQuery.isLoading && debouncedQuery.length >= 2 && !visibleGroups.length ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-bold text-ink">Sin resultados</p>
            <p className="mt-1 text-[13px] text-slate-600">Prueba con otro suplidor, ciudad, material o etiqueta.</p>
          </CardContent>
        </Card>
      ) : null}

      {visibleGroups.length ? (
        <section className="grid gap-4 xl:grid-cols-2" aria-label={`Resultados relacionados: ${total}`}>
          {visibleGroups.map((group) => (
            <Card key={group.key}>
              <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-base font-bold text-ink">{group.label}</h2>
                <Badge tone="slate">{group.count}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.results.map((result) => (
                  <SearchResultRow key={`${result.type}-${result.id}`} result={result} />
                ))}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function SearchResultRow({ result }: { result: SmartSearchResult }) {
  const Icon = resultIcons[result.type];

  return (
    <Link
      to={result.path}
      className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 transition hover:border-brand-100 hover:bg-brand-50/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-bold text-ink">{result.title}</p>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">{result.subtitle}</p>
        {result.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{result.description}</p> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.meta.slice(0, 3).map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
