"use client";

import { useEffect, useRef, useState } from "react";
import { Mensagem } from "@/types";
import { mensagemEscalonamento } from "@/data/mock-data";
import {
  enviarMensagemDoPai,
  encaminharChatParaDirecao,
  useMensagensDoChat,
} from "@/lib/chat";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, ShieldAlert, CheckCheck, Loader2 } from "lucide-react";

function formatarHora(timestamp: number | null) {
  if (!timestamp) return "enviando...";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatScreen({
  chatId,
  titulo,
  onVoltar,
  onEncerrar,
}: {
  chatId: string;
  titulo: string;
  onVoltar: () => void;
  onEncerrar: () => void;
}) {
  const { user } = useAuth();
  const { mensagens, carregando } = useMensagensDoChat(chatId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [escalonando, setEscalonando] = useState(false);
  const [escalonado, setEscalonado] = useState(false);
  const fimDaListaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!conteudo || !user || enviando) return;

    setTexto("");
    setEnviando(true);
    try {
      await enviarMensagemDoPai(chatId, conteudo, user.uid);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      setTexto(conteudo); // devolve o texto ao campo para o pai tentar de novo
    } finally {
      setEnviando(false);
    }
  }

  async function encaminharParaDirecao() {
    if (escalonado || escalonando) return;
    setEscalonando(true);
    try {
      await encaminharChatParaDirecao(chatId, mensagemEscalonamento);
      setEscalonado(true);
    } catch (erro) {
      console.error("Erro ao encaminhar para a Direção:", erro);
    } finally {
      setEscalonando(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4.75rem)] animate-fade-in-up flex-col">
      {/* Cabeçalho do chat */}
      <header className="flex items-center gap-3 bg-navy-900 px-4 py-3 text-white">
        <button onClick={onVoltar} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold">
            {titulo}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {escalonado ? "Encaminhado para a Direção" : "Online"}
          </p>
        </div>
        <button
          onClick={onEncerrar}
          className="text-xs font-medium text-sky-300 underline underline-offset-2"
        >
          Novo atendimento
        </button>
      </header>

      {/* Botão de escalonamento, sempre visível */}
      <div className="border-b border-sky-100 bg-sky-50 px-4 py-2.5">
        <button
          onClick={encaminharParaDirecao}
          disabled={escalonado || escalonando}
          className={`flex w-full items-center justify-center gap-2 rounded-xl2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
            escalonado
              ? "bg-navy-100 text-navy-600/50"
              : "bg-danger text-white active:bg-danger/90"
          }`}
        >
          {escalonando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ShieldAlert size={16} />
          )}
          {escalonado
            ? "Encaminhado para a Direção"
            : "Problema não resolvido? Encaminhar para a Direção"}
        </button>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#EAF1F8] px-4 py-4">
        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-navy-600/50" size={22} />
          </div>
        ) : (
          mensagens.map((msg) => <BolhaMensagem key={msg.id} mensagem={msg} />)
        )}
        <div ref={fimDaListaRef} />
      </div>

      {/* Campo de entrada */}
      <div className="flex items-center gap-2 border-t border-sky-100 bg-white px-3 py-2.5">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
          type="text"
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-full bg-sky-50 px-4 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-600/40"
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white active:bg-navy-800 disabled:opacity-60"
        >
          {enviando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

function BolhaMensagem({ mensagem }: { mensagem: Mensagem }) {
  const éDoPai = mensagem.remetente === "pai";
  const éDoSistema =
    mensagem.remetente === "sistema" || mensagem.remetente === "direcao";

  if (éDoSistema) {
    return (
      <div className="flex justify-center">
        <p
          className={`max-w-[85%] rounded-xl2 px-3.5 py-2 text-center text-[12.5px] leading-snug shadow-card ${
            mensagem.remetente === "direcao"
              ? "bg-navy-900 text-white"
              : "bg-white text-navy-700"
          }`}
        >
          {mensagem.texto}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${éDoPai ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-xl2 px-3.5 py-2.5 text-[13.5px] leading-snug shadow-card ${
          éDoPai
            ? "rounded-tr-sm bg-sky-600 text-white"
            : "rounded-tl-sm bg-white text-navy-900"
        }`}
      >
        <p>{mensagem.texto}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
            éDoPai ? "text-sky-100/80" : "text-navy-600/50"
          }`}
        >
          <span>{formatarHora(mensagem.timestamp)}</span>
          {éDoPai && <CheckCheck size={13} />}
        </div>
      </div>
    </div>
  );
}
