import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, PackagePlus, RotateCcw, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createBrandRequest,
  createCatalogItemRequest,
  createCategoryRequest,
  deleteCatalogItemRequest,
  listBrandsRequest,
  listCatalogItemsRequest,
  listCategoriesRequest,
  type CatalogFilters,
  type CatalogItemPayload,
} from "../services/api";

const emptyItem: CatalogItemPayload = {
  name: "",
  type: "MATERIAL",
  unit: "",
  categoryId: "",
  brandId: "",
  description: "",
};

export function Catalog() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [itemForm, setItemForm] = useState<CatalogItemPayload>(emptyItem);
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const itemsQuery = useQuery({
    queryKey: ["catalog-items", filters],
    queryFn: () => listCatalogItemsRequest(token!, filters),
    enabled: Boolean(token),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategoriesRequest(token!),
    enabled: Boolean(token),
  });

  const brandsQuery = useQuery({
    queryKey: ["brands"],
    queryFn: () => listBrandsRequest(token!),
    enabled: Boolean(token),
  });

  const items = useMemo(() => itemsQuery.data?.items ?? [], [itemsQuery.data?.items]);
  const categories = categoriesQuery.data?.categories ?? [];
  const brands = brandsQuery.data?.brands ?? [];

  const stats = useMemo(() => {
    return {
      total: items.length,
      materials: items.filter((item) => item.type === "MATERIAL").length,
      services: items.filter((item) => item.type === "SERVICIO").length,
      linked: items.reduce((count, item) => count + item.supplierCount, 0),
    };
  }, [items]);

  const createItemMutation = useMutation({
    mutationFn: () => createCatalogItemRequest(token!, itemForm),
    onSuccess: async () => {
      setItemForm(emptyItem);
      setNotice("Ítem agregado al catálogo.");
      await queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos guardar el ítem."),
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => createCategoryRequest(token!, newCategory),
    onSuccess: async () => {
      setNewCategory("");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: () => createBrandRequest(token!, newBrand),
    onSuccess: async () => {
      setNewBrand("");
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => deleteCatalogItemRequest(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalog-items"] }),
  });

  function updateFilter(key: keyof CatalogFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  }

  function updateItemField<K extends keyof CatalogItemPayload>(key: K, value: CatalogItemPayload[K]) {
    setNotice(null);
    setItemForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 2"
        title="Catálogo"
        description="Administra materiales, servicios, categorías y marcas para conectarlos con tus suplidores."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-[13px] font-semibold text-slate-500">Ítems</p><p className="mt-1.5 text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[13px] font-semibold text-slate-500">Materiales</p><p className="mt-1.5 text-2xl font-bold">{stats.materials}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[13px] font-semibold text-slate-500">Servicios</p><p className="mt-1.5 text-2xl font-bold">{stats.services}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[13px] font-semibold text-slate-500">Relaciones</p><p className="mt-1.5 text-2xl font-bold">{stats.linked}</p></CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
              <h2 className="text-base font-bold text-ink">Agregar ítem</h2>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                createItemMutation.mutate();
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Nombre</span>
                <Input value={itemForm.name} onChange={(event) => updateItemField("name", event.target.value)} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Tipo</span>
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.type} onChange={(event) => updateItemField("type", event.target.value as "MATERIAL" | "SERVICIO")}>
                    <option value="MATERIAL">Material</option>
                    <option value="SERVICIO">Servicio</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Unidad</span>
                  <Input value={itemForm.unit ?? ""} onChange={(event) => updateItemField("unit", event.target.value)} placeholder="unidad, caja, hora" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Categoría</span>
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.categoryId ?? ""} onChange={(event) => updateItemField("categoryId", event.target.value)}>
                    <option value="">Sin categoría</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Marca</span>
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.brandId ?? ""} onChange={(event) => updateItemField("brandId", event.target.value)}>
                    <option value="">Sin marca</option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Descripción</span>
                <Input value={itemForm.description ?? ""} onChange={(event) => updateItemField("description", event.target.value)} />
              </label>
              {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</div> : null}
              <Button type="submit" disabled={createItemMutation.isPending}>
                <PackagePlus className="h-4 w-4" />
                {createItemMutation.isPending ? "Guardando..." : "Agregar ítem"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Categorías y marcas</h2>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  createCategoryMutation.mutate();
                }}
              >
                <Input placeholder="Nueva categoría" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
                <Button type="submit">Agregar</Button>
              </form>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  createBrandMutation.mutate();
                }}
              >
                <Input placeholder="Nueva marca" value={newBrand} onChange={(event) => setNewBrand(event.target.value)} />
                <Button type="submit">Agregar</Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => <Badge key={category.id}>{category.name}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => <Badge key={brand.id} tone="blue">{brand.name}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_160px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="Buscar ítem, categoría o marca" value={filters.search ?? ""} onChange={(event) => updateFilter("search", event.target.value)} />
              </div>
              <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={filters.type ?? ""} onChange={(event) => updateFilter("type", event.target.value)}>
                <option value="">Todos</option>
                <option value="MATERIAL">Material</option>
                <option value="SERVICIO">Servicio</option>
              </select>
              <Button type="button" variant="outline" onClick={() => setFilters({})}>
                <RotateCcw className="h-4 w-4" />
                Limpiar
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Ítems del catálogo</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_140px_180px_90px_auto] md:items-center">
                <div>
                  <p className="font-bold text-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description || item.unit || "Sin descripción"}</p>
                </div>
                <Badge tone={item.type === "MATERIAL" ? "green" : "blue"}>{item.type === "MATERIAL" ? "Material" : "Servicio"}</Badge>
                <p className="text-sm text-slate-600">{item.category?.name || "Sin categoría"} · {item.brand?.name || "Sin marca"}</p>
                <p className="text-sm font-semibold text-slate-600">{item.supplierCount} supl.</p>
                <div className="flex items-center gap-2">
                  <Link to={`/catalog/${item.id}`}>
                    <Button type="button" variant="outline" size="icon" title="Ver registro">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button type="button" variant="outline" size="icon" title="Desactivar" onClick={() => deleteItemMutation.mutate(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
            {!items.length ? <div className="p-8 text-center text-sm text-slate-600">No hay ítems con esos filtros.</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
