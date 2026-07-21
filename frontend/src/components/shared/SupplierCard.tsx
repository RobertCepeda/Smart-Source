import { Globe, Mail, MapPin, MessageCircle, Pencil, Phone, Tags, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Supplier } from "../../services/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type SupplierCardProps = {
  supplier: Supplier;
  onDelete: (supplier: Supplier) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function whatsappLink(value: string | null) {
  if (!value) {
    return undefined;
  }

  const phone = value.replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}` : undefined;
}

export function SupplierCard({ supplier, onDelete }: SupplierCardProps) {
  const primaryContact = supplier.contacts.find((contact) => contact.isPrimary) ?? supplier.contacts[0];
  const topItems = supplier.catalogItems.slice(0, 4);
  const callPhone = supplier.phone ?? primaryContact?.phone ?? null;
  const whatsapp = whatsappLink(supplier.whatsapp ?? primaryContact?.whatsapp ?? null);
  const email = supplier.email ?? primaryContact?.email ?? null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link
            to={`/suppliers/${supplier.id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-base font-bold text-brand-700"
          >
            {initials(supplier.name)}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/suppliers/${supplier.id}`} className="truncate text-sm font-bold text-ink hover:text-brand-700">
                {supplier.name}
              </Link>
              <Badge tone="green">Activo</Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {supplier.city || "Sin ciudad"} - {supplier.category || "Sin categoría"}
            </p>
            {primaryContact ? (
              <p className="mt-1 text-xs text-slate-500">
                Contacto: <span className="font-semibold text-slate-700">{primaryContact.name}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3.5 flex min-h-6 flex-wrap gap-2">
          {topItems.length ? topItems.map((item) => <Badge key={item.id}>{item.name}</Badge>) : <Badge>Catálogo pendiente</Badge>}
        </div>

        <div className="mt-3.5 flex min-h-5 flex-wrap gap-2 text-xs text-slate-500">
          {supplier.tags.length ? (
            <>
              <span className="inline-flex items-center gap-1">
                <Tags className="h-3.5 w-3.5" />
                {supplier.tags[0]}
              </span>
              {supplier.tags.slice(1, 3).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </>
          ) : (
            <span>Sin etiquetas</span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-6 gap-2">
          <Button type="button" variant="outline" size="icon" title="Llamar" disabled={!callPhone} onClick={() => callPhone && window.open(`tel:${callPhone}`)}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" title="WhatsApp" disabled={!whatsapp} onClick={() => whatsapp && window.open(whatsapp, "_blank")}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" title="Email" disabled={!email} onClick={() => email && window.open(`mailto:${email}`)}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Web"
            disabled={!supplier.website}
            onClick={() => supplier.website && window.open(supplier.website, "_blank")}
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Link
            to={`/registration?edit=${supplier.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-sm font-semibold text-ink transition hover:bg-slate-50"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button type="button" variant="outline" size="icon" title="Desactivar" onClick={() => onDelete(supplier)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
