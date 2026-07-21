import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { createSupportTicketRequest, listSupportTicketsRequest } from "../services/api";

export function SupportCenter() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("SOPORTE");
  const [priority, setPriority] = useState("NORMAL");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => listSupportTicketsRequest(token!),
    enabled: Boolean(token),
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
            <h2 className="text-base font-bold text-ink">Mis solicitudes</h2>
            <Inbox className="h-5 w-5 text-brand-700" />
          </CardHeader>
          <CardContent className="space-y-3">
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
                    <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                      {ticket.status}
                    </span>
                  </div>
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
