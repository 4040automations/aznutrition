"use client";

import { useState } from "react";
import type { KnowledgePanel } from "@/lib/types";
import { ChevronIcon } from "./icons";

interface Props {
  panel: KnowledgePanel;
  defaultOpen?: boolean;
}

/** Collapsible accordion for an OpenFoodFacts knowledge panel. */
export default function KnowledgePanelItem({ panel, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const title = panel.title_element?.title ?? "Details";
  const subtitle = panel.title_element?.subtitle;
  const icon = panel.title_element?.icon_url;
  const html = panel.elements?.find((e) => e.text_element?.html)?.text_element?.html;

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-overlay"
        aria-expanded={open}
      >
        {icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-6 w-6 shrink-0 object-contain" />
        )}
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-100">{title}</span>
          {subtitle && <span className="block text-xs text-slate-400">{subtitle}</span>}
        </span>
        <ChevronIcon
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-surface-border px-4 py-3">
          {html ? (
            <div
              className="off-content text-sm text-slate-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-sm text-slate-500">No further information available.</p>
          )}
        </div>
      )}
    </div>
  );
}
