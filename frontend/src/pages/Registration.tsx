import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createSupplierRequest,
  getSupplierRequest,
  updateSupplierRequest,
  type SupplierPayload,
} from "../services/api";

const steps = ["Datos generales", "Contacto", "Catálogo", "Etiquetas"];

type FormState = {
  name: string;
  rnc: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  notes: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  catalogText: string;
  tagsText: string;
};

const emptyForm: FormState = {
  name: "",
  rnc: "",
  category: "",
  city: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  notes: "",
  contactName: "",
  contactRole: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactEmail: "",
  catalogText: "",
  tagsText: "",
};

function splitValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function Registration() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [activeStep, setActiveStep] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const supplierQuery = useQuery({
    queryKey: ["supplier", editId],
    queryFn: () => getSupplierRequest(token!, editId!),
    enabled: Boolean(token && editId),
  });

  useEffect(() => {
    const supplier = supplierQuery.data?.supplier;

    if (!supplier) {
      return;
    }

    const primaryContact = supplier.contacts.find((contact) => contact.isPrimary) ?? supplier.contacts[0];

    setForm({
      name: supplier.name,
      rnc: supplier.rnc ?? "",
      category: supplier.category ?? "",
      city: supplier.city ?? "",
      address: supplier.address ?? "",
      phone: supplier.phone ?? "",
      whatsapp: supplier.whatsapp ?? "",
      email: supplier.email ?? "",
      website: supplier.website ?? "",
      notes: supplier.notes ?? "",
      contactName: primaryContact?.name ?? "",
      contactRole: primaryContact?.role ?? "",
      contactPhone: primaryContact?.phone ?? "",
      contactWhatsapp: primaryContact?.whatsapp ?? "",
      contactEmail: primaryContact?.email ?? "",
      catalogText: supplier.catalogItems.map((item) => item.name).join(", "),
      tagsText: supplier.tags.join(", "),
    });
  }, [supplierQuery.data?.supplier]);

  const payload = useMemo<SupplierPayload>(() => {
    const contacts = form.contactName
      ? [
          {
            name: form.contactName,
            role: form.contactRole,
            phone: form.contactPhone,
            whatsapp: form.contactWhatsapp,
            email: form.contactEmail,
            isPrimary: true,
          },
        ]
      : [];

    return {
      name: form.name,
      rnc: form.rnc,
      category: form.category,
      city: form.city,
      address: form.address,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      website: form.website,
      notes: form.notes,
      contacts,
      tags: splitValues(form.tagsText),
      catalogItems: splitValues(form.catalogText).map((name) => ({
        name,
        type: "MATERIAL",
      })),
    };
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: () =>
      editId ? updateSupplierRequest(token!, editId, payload) : createSupplierRequest(token!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      navigate("/suppliers");
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar el suplidor.");
    },
  });

  function updateField(key: keyof FormState, value: string) {
    setMessage(null);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setActiveStep(0);
      setMessage("El nombre del suplidor es obligatorio.");
      return;
    }

    saveMutation.mutate();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={editId ? "Editar suplidor" : "Alta"}
        title={editId ? "Actualizar suplidor" : "Registrar suplidor"}
        description="Completa la información esencial. Luego seguiremos puliendo catálogo, precios y documentos en sus módulos."
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              className={`rounded-lg border p-3 text-left transition ${
                activeStep === index ? "border-brand-500 bg-brand-50" : "border-border bg-slate-50 hover:bg-white"
              }`}
              onClick={() => setActiveStep(index)}
            >
              <div className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-ink">
                {index + 1}
              </div>
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                {step}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <p className="text-xs font-semibold text-slate-500">Paso {activeStep + 1} de 4</p>
            <h2 className="text-base font-bold text-ink">{steps[activeStep]}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeStep === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre del suplidor</span>
                  <Input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">RNC</span>
                  <Input value={form.rnc} onChange={(event) => updateField("rnc", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Categoria</span>
                  <Input value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Construccion, Oficina, Tecnologia" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ciudad</span>
                  <Input value={form.city} onChange={(event) => updateField("city", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Telefono principal</span>
                  <Input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">WhatsApp</span>
                  <Input value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Correo</span>
                  <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Web</span>
                  <Input type="url" value={form.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://..." />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Dirección</span>
                  <Input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                </label>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nombre del contacto principal</span>
                  <Input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Cargo</span>
                  <Input value={form.contactRole} onChange={(event) => updateField("contactRole", event.target.value)} placeholder="Vendedor, gerente, soporte" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Telefono</span>
                  <Input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">WhatsApp</span>
                  <Input value={form.contactWhatsapp} onChange={(event) => updateField("contactWhatsapp", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Correo</span>
                  <Input type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
                </label>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Materiales o servicios principales</span>
                  <Input
                    value={form.catalogText}
                    onChange={(event) => updateField("catalogText", event.target.value)}
                    placeholder="Cemento gris, varillas, mantenimiento preventivo"
                  />
                </label>
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  En el Módulo 2 esto se convertirá en catálogo completo con unidades, marcas y precios por suplidor.
                </p>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Etiquetas</span>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => updateField("tagsText", event.target.value)}
                    placeholder="Crédito, Urgente, Local"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Notas internas</span>
                  <textarea
                    className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Condiciones, observaciones o recordatorios."
                  />
                </label>
              </div>
            ) : null}

            {message ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex gap-3">
            {activeStep < steps.length - 1 ? (
              <Button type="button" onClick={() => setActiveStep((step) => step + 1)}>
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={saveMutation.isPending || supplierQuery.isLoading}>
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Guardando..." : editId ? "Guardar cambios" : "Registrar suplidor"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
