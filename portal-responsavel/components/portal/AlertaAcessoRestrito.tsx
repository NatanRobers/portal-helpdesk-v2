"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

export default function AlertaAcessoRestrito() {
  const searchParams = useSearchParams();
  const [dispensado, setDispensado] = useState(false);

  const restrito = searchParams.get("acesso") === "restrito";
  if (!restrito || dispensado) return null;

  return (
    <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl2 border border-danger/20 bg-danger/10 p-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
      <p className="flex-1 text-[13px] leading-snug text-danger">
        Acesso restrito a funcionários. Essa área é exclusiva da equipe da escola.
      </p>
      <button
        onClick={() => setDispensado(true)}
        aria-label="Fechar aviso"
        className="shrink-0 text-danger/60"
      >
        <X size={15} />
      </button>
    </div>
  );
}
