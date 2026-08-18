import { SegmentoCoordenacao } from "@/types";
import { segmentosInfo } from "@/data/mock-data";
import { ArrowLeft, ChevronRight, Baby, BookOpenCheck, Backpack } from "lucide-react";

const iconePorSegmento: Record<SegmentoCoordenacao, typeof Baby> = {
  infantil: Baby,
  fundamental1: BookOpenCheck,
  fundamental2: Backpack,
};

export default function SegmentoSelector({
  onEscolher,
  onVoltar,
}: {
  onEscolher: (segmento: SegmentoCoordenacao) => void;
  onVoltar: () => void;
}) {
  const segmentos = Object.keys(segmentosInfo) as SegmentoCoordenacao[];

  return (
    <div className="animate-fade-in-up px-5 pt-6">
      <button
        onClick={onVoltar}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-navy-600"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-6">
        <h1 className="font-display text-lg font-semibold text-navy-900">
          Coordenação
        </h1>
        <p className="text-sm text-navy-600/70">
          Selecione o segmento do aluno
        </p>
      </div>

      <div className="space-y-3">
        {segmentos.map((segmento) => {
          const Icon = iconePorSegmento[segmento];
          return (
            <button
              key={segmento}
              onClick={() => onEscolher(segmento)}
              className="flex w-full items-center gap-4 rounded-xl2 bg-white p-4 text-left shadow-card transition-transform active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-navy-800">
                <Icon size={20} />
              </span>
              <p className="flex-1 font-display text-[15px] font-semibold text-navy-900">
                {segmentosInfo[segmento].label}
              </p>
              <ChevronRight size={18} className="text-navy-600/40" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
