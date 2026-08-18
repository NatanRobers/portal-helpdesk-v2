import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export default function CategoryCard({
  icon: Icon,
  titulo,
  descricao,
  href,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl2 bg-white p-4 shadow-card transition-transform active:scale-[0.98]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <Icon size={21} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-semibold text-brand-950">
          {titulo}
        </p>
        <p className="truncate text-[13px] text-ink/60">{descricao}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-brand-700/40" />
    </Link>
  );
}
