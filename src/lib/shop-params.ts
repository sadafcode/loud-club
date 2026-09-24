import type { ProductFilters, SortKey } from "@/lib/catalog";
import type { Category } from "@/lib/types";

/**
 * Shop filters live in the URL so every filtered view is shareable and
 * survives refresh. Multi-value params are comma-separated:
 * `/shop/girls?category=knitwear,outerwear&size=S&sort=price-asc`.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

const SORTS: SortKey[] = ["featured", "newest", "price-asc", "price-desc"];

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "New arrivals",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export type ShopQuery = Omit<ProductFilters, "collection">;

export function parseShopParams(params: SearchParams): ShopQuery {
  const sort = first(params.sort) as SortKey | undefined;
  const max = Number(first(params.max));
  return {
    categories: list(params.category) as Category[],
    colors: list(params.color),
    sizes: list(params.size),
    maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
    onSale: first(params.sale) === "1",
    query: first(params.q)?.trim() || undefined,
    sort: sort && SORTS.includes(sort) ? sort : "featured",
  };
}

export function toSearchString(q: ShopQuery): string {
  const params = new URLSearchParams();
  if (q.categories?.length) params.set("category", q.categories.join(","));
  if (q.colors?.length) params.set("color", q.colors.join(","));
  if (q.sizes?.length) params.set("size", q.sizes.join(","));
  if (q.maxPrice) params.set("max", String(q.maxPrice));
  if (q.onSale) params.set("sale", "1");
  if (q.query) params.set("q", q.query);
  if (q.sort && q.sort !== "featured") params.set("sort", q.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Number of active refinements (search and sort don't count). */
export function activeFilterCount(q: ShopQuery) {
  return (
    (q.categories?.length ?? 0) +
    (q.colors?.length ?? 0) +
    (q.sizes?.length ?? 0) +
    (q.maxPrice ? 1 : 0) +
    (q.onSale ? 1 : 0)
  );
}
