"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findVariant } from "@/lib/catalog";
import { shippingFor } from "@/lib/format";
import type { CartItem } from "@/lib/types";
import { getStock } from "@/store/stock";

type AddResult = { ok: true } | { ok: false; reason: "sold-out" | "limit"; available: number };

type CartState = {
  items: CartItem[];
  add: (sku: string, quantity?: number) => AddResult;
  addMany: (skus: string[]) => number;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (sku, quantity = 1) => {
        const found = findVariant(sku);
        const available = getStock(sku);
        if (!found || available === 0) return { ok: false, reason: "sold-out", available: 0 };

        const existing = get().items.find((i) => i.sku === sku);
        const next = (existing?.quantity ?? 0) + quantity;
        if (next > available) return { ok: false, reason: "limit", available };

        set((s) => ({
          items: existing
            ? s.items.map((i) => (i.sku === sku ? { ...i, quantity: next } : i))
            : [...s.items, { sku, productId: found.product.id, quantity }],
        }));
        return { ok: true };
      },

      /** Add one of each SKU (complete the look). Returns how many were added. */
      addMany: (skus) => skus.filter((sku) => get().add(sku).ok).length,

      setQuantity: (sku, quantity) => {
        if (quantity <= 0) return get().remove(sku);
        const capped = Math.min(quantity, getStock(sku));
        set((s) => ({ items: s.items.map((i) => (i.sku === sku ? { ...i, quantity: capped } : i)) }));
      },

      remove: (sku) => set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),

      clear: () => set({ items: [] }),
    }),
    { name: "loud-club-cart" },
  ),
);

export type CartLine = CartItem & {
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  slug: string;
};

export function selectLines(items: CartItem[]): CartLine[] {
  return items.flatMap((item) => {
    const found = findVariant(item.sku);
    if (!found) return [];
    const { product, variant } = found;
    return [
      {
        ...item,
        name: product.name,
        slug: product.slug,
        image: product.images[0],
        color: variant.color,
        size: variant.size,
        price: product.price,
      },
    ];
  });
}

export function cartTotals(items: CartItem[]) {
  const lines = selectLines(items);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping = shippingFor(subtotal);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return { lines, subtotal, shipping, total: subtotal + shipping, count };
}
