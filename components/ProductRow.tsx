import type { OFFProduct } from "@/lib/types";
import { getGrade, gradeStyle } from "@/lib/nutriscore";
import NutriScoreBadge from "./NutriScoreBadge";

interface Props {
  product: OFFProduct;
  onSelect: (code: string) => void;
}

export default function ProductRow({ product, onSelect }: Props) {
  const grade = getGrade(product);
  const style = gradeStyle(grade);
  const image = product.image_front_url || product.image_url;
  const name = product.product_name?.trim() || "Unnamed product";
  const code = product.code ?? "";

  return (
    <button
      onClick={() => code && onSelect(code)}
      className="group flex w-full items-center gap-4 rounded-xl border border-surface-border bg-surface-raised p-3 text-left transition duration-200 hover:border-brand-500/50 hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white sm:h-24 sm:w-24">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} loading="lazy" className="h-full w-full object-contain p-1.5" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/packaging.svg" alt="" className="h-10 w-10 opacity-30 invert" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-slate-100 group-hover:text-white">{name}</h3>
        {product.brands && (
          <p className="truncate text-sm text-slate-400">{product.brands}</p>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className={`text-sm font-medium ${style.text}`}>{style.label}</span>
        <NutriScoreBadge grade={grade} size="md" />
      </div>
      <div className="shrink-0 sm:hidden">
        <NutriScoreBadge grade={grade} size="sm" />
      </div>
    </button>
  );
}
