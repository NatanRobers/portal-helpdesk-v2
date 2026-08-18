"use client";

import { useState } from "react";
import { avaliarTicket } from "@/lib/tickets";
import { Loader2, Star } from "lucide-react";

export default function AvaliacaoCSAT({ ticketId }: { ticketId: string }) {
  const [notaSelecionada, setNotaSelecionada] = useState<number | null>(null);
  const [notaEmHover, setNotaEmHover] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const notaExibida = notaEmHover ?? notaSelecionada ?? 0;

  async function confirmarAvaliacao() {
    if (!notaSelecionada || enviando) return;

    setErro(null);
    setEnviando(true);
    try {
      await avaliarTicket(ticketId, notaSelecionada);
      setEnviado(true);
    } catch (err) {
      console.error("Erro ao avaliar ticket:", err);
      setErro("Não foi possível registrar sua avaliação. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-xl2 bg-brand-50 p-5 text-center">
        <div className="flex justify-center gap-1 text-brand-700">
          {[1, 2, 3, 4, 5].map((valor) => (
            <Star
              key={valor}
              size={22}
              fill={valor <= (notaSelecionada ?? 0) ? "currentColor" : "none"}
            />
          ))}
        </div>
        <p className="mt-2 font-display text-[14px] font-semibold text-brand-950">
          Obrigado pela sua avaliação!
        </p>
        <p className="mt-0.5 text-[13px] text-ink/60">
          Seu feedback nos ajuda a melhorar o atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-brand-100 bg-brand-50 p-5 text-center">
      <p className="font-display text-[14px] font-semibold text-brand-950">
        Como foi o seu atendimento?
      </p>
      <p className="mt-0.5 text-[13px] text-ink/60">
        Avalie de 1 a 5 estrelas
      </p>

      <div className="mt-3 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setNotaSelecionada(valor)}
            onMouseEnter={() => setNotaEmHover(valor)}
            onMouseLeave={() => setNotaEmHover(null)}
            aria-label={`${valor} estrela${valor > 1 ? "s" : ""}`}
            className="p-1 text-brand-700 transition-transform active:scale-90"
          >
            <Star size={28} fill={valor <= notaExibida ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      {erro && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={confirmarAvaliacao}
        disabled={!notaSelecionada || enviando}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 bg-brand-700 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {enviando && <Loader2 size={15} className="animate-spin" />}
        {enviando ? "Enviando..." : "Confirmar avaliação"}
      </button>
    </div>
  );
}
