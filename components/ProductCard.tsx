import type { OFFProduct } from "@/lib/types";
import { getGrade } from "@/lib/nutriscore";
import NutriScoreBadge from "./NutriScoreBadge";

interface Props {
  product: OFFProduct;
  onSelect: (code: string) => void;
}

export default function ProductCard({ product, onSelect }: Props) {
  const grade = getGrade(product);
  const image = product.image_front_url || product.image_url;
  const name = product.product_name?.trim() || "Unnamed product";
  const code = product.code ?? "";

  return (
    <button
      onClick={() => code && onSelect(code)}
      className="group flex flex-col overflow-hidden rounded-xl border border-surface-border bg-surface-raised text-left transition duration-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/packaging.svg" alt="" className="h-16 w-16 opacity-30 invert" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <NutriScoreBadge grade={grade} size="sm" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-100">{name}</h3>
        {product.brands && (
          <p className="line-clamp-1 text-xs text-slate-400">{product.brands}</p>
        )}
      </div>
    </button>
  );
}
