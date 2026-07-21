import { NextResponse } from "next/server";
import type {
  ProductBundle,
  ProductDetailsResponse,
  KnowledgePanelsResponse,
} from "@/lib/types";

const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
// OpenFoodFacts asks API clients to identify themselves.
const UA = "AZNutrition/1.0 (github.com/aznutrition)";
const TIMEOUT_MS = 8000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch JSON from OFF with a timeout and one retry. OFF occasionally returns
 * 5xx or is briefly slow, so a single blip shouldn't fail the whole lookup.
 */
async function offFetch<T>(url: string, revalidate: number): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(400);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate },
      });
      // OFF returns HTTP 404 (with a valid `{status:0}` JSON body) for unknown
      // barcodes — that's a legitimate "not found", not a transport error.
      if (res.status === 404) return (await res.json()) as T;
      if (!res.ok) {
        // Other client errors won't be fixed by retrying.
        if (res.status < 500) throw new Error(`OpenFoodFacts responded ${res.status}`);
        lastErr = new Error(`OpenFoodFacts responded ${res.status}`);
        continue;
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("OpenFoodFacts request failed");
}

export async function GET(request: Request) {
  const upc = new URL(request.url).searchParams.get("upc")?.trim();

  if (!upc || !/^\d{6,14}$/.test(upc)) {
    return NextResponse.json({ error: "A valid UPC/EAN barcode is required." }, { status: 400 });
  }

  // The product record is required; knowledge panels are a nice-to-have, so a
  // failure there shouldn't block the lookup.
  let details: ProductDetailsResponse;
  try {
    details = await offFetch<ProductDetailsResponse>(`${OFF_BASE}/${upc}.json`, 86400);
  } catch (err) {
    console.error("get-product-details:", err);
    return NextResponse.json(
      { error: "Could not reach the nutrition database. Please try again in a moment." },
      { status: 502 }
    );
  }

  // OFF returns status 0 with an empty product when the barcode is unknown.
  if (details.status === 0 || !details.product) {
    return NextResponse.json(
      { error: "No nutrition record found for that barcode." },
      { status: 404 }
    );
  }

  let knowledge: KnowledgePanelsResponse = {};
  try {
    knowledge = await offFetch<KnowledgePanelsResponse>(
      `${OFF_BASE}/${upc}.json?fields=knowledge_panels`,
      86400
    );
  } catch (err) {
    console.warn("get-product-knowledge (non-fatal):", err);
  }

  const bundle: ProductBundle = { details, knowledge };
  return NextResponse.json(bundle);
}
