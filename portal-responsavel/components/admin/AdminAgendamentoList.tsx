"use client";

import { useState, type FormEvent } from "react";
import { atualizarStatusAgendamento, remarcarAgendamento, hojeISO } from "@/lib/agendamentos";
import { useAtualizacaoOtimista } from "@/lib/useAtualizacaoOtimista";
import { setoresAgendamentoInfo } from "@/data/mock-data";
import { Agendamento, AgendamentoStatus } from "@/types";
import { CalendarClock, Clock, Loader2, X } from "lucide-react";

const STATUS_OPCOES: AgendamentoStatus[] = ["CONFIRMADO", "REALIZADO", "CANCELADO"];

/** Cor por status — aplicada no próprio <select>, então a cor muda junto com a escolha. */
const CLASSES_STATUS: Record<AgendamentoStatus, string> = {
  CONFIRMADO: "border-success/30 bg-success/10 text-success",
  REALIZADO: "border-sky-200 bg-sky-100 text-sky-700",
  CANCELADO: "border-ink/10 bg-ink/5 text-ink/50",
};

function formatarData(dataISO: string) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Encurta o UID do Firebase pra caber na coluna, mantendo o valor completo no title (tooltip). */
function encurtarId(id: string) {
  return id.length > 10 ? `${id.slice(0, 10)}…` : id;
}

export default function AdminAgendamentoList({
  agendamentos,
}: {
  agendamentos: Agendamento[];
}) {
  // Um único modal compartilhado por toda a lista — mais simples do que
  // cada linha/card ter o próprio modal duplicado. `null` = fechado.
  const [agendamentoParaRemarcar, setAgendamentoParaRemarcar] = useState<Agendamento | null>(
    null
  );

  return (
    <>
      {/* Desktop — tabela tradicional */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Horário</th>
              <th className="px-4 py-3 font-medium">Setor</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.map((agendamento) => (
              <LinhaDesktop
                key={agendamento.id}
                agendamento={agendamento}
                onRemarcar={() => setAgendamentoParaRemarcar(agendamento)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — um card por reunião */}
      <div className="space-y-3 md:hidden">
        {agendamentos.map((agendamento) => (
          <CardMobile
            key={agendamento.id}
            agendamento={agendamento}
            onRemarcar={() => setAgendamentoParaRemarcar(agendamento)}
          />
        ))}
      </div>

      {agendamentoParaRemarcar && (
        <ModalRemarcar
          agendamento={agendamentoParaRemarcar}
          onClose={() => setAgendamentoParaRemarcar(null)}
        />
      )}
    </>
  );
}

/** Compartilhado entre a linha desktop e o card mobile — só muda a largura via className. */
function SeletorStatus({
  agendamento,
  className = "",
}: {
  agendamento: Agendamento;
  className?: string;
}) {
  const { valor, atualizando, handleMudar } = useAtualizacaoOtimista(
    agendamento.status,
    (novoStatus) => atualizarStatusAgendamento(agendamento.id, novoStatus)
  );

  return (
    <select
      value={valor}
      disabled={atualizando}
      onChange={(e) => handleMudar(e.target.value as AgendamentoStatus)}
      className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold outline-none focus:border-brand-500 disabled:opacity-50 ${CLASSES_STATUS[valor]} ${className}`}
    >
      {STATUS_OPCOES.map((opcao) => (
        <option key={opcao} value={opcao}>
          {opcao}
        </option>
      ))}
    </select>
  );
}

function BotaoRemarcar({
  onRemarcar,
  className = "",
}: {
  onRemarcar: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemarcar}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100 ${className}`}
    >
      <CalendarClock size={13} />
      Remarcar
    </button>
  );
}

function LinhaDesktop({
  agendamento,
  onRemarcar,
}: {
  agendamento: Agendamento;
  onRemarcar: () => void;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-4 py-3 text-slate-700">{formatarData(agendamento.data)}</td>
      <td className="px-4 py-3 text-slate-700">{agendamento.horario}</td>
      <td className="px-4 py-3 text-slate-700">
        {setoresAgendamentoInfo[agendamento.setor].label}
      </td>
      <td
        className="px-4 py-3 font-mono text-[12px] text-slate-500"
        title={agendamento.solicitanteId}
      >
        {encurtarId(agendamento.solicitanteId)}
      </td>
      <td className="max-w-[320px] whitespace-pre-wrap px-4 py-3 text-slate-800">
        {agendamento.motivo}
      </td>
      <td className="px-4 py-3">
        <SeletorStatus agendamento={agendamento} />
      </td>
      <td className="px-4 py-3">
        <BotaoRemarcar onRemarcar={onRemarcar} />
      </td>
    </tr>
  );
}

function CardMobile({
  agendamento,
  onRemarcar,
}: {
  agendamento: Agendamento;
  onRemarcar: () => void;
}) {
  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-sm">
      {/* Data e horário em destaque no topo, como pedido */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-slate-900">
          <CalendarClock size={16} className="text-brand-700" />
          {formatarData(agendamento.data)}
        </span>
        <span className="flex items-center gap-1 text-[13px] font-medium text-slate-600">
          <Clock size={14} />
          {agendamento.horario}
        </span>
      </div>

      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-brand-700">
        {setoresAgendamentoInfo[agendamento.setor].label}
      </p>

      <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-slate-700">
        {agendamento.motivo}
      </p>

      <p
        className="mt-2 font-mono text-[11px] text-slate-400"
        title={agendamento.solicitanteId}
      >
        Solicitante: {encurtarId(agendamento.solicitanteId)}
      </p>

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-medium text-slate-500">
            Status
          </label>
          <SeletorStatus agendamento={agendamento} className="w-full" />
        </div>
      </div>

      <BotaoRemarcar onRemarcar={onRemarcar} className="mt-2 w-full justify-center" />
    </div>
  );
}

function ModalRemarcar({
  agendamento,
  onClose,
}: {
  agendamento: Agendamento;
  onClose: () => void;
}) {
  const [novaData, setNovaData] = useState(agendamento.data);
  const [novoHorario, setNovoHorario] = useState(agendamento.horario);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: FormEvent) {
    e.preventDefault();
    if (!novaData || !novoHorario) return;

    setErro(null);
    setSalvando(true);
    try {
      await remarcarAgendamento(agendamento.id, novaData, novoHorario);
      onClose();
    } catch (err) {
      console.error("Erro ao remarcar agendamento:", err);
      setErro("Não foi possível remarcar agora. Tente novamente.");
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl2 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-slate-900">
            Remarcar reunião
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-[12px] text-slate-500">
          {setoresAgendamentoInfo[agendamento.setor].label} · atualmente em{" "}
          {formatarData(agendamento.data)} às {agendamento.horario}
        </p>

        <form onSubmit={handleSalvar} className="space-y-3">
          <div>
            <label
              htmlFor="nova-data"
              className="mb-1 block text-[12px] font-medium text-slate-600"
            >
              Nova data
            </label>
            <input
              id="nova-data"
              type="date"
              required
              min={hojeISO()}
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label
              htmlFor="novo-horario"
              className="mb-1 block text-[12px] font-medium text-slate-600"
            >
              Novo horário
            </label>
            <input
              id="novo-horario"
              type="time"
              required
              value={novoHorario}
              onChange={(e) => setNovoHorario(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-[12px] text-danger">{erro}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-700 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {salvando && <Loader2 size={14} className="animate-spin" />}
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
