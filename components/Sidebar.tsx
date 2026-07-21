"use client";

import type { RecentSearch } from "@/lib/types";
import type { Grade } from "@/lib/nutriscore";
import NutriScoreBadge from "./NutriScoreBadge";
import {
  HistoryIcon,
  TrashIcon,
  CloseIcon,
  BarcodeIcon,
  LinkIcon,
  LeafIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons";

interface Props {
  items: RecentSearch[];
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelect: (item: RecentSearch) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function KindIcon({ kind }: { kind: RecentSearch["kind"] }) {
  const cls = "text-slate-500";
  if (kind === "upc") return <BarcodeIcon width={14} height={14} className={cls} />;
  if (kind === "amazon") return <LinkIcon width={14} height={14} className={cls} />;
  return <LeafIcon width={14} height={14} className={cls} />;
}

interface PanelProps {
  items: RecentSearch[];
  onSelect: (item: RecentSearch) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** When provided, renders a collapse button in the header (desktop only). */
  onCollapse?: () => void;
}

function Panel({ items, onSelect, onRemove, onClear, onCollapse }: PanelProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <HistoryIcon width={16} height={16} /> Recent searches
        </h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-500 transition hover:text-red-400"
            >
              Clear
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              aria-label="Collapse sidebar"
              className="rounded-md p-1 text-slate-400 transition hover:bg-surface-overlay hover:text-slate-200"
            >
              <ChevronLeftIcon width={16} height={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500">
            Your recent lookups will appear here.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="group relative">
                <button
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 pr-8 text-left transition hover:bg-surface-overlay"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-md bg-white object-contain p-0.5"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-overlay">
                      <KindIcon kind={item.kind} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-200">{item.label}</span>
                    <span className="block text-xs text-slate-500">{timeAgo(item.timestamp)}</span>
                  </span>
                  {item.grade && <NutriScoreBadge grade={item.grade as Grade} size="sm" />}
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  aria-label="Remove"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <TrashIcon width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  ...panel
}: Props) {
  return (
    <>
      {/* Desktop rail — collapses to a slim strip. */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-surface-border bg-surface-raised/40 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-12" : "w-72"
        }`}
      >
        {collapsed ? (
          <div className="flex w-full flex-col items-center gap-3 py-4">
            <button
              onClick={onToggleCollapse}
              aria-label="Expand recent searches"
              className="relative rounded-md p-2 text-slate-300 transition hover:bg-surface-overlay hover:text-white"
              title="Recent searches"
            >
              <HistoryIcon width={18} height={18} />
              {panel.items.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                  {panel.items.length}
                </span>
              )}
            </button>
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="rounded-md p-1.5 text-slate-400 transition hover:bg-surface-overlay hover:text-slate-200"
            >
              <ChevronRightIcon width={16} height={16} />
            </button>
          </div>
        ) : (
          <Panel {...panel} onCollapse={onToggleCollapse} />
        )}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-surface-border bg-surface-raised shadow-2xl transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 rounded-md p-1 text-slate-400 hover:text-white"
          >
            <CloseIcon width={18} height={18} />
          </button>
          <Panel {...panel} />
        </aside>
      </div>
    </>
  );
}
