"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OFFProduct } from "@/lib/types";
import type { SortKey } from "@/lib/off";
import ProductCard from "./ProductCard";
import ProductRow from "./ProductRow";
import Pagination from "./Pagination";
import { GridIcon, ListIcon, SortIcon } from "./icons";

interface Props {
  products: OFFProduct[];
  count: number;
  page: number;
  pageSize: number;
  notice?: string | null;
  sort: SortKey;
  hideUnrated: boolean;
  onHideUnratedChange: (next: boolean) => void;
  onSortChange: (sort: SortKey) => void;
  onSelect: (code: string) => void;
  onPageChange: (page: number) => void;
}

type ViewMode = "list" | "grid";

const VIEW_KEY = "aznutrition:view";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "score", label: "Best Nutri-Score" },
  { value: "popularity", label: "Most popular" },
];

/** Collapse OFF's frequent near-duplicate listings (same product entered many times). */
function dedupe(products: OFFProduct[]): OFFProduct[] {
  const seen = new Set<string>();
  const out: OFFProduct[] = [];
  for (const p of products) {
    const key = `${p.product_name ?? ""}|${p.brands ?? ""}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(p);
  }
  return out;
}

export default function ProductGrid({
  products,
  count,
  page,
  pageSize,
  notice,
  sort,
  hideUnrated,
  onHideUnratedChange,
  onSortChange,
  onSelect,
  onPageChange,
}: Props) {
  const [view, setView] = useState<ViewMode>("list");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "grid" || v === "list") setView(v);
  }, []);

  // Scroll results back to the top when navigating between pages (skip first render).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  const updateView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  // Unrated products are now filtered server-side (see /api/brand `rated`), so the only
  // client-side reduction is collapsing OFF's near-duplicate listings.
  const visible = useMemo(() => dedupe(products), [products]);
  const hiddenDupes = products.length - visible.length;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const toggleBtn = (active: boolean) =>
    `flex items-center justify-center rounded-md p-1.5 transition ${
      active ? "bg-brand-600 text-white" : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div ref={topRef} className="animate-fade-in scroll-mt-24">
      <div className="mb-5 space-y-3">
        {notice && <p className="text-slate-200">{notice}</p>}

        <p className="text-sm text-slate-400">
          <span className="font-medium text-slate-200">{visible.length}</span> shown · page{" "}
          <span className="font-medium text-slate-200">{page}</span> of{" "}
          <span className="font-medium text-slate-200">{totalPages}</span> ·{" "}
          <span className="font-medium text-slate-200">{count.toLocaleString()}</span> total
          {hiddenDupes > 0 && (
            <span className="text-slate-500"> · {hiddenDupes} duplicate{hiddenDupes > 1 ? "s" : ""} hidden</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
            {/* Hide unrated products (no Nutri-Score → no value in a browse view). */}
            <button
              onClick={() => onHideUnratedChange(!hideUnrated)}
              role="switch"
              aria-checked={hideUnrated}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                hideUnrated
                  ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
                  : "border-surface-border bg-surface-raised text-slate-400 hover:text-slate-200"
              }`}
            >
              <span
                className={`relative h-4 w-7 rounded-full transition ${
                  hideUnrated ? "bg-brand-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                    hideUnrated ? "left-3.5" : "left-0.5"
                  }`}
                />
              </span>
              Hide unrated
            </button>

            {/* Sort — applied server-side, so it's consistent across all pages. */}
            <label className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1.5">
              <SortIcon width={16} height={16} className="text-slate-400" />
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as SortKey)}
                className="cursor-pointer bg-transparent text-sm text-slate-200 focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-surface-raised text-slate-200">
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            {/* View toggle */}
            <div
              className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-raised p-1"
              role="group"
              aria-label="View mode"
            >
              <button
                onClick={() => updateView("list")}
                className={toggleBtn(view === "list")}
                aria-pressed={view === "list"}
                aria-label="List view"
              >
                <ListIcon width={18} height={18} />
              </button>
              <button
                onClick={() => updateView("grid")}
                className={toggleBtn(view === "grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
              >
                <GridIcon width={18} height={18} />
              </button>
            </div>
          </div>
        </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p, i) => (
            <ProductCard key={p.code ?? i} product={p} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((p, i) => (
            <ProductRow key={p.code ?? i} product={p} onSelect={onSelect} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
    </div>
  );
}
