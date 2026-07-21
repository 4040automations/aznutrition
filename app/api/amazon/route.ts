import { NextResponse } from "next/server";
import axios from "axios";
import { load, type CheerioAPI } from "cheerio";
import type { AmazonLookupResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Realistic browser headers reduce (but never eliminate) Amazon bot blocking.
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
};

/** Pull the first 12–14 digit barcode from a detail label like "UPC ‏ : ‎ 012345678905". */
function extractBarcode(text: string): string | null {
  if (!/UPC|EAN|GTIN|Barcode/i.test(text)) return null;
  const match = text.match(/\b\d{12,14}\b/);
  return match ? match[0] : null;
}

// Slug words that add no signal to a nutrition search — dropped to keep the query focused.
const STOP_WORDS = new Set([
  "the", "and", "with", "of", "for", "pack", "count", "ct", "oz", "ounce", "ounces",
  "variety", "assorted", "value", "size", "each", "per", "case", "box", "bag", "bottle",
  "ingredients", "gluten", "free", "keto", "friendly", "natural", "organic", "new",
]);

/**
 * Derive a product-name search query from an Amazon URL's slug — the human-readable
 * path segment before `/dp/` (e.g. "Wilde-Protein-Chips-Variety" → "Wilde Protein Chips").
 * This works even when Amazon blocks the page scrape, since it reads only the URL.
 */
function slugToQuery(link: string): string | null {
  let pathname: string;
  try {
    ({ pathname } = new URL(link));
  } catch {
    return null;
  }
  const parts = pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((p) => p === "dp" || p === "gp" || p === "product");
  const slug =
    marker > 0 ? parts[marker - 1] : parts.find((p) => p.includes("-") && /[a-z]/i.test(p));
  if (!slug || !/[a-z]/i.test(slug)) return null;

  const words = decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    // Drop pure numbers (sizes/counts like "13", "5") and stop-words — they
    // over-constrain the search and can drop the match to zero results.
    .filter((w) => w && !/^\d+$/.test(w) && !STOP_WORDS.has(w.toLowerCase()))
    .slice(0, 5);

  const query = words.join(" ").trim();
  return query.length >= 3 ? query : null;
}

function scrape(html: string, searchQuery: string | null): AmazonLookupResponse {
  const $: CheerioAPI = load(html);
  const result: AmazonLookupResponse = {
    upcCode: null,
    productTitle: null,
    brand: null,
    store: null,
    flavor: null,
    searchQuery,
  };

  // Product title.
  const title = $("#productTitle").text().trim();
  if (title) result.productTitle = title;

  // Barcode — check both common Amazon detail layouts.
  $("#detailBullets_feature_div li, #productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr")
    .each((_, el) => {
      if (result.upcCode) return;
      const code = extractBarcode($(el).text());
      if (code) result.upcCode = code;
    });

  // Brand + flavor from the "product overview" table.
  $("#productOverview_feature_div tr").each((_, el) => {
    const label = $(el).find("td, th").first().text().trim().toLowerCase();
    const value = $(el).find("td").last().text().trim();
    if (!value) return;
    if (label.includes("brand") && !result.brand) result.brand = value;
    if (label.includes("flavor") && !result.flavor) result.flavor = value;
  });

  // Store / byline as a brand fallback.
  const byline = $("#bylineInfo").text().trim();
  if (byline) {
    result.store = byline.replace(/^Visit the /i, "").replace(/ Store$/i, "").trim();
  }

  return result;
}

export async function POST(request: Request) {
  let link: string | undefined;
  try {
    ({ link } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!link || !/^https?:\/\//i.test(link)) {
    return NextResponse.json({ error: "A valid Amazon link is required." }, { status: 400 });
  }

  // Derived from the URL alone, so it survives Amazon blocking the page fetch below.
  const searchQuery = slugToQuery(link);

  try {
    const { data: html } = await axios.get<string>(link, {
      headers: BROWSER_HEADERS,
      timeout: 12000,
      maxRedirects: 5,
      responseType: "text",
    });

    const result = scrape(html, searchQuery);

    // If we couldn't read anything AND the URL had no usable slug, guide the user.
    if (
      !result.upcCode &&
      !result.brand &&
      !result.store &&
      !result.productTitle &&
      !result.searchQuery
    ) {
      return NextResponse.json(
        { error: "Couldn't read that Amazon page. Try the product's UPC/barcode instead." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("amazon lookup:", err instanceof Error ? err.message : err);

    // Amazon blocked or the link was unreachable — still return the slug-derived
    // query so the client can fall back to a keyword search instead of failing.
    if (searchQuery) {
      return NextResponse.json({
        upcCode: null,
        productTitle: null,
        brand: null,
        store: null,
        flavor: null,
        searchQuery,
      });
    }

    return NextResponse.json(
      {
        error:
          "Amazon blocked the lookup or the link was unreachable. Try the product's UPC/barcode instead.",
      },
      { status: 502 }
    );
  }
}
