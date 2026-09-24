"use client";

import { useEffect } from "react";
import { findVariant } from "@/lib/catalog";
import { useCart } from "@/store/cart";
import { getStock, LOW_STOCK_THRESHOLD, useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

const TICK_MS = 6000;

/**
 * Drives the simulated live inventory and turns stock events into
 * notifications: back-in-stock alerts, and nudges when an item in the bag is
 * selling out.
 */
export function StockTicker() {
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      useStockStore.getState().tick(useWishlist.getState().alerts);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(
    () =>
      useStockStore.subscribe((state, prev) => {
        const event = state.lastEvent;
        if (!event || event === prev.lastEvent) return;
        const found = findVariant(event.sku);
        if (!found) return;
        const { product, variant } = found;
        const label = `${product.name} — ${variant.color}${variant.size === "OS" ? "" : `, ${variant.size}`}`;
        const { toast } = useUI.getState();

        if (event.type === "restock") {
          const wishlist = useWishlist.getState();
          if (!wishlist.alerts.includes(event.sku)) return;
          wishlist.unsubscribe(event.sku);
          toast({ title: "Back in stock", body: label, href: `/product/${product.slug}`, tone: "success" });
          return;
        }

        const inBag = useCart.getState().items.some((i) => i.sku === event.sku);
        const left = getStock(event.sku);
        if (inBag && left <= LOW_STOCK_THRESHOLD) {
          toast({
            title: left === 0 ? "An item in your bag just sold out" : `Selling fast — ${left} left`,
            body: label,
            href: "/cart",
            tone: "alert",
          });
        }
      }),
    [],
  );

  return null;
}
