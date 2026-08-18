"use client";

import Link from "next/link";
import { atualizarStatusTicket, atualizarPrioridadeTicket } from "@/lib/tickets";
import { useAtualizacaoOtimista } from "@/lib/useAtualizacaoOtimista";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { Ticket, TicketPrioridade, TicketStatus } from "@/types";
import { MessageSquare } from "lucide-react";

const STATUS_OPCOES: TicketStatus[] = ["ABERTO", "EM ANÁLISE", "CONCLUÍDO"];
const PRIORIDADE_OPCOES: TicketPrioridade[] = ["Baixa", "Normal", "Alta"];

function formatarData(timestamp: number | null) {
  if (!timestamp) return "agora há pouco";
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminTicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <>
      {/* Desktop — tabela tradicional */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Resumo</th>
              <th className="px-4 py-3 font-medium">Segmento</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aberto em</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <LinhaDesktop key={ticket.id} ticket={ticket} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — um card por ticket */}
      <div className="space-y-3 md:hidden">
        {tickets.map((ticket) => (
          <CardMobile key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </>
  );
}

/** Compartilhado entre a linha desktop e o card mobile — só muda a largura via className. */
function SeletorStatus({ ticket, className = "" }: { ticket: Ticket; className?: string }) {
  const { valor, atualizando, handleMudar } = useAtualizacaoOtimista(ticket.status, (novoStatus) =>
    atualizarStatusTicket(ticket.id, novoStatus)
  );

  return (
    <select
      value={valor}
      disabled={atualizando}
      onChange={(e) => handleMudar(e.target.value as TicketStatus)}
      className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 outline-none focus:border-brand-500 disabled:opacity-50 ${className}`}
    >
      {STATUS_OPCOES.map((opcao) => (
        <option key={opcao} value={opcao}>
          {opcao}
        </option>
      ))}
    </select>
  );
}

/** Compartilhado entre a linha desktop e o card mobile — só muda a largura via className. */
function SeletorPrioridade({ ticket, className = "" }: { ticket: Ticket; className?: string }) {
  const { valor, atualizando, handleMudar } = useAtualizacaoOtimista(
    ticket.prioridade,
    (novaPrioridade) => atualizarPrioridadeTicket(ticket.id, novaPrioridade)
  );

  return (
    <select
      value={valor}
      disabled={atualizando}
      onChange={(e) => handleMudar(e.target.value as TicketPrioridade)}
      className={`rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700 outline-none focus:border-brand-500 disabled:opacity-50 ${className}`}
    >
      {PRIORIDADE_OPCOES.map((opcao) => (
        <option key={opcao} value={opcao}>
          {opcao}
        </option>
      ))}
    </select>
  );
}

function LinhaDesktop({ ticket }: { ticket: Ticket }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 font-mono text-[12px] text-brand-700">
        <Link href={`/admin/tickets/${ticket.id}`} className="hover:underline">
          {ticket.id}
        </Link>
      </td>
      <td className="max-w-[280px] truncate px-4 py-3 text-slate-800">{ticket.resumo}</td>
      <td className="px-4 py-3 text-slate-600">{ticket.segmento}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <PriorityBadge prioridade={ticket.prioridade} />
          <SeletorPrioridade ticket={ticket} />
        </div>
      </td>
      <td className="px-4 py-3">
        <SeletorStatus ticket={ticket} />
      </td>
      <td className="px-4 py-3 text-slate-500">{formatarData(ticket.dataCriacao)}</td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/tickets/${ticket.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
        >
          <MessageSquare size={13} />
          Abrir Chat
        </Link>
      </td>
    </tr>
  );
}

function CardMobile({ ticket }: { ticket: Ticket }) {
  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] text-brand-700">{ticket.id}</span>
        <span className="text-[11px] text-slate-400">{formatarData(ticket.dataCriacao)}</span>
      </div>

      <p className="mt-1.5 font-display text-[14px] font-semibold text-slate-900">
        {ticket.resumo}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={ticket.status} />
        <PriorityBadge prioridade={ticket.prioridade} />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {ticket.segmento}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">
            Status
          </label>
          <SeletorStatus ticket={ticket} className="w-full" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">
            Prioridade
          </label>
          <SeletorPrioridade ticket={ticket} className="w-full" />
        </div>
      </div>

      <Link
        href={`/admin/tickets/${ticket.id}`}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl2 bg-brand-700 py-2.5 text-[13px] font-semibold text-white"
      >
        <MessageSquare size={14} />
        Abrir Chat
      </Link>
    </div>
  );
}
