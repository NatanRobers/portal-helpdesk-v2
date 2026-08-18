"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAgendamentosAdmin } from "@/lib/agendamentos";
import AdminAgendamentoList from "@/components/admin/AdminAgendamentoList";
import { Loader2 } from "lucide-react";

export default function AdminAgendamentosPage() {
  const { role } = useAuth();
  const { agendamentos, carregando } = useAgendamentosAdmin(role);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-slate-900">
          Agenda de Reuniões
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {carregando
            ? "Carregando..."
            : `${agendamentos.length} ${agendamentos.length === 1 ? "reunião" : "reuniões"}`}
        </p>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-700" size={26} />
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="rounded-xl2 border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Nenhuma reunião agendada para o seu setor.
        </div>
      ) : (
        <AdminAgendamentoList agendamentos={agendamentos} />
      )}
    </div>
  );
}
