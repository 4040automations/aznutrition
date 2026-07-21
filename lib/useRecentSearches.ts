"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecentSearch } from "./types";

const STORAGE_KEY = "aznutrition:recent";
const MAX_ITEMS = 25;

function read(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentSearch[]) : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    setItems(read());
    setReady(true);
  }, []);

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: RecentSearch[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, []);

  const add = useCallback(
    (entry: Omit<RecentSearch, "id" | "timestamp">) => {
      setItems((prev) => {
        // De-dupe by query+kind; most recent floats to the top.
        const filtered = prev.filter(
          (i) => !(i.query === entry.query && i.kind === entry.kind)
        );
        const next: RecentSearch[] = [
          { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    []
  );

  const remove = useCallback(
    (id: string) => persist(items.filter((i) => i.id !== id)),
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, ready, add, remove, clear };
}
