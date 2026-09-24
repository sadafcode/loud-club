import Link from "next/link";
import { ProductGrid } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { CATEGORY_LABELS, COLLECTIONS, getFacets, getProducts } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { toSearchString, type ShopQuery } from "@/lib/shop-params";
import type { Collection } from "@/lib/types";
import { ShopFilters } from "./shop-filters";

/** Product listing shared by /shop and /shop/[collection]. */
export async function ShopView({ collection, query }: { collection?: Collection; query: ShopQuery }) {
  const meta = COLLECTIONS.find((c) => c.slug === collection);
  const basePath = collection ? `/shop/${collection}` : "/shop";

  // Facets come from the whole collection so options don't vanish as you filter.
  const [all, results] = await Promise.all([
    getProducts({ collection }),
    getProducts({ ...query, collection }),
  ]);
  const facets = getFacets(all);

  const title = query.query
    ? `“${query.query}”`
    : query.onSale && !meta
      ? "Sale"
      : (meta?.label ?? "Everything");
  const blurb = query.query
    ? `${results.length} ${results.length === 1 ? "result" : "results"} across the collection.`
    : (meta?.blurb ?? "Every piece from every collection — girls, boys and unisex.");

  const activeCategory = query.categories?.length === 1 ? query.categories[0] : undefined;
  const categoryHref = (c?: (typeof facets.categories)[number]) =>
    `${basePath}${toSearchString({ ...query, categories: c ? [c] : [] })}`;

  return (
    <div className="gutter pb-24">
      <header className="grid gap-6 pt-10 pb-8 md:grid-cols-12 md:items-end md:pt-14 md:pb-10">
        <div className="md:col-span-8">
          <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-muted">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span aria-hidden>/</span>
            {meta ? (
              <>
                <Link href="/shop" className="hover:text-ink">
                  Shop
                </Link>
                <span aria-hidden>/</span>
                <span className="text-ink">{meta.label}</span>
              </>
            ) : (
              <span className="text-ink">Shop</span>
            )}
          </nav>
          <h1 className="display mt-5 text-[clamp(3.5rem,9vw,8rem)]">{title}</h1>
        </div>
        <p className="max-w-sm text-sm text-muted md:col-span-4 md:justify-self-end">{blurb}</p>
      </header>

      {!collection && !query.query && (
        <ul className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {COLLECTIONS.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link href={`/shop/${c.slug}`} className="display block rounded-full border border-line px-5 py-1.5 text-2xl hover:border-ink">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {facets.categories.length > 1 && (
        <ul className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <li className="shrink-0">
            <CategoryTab href={categoryHref()} active={!query.categories?.length}>
              All
            </CategoryTab>
          </li>
          {facets.categories.map((c) => (
            <li key={c} className="shrink-0">
              <CategoryTab href={categoryHref(c)} active={activeCategory === c}>
                {CATEGORY_LABELS[c]}
              </CategoryTab>
            </li>
          ))}
        </ul>
      )}

      <ShopFilters query={query} facets={facets} total={results.length}>
        <div className="pt-8">
          {results.length > 0 ? (
            <ProductGrid products={results} preloadFirst={4} />
          ) : (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
              <p className="display text-5xl md:text-6xl">Nothing here. Yet.</p>
              <p className="max-w-sm text-sm text-muted">
                No pieces match those filters. Loosen things up, or start from the full collection.
              </p>
              <ButtonLink href={basePath} variant="outline">
                Clear filters
              </ButtonLink>
            </div>
          )}
        </div>
      </ShopFilters>
    </div>
  );
}

function CategoryTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-full px-4 py-2 text-sm transition-colors",
        active ? "bg-ink text-paper" : "bg-concrete hover:bg-stone",
      )}
    >
      {children}
    </Link>
  );
}
