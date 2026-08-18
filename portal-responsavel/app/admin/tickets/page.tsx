"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTicketsAdmin } from "@/lib/tickets";
import AdminTicketTable from "@/components/admin/AdminTicketTable";
import { Loader2 } from "lucide-react";

export default function AdminTicketsPage() {
  const { role } = useAuth();
  const { tickets, carregando } = useTicketsAdmin(role);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-slate-900">
          Fila de Atendimento
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {carregando
            ? "Carregando..."
            : `${tickets.length} chamado${tickets.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-700" size={26} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl2 border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nenhum chamado por aqui ainda.
        </div>
      ) : (
        <AdminTicketTable tickets={tickets} />
      )}
    </div>
  );
}
