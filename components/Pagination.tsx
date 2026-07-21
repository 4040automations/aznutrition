interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Windowed pagination: shows first/last plus a range around the current page. */
function pageWindow(page: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "...")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  const btn =
    "min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        className={`${btn} bg-surface-raised text-slate-300 hover:bg-surface-overlay`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-slate-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${btn} ${
              p === page
                ? "bg-brand-600 text-white"
                : "bg-surface-raised text-slate-300 hover:bg-surface-overlay"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        className={`${btn} bg-surface-raised text-slate-300 hover:bg-surface-overlay`}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}
