"use client";

import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { recommendSize } from "@/lib/sizing";
import type { Product } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useFit } from "@/store/fit";
import { useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";

type Choice = { selected: boolean; color: string; size?: string };

/**
 * Shop several pieces at once: pick colour/size per piece (sizes pre-filled
 * from the shopper's fit profile) and add them all to the bag in one go.
 */
export function LookPicker({ items, className }: { items: Product[]; className?: string }) {
  const hydrated = useHydrated();
  const profile = useFit((s) => s.profile);
  const overrides = useStockStore((s) => s.overrides);
  const addMany = useCart((s) => s.addMany);
  const open = useUI((s) => s.open);
  const toast = useUI((s) => s.toast);

  const [picks, setPicks] = useState<Record<string, Choice>>(() =>
    Object.fromEntries(items.map((p) => [p.id, { selected: true, color: p.colors[0].name }])),
  );

  const stockOf = (p: Product, color: string, size: string) => {
    const v = p.variants.find((x) => x.color === color && x.size === size);
    return v ? (overrides[v.sku] ?? v.stock) : 0;
  };

  /** Explicit choice, else the shopper's recommended size, else the first size in stock. */
  const sizeFor = (p: Product) => {
    const pick = picks[p.id];
    if (pick.size) return pick.size;
    const rec = hydrated && profile ? recommendSize(p, profile)?.size : undefined;
    if (rec && stockOf(p, pick.color, rec) > 0) return rec;
    return p.sizes.find((s) => stockOf(p, pick.color, s) > 0);
  };

  const update = (id: string, patch: Partial<Choice>) => setPicks((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const chosen = items
    .filter((p) => picks[p.id].selected)
    .map((p) => ({ product: p, size: sizeFor(p), color: picks[p.id].color }))
    .filter((c): c is { product: Product; size: string; color: string } => !!c.size);
  const total = chosen.reduce((sum, c) => sum + c.product.price, 0);

  const onAdd = () => {
    const skus = chosen.map((c) => c.product.variants.find((v) => v.color === c.color && v.size === c.size)!.sku);
    const added = addMany(skus);
    if (added === skus.length) {
      open("cart");
    } else {
      toast({
        title: `Added ${added} of ${skus.length}`,
        body: "Some pieces sold out or are already maxed in your bag.",
        tone: "alert",
        href: "/cart",
      });
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {items.map((p) => {
          const pick = picks[p.id];
          const size = sizeFor(p);
          const soldOut = !size;
          return (
            <li key={p.id} className={cn("flex gap-4 py-5 transition-opacity", !pick.selected && "opacity-50")}>
              <button
                role="checkbox"
                aria-checked={pick.selected}
                aria-label={`Include ${p.name}`}
                onClick={() => update(p.id, { selected: !pick.selected })}
                className={cn(
                  "mt-1 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  pick.selected ? "border-ink bg-ink text-lime" : "border-ink/30",
                )}
              >
                {pick.selected && <Check className="size-3.5" strokeWidth={3} />}
              </button>
              <Link href={`/product/${p.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-stone">
                <Image src={imageUrl(p.images[0])} alt={p.name} fill sizes="80px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/product/${p.slug}`} className="text-sm font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-sm tabular-nums">{formatPrice(p.price)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Select
                    label={`${p.name} colour`}
                    value={pick.color}
                    onChange={(color) => update(p.id, { color, size: undefined })}
                    options={p.colors.map((c) => ({ value: c.name, label: c.name }))}
                  />
                  {p.sizes.length > 1 && (
                    <Select
                      label={`${p.name} size`}
                      value={size ?? ""}
                      onChange={(s) => update(p.id, { size: s })}
                      options={[
                        ...(soldOut ? [{ value: "", label: "Sold out" }] : []),
                        ...p.sizes.map((s) => {
                          const n = stockOf(p, pick.color, s);
                          return { value: s, label: n === 0 ? `${s} — sold out` : s, disabled: n === 0 };
                        }),
                      ]}
                    />
                  )}
                </div>
                {hydrated && profile && !pick.size && size && recommendSize(p, profile)?.size === size && (
                  <p className="mt-2 text-xs text-muted">Pre-selected from your size profile</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {chosen.length} {chosen.length === 1 ? "piece" : "pieces"} ·{" "}
          <span className="text-ink tabular-nums">{formatPrice(total)}</span>
        </p>
        <Button size="lg" onClick={onAdd} disabled={chosen.length === 0}>
          Add {chosen.length > 1 ? `all ${chosen.length}` : chosen.length === 1 ? "1 piece" : ""} to bag
        </Button>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-ink/20 bg-paper pl-3.5 pr-8 text-xs hover:border-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2" />
    </span>
  );
}
