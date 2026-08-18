"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import AgendamentoForm from "@/components/agendamento/AgendamentoForm";

export default function NovoAgendamentoPage() {
  return (
    <RequireAuth>
      <div className="animate-fade-in-up">
        <header className="flex items-center gap-3 bg-brand-900 px-5 py-5 text-white">
          <Link href="/" aria-label="Voltar para a Central de Ajuda">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100/70">
              Nova reunião
            </p>
            <h1 className="font-display text-lg font-semibold">
              Agendar reunião
            </h1>
          </div>
        </header>

        <div className="px-5 py-6">
          <AgendamentoForm />
        </div>
      </div>
    </RequireAuth>
  );
}
