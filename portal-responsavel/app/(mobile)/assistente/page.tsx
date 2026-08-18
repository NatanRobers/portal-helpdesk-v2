"use client";

import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import ChatbotFAQ from "@/components/bot/ChatbotFAQ";

export default function AssistentePage() {
  return (
    <RequireAuth>
      <div className="animate-fade-in-up">
        <header className="flex items-center gap-3 bg-brand-900 px-4 py-3 text-white">
          <Link href="/" aria-label="Voltar para a Central de Ajuda">
            <ArrowLeft size={20} />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Bot size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] font-semibold">
              Assistente Virtual
            </p>
            <p className="flex items-center gap-1 text-[11px] text-brand-100/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Online
            </p>
          </div>
        </header>

        <ChatbotFAQ />
      </div>
    </RequireAuth>
  );
}
