"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Bell, BellRing, Eye, Ruler } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getSizeChart, recommendSize } from "@/lib/sizing";
import type { Product } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useFit } from "@/store/fit";
import { LOW_STOCK_THRESHOLD, useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";
import { SizeGuide } from "./size-guide";
import { WishlistButton } from "./wishlist-button";

/** Colour + size selection, live stock and add-to-bag for the product page. */
export function BuyBox({ product }: { product: Product }) {
  const oneSize = product.sizes.length === 1;
  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState<string | undefined>(oneSize ? product.sizes[0] : undefined);
  const [error, setError] = useState<string>();
  const [guideOpen, setGuideOpen] = useState(false);
  const closeGuide = useCallback(() => setGuideOpen(false), []);
  const shake = useAnimationControls();

  const hydrated = useHydrated();
  const overrides = useStockStore((s) => s.overrides);
  const add = useCart((s) => s.add);
  const open = useUI((s) => s.open);
  const toast = useUI((s) => s.toast);
  const profile = useFit((s) => s.profile);
  const alerts = useWishlist((s) => s.alerts);
  const subscribe = useWishlist((s) => s.subscribe);
  const unsubscribe = useWishlist((s) => s.unsubscribe);

  // Point the stock simulation at this product while it's on screen.
  useEffect(() => {
    const { setFocus } = useStockStore.getState();
    setFocus(product.variants.map((v) => v.sku));
    return () => setFocus([]);
  }, [product]);

  const variantFor = (s: string) => product.variants.find((v) => v.color === color && v.size === s);
  const stockFor = (s: string) => {
    const v = variantFor(s);
    return v ? (overrides[v.sku] ?? v.stock) : 0;
  };

  const variant = size ? variantFor(size) : undefined;
  const stock = size ? stockFor(size) : undefined;
  const colorSoldOut = product.sizes.every((s) => stockFor(s) === 0);
  const hasGuide = !!getSizeChart(product);
  const yourSize = hydrated && profile ? recommendSize(product, profile)?.size : undefined;
  const watching = hydrated && !!variant && alerts.includes(variant.sku);

  const selectSize = (s: string) => {
    setSize(s);
    setError(undefined);
  };

  const onAdd = () => {
    if (!variant) {
      setError("Choose a size first");
      shake.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } });
      return;
    }
    const result = add(variant.sku);
    if (result.ok) {
      open("cart");
    } else if (result.reason === "limit") {
      toast({ title: `Only ${result.available} available`, body: "They're all in your bag already.", tone: "alert" });
    } else {
      toast({ title: "Just sold out", body: `${product.name} in ${color}, ${size}.`, tone: "alert" });
    }
  };

  const onNotify = () => {
    if (!variant) return;
    if (watching) {
      unsubscribe(variant.sku);
      return;
    }
    subscribe(variant.sku);
    toast({
      title: "We'll let you know",
      body: `You'll get an alert when ${color}${oneSize ? "" : `, ${size}`} is back.`,
      href: "/wishlist",
    });
  };

  return (
    <div className="space-y-7">
      <LiveStrip productId={product.id} />

      <fieldset>
        <legend className="eyebrow text-muted">
          Colour — <span className="text-ink">{color}</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {product.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={c.name === color}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColor(c.name)}
              className={cn(
                "size-9 rounded-full ring-1 ring-ink/15 ring-offset-[3px] ring-offset-paper transition-shadow",
                c.name === color ? "ring-2 ring-ink" : "hover:ring-ink/50",
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </fieldset>

      {!oneSize && (
        <fieldset>
          <legend className="sr-only">Size</legend>
          <div className="flex items-baseline justify-between">
            <p aria-hidden className="eyebrow text-muted">
              Size{size && <> — <span className="text-ink">{size}</span></>}
            </p>
            {hasGuide && (
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs underline decoration-lime decoration-2 underline-offset-4 hover:text-cobalt"
              >
                <Ruler className="size-3.5" strokeWidth={1.5} />
                {yourSize ? `Your size: ${yourSize}` : "Find my size"}
              </button>
            )}
          </div>
          <motion.div animate={shake} className="mt-3 grid grid-cols-5 gap-2">
            {product.sizes.map((s) => {
              const n = stockFor(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === size}
                  aria-label={`${s}${n === 0 ? ", sold out" : ""}${s === yourSize ? ", recommended for you" : ""}`}
                  onClick={() => selectSize(s)}
                  className={cn(
                    "relative h-12 rounded-full border text-sm transition-colors",
                    s === size ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                    n === 0 && "text-muted line-through decoration-1",
                    n === 0 && s === size && "bg-stone text-muted",
                  )}
                >
                  {s}
                  {n > 0 && n <= LOW_STOCK_THRESHOLD && (
                    <span aria-hidden className="absolute right-2 top-2 size-1.5 rounded-full bg-signal" />
                  )}
                  {s === yourSize && (
                    <span
                      aria-hidden
                      className="eyebrow absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-lime px-1.5 py-0.5 !text-[8px] leading-none text-ink no-underline"
                    >
                      You
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        </fieldset>
      )}

      <div className="min-h-5 text-sm" aria-live="polite">
        {error ? (
          <span className="text-signal">{error}</span>
        ) : stock === 0 ? (
          <span className="text-muted">Sold out in {oneSize ? color : `${color}, ${size}`} — get an alert when it&apos;s back.</span>
        ) : stock !== undefined && stock <= LOW_STOCK_THRESHOLD ? (
          <span className="inline-flex items-center gap-1 text-signal">
            Only
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.strong
                key={stock}
                initial={{ y: -10, opacity: 0, scale: 1.4 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 10, opacity: 0 }}
                className="inline-block font-medium tabular-nums"
              >
                {stock}
              </motion.strong>
            </AnimatePresence>
            left in {oneSize ? color : size} — order soon.
          </span>
        ) : stock !== undefined ? (
          <span className="text-muted">In stock. Ships in 1–2 working days.</span>
        ) : colorSoldOut ? (
          <span className="text-muted">{color} is sold out in every size.</span>
        ) : (
          <span className="text-muted">
            <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-full bg-signal align-middle" />
            Low stock
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {stock === 0 ? (
          <Button size="lg" variant={watching ? "outline" : "primary"} className="flex-1" onClick={onNotify}>
            {watching ? (
              <>
                <BellRing className="size-4" /> Alert set — tap to cancel
              </>
            ) : (
              <>
                <Bell className="size-4" /> Notify me when it&apos;s back
              </>
            )}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={onAdd}>
            Add to bag
          </Button>
        )}
        <WishlistButton productId={product.id} name={product.name} variant="outline" />
      </div>

      {hasGuide && (
        <SizeGuide product={product} open={guideOpen} onClose={closeGuide} onSelect={selectSize} />
      )}
    </div>
  );
}

/** Deterministic starting point so server and client render the same count. */
function seedViewers(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 6 + (h % 19);
}

function LiveStrip({ productId }: { productId: string }) {
  const [viewers, setViewers] = useState(() => seedViewers(productId));

  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => Math.max(3, v + Math.round((Math.random() - 0.45) * 4)));
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-[#8fbf00]" />
      </span>
      <span className="eyebrow text-ink">Live stock</span>
      <span aria-hidden>·</span>
      <Eye className="size-3.5" strokeWidth={1.5} />
      <span className="tabular-nums">{viewers} people viewing now</span>
    </p>
  );
}
