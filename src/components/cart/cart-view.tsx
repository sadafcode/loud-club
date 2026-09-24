"use client";

import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { CartRow } from "@/components/layout/cart-drawer";
import { Button, ButtonLink } from "@/components/ui/button";
import { findVariant } from "@/lib/catalog";
import { orderTotals } from "@/lib/checkout";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cartTotals, useCart } from "@/store/cart";
import { useStockStore } from "@/store/stock";
import { PromoField, TotalsTable } from "./order-summary";

const PERKS = [
  { icon: Truck, text: `Free standard delivery over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
  { icon: RotateCcw, text: "Free 30-day returns & exchanges" },
  { icon: ShieldCheck, text: "Secure checkout" },
];

/** Lines whose quantity can no longer be fulfilled — checkout is blocked until fixed. */
export function useUnavailable(skus: { sku: string; quantity: number }[]) {
  const overrides = useStockStore((s) => s.overrides);
  return skus.filter(({ sku, quantity }) => quantity > (overrides[sku] ?? findVariant(sku)?.variant.stock ?? 0));
}

export function CartView() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const promo = useCart((s) => s.promo);
  const { lines, subtotal, count } = cartTotals(hydrated ? items : []);
  const totals = orderTotals(subtotal, { promo });
  const unavailable = useUnavailable(lines);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (!hydrated) {
    return <div className="gutter min-h-[60vh] pt-14" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="gutter flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="eyebrow text-muted">Your bag</p>
        <h1 className="display text-6xl md:text-8xl">Quiet in here.</h1>
        <p className="max-w-sm text-muted">Nothing in your bag yet. The new drop is a good place to start.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop?sort=newest" size="lg">
            Shop new arrivals
          </ButtonLink>
          <ButtonLink href="/lookbook" size="lg" variant="outline">
            Browse the lookbook
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="gutter pt-10 pb-24 md:pt-14">
      <header className="flex items-end justify-between border-b border-ink pb-6">
        <h1 className="display text-6xl md:text-8xl">Your bag</h1>
        <p className="eyebrow text-muted">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>
      </header>

      <div className="grid gap-12 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-2 rounded-2xl bg-concrete p-5">
            <p className="text-sm">
              {remaining > 0 ? (
                <>
                  Add <strong className="font-medium">{formatPrice(remaining)}</strong> more for free standard delivery.
                </>
              ) : (
                <>
                  You&apos;ve unlocked <strong className="font-medium">free standard delivery</strong>.
                </>
              )}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-stone">
              <div
                className="h-full rounded-full bg-cobalt transition-[width] duration-500"
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <CartRow key={line.sku} line={line} />
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-5">
          <div className="space-y-6 rounded-3xl border border-line p-6 md:p-8 lg:sticky lg:top-24">
            <h2 className="eyebrow">Order summary</h2>
            <PromoField />
            <TotalsTable totals={totals} shippingLabel="Standard shipping" />
            {unavailable.length > 0 && (
              <p className="rounded-2xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">
                Some pieces sold out while they were in your bag. Update them to continue.
              </p>
            )}
            {unavailable.length > 0 ? (
              <Button size="lg" className="w-full" disabled>
                Checkout <ArrowRight className="size-4" />
              </Button>
            ) : (
              <ButtonLink href="/checkout" size="lg" className="w-full">
                Checkout <ArrowRight className="size-4" />
              </ButtonLink>
            )}
            <ul className="space-y-2.5 border-t border-line pt-6">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted">
                  <Icon className="size-4 shrink-0 text-ink" strokeWidth={1.5} />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
