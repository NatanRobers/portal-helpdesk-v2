import { Setor } from "@/types";
import { setoresInfo } from "@/data/mock-data";
import {
  FileSignature,
  Wallet,
  Users,
  ChevronRight,
  Headset,
} from "lucide-react";

const iconePorSetor: Record<Setor, typeof FileSignature> = {
  secretaria: FileSignature,
  financeiro: Wallet,
  coordenacao: Users,
};

export default function SectorSelector({
  onEscolher,
}: {
  onEscolher: (setor: Setor) => void;
}) {
  const setores = Object.keys(setoresInfo) as Setor[];

  return (
    <div className="animate-fade-in-up px-5 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white">
          <Headset size={20} />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold text-navy-900">
            Atendimento
          </h1>
          <p className="text-sm text-navy-600/70">
            Com qual setor você quer falar?
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {setores.map((setor) => {
          const Icon = iconePorSetor[setor];
          const info = setoresInfo[setor];
          return (
            <button
              key={setor}
              onClick={() => onEscolher(setor)}
              className="flex w-full items-center gap-4 rounded-xl2 bg-white p-4 text-left shadow-card transition-transform active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-navy-800">
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-semibold text-navy-900">
                  {info.label}
                </p>
                <p className="truncate text-[13px] text-navy-600/70">
                  {info.descricao}
                </p>
              </div>
              <ChevronRight size={18} className="text-navy-600/40" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
