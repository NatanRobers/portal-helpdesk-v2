"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RequireStaff from "@/components/auth/RequireStaff";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabels } from "@/data/mock-data";
import {
  CalendarClock,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exato: true },
  { href: "/admin/tickets", label: "Fila de Atendimento", icon: Inbox, exato: false },
  { href: "/admin/agendamentos", label: "Agenda de Reuniões", icon: CalendarClock, exato: false },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, exato: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireStaff>
      <AdminShell>{children}</AdminShell>
    </RequireStaff>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu automaticamente sempre que a rota muda — cobre tanto o
  // clique num link quanto navegação por outros meios (botão voltar etc).
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-ink md:flex">
      {/* Top bar — só aparece no mobile, some no desktop (md:hidden) */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-950 text-white">
            <GraduationCap size={16} />
          </span>
          <p className="text-[13px] font-semibold text-slate-900">Portal da Escola</p>
        </div>
        <button
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Overlay — escurece o conteúdo por trás do menu aberto no mobile */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar — fixa e fora da tela no mobile (desliza com translate),
          estática e sempre visível no desktop (md:static + md:translate-x-0) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-brand-950 text-white transition-transform duration-200 ease-out md:static md:z-auto md:w-60 md:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 px-5 py-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <GraduationCap size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">Portal da Escola</p>
              <p className="truncate text-[11px] text-white/50">
                Logado como: {role ? roleLabels[role] : "..."}
              </p>
            </div>
          </div>
          {/* Botão de fechar — só faz sentido no mobile, sidebar do desktop não fecha */}
          <button
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="shrink-0 text-white/60 md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-1 px-3">
          {LINKS.map(({ href, label, icon: Icon, exato }) => {
            const ativo = exato ? pathname === href : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-2.5 rounded-xl2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  ativo
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => logout()}
          className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl2 px-3 py-2.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={17} />
          Sair
        </button>
      </aside>

      <main className="min-h-screen flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
