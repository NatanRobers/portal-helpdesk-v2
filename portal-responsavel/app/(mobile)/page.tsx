"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import SearchBar from "@/components/portal/SearchBar";
import CategoryCard from "@/components/portal/CategoryCard";
import AlertaAcessoRestrito from "@/components/portal/AlertaAcessoRestrito";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, LogOut, FileQuestion, ListChecks, Bot, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import Link from "next/link";

function primeiroNome(user: { displayName: string | null; email: string | null }) {
  if (user.displayName) return user.displayName.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "responsável";
}

export default function Home() {
  return (
    <RequireAuth>
      <PortalHome />
    </RequireAuth>
  );
}

function PortalHome() {
  const { user, role, carregando, logout } = useAuth();
  const router = useRouter();

  // Funcionário (qualquer role diferente de "pai") não deve ver a Home dos
  // pais — manda direto pro Backoffice. A checagem só decide depois que
  // `carregando` vira false: até lá, o AuthContext pode ainda estar
  // buscando o `role` em users/{uid} no Firestore, e decidir com um valor
  // incompleto mandaria o funcionário pra Home por engano. (O RequireAuth
  // que envolve este componente já segura o render até `carregando` ficar
  // false, mas essa checagem fica explícita aqui também — não deve
  // depender implicitamente do comportamento de um componente pai.)
  useEffect(() => {
    if (carregando) return;
    if (role && role !== "pai") {
      router.replace("/admin");
    }
  }, [carregando, role, router]);

  if (carregando || (role && role !== "pai")) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand-700" size={26} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Cabeçalho com saudação */}
      <header className="bg-brand-900 px-5 pb-16 pt-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100/70">
              Central de Ajuda
            </p>
            <h1 className="mt-0.5 font-display text-xl font-semibold">
              Olá, {user ? primeiroNome(user) : "responsável"}!
            </h1>
            <p className="mt-1 text-sm text-brand-100/70">
              Como podemos ajudar hoje?
            </p>
          </div>
          <button
            onClick={() => logout()}
            aria-label="Sair da conta"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* Alerta de acesso restrito — só aparece se veio de um redirect do /admin */}
      <Suspense fallback={null}>
        <AlertaAcessoRestrito />
      </Suspense>

      {/* Barra de pesquisa flutuando sobre o cabeçalho, como no portal do Jira */}
      <div className="-mt-10 px-5">
        <SearchBar />
      </div>

      {/* Banner de destaque para o Assistente Virtual */}
      <div className="px-5 pt-4">
        <Link
          href="/assistente"
          className="flex items-center gap-3 rounded-xl2 bg-gradient-to-r from-brand-700 to-brand-600 p-4 text-white shadow-card transition-transform active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Bot size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-semibold">
              Precisa de ajuda rápida?
            </p>
            <p className="text-[13px] text-white/80">
              Fale com nosso Assistente Virtual
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-white/70" />
        </Link>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-brand-950">
            Como você quer começar?
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/agendamentos"
              className="text-xs font-medium text-brand-700 underline underline-offset-2"
            >
              Minhas reuniões
            </Link>
            <Link
              href="/tickets"
              className="text-xs font-medium text-brand-700 underline underline-offset-2"
            >
              Minhas solicitações
            </Link>
          </div>
        </div>

        <div className="space-y-3 pb-8">
          <CategoryCard
            icon={CalendarDays}
            titulo="Agendar reunião"
            descricao="Marque um horário com Direção, Coordenação e mais"
            href="/agendamentos/novo"
          />
          <CategoryCard
            icon={AlertTriangle}
            titulo="Informar incidente"
            descricao="Algo parou de funcionar ou está com problema"
            href="/tickets/novo?tipo=Incidente"
          />
          <CategoryCard
            icon={ListChecks}
            titulo="Enviar solicitação"
            descricao="Peça um documento, acesso ou serviço"
            href="/tickets/novo?tipo=Solicitação"
          />
          <CategoryCard
            icon={FileQuestion}
            titulo="Tirar uma dúvida"
            descricao="Faça uma pergunta para a nossa equipe"
            href="/tickets/novo?tipo=Dúvida"
          />
        </div>
      </div>
    </div>
  );
}
