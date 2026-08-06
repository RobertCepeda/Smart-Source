import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Inbox, Send } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createSupportTicketRequest, listSupportTicketsRequest, updateSupportTicketStatusRequest, type SupportTicket } from "../services/api";

const filterOptions = [
  { value: "ALL", label: "Todas" },
  { value: "OPEN", label: "Abiertas" },
  { value: "CLOSED", label: "Cerradas" },
  { value: "STANDBY", label: "En espera" },
] as const;

function elapsedTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Hace menos de un minuto";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} ${days === 1 ? "día" : "días"}`;
}

export function SupportCenter() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("SOPORTE");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [group, setGroup] = useState<(typeof filterOptions)[number]["value"]>("ALL");

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", group],
    queryFn: () => listSupportTicketsRequest(token!, group),
    enabled: Boolean(token),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportTicket["status"] }) => updateSupportTicketStatusRequest(token!, id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  });

  const createMutation = useMutation({
    mutationFn: () => createSupportTicketRequest(token!, { subject, category, priority, message }),
    onSuccess: async () => {
      setSubject("");
      setMessage("");
      setNotice("Solicitud enviada. La recibimos en el buzón de Smart Source.");
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "No pudimos enviar la solicitud."),
  });

  const tickets = ticketsQuery.data?.tickets ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Atención"
        title="Centro de Atención"
        description="Envianos solicitudes de soporte, mantenimiento, facturacion o mejoras sin salir de Smart Source."
      />

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-base font-bold text-ink">Nueva solicitud</h2>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3.5"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Asunto</span>
                <Input value={subject} onChange={(event) => setSubject(event.target.value)} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Categoria</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="SOPORTE">Soporte</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="FACTURACION">Facturacion</option>
                    <option value="IDEA">Idea o mejora</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Prioridad</span>
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-white px-3 text-[13px]"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                  >
                    <option value="BAJA">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">Mensaje</span>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                />
              </label>
              {notice ? (
                <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
                  {notice}
                </div>
              ) : null}
              <Button type="submit" disabled={createMutation.isPending}>
                <Send className="h-4 w-4" />
                {createMutation.isPending ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Mis solicitudes</h2>
              <p className="mt-0.5 text-xs text-slate-500">Seguimiento y tiempo transcurrido</p>
            </div>
            <Inbox className="h-5 w-5 text-brand-700" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-50 p-1.5">
              {filterOptions.map((option) => (
                <button key={option.value} type="button" className={`h-8 rounded-md px-3 text-xs font-semibold transition ${group === option.value ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"}`} onClick={() => setGroup(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
            {tickets.length ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-border p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-ink">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.category} - {ticket.priority}
                      </p>
                    </div>
                    {user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "SYSTEM_ADMIN" ? (
                      <select className="h-8 rounded-md border border-border bg-white px-2 text-xs font-semibold" value={ticket.status} onChange={(event) => statusMutation.mutate({ id: ticket.id, status: event.target.value as SupportTicket["status"] })}>
                        <option value="ABIERTO">Abierta</option>
                        <option value="EN_REVISION">En revisión</option>
                        <option value="EN_ESPERA">En espera</option>
                        <option value="RESUELTO">Resuelta</option>
                        <option value="CERRADO">Cerrada</option>
                      </select>
                    ) : <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{ticket.status.replaceAll("_", " ")}</span>}
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{elapsedTime(ticket.createdAt)}</p>
                  <p className="mt-3 text-[13px] leading-6 text-slate-600">{ticket.messages[0]?.body}</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-[13px] text-slate-600">
                Aún no tienes solicitudes abiertas.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
