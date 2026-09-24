"use client";

import { BellRing, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { findProduct, findVariant, imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useStock, useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

export function WishlistView() {
  const hydrated = useHydrated();
  const productIds = useWishlist((s) => s.productIds);
  const alerts = useWishlist((s) => s.alerts);

  if (!hydrated) return <div className="gutter min-h-[60vh]" aria-busy="true" />;

  const saved = productIds.map(findProduct).filter((p): p is Product => !!p);

  if (saved.length === 0 && alerts.length === 0) {
    return (
      <div className="gutter flex min-h-[60vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <p className="eyebrow text-muted">Wishlist</p>
        <h1 className="display text-6xl md:text-8xl">Nothing saved yet.</h1>
        <p className="max-w-sm text-muted">
          Tap the heart on anything you love. Sold out in your size? Set an alert and we&apos;ll ping you the moment
          it&apos;s back.
        </p>
        <ButtonLink href="/shop" size="lg">
          Start browsing
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="gutter pt-10 pb-24 md:pt-14">
      <header className="flex items-end justify-between border-b border-ink pb-6">
        <h1 className="display text-6xl md:text-8xl">Wishlist</h1>
        <p className="eyebrow text-muted">
          {saved.length} saved · {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </p>
      </header>

      {alerts.length > 0 && (
        <section className="mt-10 rounded-3xl bg-ink p-6 text-paper md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display flex items-center gap-3 text-3xl md:text-4xl">
              <BellRing className="size-6 text-lime" strokeWidth={1.5} /> Back-in-stock alerts
            </h2>
            <p className="text-xs text-paper/60">Simulated restocks — usually land within a minute or two.</p>
          </div>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {alerts.map((sku) => (
              <AlertRow key={sku} sku={sku} />
            ))}
          </ul>
        </section>
      )}

      {saved.length > 0 && (
        <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-12 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
          {saved.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} swatches={false} />
              <QuickAdd product={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertRow({ sku }: { sku: string }) {
  const found = findVariant(sku);
  const stock = useStock(sku);
  const unsubscribe = useWishlist((s) => s.unsubscribe);
  if (!found) return null;
  const { product, variant } = found;

  return (
    <li className="flex items-center gap-4 rounded-2xl bg-paper/5 p-3">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden bg-paper/10">
        <Image src={imageUrl(product.images[0])} alt={product.name} fill sizes="48px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{product.name}</p>
        <p className="text-xs text-paper/60">
          {variant.color}
          {variant.size !== "OS" && ` · ${variant.size}`}
        </p>
      </div>
      <span className={cn("eyebrow flex items-center gap-1.5 !text-[10px]", stock > 0 ? "text-lime" : "text-paper/60")}>
        <span className={cn("size-1.5 rounded-full", stock > 0 ? "bg-lime" : "animate-pulse bg-signal")} />
        {stock > 0 ? "Back" : "Waiting"}
      </span>
      <button
        onClick={() => unsubscribe(sku)}
        aria-label={`Cancel alert for ${product.name}`}
        className="rounded-full p-1.5 text-paper/60 hover:bg-paper/10 hover:text-paper"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

/** Colour + size chips under a saved piece; picking a size adds it straight to the bag. */
function QuickAdd({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0].name);
  const overrides = useStockStore((s) => s.overrides);
  const add = useCart((s) => s.add);
  const toggle = useWishlist((s) => s.toggle);
  const subscribe = useWishlist((s) => s.subscribe);
  const alerts = useWishlist((s) => s.alerts);
  const toast = useUI((s) => s.toast);

  const onPick = (size: string) => {
    const variant = product.variants.find((v) => v.color === color && v.size === size)!;
    const stock = overrides[variant.sku] ?? variant.stock;
    if (stock === 0) {
      if (!alerts.includes(variant.sku)) {
        subscribe(variant.sku);
        toast({ title: "Alert set", body: `${product.name} — ${color}, ${size}` });
      }
      return;
    }
    const result = add(variant.sku);
    toast(
      result.ok
        ? { title: "Added to bag", body: `${product.name} — ${color}${size === "OS" ? "" : `, ${size}`}`, href: "/cart", tone: "success" }
        : { title: "Couldn't add", body: "No more available in that size.", tone: "alert" },
    );
  };

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      {product.colors.length > 1 && (
        <div className="flex gap-1.5">
          {product.colors.map((c) => (
            <button
              key={c.name}
              aria-label={c.name}
              aria-pressed={c.name === color}
              onClick={() => setColor(c.name)}
              className={cn(
                "size-5 rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-paper",
                c.name === color && "ring-2 ring-ink",
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {product.sizes.map((s) => {
          const v = product.variants.find((x) => x.color === color && x.size === s)!;
          const n = overrides[v.sku] ?? v.stock;
          const watching = alerts.includes(v.sku);
          return (
            <button
              key={s}
              onClick={() => onPick(s)}
              title={n === 0 ? (watching ? "Alert set" : "Sold out — tap for an alert") : `Add ${s} to bag`}
              className={cn(
                "h-8 min-w-10 rounded-full border px-2.5 text-xs transition-colors",
                n === 0
                  ? watching
                    ? "border-lime bg-lime/30 text-muted"
                    : "border-line text-muted line-through"
                  : "border-line hover:border-ink hover:bg-ink hover:text-paper",
              )}
            >
              {s === "OS" ? "Add to bag" : s}
            </button>
          );
        })}
      </div>
      <button onClick={() => toggle(product.id)} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
        Remove
      </button>
    </div>
  );
}
