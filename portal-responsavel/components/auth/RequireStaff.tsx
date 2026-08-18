"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function RequireStaff({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, carregando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "pai") {
      // Query param lido pela Home pra mostrar o alerta amigável.
      router.replace("/?acesso=restrito");
    }
  }, [carregando, user, role, router]);

  const acessoLiberado = !carregando && user && role && role !== "pai";

  if (!acessoLiberado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-brand-700" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
