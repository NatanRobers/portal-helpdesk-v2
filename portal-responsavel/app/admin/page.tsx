"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTicketsAdmin } from "@/lib/tickets";
import { useAgendamentosAdmin, hojeISO } from "@/lib/agendamentos";
import { StatusBadge } from "@/components/tickets/Badges";
import { roleLabels } from "@/data/mock-data";
import { TicketStatus } from "@/types";
import { CalendarClock, Inbox, ListChecks, Loader2 } from "lucide-react";

const STATUS_LISTA: TicketStatus[] = ["ABERTO", "EM ANÁLISE", "CONCLUÍDO"];

export default function AdminDashboardPage() {
  const { role } = useAuth();
  const { tickets, carregando: carregandoTickets } = useTicketsAdmin(role);
  const { agendamentos, carregando: carregandoAgendamentos } = useAgendamentosAdmin(role);

  const carregando = carregandoTickets || carregandoAgendamentos;

  const ticketsAbertos = tickets.filter((ticket) => ticket.status === "ABERTO").length;
  const totalChamados = tickets.length;
  const hoje = hojeISO();
  const agendamentosHoje = agendamentos.filter((agendamento) => agendamento.data === hoje).length;

  const contagemPorStatus = STATUS_LISTA.map((status) => ({
    status,
    total: tickets.filter((ticket) => ticket.status === status).length,
  }));

  const metricas = [
    {
      label: "Tickets Abertos",
      valor: ticketsAbertos,
      icon: Inbox,
      cor: "bg-danger/10 text-danger",
    },
    {
      label: "Agendamentos Hoje",
      valor: agendamentosHoje,
      icon: CalendarClock,
      cor: "bg-brand-100 text-brand-700",
    },
    {
      label: "Total de Chamados",
      valor: totalChamados,
      icon: ListChecks,
      cor: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="font-display text-xl font-semibold text-slate-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Visão geral da Central de Ajuda
        {role ? ` — ${roleLabels[role]}` : ""}
      </p>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-700" size={26} />
        </div>
      ) : (
        <>
          {/* Métricas principais */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {metricas.map(({ label, valor, icon: Icon, cor }) => (
              <div
                key={label}
                className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${cor}`}>
                  <Icon size={17} />
                </span>
                <p className="mt-3 font-display text-3xl font-semibold text-slate-900">
                  {valor}
                </p>
                <p className="text-[13px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Chamados por status */}
          <div className="mt-8">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
              Chamados por status
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {contagemPorStatus.map(({ status, total }) => (
                <div
                  key={status}
                  className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <StatusBadge status={status} />
                  <p className="mt-3 font-display text-3xl font-semibold text-slate-900">
                    {total}
                  </p>
                  <p className="text-[13px] text-slate-500">
                    chamado{total !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
