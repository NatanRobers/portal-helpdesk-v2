"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import TicketForm from "@/components/tickets/TicketForm";

export default function NovoTicketPage() {
  return (
    <RequireAuth>
      <div className="animate-fade-in-up">
        <header className="flex items-center gap-3 bg-brand-900 px-5 py-5 text-white">
          <Link href="/" aria-label="Voltar para a Central de Ajuda">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100/70">
              Nova solicitação
            </p>
            <h1 className="font-display text-lg font-semibold">
              Abrir chamado
            </h1>
          </div>
        </header>

        <div className="px-5 py-6">
          {/* useSearchParams exige um limite de Suspense em builds estáticas do App Router */}
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-brand-700" size={24} />
              </div>
            }
          >
            <TicketForm />
          </Suspense>
        </div>
      </div>
    </RequireAuth>
  );
}
