"use client";

import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import TicketTable from "@/components/tickets/TicketTable";
import TicketListSkeleton from "@/components/tickets/TicketListSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTicketsDoSolicitante } from "@/lib/tickets";

export default function TicketsPage() {
  return (
    <RequireAuth>
      <ListaDeSolicitacoes />
    </RequireAuth>
  );
}

function ListaDeSolicitacoes() {
  const { user } = useAuth();
  const { tickets, carregando } = useTicketsDoSolicitante(user?.uid ?? null);

  return (
    <div className="animate-fade-in-up">
      <header className="flex items-center gap-3 bg-brand-900 px-5 py-5 text-white">
        <Link href="/" aria-label="Voltar para a Central de Ajuda">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100/70">
            Central de Ajuda
          </p>
          <h1 className="font-display text-lg font-semibold">
            Minhas solicitações
          </h1>
        </div>
      </header>

      <div className="px-5 py-6 pb-10">
        {carregando ? (
          <TicketListSkeleton />
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Inbox size={22} />
            </span>
            <p className="mt-3 font-display text-[15px] font-semibold text-brand-950">
              Nenhuma solicitação ainda
            </p>
            <p className="mt-1 text-[13px] text-ink/60">
              Quando você abrir um chamado, ele aparece aqui.
            </p>
            <Link
              href="/"
              className="mt-4 rounded-xl2 bg-brand-700 px-4 py-2 text-[13px] font-semibold text-white"
            >
              Abrir uma solicitação
            </Link>
          </div>
        ) : (
          <TicketTable tickets={tickets} />
        )}
      </div>
    </div>
  );
}
