import type { OFFProduct, KnowledgePanel } from "@/lib/types";
import { novaLabel } from "@/lib/nutriscore";
import { CheckIcon, AlertIcon, MinusIcon } from "./icons";

type Tone = "good" | "bad" | "warn" | "neutral";

interface Bullet {
  tone: Tone;
  text: string;
}

interface Props {
  product: OFFProduct;
  panels: Record<string, KnowledgePanel>;
}

const NUTRIENTS: { key: string; label: string }[] = [
  { key: "fat", label: "fat" },
  { key: "saturated-fat", label: "saturated fat" },
  { key: "sugars", label: "sugar" },
  { key: "salt", label: "salt" },
];

// For these nutrients, less is better — so level maps directly to a verdict.
const LEVEL: Record<string, { tone: Tone; word: string }> = {
  low: { tone: "good", word: "Low" },
  moderate: { tone: "warn", word: "Moderate" },
  high: { tone: "bad", word: "High" },
};

/** Pull the "(56.3%)" figure out of a knowledge-panel title, if present. */
function percentFor(panels: Record<string, KnowledgePanel>, key: string): string | null {
  const title = panels[`nutrient_level_${key}`]?.title_element?.title ?? "";
  return title.match(/\(([\d.]+\s*%)\)/)?.[1]?.replace(/\s/g, "") ?? null;
}

function buildBullets(product: OFFProduct, panels: Record<string, KnowledgePanel>): Bullet[] {
  const bullets: Bullet[] = [];
  const levels = product.nutrient_levels ?? {};

  for (const { key, label } of NUTRIENTS) {
    const level = levels[key];
    const meta = level ? LEVEL[level] : undefined;
    if (!meta) continue;
    const pct = percentFor(panels, key);
    bullets.push({ tone: meta.tone, text: `${meta.word} ${label}${pct ? ` · ${pct}` : ""}` });
  }

  // Processing level (NOVA).
  const nova = product.nova_group;
  if (nova) {
    const tone: Tone = nova <= 2 ? "good" : nova === 3 ? "warn" : "bad";
    bullets.push({ tone, text: `${novaLabel(nova)} (NOVA ${nova})` });
  }

  // Additives.
  const additives = product.additives_tags?.length ?? 0;
  if (product.additives_tags) {
    bullets.push(
      additives === 0
        ? { tone: "good", text: "No additives" }
        : { tone: "warn", text: `Contains ${additives} additive${additives > 1 ? "s" : ""}` }
    );
  }

  return bullets;
}

const TONE_STYLE: Record<Tone, string> = {
  good: "text-brand-400",
  bad: "text-red-400",
  warn: "text-amber-400",
  neutral: "text-slate-400",
};

function ToneIcon({ tone }: { tone: Tone }) {
  const cls = `shrink-0 ${TONE_STYLE[tone]}`;
  if (tone === "good") return <CheckIcon width={16} height={16} className={cls} />;
  if (tone === "bad") return <AlertIcon width={16} height={16} className={cls} />;
  return <MinusIcon width={16} height={16} className={cls} />;
}

/** Compact, color-coded "at a glance" verdict list for a product. */
export default function ProductSummary({ product, panels }: Props) {
  const bullets = buildBullets(product, panels);
  if (bullets.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        At a glance
      </h3>
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-200">
            <ToneIcon tone={b.tone} />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
