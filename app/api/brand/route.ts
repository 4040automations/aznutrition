import { NextResponse } from "next/server";
import type { BrandSearchResponse, OFFProduct } from "@/lib/types";

const UA = "AZNutrition/1.0 (github.com/aznutrition)";
const PAGE_SIZE = 48;
const TIMEOUT_MS = 9000;
const FIELDS = "code,product_name,brands,image_url,image_front_url,nutriscore_grade,nutriscore_2023_tags";

// Map our sort keys to OpenFoodFacts `sort_by` values. Server-side sorting keeps
// pagination globally consistent (page 1 → 2 → 3 are one continuous order).
const SORT_MAP: Record<string, string> = {
  popularity: "unique_scans_n",
  score: "nutriscore_score",
  name: "product_name",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch JSON from OFF with a timeout and retries — the search endpoint 503s often. */
async function offSearch(url: string): Promise<any> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(500 * attempt);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });
      if (res.status >= 500) {
        lastErr = new Error(`OpenFoodFacts responded ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`OpenFoodFacts responded ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("OpenFoodFacts request failed");
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sortKey = params.get("sort") ?? "popularity";
  // Default to only rated products so pagination/counts reflect what's actually shown.
  const rated = params.get("rated") !== "0";

  if (!q) {
    return NextResponse.json({ error: "A search term is required." }, { status: 400 });
  }

  const search = new URLSearchParams({
    search_terms: q,
    page: String(page),
    page_size: String(PAGE_SIZE),
    fields: FIELDS,
    sort_by: SORT_MAP[sortKey] ?? SORT_MAP.popularity,
    search_simple: "1",
    action: "process",
    json: "1",
  });

  // Exclude products with no Nutri-Score ("unknown"/"not-applicable") server-side, so the
  // total count and page count are accurate instead of being decimated client-side per page.
  if (rated) {
    search.set("tagtype_0", "nutrition_grades");
    search.set("tag_contains_0", "does_not_contain");
    search.set("tag_0", "unknown");
    search.set("tagtype_1", "nutrition_grades");
    search.set("tag_contains_1", "does_not_contain");
    search.set("tag_1", "not-applicable");
  }

  try {
    const data = await offSearch(`https://world.openfoodfacts.org/cgi/search.pl?${search}`);

    // Drop entries with no usable name — they're unidentifiable noise and would
    // otherwise dominate the top of an A–Z sort.
    const products = ((data.products as OFFProduct[]) ?? []).filter(
      (p) => p.product_name && p.product_name.trim()
    );

    const payload: BrandSearchResponse = {
      products,
      count: Number(data.count) || 0,
      page: Number(data.page) || page,
      pageSize: Number(data.page_size) || PAGE_SIZE,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("get-brand-products:", err);
    return NextResponse.json(
      { error: "Could not search the nutrition database. Please try again." },
      { status: 502 }
    );
  }
}
