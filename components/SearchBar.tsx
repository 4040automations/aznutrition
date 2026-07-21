"use client";

import { useMemo, useState } from "react";
import { classifyInput } from "@/lib/off";
import { SearchIcon, BarcodeIcon, LinkIcon, AlertIcon } from "./icons";
import Spinner from "./Spinner";

interface Props {
  loading: boolean;
  onSearch: (raw: string) => void;
}

const EXAMPLES = [
  { label: "Nutella", value: "3017620422003" },
  { label: "Coca-Cola", value: "5449000000996" },
  { label: "Oreo", value: "7622210449283" },
];

export default function SearchBar({ loading, onSearch }: Props) {
  const [value, setValue] = useState("");

  const kind = useMemo(() => classifyInput(value).kind, [value]);
  const hint =
    value.trim() === ""
      ? null
      : kind === "upc"
      ? { icon: <BarcodeIcon width={14} height={14} />, text: "Barcode detected", tone: "text-brand-400" }
      : kind === "amazon"
      ? { icon: <LinkIcon width={14} height={14} />, text: "Amazon link detected", tone: "text-brand-400" }
      : kind === "search"
      ? { icon: <SearchIcon width={14} height={14} />, text: "Search by product name", tone: "text-slate-400" }
      : { icon: <AlertIcon width={14} height={14} />, text: "Enter a name, barcode, or Amazon link", tone: "text-amber-400" };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) onSearch(value.trim());
  };

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <SearchIcon />
        </span>
        <input
          type="text"
          inputMode="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a product, or paste an Amazon link / barcode…"
          aria-label="Product name, Amazon link, or barcode"
          className="w-full rounded-2xl border border-surface-border bg-surface-raised py-4 pl-12 pr-32 text-base text-white placeholder:text-slate-500 shadow-inner transition focus:border-brand-500 focus:shadow-glow focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Spinner size={16} /> : "Analyze"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {hint && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${hint.tone}`}>
            {hint.icon} {hint.text}
          </span>
        )}
        <span className="text-xs text-slate-500">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.value}
            onClick={() => onSearch(ex.value)}
            disabled={loading}
            className="rounded-full border border-surface-border px-3 py-1 text-xs text-slate-300 transition hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
