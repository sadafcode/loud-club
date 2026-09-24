"use client";

import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { imageUrl } from "@/lib/catalog";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cartTotals, useCart, type CartLine } from "@/store/cart";
import { useStock } from "@/store/stock";
import { useUI } from "@/store/ui";

export function CartDrawer() {
  const isOpen = useUI((s) => s.panel === "cart");
  const close = useUI((s) => s.close);
  const onClose = useCallback(() => close(), [close]);
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const { lines, subtotal, count } = cartTotals(hydrated ? items : []);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Sheet open={isOpen} onClose={onClose} label="Shopping bag" title={`Your bag${count ? ` (${count})` : ""}`}>
      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <p className="display text-5xl">Your bag is quiet.</p>
          <p className="text-sm text-muted">Let&apos;s make some noise. Start with the pieces everyone&apos;s wearing.</p>
          <ButtonLink href="/shop" onClick={onClose}>
            Shop new arrivals
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="border-b border-line px-6 py-4">
            <p className="text-sm">
              {remaining > 0 ? (
                <>
                  You&apos;re <strong className="font-medium">{formatPrice(remaining)}</strong> away from free shipping
                </>
              ) : (
                <>You&apos;ve unlocked <strong className="font-medium">free shipping</strong></>
              )}
            </p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-stone">
              <div
                className="h-full rounded-full bg-cobalt transition-[width] duration-500"
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
            {lines.map((line) => (
              <CartRow key={line.sku} line={line} onNavigate={onClose} />
            ))}
          </ul>

          <div className="space-y-4 border-t border-line px-6 py-6">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow text-muted">Subtotal</span>
              <span className="text-lg tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted">Shipping and taxes calculated at checkout. Free 30-day returns.</p>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/cart" variant="outline" onClick={onClose}>
                View bag
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={onClose}>
                Checkout
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}

export function CartRow({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const stock = useStock(line.sku);
  const atMax = line.quantity >= stock;

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.slug}`} onClick={onNavigate} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-stone">
        <Image src={imageUrl(line.image)} alt={line.name} fill sizes="80px" className="object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${line.slug}`} onClick={onNavigate} className="truncate text-sm font-medium hover:underline">
            {line.name}
          </Link>
          <button onClick={() => remove(line.sku)} aria-label={`Remove ${line.name}`} className="-mr-1 -mt-1 rounded-full p-1 text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">
          {line.color} · {line.size === "OS" ? "One size" : `Size ${line.size}`}
        </p>
        {stock === 0 ? (
          <p className="mt-1 text-xs text-signal">Just sold out — remove to continue</p>
        ) : (
          stock <= 4 && <p className="mt-1 text-xs text-signal">Only {stock} left</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center rounded-full border border-line">
            <button
              onClick={() => setQuantity(line.sku, line.quantity - 1)}
              aria-label="Decrease quantity"
              className="p-2 hover:text-cobalt"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
              {line.quantity}
            </span>
            <button
              onClick={() => setQuantity(line.sku, line.quantity + 1)}
              disabled={atMax}
              aria-label="Increase quantity"
              className="p-2 hover:text-cobalt disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <span className="text-sm tabular-nums">{formatPrice(line.price * line.quantity)}</span>
        </div>
      </div>
    </li>
  );
}
