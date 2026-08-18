"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Buscar por artigos ou solicitações...",
  onSearch,
}: {
  placeholder?: string;
  /** Opcional — chamado ao pressionar Enter/enviar. Sem busca real ainda. */
  onSearch?: (termo: string) => void;
}) {
  const [termo, setTermo] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const termoLimpo = termo.trim();
    if (termoLimpo) {
      onSearch?.(termoLimpo);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search
        size={19}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-600/50"
      />
      <input
        type="text"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl2 border border-brand-100 bg-white py-3.5 pl-11 pr-4 text-sm text-ink shadow-card outline-none placeholder:text-ink/40 focus:border-brand-500"
      />
    </form>
  );
}
