"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import AvaliacaoCSAT from "@/components/tickets/AvaliacaoCSAT";
import ChatTicketCard from "@/components/tickets/ChatTicketCard";
import { StatusBadge, PriorityBadge } from "@/components/tickets/Badges";
import { useTicket } from "@/lib/tickets";
import { TicketOrigem } from "@/types";
import { ArrowLeft, Bot, FileEdit, GraduationCap, Loader2, Star, Tag } from "lucide-react";

const LABEL_ORIGEM: Record<TicketOrigem, { label: string; icon: typeof Bot }> = {
  BOT: { label: "Assistente Virtual", icon: Bot },
  FORMULARIO: { label: "Formulário", icon: FileEdit },
};

function formatarData(timestamp: number | null) {
  if (!timestamp) return "agora há pouco";
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketDetalhePage() {
  return (
    <RequireAuth>
      <DetalheDoTicket />
    </RequireAuth>
  );
}

function DetalheDoTicket() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = decodeURIComponent(params.ticketId);
  const { ticket, carregando } = useTicket(ticketId);

  return (
    <div className="animate-fade-in-up">
      <header className="flex items-center gap-3 bg-brand-900 px-5 py-5 text-white">
        <Link href="/tickets" aria-label="Voltar para minhas solicitações">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-brand-100/70">
            {ticketId}
          </p>
          <h1 className="font-display text-lg font-semibold">
            Detalhes da solicitação
          </h1>
        </div>
      </header>

      <div className="px-5 py-6 pb-10">
        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-700" size={26} />
          </div>
        ) : !ticket ? (
          <div className="rounded-xl2 bg-white p-6 text-center shadow-card">
            <p className="font-display text-[15px] font-semibold text-brand-950">
              Solicitação não encontrada
            </p>
            <p className="mt-1 text-[13px] text-ink/60">
              Verifique se o link está correto ou volte para a sua lista.
            </p>
            <Link
              href="/tickets"
              className="mt-4 inline-block rounded-xl2 bg-brand-700 px-4 py-2 text-[13px] font-semibold text-white"
            >
              Ver minhas solicitações
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cabeçalho do ticket: badges + resumo */}
            <div className="rounded-xl2 bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge prioridade={ticket.prioridade} />
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink/60">
                  <Tag size={11} />
                  {ticket.tipo}
                </span>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-brand-950">
                {ticket.resumo}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                {ticket.descricao}
              </p>
            </div>

            {/* Metadados: segmento, origem, data */}
            <div className="rounded-xl2 bg-white p-4 shadow-card">
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-[13px] text-ink/60">
                    <GraduationCap size={15} />
                    Segmento
                  </dt>
                  <dd className="text-[13px] font-medium text-brand-950">
                    {ticket.segmento}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-[13px] text-ink/60">
                    {(() => {
                      const OrigemIcon = LABEL_ORIGEM[ticket.origem].icon;
                      return <OrigemIcon size={15} />;
                    })()}
                    Origem
                  </dt>
                  <dd className="text-[13px] font-medium text-brand-950">
                    {LABEL_ORIGEM[ticket.origem].label}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] text-ink/60">Aberto em</dt>
                  <dd className="text-[13px] font-medium text-brand-950">
                    {formatarData(ticket.dataCriacao)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Chat bilateral com a escola */}
            <ChatTicketCard ticketId={ticket.id} />

            {/* Regra de ouro: CSAT só para tickets CONCLUÍDOS */}
            {ticket.status === "CONCLUÍDO" &&
              (ticket.avaliacao ? (
                <div className="flex items-center gap-2 rounded-xl2 bg-brand-50 p-4">
                  <Star size={18} className="shrink-0 fill-brand-700 text-brand-700" />
                  <p className="text-[13px] font-medium text-brand-950">
                    Você avaliou este atendimento com {ticket.avaliacao}{" "}
                    {ticket.avaliacao > 1 ? "estrelas" : "estrela"}.
                  </p>
                </div>
              ) : (
                <AvaliacaoCSAT ticketId={ticket.id} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
