import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  FileUp,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  Printer,
  Search,
  Sparkles,
  Star,
  Table2,
  Trash2,
  type LucideIcon,
  Users,
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
  generateQuoteRequestEmailRequest,
  getQuoteRequestRequest,
  listQuoteRequestsRequest,
  listSuppliersRequest,
  registerSupplierQuoteRequest,
  type QuoteRequest,
  type QuoteRequestPayload,
  type QuoteRequestStatus,
  type Supplier,
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
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "">("");
  const [search, setSearch] = useState("");
  const [quoteSupplierId, setQuoteSupplierId] = useState("");
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [quoteReceivedAt, setQuoteReceivedAt] = useState("");
  const [quoteObservations, setQuoteObservations] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!requesterPrefilled && user?.name) {
      setRequesterName(user.name);
      setRequesterPrefilled(true);
    }
  }, [requesterPrefilled, user?.name]);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "quote-requests"],
    queryFn: () => listSuppliersRequest(token!),
    enabled: Boolean(token),
  });

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
  const suppliers = useMemo(() => suppliersQuery.data?.suppliers ?? [], [suppliersQuery.data?.suppliers]);
  const selectedRequestFromList = requests.find((request) => request.id === selectedRequestId) ?? null;

  const requestDetailQuery = useQuery({
    queryKey: ["quote-request", selectedRequestId],
    queryFn: () => getQuoteRequestRequest(token!, selectedRequestId!),
    enabled: Boolean(token && selectedRequestId),
  });

  const selectedRequest = requestDetailQuery.data?.request ?? selectedRequestFromList;

  useEffect(() => {
    if (!quoteSupplierId && selectedRequest?.suppliers.length) {
      setQuoteSupplierId(selectedRequest.suppliers[0].supplierId);
    }
  }, [quoteSupplierId, selectedRequest?.suppliers]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      suppliers: requests.reduce((sum, request) => sum + request.supplierCount, 0),
      quotes: requests.reduce((sum, request) => sum + request.quoteCount, 0),
      items: requests.reduce((sum, request) => sum + request.itemCount, 0),
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
      setSelectedSupplierIds([]);
      setSelectedRequestId(request.id);
      setQuoteSupplierId(request.suppliers[0]?.supplierId ?? "");
      setViewMode("detail");
      queryClient.setQueryData(["quote-request", request.id], { request });
      await queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
    onError: (error) =>
      setNotice(error instanceof Error ? error.message : "No pudimos crear la solicitud de cotización."),
  });

  const emailMutation = useMutation({
    mutationFn: ({ requestId, supplierId }: { requestId: string; supplierId: string }) =>
      generateQuoteRequestEmailRequest(token!, requestId, supplierId),
    onSuccess: async ({ mailtoUrl, emailLog }) => {
      window.location.href = mailtoUrl;
      setNotice(`Correo preparado para ${emailLog.recipientEmail}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quote-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["quote-request", selectedRequestId] }),
      ]);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos preparar el correo."),
  });

  const quoteMutation = useMutation({
    mutationFn: ({ requestId, supplierId, file, receivedAt, observations }: { requestId: string; supplierId: string; file: File; receivedAt?: string; observations?: string }) =>
      registerSupplierQuoteRequest(token!, requestId, { supplierId, receivedAt, observations }, file),
    onSuccess: async () => {
      setNotice("Cotización registrada y analizada.");
      setQuoteFile(null);
      setQuoteObservations("");
      setQuoteReceivedAt("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quote-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["quote-request", selectedRequestId] }),
      ]);
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos registrar la cotización."),
  });

  function openRequest(request: QuoteRequest) {
    setSelectedRequestId(request.id);
    setQuoteSupplierId(request.suppliers[0]?.supplierId ?? "");
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

  function toggleSupplier(id: string) {
    setSelectedSupplierIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
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
        supplierIds: selectedSupplierIds,
        items: validLines,
      },
      files: attachments,
    });
  }

  function submitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!selectedRequest || !quoteSupplierId || !quoteFile) {
      setNotice("Selecciona el suplidor y el archivo de cotización.");
      return;
    }

    quoteMutation.mutate({
      requestId: selectedRequest.id,
      supplierId: quoteSupplierId,
      file: quoteFile,
      receivedAt: quoteReceivedAt,
      observations: quoteObservations,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Compras y análisis"
        title="Solicitudes de Cotización"
        description="Centraliza solicitud, suplidores, correos, recepción, análisis y comparación de ofertas."
        actions={
          <Badge tone="green">
            <Sparkles className="h-3.5 w-3.5" />
            Flujo completo
          </Badge>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Solicitudes" value={stats.total.toString()} />
        <MetricCard icon={Users} label="Suplidores invitados" value={stats.suppliers.toString()} />
        <MetricCard icon={FileText} label="Cotizaciones" value={stats.quotes.toString()} />
        <MetricCard icon={Table2} label="Ítems solicitados" value={stats.items.toString()} />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-2 shadow-soft">
        <Button type="button" variant={viewMode === "create" ? "default" : "ghost"} onClick={() => setViewMode("create")}>
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
        <Button type="button" variant={viewMode === "list" ? "default" : "ghost"} onClick={() => setViewMode("list")}>
          <Inbox className="h-4 w-4" />
          Bandeja
        </Button>
        {selectedRequest ? (
          <Button type="button" variant={viewMode === "detail" ? "default" : "ghost"} onClick={() => setViewMode("detail")}>
            <Eye className="h-4 w-4" />
            {selectedRequest.number}
          </Button>
        ) : null}
      </section>

      {viewMode === "create" ? (
        <CreateQuoteRequestPanel
          suppliers={suppliers}
          selectedSupplierIds={selectedSupplierIds}
          project={project}
          costCenter={costCenter}
          requesterName={requesterName}
          deadline={deadline}
          observations={observations}
          lines={lines}
          attachments={attachments}
          notice={notice}
          isPending={createMutation.isPending}
          isLoadingSuppliers={suppliersQuery.isLoading}
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
          onToggleSupplier={toggleSupplier}
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
          quoteSupplierId={quoteSupplierId}
          quoteFile={quoteFile}
          quoteReceivedAt={quoteReceivedAt}
          quoteObservations={quoteObservations}
          isLoading={requestDetailQuery.isLoading}
          notice={notice}
          isEmailPending={emailMutation.isPending}
          isQuotePending={quoteMutation.isPending}
          onBack={() => setViewMode("list")}
          onPrint={() => selectedRequest && printQuoteRequest(selectedRequest)}
          onGenerateEmail={(supplierId) => selectedRequest && emailMutation.mutate({ requestId: selectedRequest.id, supplierId })}
          onQuoteSupplierChange={setQuoteSupplierId}
          onQuoteFileChange={setQuoteFile}
          onQuoteReceivedAtChange={setQuoteReceivedAt}
          onQuoteObservationsChange={setQuoteObservations}
          onSubmitQuote={submitQuote}
        />
      ) : null}
    </div>
  );
}

function CreateQuoteRequestPanel({
  suppliers,
  selectedSupplierIds,
  project,
  costCenter,
  requesterName,
  deadline,
  observations,
  lines,
  attachments,
  notice,
  isPending,
  isLoadingSuppliers,
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
  onToggleSupplier,
  onSubmit,
}: {
  suppliers: Supplier[];
  selectedSupplierIds: string[];
  project: string;
  costCenter: string;
  requesterName: string;
  deadline: string;
  observations: string;
  lines: RequestLineForm[];
  attachments: File[];
  notice: string | null;
  isPending: boolean;
  isLoadingSuppliers: boolean;
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
  onToggleSupplier: (id: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Datos de la solicitud</h2>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Input value={requesterName} onChange={(event) => onRequesterNameChange(event.target.value)} placeholder="Nombre del solicitante" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Fecha límite</span>
              <Input type="date" value={deadline} onChange={(event) => onDeadlineChange(event.target.value)} />
            </label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Suplidores invitados</h2>
            <p className="text-xs text-slate-500">Selecciona uno o varios suplidores registrados. Se usará su correo o contacto principal.</p>
          </div>
          <Badge tone={selectedSupplierIds.length ? "green" : "slate"}>{selectedSupplierIds.length} seleccionados</Badge>
        </CardHeader>
        <CardContent>
          {isLoadingSuppliers ? <p className="text-[13px] text-slate-600">Cargando suplidores...</p> : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierChoiceCard
                key={supplier.id}
                supplier={supplier}
                isSelected={selectedSupplierIds.includes(supplier.id)}
                onToggle={() => onToggleSupplier(supplier.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-base font-bold text-ink">Materiales, equipos o servicios</h2>
          <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {lines.map((line, index) => (
            <RequestLineEditor key={index} index={index} line={line} onUpdate={onUpdateLine} onRemove={onRemoveLine} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-bold text-ink">Adjuntos de referencia</h2>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">Planos, fichas técnicas o documentos para enviar a los suplidores.</p>
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
                  <FileChip key={`${file.name}-${index}`} name={file.name} detail={formatBytes(file.size)} onRemove={() => onRemoveAttachment(index)} />
                ))}
              </div>
            ) : null}
          </div>

          {notice ? <Notice>{notice}</Notice> : null}
          <div className="mt-4">
            <Button type="submit" disabled={isPending}>
              <ClipboardList className="h-4 w-4" />
              {isPending ? "Creando..." : "Crear solicitud"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function SupplierChoiceCard({ supplier, isSelected, onToggle }: { supplier: Supplier; isSelected: boolean; onToggle: () => void }) {
  const primary = supplier.contacts.find((contact) => contact.isPrimary) ?? supplier.contacts[0];
  const email = primary?.email ?? supplier.email;
  const phone = primary?.phone ?? supplier.phone;

  return (
    <button
      type="button"
      className={`rounded-lg border p-3 text-left transition ${
        isSelected ? "border-brand-300 bg-brand-50/70" : "border-border bg-white hover:border-brand-200 hover:bg-slate-50"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{supplier.name}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{supplier.city ?? "Sin ciudad"} · {supplier.category ?? "Sin categoría"}</p>
        </div>
        {isSelected ? <CheckCircle2 className="h-4 w-4 text-brand-700" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
      </div>
      <div className="mt-3 space-y-1 text-xs text-slate-600">
        <p className="truncate">Contacto: {primary?.name ?? "Principal"}</p>
        <p className="truncate">Correo: {email ?? "Sin correo"}</p>
        <p className="truncate">Teléfono: {phone ?? "Sin teléfono"}</p>
      </div>
    </button>
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
            <p className="text-xs text-slate-500">Abre el expediente para enviar correos, registrar cotizaciones y comparar ofertas.</p>
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
          <Input className="pl-9" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar por número, proyecto, suplidor o ítem" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <EmptyState text="Cargando solicitudes..." /> : null}
        {!isLoading && !requests.length ? <EmptyState text="Aún no hay solicitudes con este filtro." /> : null}
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
  quoteSupplierId,
  quoteFile,
  quoteReceivedAt,
  quoteObservations,
  isLoading,
  notice,
  isEmailPending,
  isQuotePending,
  onBack,
  onPrint,
  onGenerateEmail,
  onQuoteSupplierChange,
  onQuoteFileChange,
  onQuoteReceivedAtChange,
  onQuoteObservationsChange,
  onSubmitQuote,
}: {
  request: QuoteRequest | null;
  quoteSupplierId: string;
  quoteFile: File | null;
  quoteReceivedAt: string;
  quoteObservations: string;
  isLoading: boolean;
  notice: string | null;
  isEmailPending: boolean;
  isQuotePending: boolean;
  onBack: () => void;
  onPrint: () => void;
  onGenerateEmail: (supplierId: string) => void;
  onQuoteSupplierChange: (value: string) => void;
  onQuoteFileChange: (file: File | null) => void;
  onQuoteReceivedAtChange: (value: string) => void;
  onQuoteObservationsChange: (value: string) => void;
  onSubmitQuote: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (isLoading && !request) {
    return <EmptyState text="Cargando detalle de la solicitud..." />;
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-ink">{request.number}</h2>
                <Badge tone={statusTone[request.status]}>{statusLabels[request.status]}</Badge>
                <Badge tone="blue">{request.quoteCount} cotizaciones</Badge>
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
          {notice ? <Notice>{notice}</Notice> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <DetailBox label="Proyecto" value={request.project} />
            <DetailBox label="Centro de costo" value={request.costCenter ?? "Sin centro"} />
            <DetailBox label="Solicitante" value={request.requesterName} />
            <DetailBox label="Fecha límite" value={request.deadline ? formatDate(request.deadline) : "Sin fecha"} />
          </section>
          <RequestItemsTable request={request} />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <h3 className="text-base font-bold text-ink">Suplidores y correos</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.suppliers.length ? (
              request.suppliers.map((entry) => {
                const hasQuote = request.quotes.some((quote) => quote.supplierId === entry.supplierId);
                return (
                  <div key={entry.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-ink">{entry.supplier.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.contactName ?? "Contacto principal"} · {entry.contactEmail ?? "Sin correo"}</p>
                        <p className="mt-1 text-xs text-slate-500">{entry.contactPhone ?? entry.supplier.phone ?? "Sin teléfono"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasQuote ? <Badge tone="green">Cotizó</Badge> : <Badge tone="amber">Pendiente</Badge>}
                        <Button type="button" variant="outline" size="sm" disabled={isEmailPending} onClick={() => onGenerateEmail(entry.supplierId)}>
                          <Mail className="h-4 w-4" />
                          Correo
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Esta solicitud no tiene suplidores seleccionados." />
            )}

            <div className="rounded-lg border border-border bg-slate-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Historial de correos</p>
              {request.emailLogs.length ? (
                <div className="space-y-2">
                  {request.emailLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{log.recipientEmail}</p>
                        <p className="text-slate-500">{formatDateTime(log.createdAt)}</p>
                      </div>
                      <Badge tone="blue">{log.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Aún no se ha preparado ningún correo.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-bold text-ink">Recepción de cotizaciones</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 rounded-lg border border-border bg-slate-50 p-3 md:grid-cols-[1fr_150px] md:items-end" onSubmit={onSubmitQuote}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Suplidor</span>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                  value={quoteSupplierId}
                  onChange={(event) => onQuoteSupplierChange(event.target.value)}
                >
                  {request.suppliers.map((entry) => (
                    <option key={entry.supplierId} value={entry.supplierId}>
                      {entry.supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Recepción</span>
                <Input type="date" value={quoteReceivedAt} onChange={(event) => onQuoteReceivedAtChange(event.target.value)} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Archivo original</span>
                <input
                  type="file"
                  className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px]"
                  onChange={(event) => onQuoteFileChange(event.target.files?.[0] ?? null)}
                />
                {quoteFile ? <p className="mt-1 text-xs text-slate-500">{quoteFile.name} · {formatBytes(quoteFile.size)}</p> : null}
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">Observaciones</span>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  value={quoteObservations}
                  onChange={(event) => onQuoteObservationsChange(event.target.value)}
                  placeholder="Notas internas sobre la cotización recibida."
                />
              </label>
              <Button type="submit" disabled={isQuotePending || !request.suppliers.length} className="md:col-span-2">
                <FileUp className="h-4 w-4" />
                {isQuotePending ? "Analizando..." : "Registrar y analizar cotización"}
              </Button>
            </form>

            <div className="space-y-2">
              {request.quotes.length ? (
                request.quotes.map((quote) => (
                  <div key={quote.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{quote.supplier.name}</p>
                        <p className="truncate text-xs text-slate-500">{quote.fileName} · {formatDate(quote.receivedAt)}</p>
                      </div>
                      <Badge tone={quote.reviewStatus === "ANALIZADA" ? "green" : "amber"}>{quote.reviewStatus}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{quote.lines.length} líneas detectadas</p>
                  </div>
                ))
              ) : (
                <EmptyState text="Aún no hay cotizaciones registradas." />
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <ComparisonTable request={request} />
    </div>
  );
}

function RequestItemsTable({ request }: { request: QuoteRequest }) {
  return (
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
      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-border bg-slate-50 p-3 text-[13px] leading-6 text-slate-700">
          {request.observations || "Sin observaciones generales."}
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Adjuntos</p>
          {request.attachments.length ? (
            <div className="space-y-2">
              {request.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 text-xs">
                  <FileText className="h-4 w-4 text-brand-700" />
                  <span className="truncate font-semibold text-ink">{attachment.fileName}</span>
                  <span className="text-slate-500">{formatBytes(attachment.sizeBytes)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Sin adjuntos.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ComparisonTable({ request }: { request: QuoteRequest }) {
  const hasOffers = request.comparison.rows.some((row) => row.offers.some((offer) => offer.quoteId));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold text-ink">Comparación automática</h3>
          <p className="text-xs text-slate-500">Cada fila es un ítem solicitado y cada columna representa un suplidor.</p>
        </div>
        <Badge tone={hasOffers ? "green" : "slate"}>
          <Sparkles className="h-3.5 w-3.5" />
          {hasOffers ? "Análisis activo" : "Esperando cotizaciones"}
        </Badge>
      </CardHeader>
      <CardContent>
        {!request.suppliers.length ? <EmptyState text="Selecciona suplidores para construir el cuadro comparativo." /> : null}
        {request.suppliers.length && !hasOffers ? <EmptyState text="Registra cotizaciones para ver precios, marcas, tiempos y diferencias." /> : null}
        {request.suppliers.length ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-[980px] w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="w-56 border-b border-border px-3 py-2 font-bold uppercase tracking-[0.12em]">Ítem</th>
                  {request.comparison.suppliers.map((supplier) => (
                    <th key={supplier.supplierId} className="min-w-56 border-b border-l border-border px-3 py-2 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-ink">{supplier.supplierName}</p>
                          <p className="mt-1 flex items-center gap-1 text-slate-500">
                            <Star className="h-3 w-3" />
                            {supplier.rating || 0}/5
                          </p>
                        </div>
                        {supplier.quoteId ? <Badge tone="green">Recibida</Badge> : <Badge tone="amber">Pendiente</Badge>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {request.comparison.rows.map((row) => (
                  <tr key={row.item.id} className="border-t border-border">
                    <td className="bg-white px-3 py-3 align-top">
                      <p className="font-bold text-ink">{row.item.lineNumber}. {row.item.description}</p>
                      <p className="mt-1 text-slate-500">{Number(row.item.quantity).toLocaleString("es-DO")} {row.item.unit}</p>
                    </td>
                    {row.offers.map((offer) => (
                      <td key={`${row.item.id}-${offer.supplierId}`} className="border-l border-border px-3 py-3 align-top">
                        {offer.quoteId ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {offer.isBestPrice ? <Badge tone="green">Mejor precio</Badge> : null}
                              {offer.isBestDelivery ? <Badge tone="blue">Mejor entrega</Badge> : null}
                              {offer.matchScore !== null ? <Badge tone={offer.matchScore >= 60 ? "green" : "amber"}>{offer.matchScore}% match</Badge> : null}
                            </div>
                            <p><span className="font-semibold text-slate-500">Unitario:</span> {formatMoney(offer.unitPrice)}</p>
                            <p><span className="font-semibold text-slate-500">Total:</span> {formatMoney(offer.totalPrice)}</p>
                            <p><span className="font-semibold text-slate-500">Marca:</span> {offer.brand ?? "N/D"}</p>
                            <p><span className="font-semibold text-slate-500">Modelo:</span> {offer.model ?? "N/D"}</p>
                            <p><span className="font-semibold text-slate-500">Entrega:</span> {offer.leadTime ?? "N/D"}</p>
                            <p><span className="font-semibold text-slate-500">Garantía:</span> {offer.warranty ?? "N/D"}</p>
                            <p><span className="font-semibold text-slate-500">Disponibilidad:</span> {offer.availability ?? "N/D"}</p>
                            {offer.differences ? (
                              <p className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                                <AlertTriangle className="mr-1 inline h-3 w-3" />
                                {offer.differences}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin cotización</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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
          <p className="mt-1 text-xs text-slate-500">{request.requesterName} · {formatDate(request.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 sm:text-right">
          <div>
            <p className="font-semibold text-ink">{request.supplierCount} suplidores</p>
            <p>{request.quoteCount} cotizaciones</p>
          </div>
          <Eye className="h-4 w-4 text-brand-700" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1">
          <CalendarDays className="h-3.5 w-3.5" />
          Límite: {request.deadline ? formatDate(request.deadline) : "Sin fecha"}
        </span>
        {request.costCenter ? <span className="rounded-md bg-slate-50 px-2 py-1">{request.costCenter}</span> : null}
        <span className="rounded-md bg-slate-50 px-2 py-1">{request.itemCount} ítems</span>
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

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Icon className="mb-2.5 h-5 w-5 text-brand-700" />
        <p className="text-[13px] font-semibold text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-bold text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}

function FileChip({ name, detail, onRemove }: { name: string; detail: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2 text-xs">
      <FileText className="h-4 w-4 text-brand-700" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink">{name}</p>
        <p className="text-slate-500">{detail}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" title="Quitar adjunto" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">{text}</p>;
}

function Notice({ children }: { children: string }) {
  return <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{children}</div>;
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
      <h2>Suplidores invitados</h2>
      <p>${escapeHtml(request.suppliers.map((entry) => entry.supplier.name).join(", ") || "Sin suplidores.")}</p>
    </div>

    <div class="section">
      <h2>Ítems solicitados</h2>
      <table>
        <thead>
          <tr><th>No.</th><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>Especificaciones</th></tr>
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

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/D";
  }

  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-DO");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
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
