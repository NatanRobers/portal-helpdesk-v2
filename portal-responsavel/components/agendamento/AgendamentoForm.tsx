"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  criarAgendamento,
  buscarHorariosOcupados,
  hojeISO,
} from "@/lib/agendamentos";
import { buscarConfiguracaoAgenda, CONFIGURACAO_PADRAO } from "@/lib/configuracoes";
import { setoresAgendamentoInfo } from "@/data/mock-data";
import { ConfiguracaoAgenda, SetorAgendamento } from "@/types";
import {
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Landmark,
  Loader2,
  Wallet,
} from "lucide-react";

const ICONE_SETOR: Record<SetorAgendamento, typeof Building2> = {
  direcao: Landmark,
  secretaria: Building2,
  coordenacao: GraduationCap,
  financeiro: Wallet,
};

const SETORES = Object.keys(setoresAgendamentoInfo) as SetorAgendamento[];
const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

/** YYYY-MM-DD no fuso LOCAL — igual ao hojeISO(), mas pra uma data qualquer do calendário. */
function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function inicioDoMes(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

/** Grid do mês: null nas células vazias antes do dia 1 (alinhamento por dia da semana). */
function construirDiasDoMes(mesExibido: Date): (Date | null)[] {
  const ano = mesExibido.getFullYear();
  const mes = mesExibido.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
  const totalDeDias = new Date(ano, mes + 1, 0).getDate();

  const dias: (Date | null)[] = Array(primeiroDiaSemana).fill(null);
  for (let dia = 1; dia <= totalDeDias; dia++) {
    dias.push(new Date(ano, mes, dia));
  }
  return dias;
}

function formatarMesAno(data: Date): string {
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function AgendamentoForm() {
  const { user } = useAuth();
  const router = useRouter();

  const hoje = hojeISO();
  const [setor, setSetor] = useState<SetorAgendamento | null>(null);
  const [mesExibido, setMesExibido] = useState<Date>(() => inicioDoMes(new Date()));
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  // Configuração dinâmica (dias/horários disponíveis) — vem de
  // configuracoes/agenda no Firestore, não é mais hardcoded no componente.
  const [config, setConfig] = useState<ConfiguracaoAgenda>(CONFIGURACAO_PADRAO);
  const [carregandoConfig, setCarregandoConfig] = useState(true);

  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarConfiguracaoAgenda()
      .then(setConfig)
      .catch((err) => {
        console.error("Erro ao buscar configuração da agenda:", err);
        // Mantém CONFIGURACAO_PADRAO já setada no useState — melhor ter uma
        // agenda com valores razoáveis do que travar o formulário inteiro.
      })
      .finally(() => setCarregandoConfig(false));
  }, []);

  const diasDoMes = useMemo(() => construirDiasDoMes(mesExibido), [mesExibido]);

  // Não deixa voltar pra antes do mês atual — não tem o que selecionar lá.
  const mesAnteriorBloqueado =
    mesExibido.getFullYear() === new Date().getFullYear() &&
    mesExibido.getMonth() === new Date().getMonth();

  function handleEscolherSetor(opcao: SetorAgendamento) {
    setSetor(opcao);
    // Trocar de setor invalida a data/horário já escolhidos (o cálculo de
    // conflito é por setor — os horários ocupados de um não valem pro outro).
    setData(null);
    setHorario(null);
    setHorariosOcupados([]);
  }

  function irParaMesAnterior() {
    if (mesAnteriorBloqueado) return;
    setMesExibido((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  }

  function irParaProximoMes() {
    setMesExibido((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  }

  async function handleSelecionarDia(dia: Date) {
    if (!setor) return;

    const iso = paraISO(dia);
    setData(iso);
    setHorario(null);
    setErro(null);
    setCarregandoHorarios(true);
    try {
      const ocupados = await buscarHorariosOcupados(iso, setor);
      setHorariosOcupados(ocupados);
    } catch (err) {
      console.error("Erro ao buscar horários ocupados:", err);
      setHorariosOcupados([]);
    } finally {
      setCarregandoHorarios(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !setor || !data || !horario) return;

    // Última checagem contra double-booking: entre o usuário escolher o
    // horário e clicar em confirmar, outra pessoa pode ter agendado o mesmo
    // slot. Não é 100% à prova de corrida (isso pediria uma transaction lendo
    // o próprio horário), mas cobre o caso comum de duas abas abertas.
    if (horariosOcupados.includes(horario)) {
      setErro("Esse horário acabou de ser ocupado. Escolha outro.");
      setHorario(null);
      return;
    }

    const motivoLimpo = motivo.trim();
    if (!motivoLimpo) {
      setErro("Conte rapidamente o assunto da reunião.");
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await criarAgendamento({
        setor,
        data,
        horario,
        motivo: motivoLimpo,
        solicitanteId: user.uid,
      });
      router.push("/agendamentos");
    } catch (err) {
      console.error("Erro ao criar agendamento:", err);
      setErro("Não foi possível confirmar o agendamento. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Passo 1 — Setor */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-brand-950">
          Com qual setor você quer se reunir?
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {SETORES.map((opcao) => {
            const Icon = ICONE_SETOR[opcao];
            const selecionado = setor === opcao;
            return (
              <button
                key={opcao}
                type="button"
                onClick={() => handleEscolherSetor(opcao)}
                className={`flex flex-col items-center gap-2 rounded-xl2 border px-3 py-4 text-center transition-colors ${
                  selecionado
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-brand-100 bg-white text-brand-950/80"
                }`}
              >
                <Icon size={22} />
                <span className="text-[13px] font-semibold">
                  {setoresAgendamentoInfo[opcao].label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Passo 2 — Calendário visual (só aparece depois do setor escolhido) */}
      {setor && (
        <div className="animate-fade-in-up">
          <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-brand-950">
            <Calendar size={14} />
            Escolha uma data
          </label>

          {carregandoConfig ? (
            <div className="flex justify-center rounded-xl2 border border-brand-100 bg-white py-10">
              <Loader2 className="animate-spin text-brand-700" size={22} />
            </div>
          ) : (
            <div className="rounded-xl2 border border-brand-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={irParaMesAnterior}
                  disabled={mesAnteriorBloqueado}
                  aria-label="Mês anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brand-700 disabled:opacity-20"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="font-display text-[14px] font-semibold text-brand-950">
                  {formatarMesAno(mesExibido)}
                </p>
                <button
                  type="button"
                  onClick={irParaProximoMes}
                  aria-label="Próximo mês"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-brand-700"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink/40">
                {DIAS_DA_SEMANA.map((letra, i) => (
                  <span key={i}>{letra}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {diasDoMes.map((dia, i) => {
                  if (!dia) return <div key={`vazio-${i}`} />;

                  const iso = paraISO(dia);
                  // Antes era um "éFimDeSemana" hardcoded (sáb/dom fixos) —
                  // agora vem de config.diasDisponiveis, que a escola controla
                  // em /admin/configuracoes.
                  const éDiaHabilitado = config.diasDisponiveis.includes(dia.getDay());
                  const éPassado = iso < hoje;
                  const desabilitado = !éDiaHabilitado || éPassado;
                  const selecionado = iso === data;

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={desabilitado}
                      onClick={() => handleSelecionarDia(dia)}
                      className={`aspect-square rounded-lg text-[13px] font-medium transition-colors ${
                        selecionado
                          ? "bg-brand-700 text-white"
                          : desabilitado
                          ? "cursor-not-allowed text-ink/20"
                          : "text-brand-950 hover:bg-brand-50 active:bg-brand-100"
                      }`}
                    >
                      {dia.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Passo 3 — Horários, com bloqueio de conflito (só aparece depois da data escolhida) */}
      {setor && data && (
        <div className="animate-fade-in-up">
          <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-brand-950">
            <Clock size={14} />
            Horários disponíveis
          </label>

          {carregandoHorarios ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-brand-700" size={20} />
            </div>
          ) : config.horariosDisponiveis.length === 0 ? (
            <p className="rounded-xl2 border border-brand-100 bg-white px-4 py-6 text-center text-[13px] text-ink/50">
              Nenhum horário configurado pra esse dia ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {config.horariosDisponiveis.map((opcao) => {
                const ocupado = horariosOcupados.includes(opcao);
                const selecionado = horario === opcao;
                return (
                  <button
                    key={opcao}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHorario(opcao)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                      ocupado
                        ? "cursor-not-allowed border-brand-100 bg-brand-50 text-ink/30 opacity-60"
                        : selecionado
                        ? "border-brand-700 bg-brand-700 text-white"
                        : "border-brand-100 bg-white text-brand-950/70"
                    }`}
                  >
                    {selecionado && <Check size={13} />}
                    {opcao}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Passo 4 — Motivo (só aparece depois do horário escolhido) */}
      {setor && data && horario && (
        <div className="animate-fade-in-up">
          <label
            htmlFor="motivo"
            className="mb-1.5 block text-[13px] font-medium text-brand-950"
          >
            Motivo e descrição detalhada
          </label>
          <textarea
            id="motivo"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Gostaria de falar sobre o desempenho do Joãozinho em Matemática..."
            className="w-full resize-none rounded-xl2 border border-brand-100 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-brand-500"
          />
        </div>
      )}

      {erro && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {erro}
        </p>
      )}

      {/* Submit — só aparece quando os 4 passos estão preenchidos */}
      {setor && data && horario && (
        <button
          type="submit"
          disabled={enviando || !motivo.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-brand-700 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {enviando && <Loader2 size={17} className="animate-spin" />}
          {enviando ? "Confirmando..." : "Confirmar agendamento"}
        </button>
      )}
    </form>
  );
}
