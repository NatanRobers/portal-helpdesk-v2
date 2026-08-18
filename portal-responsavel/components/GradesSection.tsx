import { materiasMock } from "@/data/mock-data";
import { BookOpen } from "lucide-react";

function corDaNota(nota: number, max: number) {
  const perc = nota / max;
  if (perc >= 0.7) return "text-success bg-success/10";
  if (perc >= 0.5) return "text-warn bg-warn/10";
  return "text-danger bg-danger/10";
}

export default function GradesSection() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-navy-900">
          Notas do bimestre
        </h2>
        <span className="text-xs font-medium text-navy-600/60">
          3º Bimestre
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {materiasMock.map((materia) => (
          <div
            key={materia.id}
            className="rounded-xl2 bg-white p-4 shadow-card"
          >
            <div className="flex items-center gap-2 text-navy-600">
              <BookOpen size={15} />
              <p className="truncate text-[13px] font-medium text-navy-900">
                {materia.nome}
              </p>
            </div>

            <div className="mt-3 flex items-end justify-between">
              <span
                className={`rounded-lg px-2 py-1 font-display text-lg font-bold ${corDaNota(
                  materia.notaBimestre,
                  materia.notaMaxima
                )}`}
              >
                {materia.notaBimestre.toFixed(1)}
              </span>
              <div className="text-right">
                <p className="text-[11px] text-navy-600/60">Faltas</p>
                <p
                  className={`text-sm font-semibold ${
                    materia.faltas >= materia.faltasLimite - 1
                      ? "text-danger"
                      : "text-navy-800"
                  }`}
                >
                  {materia.faltas}/{materia.faltasLimite}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
