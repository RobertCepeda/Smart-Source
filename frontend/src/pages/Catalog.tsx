import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
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
  createSubcategoryRequest,
  getQuoteRequestDraftRequest,
  listBrandsRequest,
  listCategoriesRequest,
  listSubcategoriesRequest,
  type CatalogItemPayload,
} from "../services/api";

const emptyItem: CatalogItemPayload = {
  name: "",
  type: "MATERIAL",
  unit: "",
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  description: "",
};

export function Catalog() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [itemForm, setItemForm] = useState<CatalogItemPayload>(emptyItem);
  const [newCategory, setNewCategory] = useState("");
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fromQuoteRequest = searchParams.get("from") === "quote-request";
  const suggestedItemName = searchParams.get("name")?.trim() ?? "";

  useEffect(() => {
    if (fromQuoteRequest) {
      if (suggestedItemName) {
        setItemForm((current) => (current.name.trim() ? current : { ...current, name: suggestedItemName }));
      }
      setNotice("Tu solicitud quedó guardada como borrador. Agrega el insumo y vuelve cuando termines.");
    }
  }, [fromQuoteRequest, suggestedItemName]);

  const draftQuery = useQuery({
    queryKey: ["quote-request-draft"],
    queryFn: () => getQuoteRequestDraftRequest(token!),
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

  const subcategoriesQuery = useQuery({
    queryKey: ["subcategories"],
    queryFn: () => listSubcategoriesRequest(token!),
    enabled: Boolean(token),
  });

  const categories = categoriesQuery.data?.categories ?? [];
  const brands = brandsQuery.data?.brands ?? [];
  const subcategories = subcategoriesQuery.data?.subcategories ?? [];
  const itemSubcategories = subcategories.filter((entry) => entry.categoryId === itemForm.categoryId);

  const createItemMutation = useMutation({
    mutationFn: () => createCatalogItemRequest(token!, itemForm),
    onSuccess: async () => {
      setItemForm(emptyItem);
      setNotice(fromQuoteRequest ? "Insumo agregado. Ya puedes volver al borrador de la solicitud." : "Insumo agregado al catálogo.");
      await queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos guardar el insumo."),
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

  const createSubcategoryMutation = useMutation({
    mutationFn: () => createSubcategoryRequest(token!, { categoryId: subcategoryCategoryId, name: newSubcategory }),
    onSuccess: async () => {
      setNewSubcategory("");
      await queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });

  function updateItemField<K extends keyof CatalogItemPayload>(key: K, value: CatalogItemPayload[K]) {
    setNotice(null);
    setItemForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 2"
        title="Creación de catálogo"
        description="Registra insumos y servicios con categorías, subcategorías y marcas estandarizadas."
        actions={
          fromQuoteRequest || Boolean(draftQuery.data?.draft) ? (
            <Link
              to="/quote-requests"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a solicitud
            </Link>
          ) : null
        }
      />

      {fromQuoteRequest ? (
        <div className="flex flex-col gap-2 rounded-lg border border-brand-100 bg-brand-50/70 px-3 py-2.5 text-[13px] text-brand-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Tu solicitud se guardó como borrador. Registra el material y vuelve para seleccionarlo.</span>
          <Link
            to="/quote-requests"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
              <h2 className="text-base font-bold text-ink">Agregar insumo</h2>
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
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Nombre del insumo</span>
                <Input value={itemForm.name} onChange={(event) => updateItemField("name", event.target.value)} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Tipo</span>
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.type} onChange={(event) => updateItemField("type", event.target.value as "MATERIAL" | "SERVICIO")}>
                    <option value="MATERIAL">Insumo</option>
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
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.categoryId ?? ""} onChange={(event) => setItemForm((current) => ({ ...current, categoryId: event.target.value, subcategoryId: "" }))}>
                    <option value="">Sin categoría</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Subcategoría</span>
                  <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.subcategoryId ?? ""} onChange={(event) => updateItemField("subcategoryId", event.target.value)} disabled={!itemForm.categoryId}>
                    <option value="">Sin subcategoría</option>
                    {itemSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Marca</span>
                <select className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]" value={itemForm.brandId ?? ""} onChange={(event) => updateItemField("brandId", event.target.value)}>
                  <option value="">Sin marca</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Descripción</span>
                <Input value={itemForm.description ?? ""} onChange={(event) => updateItemField("description", event.target.value)} />
              </label>
              {notice ? <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</div> : null}
              <Button type="submit" disabled={createItemMutation.isPending}>
                <PackagePlus className="h-4 w-4" />
                {createItemMutation.isPending ? "Guardando..." : "Agregar insumo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-base font-bold text-ink">Insumos</h2>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-3">
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
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  createSubcategoryMutation.mutate();
                }}
              >
                <select className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]" value={subcategoryCategoryId} onChange={(event) => setSubcategoryCategoryId(event.target.value)} required>
                  <option value="">Categoría principal</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Input placeholder="Nueva subcategoría" value={newSubcategory} onChange={(event) => setNewSubcategory(event.target.value)} required />
                  <Button type="submit">Agregar</Button>
                </div>
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
                {subcategories.map((subcategory) => <Badge key={subcategory.id} tone="green">{subcategory.name}</Badge>)}
              </div>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => <Badge key={brand.id} tone="blue">{brand.name}</Badge>)}
              </div>
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
}
