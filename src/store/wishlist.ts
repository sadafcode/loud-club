"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  productIds: string[];
  /** SKUs the shopper wants a back-in-stock alert for. */
  alerts: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  subscribe: (sku: string) => void;
  unsubscribe: (sku: string) => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      alerts: [],
      toggle: (productId) =>
        set((s) => ({
          productIds: s.productIds.includes(productId)
            ? s.productIds.filter((id) => id !== productId)
            : [productId, ...s.productIds],
        })),
      has: (productId) => get().productIds.includes(productId),
      subscribe: (sku) =>
        set((s) => (s.alerts.includes(sku) ? s : { alerts: [...s.alerts, sku] })),
      unsubscribe: (sku) => set((s) => ({ alerts: s.alerts.filter((a) => a !== sku) })),
    }),
    { name: "loud-club-wishlist" },
  ),
);
