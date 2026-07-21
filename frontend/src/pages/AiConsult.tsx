import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Upload,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import {
  askAiDocumentRequest,
  getAiDocumentRequest,
  listAiDocumentsRequest,
  uploadAiDocumentRequest,
  type AiDocumentSummary,
} from "../services/api";
import { cn } from "../lib/utils";

const acceptedFileTypes = ".csv,.xlsx,.xls,.pdf,.json,.txt,.docx";

export function AiConsult() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["ai-documents"],
    queryFn: () => listAiDocumentsRequest(token!),
    enabled: Boolean(token),
  });

  const documents = useMemo(() => documentsQuery.data?.documents ?? [], [documentsQuery.data?.documents]);

  useEffect(() => {
    if (!selectedDocumentId && documents.length) {
      setSelectedDocumentId(documents[0].id);
    }
  }, [documents, selectedDocumentId]);

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const detailQuery = useQuery({
    queryKey: ["ai-document", selectedDocumentId],
    queryFn: () => getAiDocumentRequest(token!, selectedDocumentId!),
    enabled: Boolean(token && selectedDocumentId),
  });

  const documentDetail = detailQuery.data?.document;
  const latestQuestions = documentDetail?.questions ?? [];
  const totalQuestions = useMemo(
    () => documents.reduce((total, document) => total + document.questionCount, 0),
    [documents],
  );

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAiDocumentRequest(token!, file),
    onSuccess: async ({ document }) => {
      setSelectedDocumentId(document.id);
      setNotice("Documento leído y guardado. Ya puedes hacerle preguntas.");
      await queryClient.invalidateQueries({ queryKey: ["ai-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["ai-document", document.id] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "No pudimos importar el documento.");
    },
  });

  const askMutation = useMutation({
    mutationFn: (nextQuestion: string) => askAiDocumentRequest(token!, selectedDocumentId!, nextQuestion),
    onSuccess: async () => {
      setQuestion("");
      setNotice("Respuesta generada con la data del documento.");
      await queryClient.invalidateQueries({ queryKey: ["ai-document", selectedDocumentId] });
      await queryClient.invalidateQueries({ queryKey: ["ai-documents"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "No pudimos responder esa pregunta.");
    },
  });

  function uploadFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setNotice(null);
    uploadMutation.mutate(file);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    uploadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    uploadFile(event.dataTransfer.files?.[0]);
  }

  function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();

    if (!selectedDocumentId || nextQuestion.length < 3) {
      setNotice("Escribe una pregunta un poco más completa.");
      return;
    }

    setNotice(null);
    askMutation.mutate(nextQuestion);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Compras y análisis"
        title="Consultas IA"
        description="Importa reportes o documentos, Smart Source los lee en backend y te responde preguntas con la data encontrada."
        actions={
          <>
            <input ref={fileInputRef} type="file" className="hidden" accept={acceptedFileTypes} onChange={onFileChange} />
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Importar documento
            </Button>
          </>
        }
      />

      {notice ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileText} label="Documentos" value={documents.length.toString()} detail="importados" />
        <MetricCard icon={Database} label="Filas leídas" value={(selectedDocument?.rowCount ?? 0).toString()} detail="documento activo" />
        <MetricCard icon={MessageSquare} label="Preguntas" value={totalQuestions.toString()} detail="historial guardado" />
        <MetricCard icon={BrainCircuit} label="Motor" value="Local" detail="listo para pruebas" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <Card className="self-start overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Archivos</p>
              <h2 className="text-sm font-bold text-ink">Documentos leídos</h2>
            </div>
            <Badge tone="slate">{documents.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="rounded-lg border border-dashed border-brand-200 bg-brand-50/60 p-3 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <Upload className="mx-auto h-5 w-5 text-brand-700" />
              <p className="mt-2 text-xs font-bold text-ink">Suelta un archivo o impórtalo</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">CSV, Excel, PDF, JSON, TXT o DOCX hasta 15 MB.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                Seleccionar
              </Button>
            </div>

            <div className="space-y-2">
              {documentsQuery.isLoading ? <EmptyState text="Cargando documentos..." /> : null}
              {!documentsQuery.isLoading && !documents.length ? (
                <EmptyState text="Importa un archivo para empezar a consultar." />
              ) : null}
              {documents.map((document) => (
                <DocumentButton
                  key={document.id}
                  document={document}
                  isActive={document.id === selectedDocumentId}
                  onClick={() => setSelectedDocumentId(document.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedDocumentId ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bot className="mx-auto h-8 w-8 text-brand-700" />
                <h2 className="mt-3 text-sm font-bold text-ink">Todavía no hay documento activo</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Importa un archivo para ver resumen, texto leído y preguntas.</p>
              </CardContent>
            </Card>
          ) : null}

          {selectedDocumentId && detailQuery.isLoading ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-5 text-xs text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
                Cargando lectura del documento...
              </CardContent>
            </Card>
          ) : null}

          {documentDetail ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-ink">{documentDetail.fileName}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(documentDetail.sizeBytes)} · {documentDetail.extension?.toUpperCase() || "Archivo"} ·{" "}
                      {formatDate(documentDetail.createdAt)}
                    </p>
                  </div>
                  <Badge tone="green">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Leído
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoBlock title="Resumen automático" text={documentDetail.summary} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <MiniStat label="Hojas" value={documentDetail.sheetCount} />
                    <MiniStat label="Filas" value={documentDetail.rowCount} />
                    <MiniStat label="Consultas" value={documentDetail.questionCount} />
                  </div>
                  <InfoBlock title="Vista previa del texto leído" text={documentDetail.extractedTextPreview || "No se pudo extraer texto visible."} muted />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-sm font-bold text-ink">Pregunta sobre este documento</h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form className="grid gap-2 md:grid-cols-[1fr_auto]" onSubmit={onAsk}>
                    <textarea
                      className="min-h-[76px] w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-[13px] leading-5 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      placeholder="Ejemplo: ¿Cuál fue el gasto total por suplidor? ¿Qué producto aparece más caro?"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                    />
                    <Button type="submit" className="self-end" disabled={askMutation.isPending || !selectedDocumentId}>
                      {askMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Preguntar
                    </Button>
                  </form>

                  <div className="space-y-2">
                    {latestQuestions.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-border bg-slate-50 p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink">{entry.question}</p>
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{entry.answer}</p>
                            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                              <Clock3 className="h-3 w-3" />
                              {formatDate(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!latestQuestions.length ? <EmptyState text="Haz la primera pregunta y el resultado quedará guardado aquí." /> : null}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DocumentButton({
  document,
  isActive,
  onClick,
}: {
  document: AiDocumentSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border p-2.5 text-left transition",
        isActive ? "border-brand-200 bg-brand-50 text-brand-900" : "border-border bg-white hover:bg-slate-50",
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-ink">{document.fileName}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{document.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="slate">{formatFileSize(document.sizeBytes)}</Badge>
            <Badge tone="blue">{document.rowCount} filas</Badge>
            <Badge tone="green">{document.questionCount} preguntas</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-500">{label}</p>
          <Icon className="h-4 w-4 text-brand-700" />
        </div>
        <p className="mt-2 truncate text-xl font-bold text-ink">{value}</p>
        <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function InfoBlock({ title, text, muted = false }: { title: string; text: string; muted?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", muted ? "border-border bg-slate-50" : "border-brand-100 bg-brand-50/50")}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">{text}</p>;
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
