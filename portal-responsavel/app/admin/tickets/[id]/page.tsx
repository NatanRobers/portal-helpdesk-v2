"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTicket, useMensagensTicket, enviarMensagemTicket } from "@/lib/tickets";
import { StatusBadge, PriorityBadge } from "@/components/tickets/Badges";
import { MensagemTicket } from "@/types";
import { ArrowLeft, Loader2, Send } from "lucide-react";

function formatarHora(timestamp: number | null) {
  if (!timestamp) return "enviando...";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTicketChatPage() {
  const params = useParams<{ id: string }>();
  const ticketId = decodeURIComponent(params.id);

  const { user } = useAuth();
  const { ticket, carregando: carregandoTicket } = useTicket(ticketId);
  const { mensagens, carregando: carregandoMensagens } = useMensagensTicket(ticketId);

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
      // isFuncionario = true — quem está enviando é o backoffice.
      await enviarMensagemTicket(ticketId, conteudo, user.uid, true);
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
      setTexto(conteudo);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Cabeçalho com os dados do ticket */}
      <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <Link
          href="/admin/tickets"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={15} />
          Voltar pra fila
        </Link>

        {carregandoTicket ? (
          <div className="flex justify-center py-3">
            <Loader2 className="animate-spin text-brand-700" size={20} />
          </div>
        ) : !ticket ? (
          <p className="text-sm text-slate-500">Chamado não encontrado.</p>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] text-brand-700">{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge prioridade={ticket.prioridade} />
            </div>
            <h1 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
              {ticket.resumo}
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              {ticket.descricao}
            </p>
          </div>
        )}
      </header>

      {/* Mensagens */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 md:px-6">
        {carregandoMensagens ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-brand-700/50" size={22} />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-slate-400">
            Nenhuma mensagem ainda. Inicie a conversa com o responsável.
          </p>
        ) : (
          mensagens.map((mensagem) => (
            <BolhaMensagemAdmin key={mensagem.id} mensagem={mensagem} />
          ))
        )}
        <div ref={fimDaListaRef} />
      </div>

      {/* Campo de envio */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
          type="text"
          placeholder="Digite sua resposta ao responsável..."
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500"
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

function BolhaMensagemAdmin({ mensagem }: { mensagem: MensagemTicket }) {
  // Visão do admin: mensagens da ESCOLA (isFuncionario) à direita.
  const éDaEscola = mensagem.isFuncionario;

  return (
    <div className={`flex ${éDaEscola ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug shadow-sm ${
          éDaEscola
            ? "rounded-tr-sm bg-brand-700 text-white"
            : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
        }`}
      >
        <p>{mensagem.texto}</p>
        <p
          className={`mt-1 text-[10px] ${
            éDaEscola ? "text-white/70" : "text-slate-400"
          }`}
        >
          {formatarHora(mensagem.dataCriacao)}
        </p>
      </div>
    </div>
  );
}
