"use client";

import { create } from "zustand";
import { findVariant } from "@/lib/catalog";
import { products } from "@/lib/data/products";

/**
 * Simulated live inventory. Baseline stock comes from the product data
 * (identical on server and client); this store only holds deltas, so the
 * first client render matches the server and changes stream in afterwards.
 */

export type StockEvent =
  | { type: "sale"; sku: string; at: number }
  | { type: "restock"; sku: string; at: number };

type StockState = {
  overrides: Record<string, number>;
  /** Shoppers "viewing" each product — pure theatre for the demo. */
  viewers: Record<string, number>;
  lastEvent?: StockEvent;
  setStock: (sku: string, stock: number) => void;
  /** Take units out of stock (checkout). Returns false if not enough left. */
  reserve: (sku: string, quantity: number) => boolean;
  tick: (watchedSkus: string[]) => void;
};

const baseStock = (sku: string) => findVariant(sku)?.variant.stock ?? 0;

export const useStockStore = create<StockState>()((set, get) => ({
  overrides: {},
  viewers: {},
  lastEvent: undefined,

  setStock: (sku, stock) =>
    set((s) => ({ overrides: { ...s.overrides, [sku]: Math.max(0, stock) } })),

  reserve: (sku, quantity) => {
    const current = getStock(sku);
    if (current < quantity) return false;
    get().setStock(sku, current - quantity);
    return true;
  },

  tick: (watchedSkus) => {
    const { overrides } = get();
    const current = (sku: string) => overrides[sku] ?? baseStock(sku);

    // Restock something a shopper is waiting on, now and then.
    const waiting = watchedSkus.filter((sku) => current(sku) === 0);
    if (waiting.length && Math.random() < 0.35) {
      const sku = waiting[Math.floor(Math.random() * waiting.length)];
      set({
        overrides: { ...overrides, [sku]: 3 + Math.floor(Math.random() * 6) },
        lastEvent: { type: "restock", sku, at: Date.now() },
      });
      return;
    }

    // Otherwise someone, somewhere, buys a low-stock item.
    const candidates = products.flatMap((p) => p.variants).filter((v) => {
      const n = current(v.sku);
      return n > 0 && n <= 6;
    });
    if (!candidates.length) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    set({
      overrides: { ...overrides, [pick.sku]: current(pick.sku) - 1 },
      lastEvent: { type: "sale", sku: pick.sku, at: Date.now() },
    });
  },
}));

// Not reactive — for use inside actions and event handlers.
export function getStock(sku: string) {
  return useStockStore.getState().overrides[sku] ?? baseStock(sku);
}

/** Reactive stock for a single variant. */
export function useStock(sku: string | undefined) {
  return useStockStore((s) => (sku ? (s.overrides[sku] ?? baseStock(sku)) : 0));
}

export const LOW_STOCK_THRESHOLD = 4;
