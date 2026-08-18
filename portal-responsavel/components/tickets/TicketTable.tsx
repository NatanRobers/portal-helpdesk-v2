import Link from "next/link";
import { Ticket } from "@/types";
import { StatusBadge } from "@/components/tickets/Badges";
import { GraduationCap, MessageCircle } from "lucide-react";

function formatarData(timestamp: number | null) {
  if (!timestamp) return "agora há pouco";
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <ul className="space-y-3">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            href={`/tickets/${ticket.id}`}
            className="block rounded-xl2 bg-white p-4 shadow-card transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-brand-700">
                {ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
            </div>

            <p className="mt-1.5 truncate font-display text-[14px] font-semibold text-brand-950">
              {ticket.resumo}
            </p>

            <div className="mt-1.5 flex items-center gap-3 text-[12px] text-ink/50">
              <span className="flex items-center gap-1">
                <GraduationCap size={13} />
                {ticket.segmento}
              </span>
              <span>{formatarData(ticket.dataCriacao)}</span>
            </div>

            <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl2 bg-brand-50 py-2 text-[13px] font-semibold text-brand-700">
              <MessageCircle size={14} />
              Abrir / Responder
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
