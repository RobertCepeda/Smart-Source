import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  Eye,
  FileText,
  Inbox,
  Paperclip,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  createQuoteRequestRequest,
  getQuoteRequestRequest,
  listQuoteRequestsRequest,
  type QuoteRequest,
  type QuoteRequestPayload,
  type QuoteRequestStatus,
} from "../services/api";

type ViewMode = "create" | "list" | "detail";

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
  const [viewMode, setViewMode] = useState<ViewMode>("create");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [project, setProject] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterPrefilled, setRequesterPrefilled] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [observations, setObservations] = useState("");
  const [lines, setLines] = useState<RequestLineForm[]>([{ ...emptyLine }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "">("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!requesterPrefilled && user?.name) {
      setRequesterName(user.name);
      setRequesterPrefilled(true);
    }
  }, [requesterPrefilled, user?.name]);

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
  const selectedRequestFromList = requests.find((request) => request.id === selectedRequestId) ?? null;

  const requestDetailQuery = useQuery({
    queryKey: ["quote-request", selectedRequestId],
    queryFn: () => getQuoteRequestRequest(token!, selectedRequestId!),
    enabled: Boolean(token && selectedRequestId),
  });

  const selectedRequest = requestDetailQuery.data?.request ?? selectedRequestFromList;

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
      setSelectedRequestId(request.id);
      setViewMode("detail");
      queryClient.setQueryData(["quote-request", request.id], { request });
      await queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : "No pudimos crear la solicitud de cotización."),
  });

  function openRequest(request: QuoteRequest) {
    setSelectedRequestId(request.id);
    setViewMode("detail");
    setNotice(null);
  }

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
        description="Crea, consulta e imprime solicitudes con número automático, ítems requeridos y adjuntos."
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

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-2 shadow-soft">
        <Button type="button" variant={viewMode === "create" ? "default" : "ghost"} onClick={() => setViewMode("create")}>
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
        <Button type="button" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}>
          <Inbox className="h-4 w-4" />
          Bandeja de solicitudes
        </Button>
        {selectedRequest ? (
          <Button type="button" variant={viewMode === "detail" ? "default" : "ghost"} onClick={() => setViewMode("detail")}>
            <Eye className="h-4 w-4" />
            Detalle {selectedRequest.number}
          </Button>
        ) : null}
      </section>

      {viewMode === "create" ? (
        <CreateQuoteRequestPanel
          project={project}
          costCenter={costCenter}
          requesterName={requesterName}
          deadline={deadline}
          observations={observations}
          lines={lines}
          attachments={attachments}
          notice={notice}
          isPending={createMutation.isPending}
          onProjectChange={setProject}
          onCostCenterChange={setCostCenter}
          onRequesterNameChange={setRequesterName}
          onDeadlineChange={setDeadline}
          onObservationsChange={setObservations}
          onUpdateLine={updateLine}
          onAddLine={addLine}
          onRemoveLine={removeLine}
          onAddAttachments={addAttachments}
          onRemoveAttachment={(index) => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}
          onSubmit={submitRequest}
        />
      ) : null}

      {viewMode === "list" ? (
        <QuoteRequestsInbox
          requests={requests}
          statusFilter={statusFilter}
          search={search}
          isLoading={requestsQuery.isLoading}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearch}
          onOpenRequest={openRequest}
        />
      ) : null}

      {viewMode === "detail" ? (
        <QuoteRequestDetailPanel
          request={selectedRequest}
          isLoading={requestDetailQuery.isLoading}
          notice={notice}
          onBack={() => setViewMode("list")}
          onPrint={() => selectedRequest && printQuoteRequest(selectedRequest)}
        />
      ) : null}
    </div>
  );
}

function CreateQuoteRequestPanel({
  project,
  costCenter,
  requesterName,
  deadline,
  observations,
  lines,
  attachments,
  notice,
  isPending,
  onProjectChange,
  onCostCenterChange,
  onRequesterNameChange,
  onDeadlineChange,
  onObservationsChange,
  onUpdateLine,
  onAddLine,
  onRemoveLine,
  onAddAttachments,
  onRemoveAttachment,
  onSubmit,
}: {
  project: string;
  costCenter: string;
  requesterName: string;
  deadline: string;
  observations: string;
  lines: RequestLineForm[];
  attachments: File[];
  notice: string | null;
  isPending: boolean;
  onProjectChange: (value: string) => void;
  onCostCenterChange: (value: string) => void;
  onRequesterNameChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onUpdateLine: (index: number, key: keyof RequestLineForm, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onAddAttachments: (files: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-ink">Nueva solicitud</h2>
          <p className="text-xs text-slate-500">Completa los datos base. Al guardar se abrirá el detalle completo.</p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Proyecto o centro</span>
              <Input value={project} onChange={(event) => onProjectChange(event.target.value)} placeholder="Ej. Torre Norte / Obra eléctrica" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Centro de costo</span>
              <Input value={costCenter} onChange={(event) => onCostCenterChange(event.target.value)} placeholder="Ej. CC-204" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Solicitante</span>
              <Input
                value={requesterName}
                onChange={(event) => onRequesterNameChange(event.target.value)}
                placeholder="Nombre del solicitante"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Fecha límite</span>
              <Input type="date" value={deadline} onChange={(event) => onDeadlineChange(event.target.value)} />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-slate-700">Materiales, equipos o servicios</p>
              <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>

            {lines.map((line, index) => (
              <RequestLineEditor key={index} index={index} line={line} onUpdate={onUpdateLine} onRemove={onRemoveLine} />
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Observaciones generales</span>
            <textarea
              className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={observations}
              onChange={(event) => onObservationsChange(event.target.value)}
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
                    onAddAttachments(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            {attachments.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2 text-xs"
                  >
                    <FileText className="h-4 w-4 text-brand-700" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{file.name}</p>
                      <p className="text-slate-500">{formatBytes(file.size)}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" title="Quitar adjunto" onClick={() => onRemoveAttachment(index)}>
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

          <Button type="submit" disabled={isPending}>
            <ClipboardList className="h-4 w-4" />
            {isPending ? "Creando..." : "Crear solicitud"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function QuoteRequestsInbox({
  requests,
  statusFilter,
  search,
  isLoading,
  onStatusFilterChange,
  onSearchChange,
  onOpenRequest,
}: {
  requests: QuoteRequest[];
  statusFilter: QuoteRequestStatus | "";
  search: string;
  isLoading: boolean;
  onStatusFilterChange: (status: QuoteRequestStatus | "") => void;
  onSearchChange: (value: string) => void;
  onOpenRequest: (request: QuoteRequest) => void;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Bandeja de solicitudes</h2>
            <p className="text-xs text-slate-500">Consulta las solicitudes creadas y abre el detalle cuando lo necesites.</p>
          </div>
          <select
            className="h-9 rounded-lg border border-border bg-white px-3 text-[13px]"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as QuoteRequestStatus | "")}
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="LISTA_PARA_ENVIAR">Lista</option>
            <option value="ENVIADA">Enviada</option>
            <option value="RECIBIENDO_COTIZACIONES">Recibiendo</option>
            <option value="CERRADA">Cerrada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por número, proyecto o ítem" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
            Cargando solicitudes...
          </p>
        ) : null}

        {!isLoading && !requests.length ? (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
            Aún no hay solicitudes con este filtro.
          </p>
        ) : null}

        <div className="grid gap-3">
          {requests.map((request) => (
            <QuoteRequestCard key={request.id} request={request} onOpen={() => onOpenRequest(request)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuoteRequestDetailPanel({
  request,
  isLoading,
  notice,
  onBack,
  onPrint,
}: {
  request: QuoteRequest | null;
  isLoading: boolean;
  notice: string | null;
  onBack: () => void;
  onPrint: () => void;
}) {
  if (isLoading && !request) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-[13px] text-slate-600">Cargando detalle de la solicitud...</p>
        </CardContent>
      </Card>
    );
  }

  if (!request) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-[13px] text-slate-600">Selecciona una solicitud desde la bandeja.</p>
          <Button type="button" variant="outline" className="mt-3" onClick={onBack}>
            Ir a la bandeja
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-ink">{request.number}</h2>
              <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
            </div>
            <p className="mt-1 text-[13px] font-semibold text-slate-700">{request.project}</p>
            <p className="mt-1 text-xs text-slate-500">Solicitud creada el {formatDate(request.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              <Inbox className="h-4 w-4" />
              Bandeja
            </Button>
            <Button type="button" onClick={onPrint}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
        {notice ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
            {notice}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <section className="grid gap-3 md:grid-cols-4">
          <DetailBox label="Proyecto" value={request.project} />
          <DetailBox label="Centro de costo" value={request.costCenter ?? "Sin centro"} />
          <DetailBox label="Solicitante" value={request.requesterName} />
          <DetailBox label="Fecha límite" value={request.deadline ? formatDate(request.deadline) : "Sin fecha"} />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-ink">Ítems solicitados</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[54px_1fr_110px_110px] bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              <span>No.</span>
              <span>Descripción</span>
              <span>Cantidad</span>
              <span>Unidad</span>
            </div>
            {request.items.map((item) => (
              <div key={item.id} className="grid grid-cols-[54px_1fr_110px_110px] gap-3 border-t border-border px-3 py-3 text-[13px]">
                <span className="font-bold text-slate-500">{item.lineNumber}</span>
                <div>
                  <p className="font-semibold text-ink">{item.description}</p>
                  {item.technicalSpecs ? <p className="mt-1 leading-5 text-slate-500">{item.technicalSpecs}</p> : null}
                </div>
                <span className="font-semibold text-ink">{Number(item.quantity).toLocaleString("es-DO")}</span>
                <span className="text-slate-600">{item.unit}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h3 className="mb-2 text-sm font-bold text-ink">Observaciones generales</h3>
            <div className="min-h-24 rounded-lg border border-border bg-slate-50 p-3 text-[13px] leading-6 text-slate-700">
              {request.observations || "Sin observaciones."}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-ink">Adjuntos</h3>
            <div className="space-y-2">
              {request.attachments.length ? (
                request.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                    <FileText className="h-4 w-4 text-brand-700" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{attachment.fileName}</p>
                      <p className="text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-[13px] text-slate-600">
                  Esta solicitud no tiene adjuntos.
                </p>
              )}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
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
        <Input value={line.description} onChange={(event) => onUpdate(index, "description", event.target.value)} placeholder="Ej. Cable THHN #12 rojo" />
        <textarea
          className="mt-2 min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          value={line.technicalSpecs}
          onChange={(event) => onUpdate(index, "technicalSpecs", event.target.value)}
          placeholder="Especificaciones técnicas, marca sugerida, norma o detalle."
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-500">Cantidad</span>
        <Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => onUpdate(index, "quantity", event.target.value)} />
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

function QuoteRequestCard({ request, onOpen }: { request: QuoteRequest; onOpen: () => void }) {
  return (
    <button type="button" className="rounded-lg border border-border bg-white p-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50/30" onClick={onOpen}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">{request.number}</p>
            <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-slate-700">{request.project}</p>
          <p className="mt-1 text-xs text-slate-500">
            {request.requesterName} · {formatDate(request.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 sm:text-right">
          <div>
            <p className="font-semibold text-ink">{request.itemCount} ítems</p>
            <p>{request.attachmentCount} adjuntos</p>
          </div>
          <Eye className="h-4 w-4 text-brand-700" />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {request.items.slice(0, 3).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="truncate">{item.description}</span>
            <span className="shrink-0 font-semibold">
              {Number(item.quantity).toLocaleString("es-DO")} {item.unit}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          Límite: {request.deadline ? formatDate(request.deadline) : "Sin fecha"}
        </span>
        {request.costCenter ? <span className="rounded-md bg-slate-50 px-2 py-1">{request.costCenter}</span> : null}
      </div>
    </button>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
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

function printQuoteRequest(request: QuoteRequest) {
  const printWindow = window.open("", "_blank", "width=980,height=720");

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
<!doctype html>
<html>
  <head>
    <title>${escapeHtml(request.number)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; }
      .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f766e; padding-bottom: 18px; }
      .brand { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #047857; font-weight: 700; }
      h1 { margin: 8px 0 0; font-size: 28px; }
      .status { border: 1px solid #cbd5e1; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 22px 0; }
      .box { border: 1px solid #dbe3ef; border-radius: 10px; padding: 12px; }
      .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; }
      .value { margin-top: 6px; font-size: 14px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; text-align: left; }
      th, td { border: 1px solid #dbe3ef; padding: 10px; vertical-align: top; font-size: 13px; }
      .section { margin-top: 22px; }
      .section h2 { margin: 0 0 8px; font-size: 16px; }
      .muted { color: #64748b; }
      @media print { body { padding: 18px; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="brand">Smart Source</div>
        <h1>Solicitud de Cotización</h1>
        <p class="muted">${escapeHtml(request.project)}</p>
      </div>
      <div>
        <div style="font-size: 22px; font-weight: 800;">${escapeHtml(request.number)}</div>
        <div class="status">${escapeHtml(statusLabels[request.status])}</div>
      </div>
    </div>

    <div class="grid">
      ${printBox("Proyecto", request.project)}
      ${printBox("Centro de costo", request.costCenter ?? "Sin centro")}
      ${printBox("Solicitante", request.requesterName)}
      ${printBox("Fecha límite", request.deadline ? formatDate(request.deadline) : "Sin fecha")}
    </div>

    <div class="section">
      <h2>Ítems solicitados</h2>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Especificaciones</th>
          </tr>
        </thead>
        <tbody>
          ${request.items
            .map(
              (item) => `
                <tr>
                  <td>${item.lineNumber}</td>
                  <td>${escapeHtml(item.description)}</td>
                  <td>${escapeHtml(Number(item.quantity).toLocaleString("es-DO"))}</td>
                  <td>${escapeHtml(item.unit)}</td>
                  <td>${escapeHtml(item.technicalSpecs ?? "")}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Observaciones</h2>
      <p>${escapeHtml(request.observations || "Sin observaciones.")}</p>
    </div>

    <div class="section">
      <h2>Adjuntos</h2>
      <p>${escapeHtml(request.attachments.map((attachment) => attachment.fileName).join(", ") || "Sin adjuntos.")}</p>
    </div>
  </body>
</html>
`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printBox(label: string, value: string) {
  return `<div class="box"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-DO");
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
