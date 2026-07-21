import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, CheckCircle2, FileText, Layers3, Loader2, Paperclip, Send, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import {
  askAiDocumentRequest,
  listAiDocumentsRequest,
  uploadAiDocumentRequest,
  type AiDocumentSummary,
} from "../services/api";
import { cn } from "../lib/utils";

const acceptedFileTypes = ".csv,.xlsx,.xls,.pdf,.json,.txt,.docx";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export function AiConsult() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Sube varias cotizaciones y pregunta algo como: ¿quién vende más barato la manzana?",
      createdAt: new Date().toISOString(),
    },
  ]);

  const documentsQuery = useQuery({
    queryKey: ["ai-documents"],
    queryFn: () => listAiDocumentsRequest(token!),
    enabled: Boolean(token),
  });

  const documents = useMemo(() => documentsQuery.data?.documents ?? [], [documentsQuery.data?.documents]);
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const totalRows = documents.reduce((total, document) => total + document.rowCount, 0);
  const totalQuestions = documents.reduce((total, document) => total + document.questionCount, 0);

  const askMutation = useMutation({
    mutationFn: (nextQuestion: string) => askAiDocumentRequest(token!, selectedDocumentId, nextQuestion),
    onSuccess: async ({ answer }) => {
      setQuestion("");
      setMessages((current) => [
        ...current,
        { id: answer.id, role: "assistant", text: answer.answer, createdAt: answer.createdAt },
      ]);
      await queryClient.invalidateQueries({ queryKey: ["ai-documents"] });
    },
    onError: (error) => {
      setMessages((current) => [
        ...current,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          text: error instanceof Error ? error.message : "No pude responder esa pregunta.",
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  async function uploadFiles(fileList: FileList | File[] | null | undefined) {
    const files = Array.from(fileList ?? []);

    if (!files.length || !token) {
      return;
    }

    setNotice(null);
    setIsUploading(true);

    try {
      for (const file of files) {
        await uploadAiDocumentRequest(token, file);
      }

      setSelectedDocumentId(null);
      setNotice(`${files.length} documento${files.length === 1 ? "" : "s"} importado${files.length === 1 ? "" : "s"}.`);
      setMessages((current) => [
        ...current,
        {
          id: `upload_${Date.now()}`,
          role: "assistant",
          text: `Listo. Ya puedo comparar ${files.length} ${files.length === 1 ? "cotización" : "cotizaciones"} contra el resto del workspace.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      await queryClient.invalidateQueries({ queryKey: ["ai-documents"] });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pude importar esos documentos.");
    } finally {
      setIsUploading(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(event.target.files);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(event.dataTransfer.files);
  }

  function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();

    if (!documents.length) {
      setNotice("Primero sube una cotización o reporte.");
      return;
    }

    if (nextQuestion.length < 3) {
      setNotice("Escribe una pregunta un poco más completa.");
      return;
    }

    setNotice(null);
    setMessages((current) => [
      ...current,
      { id: `user_${Date.now()}`, role: "user", text: nextQuestion, createdAt: new Date().toISOString() },
    ]);
    askMutation.mutate(nextQuestion);
  }

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Compras y análisis"
        title="Consultas IA"
        description="Compara cotizaciones, encuentra mejores precios y guarda equivalencias de productos."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={acceptedFileTypes}
              onChange={onFileChange}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Subir cotizaciones
            </Button>
          </>
        }
      />

      {notice ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-3">
              <div
                className="rounded-lg border border-dashed border-border bg-slate-50 p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-ink">PDF, Excel, CSV, DOCX</p>
                    <p className="text-[11px] text-slate-500">Puedes subir varios a la vez.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Importar
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Docs" value={documents.length} />
                <MiniStat label="Filas" value={totalRows} />
                <MiniStat label="Chats" value={totalQuestions} />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-ink">Cotizaciones</h2>
                <Badge tone="slate">{documents.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="max-h-[520px] space-y-2 overflow-y-auto p-2.5">
              <ScopeButton
                label="Todas las cotizaciones"
                detail="Comparar workspace completo"
                isActive={!selectedDocumentId}
                icon={Layers3}
                onClick={() => setSelectedDocumentId(null)}
              />

              {documentsQuery.isLoading ? <EmptyState text="Cargando documentos..." /> : null}
              {!documentsQuery.isLoading && !documents.length ? <EmptyState text="Todavía no hay cotizaciones." /> : null}

              {documents.map((document) => (
                <DocumentButton
                  key={document.id}
                  document={document}
                  isActive={document.id === selectedDocumentId}
                  onClick={() => setSelectedDocumentId(document.id)}
                />
              ))}
            </CardContent>
          </Card>
        </aside>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Bot className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-ink">Chat de compras</h2>
                <p className="truncate text-[11px] text-slate-500">
                  {selectedDocument ? selectedDocument.fileName : "Consultando todas las cotizaciones"}
                </p>
              </div>
            </div>
            <Badge tone="green">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Backend activo
            </Badge>
          </CardHeader>

          <CardContent className="flex min-h-[610px] flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {askMutation.isPending ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
                  Analizando cotizaciones...
                </div>
              ) : null}
            </div>

            <form className="border-t border-border bg-white p-3" onSubmit={onAsk}>
              <div className="flex gap-2">
                <textarea
                  className="min-h-[54px] flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2 text-xs leading-5 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Ejemplo: ¿quién vende más barato la manzana?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <Button type="submit" className="h-[54px] self-end" disabled={askMutation.isPending || !documents.length}>
                  {askMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Enviar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ScopeButton({
  label,
  detail,
  isActive,
  icon: Icon,
  onClick,
}: {
  label: string;
  detail: string;
  isActive: boolean;
  icon: typeof Layers3;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition",
        isActive ? "border-brand-200 bg-brand-50 text-brand-900" : "border-border bg-white hover:bg-slate-50",
      )}
      onClick={onClick}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-ink">{label}</span>
        <span className="block truncate text-[11px] text-slate-500">{detail}</span>
      </span>
    </button>
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
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-700">
          <FileText className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-ink">{document.fileName}</span>
          <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-slate-500">{document.summary}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="slate">{formatFileSize(document.sizeBytes)}</Badge>
            <Badge tone="blue">{document.rowCount} filas</Badge>
          </span>
        </span>
      </div>
    </button>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[820px] rounded-lg border px-3 py-2 text-xs leading-5 shadow-sm",
          isUser ? "border-ink bg-ink text-white" : "border-border bg-white text-slate-700",
        )}
      >
        {!isUser ? (
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
            <Sparkles className="h-3 w-3" />
            Smart Source
          </p>
        ) : null}
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold text-ink">{value}</p>
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
