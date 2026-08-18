"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMensagensTicket, enviarMensagemTicket } from "@/lib/tickets";
import { MensagemTicket } from "@/types";
import { Loader2, MessageCircle, Send } from "lucide-react";

function formatarHora(timestamp: number | null) {
  if (!timestamp) return "enviando...";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatTicketCard({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const { mensagens, carregando } = useMensagensTicket(ticketId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
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
      // isFuncionario = false — nesta tela, quem envia é sempre o responsável.
      await enviarMensagemTicket(ticketId, conteudo, user.uid, false);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      setTexto(conteudo);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl2 bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-sky-100 px-4 py-3">
        <MessageCircle size={16} className="text-brand-700" />
        <p className="font-display text-[14px] font-semibold text-brand-950">
          Conversa com a escola
        </p>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto bg-[#F1EEFB] px-4 py-4">
        {carregando ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-brand-700/50" size={20} />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink/50">
            Nenhuma mensagem ainda. Escreva pra escola se precisar complementar algo.
          </p>
        ) : (
          mensagens.map((mensagem) => (
            <BolhaMensagemPai key={mensagem.id} mensagem={mensagem} />
          ))
        )}
        <div ref={fimDaListaRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-sky-100 bg-white px-3 py-2.5">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
          type="text"
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-full bg-brand-50 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40"
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white disabled:opacity-60"
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

function BolhaMensagemPai({ mensagem }: { mensagem: MensagemTicket }) {
  // Visão do pai: mensagens do PRÓPRIO PAI (!isFuncionario) à direita.
  const éDoPai = !mensagem.isFuncionario;

  return (
    <div className={`flex ${éDoPai ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-xl2 px-3.5 py-2.5 text-[13.5px] leading-snug shadow-card ${
          éDoPai
            ? "rounded-tr-sm bg-brand-700 text-white"
            : "rounded-tl-sm bg-white text-brand-950"
        }`}
      >
        <p>{mensagem.texto}</p>
        <p className={`mt-1 text-[10px] ${éDoPai ? "text-white/70" : "text-ink/40"}`}>
          {formatarHora(mensagem.dataCriacao)}
        </p>
      </div>
    </div>
  );
}
