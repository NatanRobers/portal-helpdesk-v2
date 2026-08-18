"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock, Loader2, X } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useAgendamentosDoSolicitante, cancelarAgendamento } from "@/lib/agendamentos";
import { setoresAgendamentoInfo } from "@/data/mock-data";
import { Agendamento } from "@/types";

function formatarData(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function AgendamentosPage() {
  return (
    <RequireAuth>
      <ListaDeAgendamentos />
    </RequireAuth>
  );
}

function ListaDeAgendamentos() {
  const { user } = useAuth();
  const { agendamentos, carregando } = useAgendamentosDoSolicitante(user?.uid ?? null);

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
            Minhas reuniões
          </h1>
        </div>
      </header>

      <div className="px-5 py-6 pb-10">
        {carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-700" size={26} />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl2 bg-white px-6 py-12 text-center shadow-card">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <CalendarClock size={22} />
            </span>
            <p className="mt-3 font-display text-[15px] font-semibold text-brand-950">
              Nenhuma reunião agendada
            </p>
            <p className="mt-1 text-[13px] text-ink/60">
              Marque um horário com um dos setores da escola.
            </p>
            <Link
              href="/agendamentos/novo"
              className="mt-4 rounded-xl2 bg-brand-700 px-4 py-2 text-[13px] font-semibold text-white"
            >
              Agendar reunião
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {agendamentos.map((agendamento) => (
              <CardAgendamento key={agendamento.id} agendamento={agendamento} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CardAgendamento({ agendamento }: { agendamento: Agendamento }) {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleCancelar() {
    const confirmou = window.confirm(
      "Tem certeza que deseja cancelar esta reunião? O horário será liberado."
    );
    if (!confirmou) return;

    setErro(null);
    setCancelando(true);
    try {
      await cancelarAgendamento(agendamento.id);
      // Não precisa atualizar estado local: o agendamento chega em tempo
      // real via onSnapshot, então o próprio card troca pra badge sozinho.
    } catch (err) {
      console.error("Erro ao cancelar agendamento:", err);
      setErro("Não foi possível cancelar agora. Tente novamente.");
      setCancelando(false);
    }
  }

  return (
    <li className="rounded-xl2 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="font-display text-[14px] font-semibold text-brand-950">
          {setoresAgendamentoInfo[agendamento.setor].label}
        </p>
        {agendamento.status === "CANCELADO" ? (
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink/50">
            CANCELADO
          </span>
        ) : (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            CONFIRMADO
          </span>
        )}
      </div>

      <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink/70">
        {agendamento.motivo}
      </p>

      <div className="mt-2 flex items-center gap-3 text-[12px] text-ink/50">
        <span className="flex items-center gap-1">
          <CalendarClock size={13} />
          {formatarData(agendamento.data)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {agendamento.horario}
        </span>
      </div>

      {erro && (
        <p className="mt-2 rounded-lg bg-danger/10 px-2.5 py-1.5 text-[12px] text-danger">
          {erro}
        </p>
      )}

      {agendamento.status === "CONFIRMADO" && (
        <button
          type="button"
          onClick={handleCancelar}
          disabled={cancelando}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-danger/30 bg-danger/5 py-2 text-[12.5px] font-semibold text-danger transition-colors active:bg-danger/10 disabled:opacity-50"
        >
          {cancelando ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <X size={14} />
          )}
          {cancelando ? "Cancelando..." : "Cancelar reunião"}
        </button>
      )}
    </li>
  );
}
