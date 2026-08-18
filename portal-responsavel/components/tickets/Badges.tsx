import { TicketPrioridade, TicketStatus } from "@/types";

const CLASSES_STATUS: Record<TicketStatus, string> = {
  ABERTO: "bg-sky-100 text-sky-700",
  "EM ANÁLISE": "bg-warn/10 text-warn",
  CONCLUÍDO: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSES_STATUS[status]}`}
    >
      {status}
    </span>
  );
}

const CLASSES_PRIORIDADE: Record<TicketPrioridade, string> = {
  Baixa: "bg-ink/5 text-ink/60",
  Normal: "bg-brand-100 text-brand-700",
  Alta: "bg-danger/10 text-danger",
};

export function PriorityBadge({ prioridade }: { prioridade: TicketPrioridade }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${CLASSES_PRIORIDADE[prioridade]}`}
    >
      {prioridade}
    </span>
  );
}
