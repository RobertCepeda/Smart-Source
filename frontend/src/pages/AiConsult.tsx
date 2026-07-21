import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, FileText, Loader2, MessageSquarePlus, Paperclip, Plus, Send, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import {
  askAiChatRequest,
  createAiChatRequest,
  getAiChatRequest,
  listAiChatsRequest,
  uploadAiChatDocumentRequest,
  type AiChatSummary,
  type AiDocumentSummary,
  type AiQuestionAnswer,
} from "../services/api";
import { cn } from "../lib/utils";

const acceptedFileTypes = ".csv,.xlsx,.xls,.pdf,.json,.txt,.docx";

type ChatMessage =
  | { id: string; role: "user"; text: string; createdAt: string }
  | { id: string; role: "assistant"; text: string; createdAt: string };

export function AiConsult() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("Cotizaciones de hoy");
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const chatsQuery = useQuery({
    queryKey: ["ai-chats"],
    queryFn: () => listAiChatsRequest(token!),
    enabled: Boolean(token),
  });

  const chats = useMemo(() => chatsQuery.data?.chats ?? [], [chatsQuery.data?.chats]);
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? null;

  const chatQuery = useQuery({
    queryKey: ["ai-chat", selectedChatId],
    queryFn: () => getAiChatRequest(token!, selectedChatId!),
    enabled: Boolean(token && selectedChatId),
  });

  const chatDetail = chatQuery.data?.chat ?? null;
  const documents = chatDetail?.documents ?? [];
  const messages = buildMessages(chatDetail?.questions ?? [], pendingQuestion);

  useEffect(() => {
    if (!selectedChatId && chats.length) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const createChatMutation = useMutation({
    mutationFn: (title: string) => createAiChatRequest(token!, title),
    onSuccess: async ({ chat }) => {
      setSelectedChatId(chat.id);
      setNewChatTitle("Cotizaciones de hoy");
      setNotice("Chat creado. Ya puedes subir cotizaciones.");
      await queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "No pude crear el chat.");
    },
  });

  const askMutation = useMutation({
    mutationFn: ({ chatId, nextQuestion }: { chatId: string; nextQuestion: string }) =>
      askAiChatRequest(token!, chatId, nextQuestion),
    onSuccess: async () => {
      setQuestion("");
      setPendingQuestion(null);
      await queryClient.invalidateQueries({ queryKey: ["ai-chat", selectedChatId] });
      await queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "No pude responder esa pregunta.");
      setPendingQuestion(null);
    },
  });

  async function ensureActiveChat() {
    if (selectedChatId) {
      return selectedChatId;
    }

    if (chats[0]?.id) {
      setSelectedChatId(chats[0].id);
      return chats[0].id;
    }

    if (!token) {
      return null;
    }

    const { chat } = await createAiChatRequest(token, newChatTitle || "Cotizaciones de hoy");
    setSelectedChatId(chat.id);
    await queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
    return chat.id;
  }

  function onCreateChat(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    createChatMutation.mutate(newChatTitle || "Cotizaciones de hoy");
  }

  async function uploadFiles(fileList: FileList | File[] | null | undefined) {
    const files = Array.from(fileList ?? []);

    if (!files.length || !token) {
      return;
    }

    setNotice(null);
    setIsUploading(true);

    try {
      const chatId = await ensureActiveChat();

      if (!chatId) {
        return;
      }

      for (const file of files) {
        await uploadAiChatDocumentRequest(token, chatId, file);
      }

      setNotice(`${files.length} archivo${files.length === 1 ? "" : "s"} agregado${files.length === 1 ? "" : "s"} al chat.`);
      await queryClient.invalidateQueries({ queryKey: ["ai-chat", chatId] });
      await queryClient.invalidateQueries({ queryKey: ["ai-chats"] });
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

  async function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();

    if (nextQuestion.length < 3) {
      setNotice("Escribe una pregunta un poco más completa.");
      return;
    }

    const chatId = await ensureActiveChat();

    if (!chatId) {
      setNotice("Crea un chat primero.");
      return;
    }

    if (!documents.length) {
      setNotice("Sube cotizaciones a este chat antes de preguntar.");
      return;
    }

    setNotice(null);
    setPendingQuestion(nextQuestion);
    askMutation.mutate({ chatId, nextQuestion });
  }

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow="Compras y análisis"
        title="Consultas IA"
        description="Chats separados por tema, con archivos e historial guardado."
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
            <Button type="button" variant="outline" onClick={() => onCreateChat()} disabled={createChatMutation.isPending}>
              {createChatMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Nuevo chat
            </Button>
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Subir archivos
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
            <CardHeader className="px-3 py-2.5">
              <h2 className="text-sm font-bold text-ink">Conversaciones</h2>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <form className="space-y-2" onSubmit={onCreateChat}>
                <Input
                  className="h-8"
                  value={newChatTitle}
                  onChange={(event) => setNewChatTitle(event.target.value)}
                  placeholder="Cotizaciones de hoy"
                />
                <Button type="submit" size="sm" className="w-full" disabled={createChatMutation.isPending}>
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Crear chat
                </Button>
              </form>

              <div className="max-h-[620px] space-y-2 overflow-y-auto">
                {chatsQuery.isLoading ? <EmptyState text="Cargando chats..." /> : null}
                {!chatsQuery.isLoading && !chats.length ? <EmptyState text="Crea un chat para empezar." /> : null}
                {chats.map((chat) => (
                  <ChatButton
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === selectedChatId}
                    onClick={() => setSelectedChatId(chat.id)}
                  />
                ))}
              </div>
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
                <h2 className="truncate text-sm font-bold text-ink">{selectedChat?.title ?? "Selecciona un chat"}</h2>
                <p className="truncate text-[11px] text-slate-500">
                  {documents.length} archivo{documents.length === 1 ? "" : "s"} en esta conversación
                </p>
              </div>
            </div>
            <Badge tone="green">Historial activo</Badge>
          </CardHeader>

          <CardContent className="flex min-h-[650px] flex-col p-0">
            <div
              className="border-b border-border bg-white p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-700">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink">Archivos del chat</p>
                    <p className="text-[11px] text-slate-500">Cada chat mantiene sus propias cotizaciones.</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Agregar
                </Button>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {documents.map((document) => (
                  <DocumentChip key={document.id} document={document} />
                ))}
                {!documents.length ? <EmptyState text="Sube PDFs, Excel o CSV para iniciar el análisis." /> : null}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-3">
              {chatQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-700" />
                  Cargando historial...
                </div>
              ) : null}

              {!chatQuery.isLoading && !messages.length ? (
                <ChatBubble
                  message={{
                    id: "empty",
                    role: "assistant",
                    text: "Este chat está listo. Sube cotizaciones y pregúntame cuál empresa ofrece mejor precio.",
                    createdAt: new Date().toISOString(),
                  }}
                />
              ) : null}

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
                <Button type="submit" className="h-[54px] self-end" disabled={askMutation.isPending || !selectedChatId}>
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

function buildMessages(questions: AiQuestionAnswer[], pendingQuestion: string | null): ChatMessage[] {
  const history = questions.flatMap<ChatMessage>((entry) => [
    { id: `${entry.id}_user`, role: "user", text: entry.question, createdAt: entry.createdAt },
    { id: `${entry.id}_assistant`, role: "assistant", text: entry.answer, createdAt: entry.createdAt },
  ]);

  if (pendingQuestion) {
    history.push({ id: "pending_user", role: "user", text: pendingQuestion, createdAt: new Date().toISOString() });
  }

  return history;
}

function ChatButton({ chat, isActive, onClick }: { chat: AiChatSummary; isActive: boolean; onClick: () => void }) {
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700">
          <Bot className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-ink">{chat.title}</span>
          <span className="mt-1 block truncate text-[11px] text-slate-500">
            {chat.documentCount} archivo{chat.documentCount === 1 ? "" : "s"} · {chat.questionCount} mensaje
            {chat.questionCount === 1 ? "" : "s"}
          </span>
          {chat.recentFiles.length ? (
            <span className="mt-2 block truncate text-[11px] text-slate-400">{chat.recentFiles.join(", ")}</span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function DocumentChip({ document }: { document: AiDocumentSummary }) {
  return (
    <div className="flex min-w-[220px] items-start gap-2 rounded-lg border border-border bg-white p-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-700">
        <FileText className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-ink">{document.fileName}</span>
        <span className="mt-1 flex flex-wrap gap-1.5">
          <Badge tone="slate">{formatFileSize(document.sizeBytes)}</Badge>
          <Badge tone="blue">{document.rowCount} filas</Badge>
        </span>
      </span>
    </div>
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
