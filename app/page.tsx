"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductBundle, OFFProduct, RecentSearch } from "@/lib/types";
import {
  classifyInput,
  fetchProductByUPC,
  fetchProductsByBrand,
  fetchAmazonDetails,
  ApiError,
  type SortKey,
} from "@/lib/off";
import { getGrade } from "@/lib/nutriscore";
import { useRecentSearches } from "@/lib/useRecentSearches";

import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ProductDetail from "@/components/ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { DetailSkeleton, GridSkeleton } from "@/components/Skeleton";
import { HistoryIcon, LeafIcon } from "@/components/icons";

interface ListState {
  brand: string;
  products: OFFProduct[];
  count: number;
  page: number;
  pageSize: number;
  notice: string | null;
  sort: SortKey;
}

type Loading = "idle" | "detail" | "list";

const SORT_KEY = "aznutrition:sort";
const RAIL_KEY = "aznutrition:railCollapsed";
const HIDE_UNRATED_KEY = "aznutrition:hideUnrated";

export default function Home() {
  const recent = useRecentSearches();

  const [loading, setLoading] = useState<Loading>("idle");
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ProductBundle | null>(null);
  const [list, setList] = useState<ListState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [hideUnrated, setHideUnrated] = useState(true);

  // Restore saved preferences after mount.
  useEffect(() => {
    const s = localStorage.getItem(SORT_KEY);
    if (s === "popularity" || s === "score" || s === "name") setSort(s);
    if (localStorage.getItem(RAIL_KEY) === "true") setRailCollapsed(true);
    if (localStorage.getItem(HIDE_UNRATED_KEY) === "false") setHideUnrated(false);
  }, []);

  const toggleRail = useCallback(() => {
    setRailCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(RAIL_KEY, String(next));
      return next;
    });
  }, []);

  const rememberProduct = useCallback(
    (code: string, product: OFFProduct, kind: RecentSearch["kind"]) => {
      recent.add({
        kind,
        query: code,
        label: product.product_name?.trim() || `Barcode ${code}`,
        imageUrl: product.image_front_url || product.image_url,
        grade: getGrade(product),
      });
    },
    [recent]
  );

  /**
   * Load a single product by barcode and show the detail view.
   * If the barcode isn't in the database and a `fallback` is supplied
   * (e.g. an Amazon brand search), run that instead of erroring.
   */
  const loadProduct = useCallback(
    async (
      code: string,
      kind: RecentSearch["kind"] = "upc",
      fallback?: () => Promise<void>
    ) => {
      setLoading("detail");
      setError(null);
      setBundle(null);
      // Jump back to the top so the detail view starts at the product header,
      // not wherever the user had scrolled to in the results grid.
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const data = await fetchProductByUPC(code);
        setBundle(data);
        if (data.details.product) rememberProduct(code, data.details.product, kind);
      } catch (err) {
        if (fallback && err instanceof ApiError && err.status === 404) {
          await fallback();
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading("idle");
      }
    },
    [rememberProduct]
  );

  /** Load a page of brand/search results and show the grid. */
  const loadBrand = useCallback(
    async (
      brand: string,
      page = 1,
      notice: string | null = null,
      sortKey: SortKey = sort,
      ratedOnly: boolean = hideUnrated
    ) => {
      setLoading("list");
      setError(null);
      setBundle(null);
      try {
        const data = await fetchProductsByBrand(brand, page, sortKey, ratedOnly);
        if (data.products.length === 0) {
          setList(null);
          setError(
            ratedOnly
              ? `No rated products found for “${brand}”. Try turning off “Hide unrated”.`
              : `No products found for “${brand}”.`
          );
          return;
        }
        setList({ brand, notice, sort: sortKey, ...data });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading("idle");
      }
    },
    [sort, hideUnrated]
  );

  const handleSortChange = useCallback(
    (next: SortKey) => {
      setSort(next);
      localStorage.setItem(SORT_KEY, next);
      if (list) loadBrand(list.brand, 1, list.notice, next);
    },
    [list, loadBrand]
  );

  const handleHideUnratedChange = useCallback(
    (next: boolean) => {
      setHideUnrated(next);
      localStorage.setItem(HIDE_UNRATED_KEY, String(next));
      // Re-fetch from page 1 — the filter changes the server-side result set.
      if (list) loadBrand(list.brand, 1, list.notice, list.sort, next);
    },
    [list, loadBrand]
  );

  /** Top-level search: routes barcode / Amazon link / junk appropriately. */
  const handleSearch = useCallback(
    async (raw: string) => {
      const { kind, value } = classifyInput(raw);
      setSidebarOpen(false);

      if (kind === "unknown") {
        setError("Please enter a product name, Amazon link, or UPC / barcode.");
        return;
      }

      if (kind === "upc") {
        setList(null);
        await loadProduct(value, "upc");
        return;
      }

      if (kind === "search") {
        setBundle(null);
        await loadBrand(value);
        return;
      }

      // Amazon link → scrape for a barcode, else fall back to a brand search.
      setLoading("detail");
      setError(null);
      setBundle(null);
      setList(null);
      try {
        const amazon = await fetchAmazonDetails(value);
        const brand = amazon.brand || amazon.store;
        // Prefer a real brand from the page; otherwise use the product name parsed
        // from the URL slug so blocked scrapes still yield relevant results.
        const query = brand || amazon.searchQuery;
        const notice = brand
          ? `No exact match for that product — showing items from ${brand}.`
          : `No exact match — showing products related to that Amazon item.`;
        const searchFallback = query
          ? () => loadBrand(query, 1, notice)
          : undefined;

        if (amazon.upcCode) {
          // Try the exact barcode; if it isn't in the database, fall back to a search.
          await loadProduct(amazon.upcCode, "amazon", searchFallback);
          return;
        }
        if (query) {
          await loadBrand(query, 1, notice);
          return;
        }
        setError("Couldn't find nutrition data for that link. Try the product's barcode.");
        setLoading("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLoading("idle");
      }
    },
    [loadProduct, loadBrand]
  );

  const handleRecentSelect = useCallback(
    (item: RecentSearch) => {
      setSidebarOpen(false);
      if (item.kind === "brand") loadBrand(item.query);
      else loadProduct(item.query, item.kind);
    },
    [loadBrand, loadProduct]
  );

  const showEmpty = loading === "idle" && !bundle && !list && !error;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={recent.items}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={railCollapsed}
        onToggleCollapse={toggleRail}
        onSelect={handleRecentSelect}
        onRemove={recent.remove}
        onClear={recent.clear}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-300 hover:bg-surface-overlay lg:hidden"
              aria-label="Open recent searches"
            >
              <HistoryIcon />
            </button>
            <button
              onClick={() => {
                setBundle(null);
                setList(null);
                setError(null);
              }}
              className="flex items-center gap-2 font-semibold text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <LeafIcon width={18} height={18} />
              </span>
              <span>
                AZ<span className="text-brand-400">Nutrition</span>
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          {/* Hero — compact once a result is showing */}
          <section
            className={`mx-auto text-center transition-all ${
              showEmpty ? "mb-8 max-w-2xl" : "mb-8 max-w-3xl"
            }`}
          >
            {showEmpty && (
              <>
                <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Know what&apos;s in your food
                </h1>
                <p className="mb-8 text-slate-400">
                  Search by name, or look up nutrition facts, Nutri-Score, and additives from any barcode or Amazon link.
                </p>
              </>
            )}
            <SearchBar loading={loading !== "idle"} onSearch={handleSearch} />
          </section>

          {error && (
            <div className="mb-6">
              <ErrorBanner message={error} />
            </div>
          )}

          {loading === "detail" && <DetailSkeleton />}
          {loading === "list" && <GridSkeleton />}

          {loading === "idle" && bundle && (
            <ProductDetail
              bundle={bundle}
              canGoBack={!!list}
              onGoBack={() => setBundle(null)}
              onSeeBrand={(brand) => loadBrand(brand)}
            />
          )}

          {loading === "idle" && !bundle && list && (
            <ProductGrid
              products={list.products}
              count={list.count}
              page={list.page}
              pageSize={list.pageSize}
              notice={list.notice}
              sort={list.sort}
              hideUnrated={hideUnrated}
              onHideUnratedChange={handleHideUnratedChange}
              onSortChange={handleSortChange}
              onSelect={(code) => loadProduct(code)}
              onPageChange={(page) => loadBrand(list.brand, page, list.notice, list.sort)}
            />
          )}

          {showEmpty && <EmptyState />}
        </main>

        <footer className="border-t border-surface-border px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
          Built with <span aria-label="love">❤️</span> by{" "}
          <a
            href="https://4040automations.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-400 transition hover:text-brand-300 hover:underline"
          >
            4040automations.com
          </a>
        </footer>
      </div>
    </div>
  );
}
