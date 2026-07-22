import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createQuoteRequestRequest,
  listQuoteRequestsRequest,
  type QuoteRequest,
  type QuoteRequestPayload,
  type QuoteRequestStatus,
} from "../services/api";

type RequestLineForm = {
  description: string;
  quantity: string;
  unit: string;
  technicalSpecs: string;
};

const emptyLine: RequestLineForm = {
  description: "",
  quantity: "1",
  unit: "unidad",
  technicalSpecs: "",
};

const statusLabels: Record<QuoteRequestStatus, string> = {
  BORRADOR: "Borrador",
  LISTA_PARA_ENVIAR: "Lista",
  ENVIADA: "Enviada",
  RECIBIENDO_COTIZACIONES: "Recibiendo",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
};

const statusTone: Record<QuoteRequestStatus, "slate" | "green" | "amber" | "blue"> = {
  BORRADOR: "slate",
  LISTA_PARA_ENVIAR: "amber",
  ENVIADA: "blue",
  RECIBIENDO_COTIZACIONES: "blue",
  CERRADA: "green",
  CANCELADA: "amber",
};

export function QuoteRequests() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [project, setProject] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [requesterName, setRequesterName] = useState(user?.name ?? "");
  const [deadline, setDeadline] = useState("");
  const [observations, setObservations] = useState("");
  const [lines, setLines] = useState<RequestLineForm[]>([{ ...emptyLine }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "">("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!requesterName && user?.name) {
      setRequesterName(user.name);
    }
  }, [requesterName, user?.name]);

  const requestsQuery = useQuery({
    queryKey: ["quote-requests", statusFilter, search],
    queryFn: () =>
      listQuoteRequestsRequest(token!, {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
    enabled: Boolean(token),
  });

  const requests = useMemo(() => requestsQuery.data?.requests ?? [], [requestsQuery.data?.requests]);
  const stats = useMemo(
    () => ({
      total: requests.length,
      drafts: requests.filter((request) => request.status === "BORRADOR").length,
      items: requests.reduce((sum, request) => sum + request.itemCount, 0),
      attachments: requests.reduce((sum, request) => sum + request.attachmentCount, 0),
    }),
    [requests],
  );

  const createMutation = useMutation({
    mutationFn: ({ payload, files }: { payload: QuoteRequestPayload; files: File[] }) =>
      createQuoteRequestRequest(token!, payload, files),
    onSuccess: async ({ request }) => {
      setNotice(`Solicitud ${request.number} creada correctamente.`);
      setProject("");
      setCostCenter("");
      setDeadline("");
      setObservations("");
      setLines([{ ...emptyLine }]);
      setAttachments([]);
      await queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : "No pudimos crear la solicitud de cotización."),
  });

  function updateLine(index: number, key: keyof RequestLineForm, value: string) {
    setNotice(null);
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
  }

  function addLine() {
    setLines((current) => [...current, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  function addAttachments(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setAttachments((current) => [...current, ...Array.from(fileList)].slice(0, 8));
  }

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const validLines = lines
      .filter((line) => line.description.trim() && Number(line.quantity) > 0 && line.unit.trim())
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity),
        unit: line.unit.trim(),
        technicalSpecs: line.technicalSpecs.trim(),
      }));

    if (!project.trim()) {
      setNotice("Indica el proyecto o centro de costo de la solicitud.");
      return;
    }

    if (!validLines.length) {
      setNotice("Agrega al menos un material, equipo o servicio.");
      return;
    }

    createMutation.mutate({
      payload: {
        project,
        costCenter,
        requesterName,
        deadline,
        observations,
        items: validLines,
      },
      files: attachments,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Compras y análisis"
        title="Solicitudes de Cotización"
        description="Crea solicitudes con número automático, datos generales, ítems requeridos y adjuntos."
        actions={
          <Badge tone="green">
            <ClipboardList className="h-3.5 w-3.5" />
            Paso 1 listo
          </Badge>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Solicitudes" value={stats.total.toString()} />
        <MetricCard label="Borradores" value={stats.drafts.toString()} />
        <MetricCard label="Ítems solicitados" value={stats.items.toString()} />
        <MetricCard label="Adjuntos" value={stats.attachments.toString()} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Nueva solicitud</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitRequest}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Proyecto o centro</span>
                  <Input
                    value={project}
                    onChange={(event) => setProject(event.target.value)}
                    placeholder="Ej. Torre Norte / Obra eléctrica"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Centro de costo</span>
                  <Input
                    value={costCenter}
                    onChange={(event) => setCostCenter(event.target.value)}
                    placeholder="Ej. CC-204"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Solicitante</span>
                  <Input
                    value={requesterName}
                    onChange={(event) => setRequesterName(event.target.value)}
                    placeholder="Nombre del solicitante"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Fecha límite</span>
                  <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate-700">Materiales, equipos o servicios</p>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                {lines.map((line, index) => (
                  <RequestLineEditor
                    key={index}
                    index={index}
                    line={line}
                    onUpdate={updateLine}
                    onRemove={removeLine}
                  />
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Observaciones generales</span>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  value={observations}
                  onChange={(event) => setObservations(event.target.value)}
                  placeholder="Condiciones, instrucciones, equivalencias permitidas o notas para los suplidores."
                />
              </label>

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-ink">Documentos o planos adjuntos</p>
                    <p className="text-xs text-slate-500">PDF, Excel, Word o imágenes. Máximo 8 archivos por ahora.</p>
                  </div>
                  <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-bold text-ink shadow-sm transition hover:bg-slate-100">
                    <Paperclip className="h-4 w-4" />
                    Adjuntar
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        addAttachments(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>

                {attachments.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {attachments.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2 text-xs">
                        <FileText className="h-4 w-4 text-brand-700" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-ink">{file.name}</p>
                          <p className="text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Quitar adjunto"
                          onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {notice ? (
                <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
                  {notice}
                </div>
              ) : null}

              <Button type="submit" disabled={createMutation.isPending}>
                <ClipboardList className="h-4 w-4" />
                {createMutation.isPending ? "Creando..." : "Crear solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-ink">Solicitudes registradas</h2>
              <select
                className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as QuoteRequestStatus | "")}
              >
                <option value="">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="LISTA_PARA_ENVIAR">Lista</option>
                <option value="ENVIADA">Enviada</option>
                <option value="RECIBIENDO_COTIZACIONES">Recibiendo</option>
                <option value="CERRADA">Cerrada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, proyecto o item" />
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsQuery.isLoading ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Cargando solicitudes...
              </p>
            ) : null}

            {!requestsQuery.isLoading && !requests.length ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Aún no hay solicitudes con este filtro.
              </p>
            ) : null}

            {requests.map((request) => (
              <QuoteRequestCard key={request.id} request={request} />
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RequestLineEditor({
  index,
  line,
  onUpdate,
  onRemove,
}: {
  index: number;
  line: RequestLineForm;
  onUpdate: (index: number, key: keyof RequestLineForm, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border p-3 lg:grid-cols-[1fr_86px_110px_36px] lg:items-start">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Descripción</span>
        <Input
          value={line.description}
          onChange={(event) => onUpdate(index, "description", event.target.value)}
          placeholder="Ej. Cable THHN #12 rojo"
        />
        <textarea
          className="mt-2 min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          value={line.technicalSpecs}
          onChange={(event) => onUpdate(index, "technicalSpecs", event.target.value)}
          placeholder="Especificaciones técnicas, marca sugerida, norma o detalle."
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Cantidad</span>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={line.quantity}
          onChange={(event) => onUpdate(index, "quantity", event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Unidad</span>
        <Input value={line.unit} onChange={(event) => onUpdate(index, "unit", event.target.value)} />
      </label>
      <Button type="button" variant="outline" size="icon" title="Quitar línea" onClick={() => onRemove(index)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

function QuoteRequestCard({ request }: { request: QuoteRequest }) {
  return (
    <div className="rounded-lg border border-border p-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">{request.number}</p>
            <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-700">{request.project}</p>
          <p className="mt-1 text-xs text-slate-500">
            {request.requesterName} · {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-xs text-slate-500 sm:text-right">
          <p className="font-semibold text-ink">{request.itemCount} ítems</p>
          <p>{request.attachmentCount} adjuntos</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {request.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="truncate">{item.description}</span>
            <span className="shrink-0 font-semibold">
              {Number(item.quantity).toLocaleString()} {item.unit}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          Límite: {request.deadline ? new Date(request.deadline).toLocaleDateString() : "Sin fecha"}
        </span>
        {request.costCenter ? <span className="rounded-md bg-slate-50 px-2 py-1">{request.costCenter}</span> : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <ClipboardList className="mb-2.5 h-5 w-5 text-brand-700" />
        <p className="text-[13px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-bold text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
