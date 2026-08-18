"use client";

import { LayoutDashboard, MessageCircleMore } from "lucide-react";

/**
 * @deprecated Não é mais usado pela Home (agora um Portal, sem abas).
 * Mantido só até decidirmos se a Central de Ajuda também terá bottom nav
 * (ex.: Portal / Minhas solicitações) ou se este componente será removido.
 */
export type Aba = "painel" | "atendimento";

export default function BottomNav({
  abaAtiva,
  onChange,
}: {
  abaAtiva: Aba;
  onChange: (aba: Aba) => void;
}) {
  const itens: { id: Aba; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "painel", label: "Painel", icon: LayoutDashboard },
    { id: "atendimento", label: "Atendimento", icon: MessageCircleMore },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-sky-100 bg-white/95 px-6 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-nav backdrop-blur">
      <div className="flex items-center justify-around">
        {itens.map(({ id, label, icon: Icon }) => {
          const ativo = abaAtiva === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex min-w-[84px] flex-col items-center gap-1 rounded-xl2 py-1.5 transition-colors"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  ativo ? "bg-navy-900 text-white" : "text-navy-600/50"
                }`}
              >
                <Icon size={20} strokeWidth={ativo ? 2.25 : 2} />
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  ativo ? "text-navy-900" : "text-navy-600/50"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
