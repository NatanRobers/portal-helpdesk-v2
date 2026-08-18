"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { criarTicket } from "@/lib/tickets";
import { contemLinguagemInadequada, calcularPrioridade } from "@/lib/analiseTexto";
import { segmentosAluno } from "@/data/mock-data";
import { SegmentoAluno, TicketTipo } from "@/types";
import { Bot, Loader2, Send, ThumbsDown, ThumbsUp } from "lucide-react";

type AssuntoId = "senha" | "boleto" | "boletim" | "falta" | "cadastro" | "humano";

type Assunto = {
  id: AssuntoId;
  label: string;
  /** Ausente para "Falar com Humano" — aí já pula direto para a descrição. */
  resposta?: string;
  /** Tipo de ticket a usar caso essa dúvida não seja resolvida. */
  tipoTicket: TicketTipo;
};

const ASSUNTOS: Assunto[] = [
  {
    id: "senha",
    label: "Problema com Senha",
    resposta:
      "Para redefinir sua senha, acesse a tela de login e toque em \"Esqueci minha senha\". Enviaremos um link de redefinição para o e-mail cadastrado.",
    tipoTicket: "Incidente",
  },
  {
    id: "boleto",
    label: "Segunda via de Boleto",
    resposta:
      "Você consegue emitir a segunda via pelo Portal Financeiro, em \"Financeiro > Boletos\". O valor já vem atualizado com eventuais juros.",
    tipoTicket: "Dúvida",
  },
  {
    id: "boletim",
    label: "Onde vejo o boletim?",
    resposta:
      "Os boletins ficam disponíveis na aba \"Painel\" logo após o fechamento do bimestre. Você recebe uma notificação assim que ele é publicado.",
    tipoTicket: "Dúvida",
  },
  {
    id: "falta",
    label: "Como justificar uma falta?",
    resposta:
      "Envie o atestado ou a justificativa pela Secretaria em até 5 dias úteis após a falta. Documentos médicos podem ser anexados diretamente por lá.",
    tipoTicket: "Solicitação",
  },
  {
    id: "cadastro",
    label: "Atualização de Cadastro",
    resposta:
      "Para atualizar endereço, telefone ou e-mail, acesse Secretaria > Meus Dados. Alterações no responsável financeiro precisam ser feitas presencialmente.",
    tipoTicket: "Solicitação",
  },
  {
    id: "humano",
    label: "Falar com Humano",
    tipoTicket: "Dúvida",
  },
];

type Etapa = "segmento" | "assunto" | "resposta" | "descricao" | "concluido";

type BotMensagem = {
  id: string;
  remetente: "bot" | "usuario";
  texto: string;
};

let contadorId = 0;
function proximoId() {
  contadorId += 1;
  return `bot-msg-${contadorId}`;
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ChatbotFAQ() {
  const { user } = useAuth();
  const router = useRouter();

  const [mensagens, setMensagens] = useState<BotMensagem[]>([
    {
      id: proximoId(),
      remetente: "bot",
      texto:
        "Olá! Eu sou o assistente virtual da escola. Para começar, selecione o segmento do aluno:",
    },
  ]);
  const [etapa, setEtapa] = useState<Etapa>("segmento");
  const [digitando, setDigitando] = useState(false);
  const [segmentoEscolhido, setSegmentoEscolhido] = useState<SegmentoAluno | null>(null);
  const [assuntoEscolhido, setAssuntoEscolhido] = useState<Assunto | null>(null);
  const [descricaoLivre, setDescricaoLivre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ticketCriado, setTicketCriado] = useState(false);
  const fimDaListaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, digitando, etapa]);

  function pushUsuario(texto: string) {
    setMensagens((atual) => [...atual, { id: proximoId(), remetente: "usuario", texto }]);
  }

  /** Mostra "digitando..." por um instante antes de emplacar a próxima fala do bot. */
  async function botFala(texto: string, delay = 550) {
    setDigitando(true);
    await esperar(delay);
    setDigitando(false);
    setMensagens((atual) => [...atual, { id: proximoId(), remetente: "bot", texto }]);
  }

  async function escolherSegmento(segmento: SegmentoAluno) {
    pushUsuario(segmento);
    setSegmentoEscolhido(segmento);
    setEtapa("resposta"); // esconde os botões de segmento enquanto o bot "digita"
    await botFala("Qual o assunto?");
    setEtapa("assunto");
  }

  async function escolherAssunto(assunto: Assunto) {
    pushUsuario(assunto.label);
    setAssuntoEscolhido(assunto);
    setEtapa("resposta"); // estado transitório, some os botões de assunto

    if (assunto.resposta) {
      await botFala(assunto.resposta);
      await botFala("Isso resolveu sua dúvida?", 450);
      setEtapa("resposta");
    } else {
      await botFala(
        "Sem problemas! Descreva seu problema em uma frase para eu repassar à equipe:"
      );
      setEtapa("descricao");
    }
  }

  async function responderResolveu(resolveu: boolean) {
    pushUsuario(resolveu ? "Sim" : "Não");

    if (resolveu) {
      await botFala("Que bom! Fico feliz em ajudar. 😊");
      setEtapa("concluido");
    } else {
      await botFala(
        "Sem problemas! Descreva seu problema em uma frase para eu repassar à equipe:"
      );
      setEtapa("descricao");
    }
  }

  async function enviarDescricao() {
    const texto = descricaoLivre.trim();
    if (!texto || !user || !segmentoEscolhido || enviando) return;

    pushUsuario(texto);
    setDescricaoLivre("");

    // Valida a linguagem antes de qualquer outra coisa — nem chega a tentar
    // criar o ticket. A etapa continua "descricao": o campo de texto some
    // com a resposta do bot, mas a mesma pergunta ainda vale, então a etapa
    // não muda, só aguarda uma nova tentativa de texto.
    if (contemLinguagemInadequada(texto)) {
      await botFala(
        "Por favor, mantenha o respeito na descrição. Pode reescrever de outra forma?"
      );
      return;
    }

    setEnviando(true);
    try {
      await criarTicket({
        tipo: assuntoEscolhido?.tipoTicket ?? "Dúvida",
        resumo: `Atendimento via Assistente Virtual — ${assuntoEscolhido?.label ?? "Dúvida geral"}`,
        descricao: texto,
        prioridade: calcularPrioridade(texto),
        segmento: segmentoEscolhido,
        solicitanteId: user.uid,
        origem: "BOT",
      });

      setTicketCriado(true);
      await botFala(
        "Prontinho! Encaminhei sua solicitação para a nossa equipe. Você já pode acompanhar em \"Minhas solicitações\"."
      );
      setEtapa("concluido");
      await esperar(1200);
      router.push("/tickets");
    } catch (erro) {
      console.error("Erro ao criar ticket via bot:", erro);
      await botFala("Ops, não consegui registrar sua solicitação agora. Pode tentar de novo?");
      setEtapa("descricao");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4.75rem)] animate-fade-in-up flex-col">
      {/* Lista de mensagens */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F1EEFB] px-4 py-4">
        {mensagens.map((msg) => (
          <BolhaMensagem key={msg.id} mensagem={msg} />
        ))}

        {digitando && <BolhaDigitando />}

        {/* Quick-replies da etapa atual, dentro do fluxo de rolagem */}
        {!digitando && etapa === "segmento" && (
          <div className="flex flex-wrap gap-2 pl-10">
            {segmentosAluno.map((opcao) => (
              <button
                key={opcao}
                onClick={() => escolherSegmento(opcao)}
                className="rounded-full border border-brand-700 bg-white px-4 py-2 text-[13px] font-medium text-brand-700 active:bg-brand-100"
              >
                {opcao}
              </button>
            ))}
          </div>
        )}

        {!digitando && etapa === "assunto" && (
          <div className="flex flex-col gap-2 pl-10">
            {ASSUNTOS.map((assunto) => (
              <button
                key={assunto.id}
                onClick={() => escolherAssunto(assunto)}
                className="rounded-full border border-brand-700 bg-white px-4 py-2 text-left text-[13px] font-medium text-brand-700 active:bg-brand-100"
              >
                {assunto.label}
              </button>
            ))}
          </div>
        )}

        {!digitando && etapa === "resposta" && assuntoEscolhido?.resposta && (
          <div className="flex gap-2 pl-10">
            <button
              onClick={() => responderResolveu(true)}
              className="flex items-center gap-1.5 rounded-full border border-success bg-white px-4 py-2 text-[13px] font-medium text-success active:bg-success/10"
            >
              <ThumbsUp size={14} /> Sim
            </button>
            <button
              onClick={() => responderResolveu(false)}
              className="flex items-center gap-1.5 rounded-full border border-danger bg-white px-4 py-2 text-[13px] font-medium text-danger active:bg-danger/10"
            >
              <ThumbsDown size={14} /> Não
            </button>
          </div>
        )}

        {etapa === "concluido" && !ticketCriado && (
          <div className="pl-10">
            <Link
              href="/"
              className="inline-block rounded-full border border-brand-700 bg-white px-4 py-2 text-[13px] font-medium text-brand-700 active:bg-brand-100"
            >
              Voltar para o início
            </Link>
          </div>
        )}

        <div ref={fimDaListaRef} />
      </div>

      {/* Campo de descrição livre — só aparece quando o bot pede */}
      {etapa === "descricao" && (
        <div className="flex items-center gap-2 border-t border-brand-100 bg-white px-3 py-2.5">
          <input
            value={descricaoLivre}
            onChange={(e) => setDescricaoLivre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviarDescricao()}
            type="text"
            disabled={enviando}
            placeholder="Descreva seu problema em uma frase..."
            className="flex-1 rounded-full bg-brand-50 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 disabled:opacity-60"
          />
          <button
            onClick={enviarDescricao}
            disabled={enviando}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white active:bg-brand-800 disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function BolhaMensagem({ mensagem }: { mensagem: BotMensagem }) {
  const éDoUsuario = mensagem.remetente === "usuario";

  if (éDoUsuario) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-xl2 rounded-tr-sm bg-brand-700 px-3.5 py-2.5 text-[13.5px] leading-snug text-white shadow-card">
          {mensagem.texto}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
        <Bot size={14} />
      </span>
      <div className="max-w-[78%] rounded-xl2 rounded-tl-sm bg-white px-3.5 py-2.5 text-[13.5px] leading-snug text-ink shadow-card">
        {mensagem.texto}
      </div>
    </div>
  );
}

function BolhaDigitando() {
  return (
    <div className="flex items-end gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
        <Bot size={14} />
      </span>
      <div className="flex items-center gap-1 rounded-xl2 rounded-tl-sm bg-white px-4 py-3 shadow-card">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-700/50 [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-700/50 [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-700/50" />
      </div>
    </div>
  );
}
