import type { OFFProduct } from "./types";

export type Grade = "A" | "B" | "C" | "D" | "E" | "N/A";

/** Resolve a normalized Nutri-Score grade from an OFF product. */
export function getGrade(product?: OFFProduct | null): Grade {
  const raw =
    product?.nutriscore_grade ??
    product?.nutriscore_2023_tags?.[0] ??
    "";
  const g = raw.toString().trim().toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(g)) return g as Grade;
  return "N/A";
}

interface GradeStyle {
  /** Solid badge background. */
  badge: string;
  /** Text color on light chips. */
  text: string;
  /** Soft chip background. */
  chip: string;
  label: string;
}

const STYLES: Record<Grade, GradeStyle> = {
  A: { badge: "bg-[#037a35]", text: "text-[#037a35]", chip: "bg-emerald-500/15", label: "Excellent" },
  B: { badge: "bg-[#6ab61e]", text: "text-[#4d8a12]", chip: "bg-lime-500/15", label: "Good" },
  C: { badge: "bg-[#f5c000]", text: "text-[#a07d00]", chip: "bg-yellow-500/15", label: "Fair" },
  D: { badge: "bg-[#f08c1c]", text: "text-[#c26a05]", chip: "bg-orange-500/15", label: "Poor" },
  E: { badge: "bg-[#e63a1e]", text: "text-[#c72d13]", chip: "bg-red-500/15", label: "Bad" },
  "N/A": { badge: "bg-slate-500", text: "text-slate-400", chip: "bg-slate-500/15", label: "Unrated" },
};

export function gradeStyle(grade: Grade): GradeStyle {
  return STYLES[grade];
}

/** NOVA processing group description (1 = unprocessed … 4 = ultra-processed). */
export function novaLabel(group?: number): string | null {
  switch (group) {
    case 1:
      return "Unprocessed";
    case 2:
      return "Processed culinary ingredient";
    case 3:
      return "Processed food";
    case 4:
      return "Ultra-processed";
    default:
      return null;
  }
}
