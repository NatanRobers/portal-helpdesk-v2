"use client";

import { useEffect, useRef, useState } from "react";
import {
  useConfiguracaoAgenda,
  salvarConfiguracaoAgenda,
  CONFIGURACAO_PADRAO,
} from "@/lib/configuracoes";
import { Check, Clock, Loader2, Plus, Save, X } from "lucide-react";

const DIAS_SEMANA = [
  { valor: 0, label: "Dom" },
  { valor: 1, label: "Seg" },
  { valor: 2, label: "Ter" },
  { valor: 3, label: "Qua" },
  { valor: 4, label: "Qui" },
  { valor: 5, label: "Sex" },
  { valor: 6, label: "Sáb" },
];

export default function ConfiguracoesPage() {
  const { configuracao, carregando } = useConfiguracaoAgenda();

  const [diasSelecionados, setDiasSelecionados] = useState<number[]>(
    CONFIGURACAO_PADRAO.diasDisponiveis
  );
  const [horarios, setHorarios] = useState<string[]>(CONFIGURACAO_PADRAO.horariosDisponiveis);
  const [novoHorario, setNovoHorario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Só puxa o valor remoto pro estado local UMA VEZ, no primeiro carregamento
  // bem-sucedido. Depois disso, o formulário fica sob controle do admin — se
  // ficasse ouvindo o onSnapshot pra sempre, uma edição de outro funcionário
  // salva no meio da sessão apagaria o que este admin está digitando aqui.
  const jaInicializou = useRef(false);
  useEffect(() => {
    if (!carregando && !jaInicializou.current) {
      setDiasSelecionados(configuracao.diasDisponiveis);
      setHorarios(configuracao.horariosDisponiveis);
      jaInicializou.current = true;
    }
  }, [carregando, configuracao]);

  function alternarDia(valor: number) {
    setSalvo(false);
    setDiasSelecionados((atual) =>
      atual.includes(valor)
        ? atual.filter((d) => d !== valor)
        : [...atual, valor].sort((a, b) => a - b)
    );
  }

  function adicionarHorario() {
    if (!novoHorario || horarios.includes(novoHorario)) return;
    setSalvo(false);
    setHorarios((atual) => [...atual, novoHorario].sort());
    setNovoHorario("");
  }

  function removerHorario(horario: string) {
    setSalvo(false);
    setHorarios((atual) => atual.filter((h) => h !== horario));
  }

  async function handleSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      await salvarConfiguracaoAgenda({
        diasDisponiveis: diasSelecionados,
        horariosDisponiveis: horarios,
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar configuração da agenda:", err);
      setErro("Não foi possível salvar agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="animate-spin text-brand-700" size={26} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-slate-900">
          Configurações da Agenda
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Controla quais dias e horários aparecem pro responsável ao agendar uma reunião.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Dias disponíveis */}
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-slate-900">
            Dias da semana disponíveis
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Dias desmarcados ficam bloqueados no calendário do responsável.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {DIAS_SEMANA.map(({ valor, label }) => {
              const selecionado = diasSelecionados.includes(valor);
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => alternarDia(valor)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    selecionado
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {selecionado && <Check size={13} />}
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Horários disponíveis */}
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-display text-[15px] font-semibold text-slate-900">
            Horários disponíveis
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Lista de horários que aparecem como opção no Passo 3 do agendamento.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {horarios.length === 0 ? (
              <p className="text-[13px] text-slate-400">Nenhum horário cadastrado ainda.</p>
            ) : (
              horarios.map((horario) => (
                <span
                  key={horario}
                  className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[13px] font-medium text-brand-700"
                >
                  <Clock size={12} />
                  {horario}
                  <button
                    type="button"
                    onClick={() => removerHorario(horario)}
                    aria-label={`Remover ${horario}`}
                    className="text-brand-700/60 hover:text-brand-700"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="time"
              value={novoHorario}
              onChange={(e) => setNovoHorario(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={adicionarHorario}
              disabled={!novoHorario}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>
        </section>

        {erro && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{erro}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-2 rounded-xl2 bg-brand-700 px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {salvando ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>

          {salvo && (
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-success">
              <Check size={14} />
              Salvo com sucesso
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
