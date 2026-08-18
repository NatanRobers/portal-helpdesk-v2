export default function TicketListSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-xl2 bg-white p-4 shadow-card"
        >
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 rounded bg-brand-100" />
            <div className="h-4 w-16 rounded-full bg-brand-100" />
          </div>
          <div className="mt-2.5 h-4 w-3/4 rounded bg-brand-100" />
          <div className="mt-2.5 h-3 w-1/2 rounded bg-brand-100" />
        </li>
      ))}
    </ul>
  );
}
