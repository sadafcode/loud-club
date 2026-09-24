"use client";

import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { findVariant, imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { REASONS, sizeLabel, suggestedSize } from "@/lib/returns";
import type { OrderLine, Product, ReturnReason, ReturnResolution } from "@/lib/types";
import { useStockStore } from "@/store/stock";

export type LinePick = {
  quantity: number;
  reason?: ReturnReason;
  resolution: ReturnResolution;
  exchangeSku?: string;
};

/** Live stock for every variant of a product, re-rendering as the simulation ticks. */
function useVariantStock(product: Product | undefined) {
  const overrides = useStockStore((s) => s.overrides);
  return (sku: string) => overrides[sku] ?? product?.variants.find((v) => v.sku === sku)?.stock ?? 0;
}

/** The exchange target to preselect: the suggested size in the same colour, if it's in stock. */
function defaultExchange(product: Product, sku: string, reason: ReturnReason | undefined, stock: (sku: string) => number) {
  const current = product.variants.find((v) => v.sku === sku);
  if (!current) return undefined;
  const size = reason ? suggestedSize(product, current.size, reason) : current.size;
  const target = product.variants.find((v) => v.color === current.color && v.size === size);
  return target && target.sku !== sku && stock(target.sku) > 0 ? target.sku : undefined;
}

export function ReturnLinePicker({
  line,
  remaining,
  unitRefund,
  pick,
  onChange,
}: {
  line: OrderLine;
  remaining: number;
  unitRefund: number;
  pick?: LinePick;
  onChange: (pick: LinePick | undefined) => void;
}) {
  const found = findVariant(line.sku);
  const product = found?.product;
  const stock = useVariantStock(product);
  if (!found || !product) return null;
  const { variant } = found;

  const canExchange = product.variants.length > 1;
  const selected = !!pick;
  const exchangeTarget = pick?.exchangeSku ? product.variants.find((v) => v.sku === pick.exchangeSku) : undefined;
  const exchangeColor = exchangeTarget?.color ?? variant.color;

  const update = (patch: Partial<LinePick>) => pick && onChange({ ...pick, ...patch });

  const setReason = (reason: ReturnReason) =>
    update({
      reason,
      exchangeSku: pick?.resolution === "exchange" ? defaultExchange(product, line.sku, reason, stock) : undefined,
    });

  const setResolution = (resolution: ReturnResolution) =>
    update({
      resolution,
      exchangeSku: resolution === "exchange" ? defaultExchange(product, line.sku, pick?.reason, stock) : undefined,
    });

  const pickColor = (color: string) => {
    const sameSize = product.variants.find((v) => v.color === color && v.size === (exchangeTarget?.size ?? variant.size));
    update({ exchangeSku: sameSize && sameSize.sku !== line.sku && stock(sameSize.sku) > 0 ? sameSize.sku : undefined });
  };

  const exhausted = remaining === 0;

  return (
    <li className={cn("rounded-3xl border p-5 transition-colors md:p-6", selected ? "border-ink" : "border-line")}>
      <label className={cn("flex items-center gap-4", exhausted ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
        <input
          type="checkbox"
          checked={selected}
          disabled={exhausted}
          onChange={(e) => onChange(e.target.checked ? { quantity: 1, resolution: "refund" } : undefined)}
          className="size-5 shrink-0 accent-cobalt"
        />
        <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-stone">
          <Image src={imageUrl(product.images[0])} alt={product.name} fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <p className="text-xs text-muted">
            {variant.color} · {sizeLabel(variant.size)} · Qty {line.quantity}
          </p>
          {exhausted && <p className="mt-1 text-xs text-cobalt">Already being returned</p>}
          {!exhausted && remaining < line.quantity && (
            <p className="mt-1 text-xs text-muted">{remaining} left to return</p>
          )}
        </div>
        <span className="text-sm tabular-nums">{formatPrice(line.price * line.quantity)}</span>
      </label>

      {pick && (
        <div className="mt-6 grid gap-5 border-t border-line pt-6 md:grid-cols-2">
          <label className="block">
            <span className="eyebrow mb-2 block text-muted">Why is it coming back?</span>
            <select
              value={pick.reason ?? ""}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              aria-invalid={!pick.reason}
              className="h-12 w-full rounded-xl border border-line bg-transparent px-4 text-sm outline-none focus:border-ink"
            >
              <option value="" disabled>
                Choose a reason
              </option>
              {(Object.keys(REASONS) as ReturnReason[]).map((r) => (
                <option key={r} value={r}>
                  {REASONS[r]}
                </option>
              ))}
            </select>
          </label>

          {remaining > 1 && (
            <div>
              <span className="eyebrow mb-2 block text-muted">Quantity</span>
              <div className="inline-flex h-12 items-center rounded-full border border-line">
                <button
                  type="button"
                  aria-label="Fewer"
                  onClick={() => update({ quantity: Math.max(1, pick.quantity - 1) })}
                  disabled={pick.quantity <= 1}
                  className="grid size-12 place-items-center disabled:opacity-30"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm tabular-nums">{pick.quantity}</span>
                <button
                  type="button"
                  aria-label="More"
                  onClick={() => update({ quantity: Math.min(remaining, pick.quantity + 1) })}
                  disabled={pick.quantity >= remaining}
                  className="grid size-12 place-items-center disabled:opacity-30"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <span className="eyebrow mb-2 block text-muted">What would you like?</span>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Resolution">
              {(["refund", "exchange"] as const).map((r) => {
                const active = pick.resolution === r;
                const disabled = r === "exchange" && !canExchange;
                return (
                  <label
                    key={r}
                    className={cn(
                      "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-colors",
                      active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                      disabled && "pointer-events-none opacity-40",
                    )}
                  >
                    <input
                      type="radio"
                      name={`resolution-${line.sku}`}
                      checked={active}
                      disabled={disabled}
                      onChange={() => setResolution(r)}
                      className="sr-only"
                    />
                    <span>
                      <span className="block text-sm font-medium">{r === "refund" ? "Refund" : "Exchange"}</span>
                      <span className={cn("mt-1 block text-xs", active ? "text-paper/70" : "text-muted")}>
                        {r === "refund"
                          ? "Back to your original card"
                          : canExchange
                            ? "Another size or colour, shipped free"
                            : "No other sizes or colours"}
                      </span>
                    </span>
                    {r === "refund" && (
                      <span className={cn("text-sm tabular-nums", active && "text-lime")}>
                        {formatPrice(unitRefund * pick.quantity)}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {pick.resolution === "exchange" && (
            <div className="space-y-5 rounded-2xl bg-concrete p-5 md:col-span-2">
              {product.colors.length > 1 && (
                <div>
                  <span className="eyebrow mb-3 block text-muted">Colour · {exchangeColor}</span>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => pickColor(c.name)}
                        aria-label={c.name}
                        aria-pressed={c.name === exchangeColor}
                        className={cn(
                          "size-9 rounded-full border-2 p-0.5 transition-colors",
                          c.name === exchangeColor ? "border-ink" : "border-transparent hover:border-ink/30",
                        )}
                      >
                        <span className="block size-full rounded-full border border-ink/10" style={{ background: c.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="eyebrow mb-3 block text-muted">Size</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants
                    .filter((v) => v.color === exchangeColor)
                    .map((v) => {
                      const left = stock(v.sku);
                      const isCurrent = v.sku === line.sku;
                      const suggested =
                        pick.reason &&
                        v.color === variant.color &&
                        v.size !== variant.size &&
                        v.size === suggestedSize(product, variant.size, pick.reason);
                      return (
                        <button
                          key={v.sku}
                          type="button"
                          disabled={isCurrent || left === 0}
                          onClick={() => update({ exchangeSku: v.sku })}
                          aria-pressed={pick.exchangeSku === v.sku}
                          className={cn(
                            "relative h-11 min-w-14 rounded-full border px-4 text-sm transition-colors",
                            pick.exchangeSku === v.sku ? "border-ink bg-ink text-paper" : "border-ink/20 bg-paper hover:border-ink",
                            (isCurrent || left === 0) && "text-muted line-through decoration-1 hover:border-ink/20",
                          )}
                        >
                          {sizeLabel(v.size)}
                          {suggested && left > 0 && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-lime px-1.5 text-[9px] leading-4 text-ink no-underline">
                              Suggested
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
                <p className="mt-3 text-xs text-muted">
                  {exchangeTarget
                    ? stock(exchangeTarget.sku) <= 4
                      ? `Only ${stock(exchangeTarget.sku)} left — we'll hold one for you when you submit.`
                      : "In stock. Even swap — no charge."
                    : "Pick a size that's in stock."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
