"use client";

import { Check, ChevronDown, Loader2, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { CATEGORY_LABELS, type getFacets, type SortKey } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { SIZE_RUNS } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";
import { activeFilterCount, SORT_LABELS, toSearchString, type ShopQuery } from "@/lib/shop-params";
import type { Category } from "@/lib/types";

type Facets = ReturnType<typeof getFacets>;

const SIZE_ORDER = Object.values(SIZE_RUNS).flat();
const PRICE_STEPS = [100, 150, 250, 400];

function toggle<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

/**
 * Toolbar + filter sheet for a product listing. Filters are applied to the URL
 * immediately; the server re-renders the grid (passed as children), which is
 * dimmed while the transition is pending.
 */
export function ShopFilters({
  query,
  facets,
  total,
  children,
}: {
  query: ShopQuery;
  facets: Facets;
  total: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  const apply = (next: ShopQuery) =>
    startTransition(() => router.replace(`${pathname}${toSearchString(next)}`, { scroll: false }));

  const count = activeFilterCount(query);
  const sizes = [...facets.sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
  const prices = PRICE_STEPS.filter((p) => p < facets.maxPrice);

  const chips: { label: string; next: ShopQuery }[] = [
    ...(query.query ? [{ label: `“${query.query}”`, next: { ...query, query: undefined } }] : []),
    ...(query.categories ?? []).map((c) => ({
      label: CATEGORY_LABELS[c],
      next: { ...query, categories: toggle(query.categories, c) },
    })),
    ...(query.colors ?? []).map((c) => ({ label: c, next: { ...query, colors: toggle(query.colors, c) } })),
    ...(query.sizes ?? []).map((s) => ({ label: `Size ${s}`, next: { ...query, sizes: toggle(query.sizes, s) } })),
    ...(query.maxPrice ? [{ label: `Under ${formatPrice(query.maxPrice)}`, next: { ...query, maxPrice: undefined } }] : []),
    ...(query.onSale ? [{ label: "On sale", next: { ...query, onSale: false } }] : []),
  ];

  const cleared: ShopQuery = { sort: query.sort };

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-y border-line bg-paper/90 px-4 backdrop-blur-md md:-mx-8 md:px-8 xl:-mx-12 xl:px-12">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper"
            >
              <SlidersHorizontal className="size-4" strokeWidth={1.5} />
              Filter
              {count > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] leading-5 text-ink tabular-nums">
                  {count}
                </span>
              )}
            </button>
            <p className="eyebrow hidden text-muted sm:flex sm:items-center sm:gap-2" aria-live="polite">
              {pending && <Loader2 className="size-3.5 animate-spin" />}
              {total} {total === 1 ? "piece" : "pieces"}
            </p>
          </div>

          <label className="relative flex items-center gap-2 text-sm">
            <span className="eyebrow hidden text-muted md:inline">Sort</span>
            <select
              value={query.sort}
              onChange={(e) => apply({ ...query, sort: e.target.value as SortKey })}
              className="appearance-none rounded-full bg-transparent py-2 pl-3 pr-8 hover:bg-ink/5"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 size-4" />
          </label>
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2 pb-3">
            {chips.map((chip) => (
              <li key={chip.label}>
                <button
                  onClick={() => apply(chip.next)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-paper hover:bg-cobalt"
                >
                  {chip.label}
                  <X className="size-3" aria-label="Remove filter" />
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => apply(cleared)} className="px-2 text-xs underline underline-offset-4 hover:text-cobalt">
                Clear all
              </button>
            </li>
          </ul>
        )}
      </div>

      <div className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-50")}>{children}</div>

      <Sheet open={open} onClose={onClose} side="left" label="Filters" title="Filter" className="max-w-md">
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {facets.categories.length > 1 && (
            <FilterGroup title="Category">
              <div className="flex flex-wrap gap-2">
                {facets.categories.map((c: Category) => (
                  <Pill
                    key={c}
                    active={!!query.categories?.includes(c)}
                    onClick={() => apply({ ...query, categories: toggle(query.categories, c) })}
                  >
                    {CATEGORY_LABELS[c]}
                  </Pill>
                ))}
              </div>
            </FilterGroup>
          )}

          <FilterGroup title="Colour">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {facets.colors.map((c) => {
                const active = !!query.colors?.includes(c.name);
                return (
                  <button
                    key={c.name}
                    aria-pressed={active}
                    onClick={() => apply({ ...query, colors: toggle(query.colors, c.name) })}
                    className="flex items-center gap-3 text-left text-sm"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-paper",
                        active && "ring-2 ring-ink",
                      )}
                      style={{ background: c.hex }}
                    >
                      {active && <Check className="size-3.5 mix-blend-difference text-white" strokeWidth={3} />}
                    </span>
                    <span className={cn(active && "font-medium")}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </FilterGroup>

          <FilterGroup title="Size">
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <Pill
                  key={s}
                  square
                  active={!!query.sizes?.includes(s)}
                  onClick={() => apply({ ...query, sizes: toggle(query.sizes, s) })}
                >
                  {s === "OS" ? "One size" : s}
                </Pill>
              ))}
            </div>
          </FilterGroup>

          {prices.length > 0 && (
            <FilterGroup title="Price">
              <div className="flex flex-wrap gap-2">
                {prices.map((p) => (
                  <Pill
                    key={p}
                    active={query.maxPrice === p}
                    onClick={() => apply({ ...query, maxPrice: query.maxPrice === p ? undefined : p })}
                  >
                    Under {formatPrice(p)}
                  </Pill>
                ))}
              </div>
            </FilterGroup>
          )}

          <FilterGroup title="Offers">
            <Pill active={!!query.onSale} onClick={() => apply({ ...query, onSale: !query.onSale })}>
              On sale
            </Pill>
          </FilterGroup>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-line px-6 py-5">
          <Button variant="outline" onClick={() => apply(cleared)} disabled={count === 0}>
            Clear all
          </Button>
          <Button onClick={onClose}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : `Show ${total}`}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4 text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({
  active,
  square,
  onClick,
  children,
}: {
  active: boolean;
  square?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border py-2 text-sm transition-colors",
        square ? "min-w-12 px-3" : "px-4",
        active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}
