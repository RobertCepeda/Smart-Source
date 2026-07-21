import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, Pencil } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { getSupplierRequest } from "../services/api";

export function SupplierDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const supplierQuery = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => getSupplierRequest(token!, id!),
    enabled: Boolean(token && id),
  });

  const supplier = supplierQuery.data?.supplier;
  const primaryContact = supplier?.contacts.find((contact) => contact.isPrimary) ?? supplier?.contacts[0];

  if (supplierQuery.isLoading) {
    return <Card><CardContent className="p-8 text-center text-sm text-slate-600">Cargando suplidor...</CardContent></Card>;
  }

  if (!supplier) {
    return <Card><CardContent className="p-8 text-center text-sm text-slate-600">Suplidor no encontrado.</CardContent></Card>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Ficha de suplidor"
        title={supplier.name}
        description={`${supplier.city || "Sin ciudad"} - ${supplier.category || "Sin categoría"}`}
        actions={
          <>
            <Link
              to="/suppliers"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <Link
              to={`/registration?edit=${supplier.id}`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Informacion</h2>
          </CardHeader>
          <CardContent className="grid gap-4 text-[13px] md:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-500">RNC</p>
              <p className="mt-1 text-ink">{supplier.rnc || "No registrado"}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Ubicacion</p>
              <p className="mt-1 flex items-center gap-1 text-ink">
                <MapPin className="h-4 w-4 text-slate-400" />
                {supplier.address || supplier.city || "No registrada"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Telefono</p>
              <p className="mt-1 text-ink">{supplier.phone || "No registrado"}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Correo</p>
              <p className="mt-1 text-ink">{supplier.email || "No registrado"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-semibold text-slate-500">Notas</p>
              <p className="mt-1 leading-6 text-ink">{supplier.notes || "Sin notas internas."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Contacto principal</h2>
          </CardHeader>
          <CardContent>
            {primaryContact ? (
              <div>
                <p className="text-base font-bold text-ink">{primaryContact.name}</p>
                <p className="mt-1 text-[13px] text-slate-600">{primaryContact.role || "Contacto"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" disabled={!primaryContact.phone} onClick={() => primaryContact.phone && window.open(`tel:${primaryContact.phone}`)}>
                    <Phone className="h-4 w-4" />
                    Llamar
                  </Button>
                  <Button type="button" variant="outline" disabled={!primaryContact.whatsapp} onClick={() => primaryContact.whatsapp && window.open(`https://wa.me/${primaryContact.whatsapp.replace(/\D/g, "")}`, "_blank")}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button type="button" variant="outline" disabled={!primaryContact.email} onClick={() => primaryContact.email && window.open(`mailto:${primaryContact.email}`)}>
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-slate-600">No hay contacto registrado.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Catálogo rápido</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {supplier.catalogItems.length ? (
              supplier.catalogItems.map((item) => <Badge key={item.id}>{item.name}</Badge>)
            ) : (
              <p className="text-[13px] text-slate-600">Catálogo pendiente.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Etiquetas</h2>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {supplier.tags.length ? (
              supplier.tags.map((tag) => <Badge key={tag} tone="green">{tag}</Badge>)
            ) : (
              <p className="text-[13px] text-slate-600">Sin etiquetas.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
