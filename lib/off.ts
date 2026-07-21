// Client-side data layer. All network access goes through our own /api routes
// so third-party endpoints and scraping stay server-side.

import type {
  ProductBundle,
  BrandSearchResponse,
  AmazonLookupResponse,
} from "./types";

/** Error thrown by the client data layer, carrying the HTTP status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (body as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return body as T;
}

export function fetchProductByUPC(upc: string): Promise<ProductBundle> {
  return getJSON<ProductBundle>(`/api/product?upc=${encodeURIComponent(upc)}`);
}

/** Result ordering. Applied server-side so pagination stays globally consistent. */
export type SortKey = "popularity" | "score" | "name";

export function fetchProductsByBrand(
  brand: string,
  page = 1,
  sort: SortKey = "popularity",
  rated = true
): Promise<BrandSearchResponse> {
  return getJSON<BrandSearchResponse>(
    `/api/brand?q=${encodeURIComponent(brand)}&page=${page}&sort=${sort}&rated=${rated ? 1 : 0}`
  );
}

export function fetchAmazonDetails(link: string): Promise<AmazonLookupResponse> {
  return getJSON<AmazonLookupResponse>(`/api/amazon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
}

export type InputKind = "upc" | "amazon" | "search" | "unknown";

export interface ClassifiedInput {
  kind: InputKind;
  /** For upc: the barcode. For amazon: the extracted URL. For search: the raw text. */
  value: string;
}

const UPC_RE = /^\d{8}$|^\d{12,14}$/;
// Matches an Amazon link with OR without the http(s):// prefix, so pasting a bare
// "amazon.com/..." (as browsers often display it) still works.
const AMAZON_URL_RE =
  /((?:https?:\/\/)?[^\s"']*(?:amazon\.[a-z.]{2,}|amzn\.to|a\.co)\/[^\s"']*)/i;

/** Figure out whether the user pasted a barcode, an Amazon link, or junk. */
export function classifyInput(raw: string): ClassifiedInput {
  const text = raw.trim();
  if (!text) return { kind: "unknown", value: "" };

  const digits = text.replace(/[\s-]/g, "");
  if (UPC_RE.test(digits)) return { kind: "upc", value: digits };

  const match = text.match(AMAZON_URL_RE)?.[0];
  if (match) {
    // Normalize to an absolute URL so the server-side fetch/parse always has a protocol.
    const value = /^https?:\/\//i.test(match) ? match : `https://${match}`;
    return { kind: "amazon", value };
  }

  // Anything else that isn't an unresolved URL is treated as a free-text product search.
  if (/^https?:\/\//i.test(text)) return { kind: "unknown", value: text };
  return { kind: "search", value: text };
}
