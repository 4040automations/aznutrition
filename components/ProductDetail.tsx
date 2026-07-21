"use client";

import { useEffect, useState } from "react";
import type { ProductBundle } from "@/lib/types";
import { getGrade, gradeStyle } from "@/lib/nutriscore";
import NutriScoreBadge from "./NutriScoreBadge";
import ProductSummary from "./ProductSummary";
import KnowledgePanelItem from "./KnowledgePanel";
import ImageModal from "./ImageModal";
import { BackIcon, LeafIcon } from "./icons";

interface Props {
  bundle: ProductBundle;
  brandLabel?: string;
  canGoBack: boolean;
  onGoBack: () => void;
  onSeeBrand: (brand: string) => void;
}

const FALLBACK = "/packaging.svg";

export default function ProductDetail({
  bundle,
  brandLabel,
  canGoBack,
  onGoBack,
  onSeeBrand,
}: Props) {
  const [modal, setModal] = useState<{ src: string; alt: string } | null>(null);

  const product = bundle.details.product ?? {};
  const panels = bundle.knowledge.product?.knowledge_panels ?? {};

  const grade = getGrade(product);
  const style = gradeStyle(grade);
  const name = product.product_name?.trim() || "Unnamed product";
  const brand = brandLabel || product.brands?.split(",")[0]?.trim() || "";

  const frontImage = product.image_front_url || product.image_url || FALLBACK;
  const nutritionImage = product.image_nutrition_url;

  const nutrientPanels = Object.entries(panels)
    .filter(([id]) => id.startsWith("nutrient_level"))
    .map(([, p]) => p);
  const additivePanels = Object.entries(panels)
    .filter(([id]) => id.startsWith("additive"))
    .map(([, p]) => p);
  const ingredientsPanel = panels["ingredients"];

  // Support the browser Back button to return to a list without leaving the app.
  useEffect(() => {
    if (!canGoBack) return;
    window.history.pushState({ detail: true }, "");
    const onPop = () => onGoBack();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [canGoBack, onGoBack]);

  const ingredientsHtml =
    ingredientsPanel?.elements?.find((e) => e.text_element?.html)?.text_element?.html;

  return (
    <div className="animate-fade-in space-y-6">
      {canGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          <BackIcon width={16} height={16} /> Back to results
        </button>
      )}

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-surface-border bg-surface-raised">
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <button
            onClick={() => setModal({ src: frontImage, alt: name })}
            className="mx-auto w-full max-w-[16rem] shrink-0 overflow-hidden rounded-xl bg-white p-4 transition hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frontImage} alt={name} className="aspect-square w-full object-contain" />
          </button>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{name}</h1>
              {product.quantity && (
                <p className="mt-1 text-sm text-slate-400">{product.quantity}</p>
              )}
              {brand && (
                <button
                  onClick={() => onSeeBrand(brand)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition hover:text-brand-300"
                >
                  <LeafIcon width={15} height={15} /> More from {brand}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-3 rounded-xl p-3 ${style.chip}`}>
                <NutriScoreBadge grade={grade} size="lg" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Nutri-Score</p>
                  <p className={`text-lg font-bold ${style.text}`}>{style.label}</p>
                </div>
              </div>
              {product.ecoscore_grade && product.ecoscore_grade !== "unknown" && (
                <span className="rounded-full bg-surface-overlay px-3 py-1 text-xs font-medium text-slate-300">
                  Eco-Score {product.ecoscore_grade.toUpperCase()}
                </span>
              )}
            </div>

            <ProductSummary product={product} panels={panels} />
          </div>
        </div>
      </section>

      {/* Nutrition levels */}
      <section className="space-y-4 rounded-2xl border border-surface-border bg-surface-raised p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-bold text-white">Nutrition levels</h2>
            {nutrientPanels.length > 0 ? (
              nutrientPanels.map((p, i) => <KnowledgePanelItem key={i} panel={p} defaultOpen />)
            ) : (
              <p className="text-sm text-slate-500">No nutrition levels recorded.</p>
            )}
          </div>
          {nutritionImage && (
            <button
              onClick={() => setModal({ src: nutritionImage, alt: "Nutrition facts" })}
              className="w-full max-w-[16rem] shrink-0 self-start overflow-hidden rounded-xl bg-white p-3 transition hover:opacity-90"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nutritionImage} alt="Nutrition facts label" className="w-full object-contain" />
            </button>
          )}
        </div>
      </section>

      {/* Ingredients */}
      <section className="space-y-3 rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-bold text-white">Ingredients</h2>
        {ingredientsHtml ? (
          <div
            className="off-content text-sm leading-relaxed text-slate-300"
            dangerouslySetInnerHTML={{ __html: ingredientsHtml }}
          />
        ) : product.ingredients_text ? (
          <p className="text-sm leading-relaxed text-slate-300">{product.ingredients_text}</p>
        ) : (
          <p className="text-sm text-slate-500">Ingredient information not available.</p>
        )}
      </section>

      {/* Additives */}
      <section className="space-y-3 rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h2 className="text-lg font-bold text-white">Additives</h2>
        {additivePanels.length > 0 ? (
          <div className="space-y-3">
            {additivePanels.map((p, i) => (
              <KnowledgePanelItem key={i} panel={p} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No additives detected.</p>
        )}
      </section>

      <ImageModal src={modal?.src ?? null} alt={modal?.alt ?? ""} onClose={() => setModal(null)} />
    </div>
  );
}
