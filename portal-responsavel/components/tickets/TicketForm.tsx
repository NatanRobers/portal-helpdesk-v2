"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { criarTicket } from "@/lib/tickets";
import { contemLinguagemInadequada, calcularPrioridade } from "@/lib/analiseTexto";
import { SegmentoAluno, TicketTipo } from "@/types";
import { segmentosAluno } from "@/data/mock-data";
import { Loader2, Send } from "lucide-react";

const TIPOS: TicketTipo[] = ["Incidente", "Dúvida", "Solicitação"];

function éTicketTipo(valor: string | null): valor is TicketTipo {
  return TIPOS.includes(valor as TicketTipo);
}

/**
 * Configuração do formulário dinâmico: cada tipo de ticket tem seus próprios
 * campos, e sabe como montar o par (resumo, descricao) que o Firestore
 * espera a partir dos valores digitados nesses campos.
 */
type CampoConfig = {
  id: string;
  label: string;
  tipoCampo: "input" | "textarea";
  placeholder: string;
};

type ConfigDoTipo = {
  campos: CampoConfig[];
  montarResumoEDescricao: (valores: Record<string, string>) => {
    resumo: string;
    descricao: string;
  };
};

const FORM_CONFIG: Record<TicketTipo, ConfigDoTipo> = {
  Incidente: {
    campos: [
      {
        id: "resumo",
        label: "Resumo do problema",
        tipoCampo: "input",
        placeholder: "Ex: Não consigo acessar o boleto",
      },
      {
        id: "passos",
        label: "Descreva o problema detalhadamente",
        tipoCampo: "textarea",
        placeholder: "Conte com detalhes o que está acontecendo...",
      },
    ],
    montarResumoEDescricao: (v) => ({
      resumo: v.resumo ?? "",
      descricao: v.passos ?? "",
    }),
  },
  Solicitação: {
    campos: [
      {
        id: "resumo",
        label: "O que você precisa?",
        tipoCampo: "input",
        placeholder: "Ex: Declaração de matrícula",
      },
      {
        id: "motivo",
        label: "Motivo da solicitação",
        tipoCampo: "textarea",
        placeholder: "Explique o motivo do pedido...",
      },
    ],
    montarResumoEDescricao: (v) => ({
      resumo: v.resumo ?? "",
      descricao: v.motivo ?? "",
    }),
  },
  Dúvida: {
    campos: [
      {
        id: "duvida",
        label: "Qual a sua dúvida?",
        tipoCampo: "textarea",
        placeholder: "Escreva sua dúvida com o máximo de detalhes possível...",
      },
    ],
    // Só existe um campo aqui — o resumo é derivado (truncado) da própria dúvida.
    montarResumoEDescricao: (v) => {
      const texto = (v.duvida ?? "").trim();
      const resumo = texto.length > 60 ? `${texto.slice(0, 60)}...` : texto;
      return { resumo, descricao: texto };
    },
  },
};

export default function TicketForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tipoDaUrl = searchParams.get("tipo");
  const tipoInicial: TicketTipo = éTicketTipo(tipoDaUrl) ? tipoDaUrl : "Dúvida";

  const [tipo, setTipo] = useState<TicketTipo>(tipoInicial);
  const [segmento, setSegmento] = useState<SegmentoAluno | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const configAtual = FORM_CONFIG[tipo];

  function handleCampoChange(id: string, valor: string) {
    setValores((atual) => ({ ...atual, [id]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!segmento) {
      setErro("Selecione o segmento do aluno para continuar.");
      return;
    }

    const camposVazios = configAtual.campos.some(
      (campo) => !(valores[campo.id] ?? "").trim()
    );
    if (camposVazios) {
      setErro("Preencha todos os campos para continuar.");
      return;
    }

    // Todo o texto digitado nos campos deste tipo, junto, pra análise.
    const textoCombinado = configAtual.campos
      .map((campo) => valores[campo.id] ?? "")
      .join(" ");

    if (contemLinguagemInadequada(textoCombinado)) {
      setErro("Por favor, mantenha o respeito na descrição.");
      return;
    }

    const { resumo, descricao } = configAtual.montarResumoEDescricao(valores);
    const prioridade = calcularPrioridade(textoCombinado);

    setErro(null);
    setEnviando(true);
    try {
      await criarTicket({
        tipo,
        resumo,
        descricao,
        prioridade,
        segmento,
        solicitanteId: user.uid,
      });
      router.push("/tickets");
    } catch (err) {
      console.error("Erro ao criar ticket:", err);
      setErro("Não foi possível abrir a solicitação. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tipo */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-brand-950">
          Tipo de solicitação
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setTipo(opcao)}
              className={`rounded-xl2 border px-2 py-2.5 text-[13px] font-medium transition-colors ${
                tipo === opcao
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-brand-100 bg-white text-brand-950/70"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {/* Segmento do aluno — obrigatório em toda solicitação */}
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-brand-950">
          Segmento do aluno
        </label>
        <div className="grid grid-cols-2 gap-2">
          {segmentosAluno.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setSegmento(opcao)}
              className={`rounded-xl2 border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                segmento === opcao
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-brand-100 bg-white text-brand-950/70"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </div>

      {/* Campos dinâmicos — mudam conforme o tipo escolhido acima */}
      {configAtual.campos.map((campo) => (
        <div key={`${tipo}-${campo.id}`}>
          <label
            htmlFor={campo.id}
            className="mb-1.5 block text-[13px] font-medium text-brand-950"
          >
            {campo.label}
          </label>
          {campo.tipoCampo === "input" ? (
            <input
              id={campo.id}
              type="text"
              value={valores[campo.id] ?? ""}
              onChange={(e) => handleCampoChange(campo.id, e.target.value)}
              placeholder={campo.placeholder}
              className="w-full rounded-xl2 border border-brand-100 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-brand-500"
            />
          ) : (
            <textarea
              id={campo.id}
              rows={5}
              value={valores[campo.id] ?? ""}
              onChange={(e) => handleCampoChange(campo.id, e.target.value)}
              placeholder={campo.placeholder}
              className="w-full resize-none rounded-xl2 border border-brand-100 bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-brand-500"
            />
          )}
        </div>
      ))}

      {erro && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-brand-700 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {enviando ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {enviando ? "Enviando..." : "Abrir solicitação"}
      </button>
    </form>
  );
}
