import { BarcodeIcon, LeafIcon, PanelIcon } from "./icons";

const FEATURES = [
  {
    icon: <BarcodeIcon />,
    title: "Look it up in seconds",
    body: "Scan the barcode or paste an Amazon link — no account, no hunting through labels.",
  },
  {
    icon: <LeafIcon />,
    title: "See the health score instantly",
    body: "An at-a-glance Nutri-Score A–E, processing level, and additive count for every product.",
  },
  {
    icon: <PanelIcon />,
    title: "Know what's really inside",
    body: "Full ingredients and every additive, explained in plain language — not marketing spin.",
  },
];

export default function EmptyState() {
  return (
    <div className="animate-fade-in space-y-10">
      {/* Why use it — the benefit / use-case, not just the features. */}
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
          <LeafIcon width={13} height={13} /> Check before you buy
        </span>
        <h2 className="mt-4 text-2xl font-bold text-white">Why use AZNutrition?</h2>
        <p className="mt-3 leading-relaxed text-slate-400">
          Packaging is designed to sell, not to inform. AZNutrition gives you an instant,
          unbiased health read on any packaged food — so you can compare options and make a
          better choice in seconds, right from the store aisle.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-surface-border bg-surface-raised p-5"
          >
            <div className="mb-3 inline-flex rounded-xl bg-brand-500/15 p-2.5 text-brand-400">
              {f.icon}
            </div>
            <h3 className="mb-1 font-semibold text-slate-100">{f.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Nutrition data from{" "}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="text-brand-400 hover:underline"
        >
          Open Food Facts
        </a>
        , a free and open database.
      </p>
    </div>
  );
}
