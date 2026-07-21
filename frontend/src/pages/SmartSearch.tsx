import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  FolderTree,
  PackageSearch,
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
import { smartSearchRequest, type SmartSearchResult } from "../services/api";

const quickSearches = ["cemento", "Santiago", "crédito", "oficina"];

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
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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

  const groups = useMemo(() => searchQuery.data?.groups ?? [], [searchQuery.data?.groups]);
  const visibleGroups = useMemo(() => groups.filter((group) => group.results.length), [groups]);
  const total = searchQuery.data?.total ?? 0;
  const isTooShort = query.trim().length > 0 && query.trim().length < 2;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Módulo 3"
        title="Búsqueda inteligente"
        description="Encuentra suplidores, contactos, materiales, servicios, categorías, marcas y etiquetas desde un solo punto."
      />

      <Card>
        <CardContent className="space-y-4 p-4">
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
              {query.trim().length ? `${total} resultados` : "Global"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickSearches.map((item) => (
              <Button key={item} type="button" variant="outline" size="sm" onClick={() => setQuery(item)}>
                {item}
              </Button>
            ))}
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
        <section className="grid gap-4 xl:grid-cols-2">
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
