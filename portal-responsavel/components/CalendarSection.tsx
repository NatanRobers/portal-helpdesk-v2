import { eventosMock } from "@/data/mock-data";
import { EventoCalendario } from "@/types";
import { FileText, PartyPopper, Sun } from "lucide-react";

const iconePorTipo: Record<
  EventoCalendario["tipo"],
  { icon: typeof FileText; classes: string; label: string }
> = {
  prova: { icon: FileText, classes: "bg-sky-600 text-white", label: "Prova" },
  feriado: { icon: Sun, classes: "bg-warn text-white", label: "Feriado" },
  evento: {
    icon: PartyPopper,
    classes: "bg-navy-700 text-white",
    label: "Evento",
  },
};

export default function CalendarSection() {
  return (
    <section className="pb-6">
      <h2 className="mb-3 font-display text-base font-semibold text-navy-900">
        Datas importantes
      </h2>

      <div className="relative rounded-xl2 bg-white p-4 shadow-card">
        <ol className="relative space-y-5 before:absolute before:bottom-1 before:left-[19px] before:top-1 before:w-px before:bg-sky-100">
          {eventosMock.map((evento) => {
            const info = iconePorTipo[evento.tipo];
            const Icon = info.icon;
            return (
              <li key={evento.id} className="relative flex gap-3 pl-0">
                <span
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${info.classes}`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-[13px] font-semibold text-navy-900">
                    {evento.data}
                  </p>
                  <p className="text-[13px] leading-snug text-navy-800/80">
                    {evento.titulo}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
