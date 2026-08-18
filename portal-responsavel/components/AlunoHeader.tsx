import { alunoMock } from "@/data/mock-data";
import { Bell, GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AlunoHeader() {
  const { logout } = useAuth();

  return (
    <header className="bg-navy-900 px-5 pb-8 pt-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-300">
            Portal do Responsável
          </p>
          <h1 className="mt-0.5 font-display text-lg font-semibold">
            Olá, responsável!
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Notificações"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <Bell size={18} />
          </button>
          <button
            onClick={() => logout()}
            aria-label="Sair da conta"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 rounded-xl2 bg-white/5 p-4">
        <img
          src={alunoMock.fotoUrl}
          alt={`Foto de perfil de ${alunoMock.nome}`}
          className="h-14 w-14 rounded-full border-2 border-sky-400/40 bg-white"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">
            {alunoMock.nome}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-sky-200">
            <GraduationCap size={15} />
            <span>{alunoMock.serie}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
