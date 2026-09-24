import { looks } from "@/lib/data/looks";
import { products } from "@/lib/data/products";
import type { Category, Collection, Look, Product, Variant } from "@/lib/types";

/**
 * Data access for the storefront. Everything is async even though it reads
 * local mock data, so swapping in a real backend only touches this file.
 */

export const COLLECTIONS: { slug: Collection; label: string; blurb: string }[] = [
  { slug: "girls", label: "Girls", blurb: "Soft tailoring, statement knits and coats built to last." },
  { slug: "boys", label: "Boys", blurb: "Workwear, raw denim and tailoring without the armour." },
  { slug: "unisex", label: "Unisex", blurb: "Essentials cut for everyone. Size by fit, not by label." },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  tees: "Tees",
  knitwear: "Knitwear & Sweats",
  outerwear: "Outerwear",
  shirts: "Shirts",
  tailoring: "Tailoring",
  denim: "Denim",
  trousers: "Trousers & Sets",
  dresses: "Dresses",
  bags: "Bags",
  headwear: "Headwear",
  footwear: "Footwear",
};

/** Who a lookbook chapter is styled for. */
export const LOOK_AUDIENCE: Record<Look["collection"], string> = {
  girls: "Girls",
  boys: "Boys",
  unisex: "Unisex",
  all: "Everyone",
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export type ProductFilters = {
  collection?: Collection;
  categories?: Category[];
  colors?: string[];
  sizes?: string[];
  maxPrice?: number;
  onSale?: boolean;
  query?: string;
  sort?: SortKey;
};

/** Source URL for a photo id; sizing is added by the image loader. */
export function imageUrl(id: string) {
  return `https://images.unsplash.com/${id}`;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const q = filters.query?.trim().toLowerCase();
  const result = products.filter((p) => {
    if (filters.collection && p.collection !== filters.collection) return false;
    if (filters.categories?.length && !filters.categories.includes(p.category)) return false;
    if (filters.colors?.length && !p.colors.some((c) => filters.colors!.includes(c.name))) return false;
    if (filters.sizes?.length && !p.sizes.some((s) => filters.sizes!.includes(s))) return false;
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.onSale && !p.compareAt) return false;
    if (q) {
      const haystack = [p.name, p.tagline, p.category, ...p.tags, ...p.colors.map((c) => c.name)]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  switch (filters.sort) {
    case "newest":
      return result.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    case "price-asc":
      return result.sort((a, b) => a.price - b.price);
    case "price-desc":
      return result.sort((a, b) => b.price - a.price);
    default:
      return result;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  return products.find((p) => p.slug === slug);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
}

export async function getLooks(): Promise<Look[]> {
  return looks;
}

export async function getLook(slug: string): Promise<Look | undefined> {
  return looks.find((l) => l.slug === slug);
}

/** Other pieces styled with this product across all of its looks. */
export async function getCompleteTheLook(product: Product): Promise<{ look?: Look; items: Product[] }> {
  const look = looks.find((l) => product.lookIds.includes(l.id));
  if (!look) return { items: [] };
  const items = await getProductsByIds(look.productIds.filter((id) => id !== product.id));
  return { look, items };
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const score = (p: Product) =>
    (p.category === product.category ? 2 : 0) + (p.collection === product.collection ? 1 : 0);
  return products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

export async function getTryOnProducts(): Promise<Product[]> {
  return products.filter((p) => p.tryOn);
}

/** Facet values present in a product list — used to build the filter bar. */
export function getFacets(list: Product[]) {
  const categories = [...new Set(list.map((p) => p.category))];
  const colors = new Map<string, string>();
  for (const p of list) for (const c of p.colors) colors.set(c.name, c.hex);
  const sizes = [...new Set(list.flatMap((p) => p.sizes))];
  const maxPrice = Math.max(0, ...list.map((p) => p.price));
  return {
    categories,
    colors: [...colors].map(([name, hex]) => ({ name, hex })),
    sizes,
    maxPrice,
  };
}

// Synchronous lookups for client components (cart, wishlist) that only hold ids.

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function findVariant(sku: string): { product: Product; variant: Variant } | undefined {
  for (const product of products) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
}

export function allSlugs() {
  return {
    products: products.map((p) => p.slug),
    looks: looks.map((l) => l.slug),
  };
}
