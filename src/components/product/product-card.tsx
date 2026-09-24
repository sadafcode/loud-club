import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { imageUrl } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { WishlistButton } from "./wishlist-button";

const MAX_SWATCHES = 4;

export function ProductCard({
  product,
  sizes,
  preload,
  swatches = true,
}: {
  product: Product;
  sizes?: string;
  preload?: boolean;
  swatches?: boolean;
}) {
  const [hero, alt] = product.images;
  const soldOut = product.variants.every((v) => v.stock === 0);
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone">
          <Image
            src={imageUrl(hero)}
            alt={product.name}
            fill
            preload={preload}
            sizes={sizes ?? "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"}
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          />
          {alt && (
            <Image
              src={imageUrl(alt)}
              alt=""
              fill
              sizes={sizes ?? "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut ? (
              <Badge tone="sold-out">Sold out</Badge>
            ) : (
              <>
                {product.isNew && <Badge tone="new">New</Badge>}
                {off > 0 && <Badge tone="sale">−{off}%</Badge>}
              </>
            )}
          </div>
          {product.tryOn && (
            <Badge
              tone="cobalt"
              className="absolute bottom-3 left-3 opacity-0 transition-opacity group-hover:opacity-100"
            >
              Try-on ready
            </Badge>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">{product.name}</h3>
            <p className="mt-0.5 truncate text-xs text-muted">{product.tagline}</p>
          </div>
          <Price
            value={product.price}
            compareAt={product.compareAt}
            className="shrink-0 flex-col items-end gap-0 text-sm sm:flex-row sm:items-baseline sm:gap-2"
          />
        </div>
        {swatches && (
          <ul className="mt-2 flex items-center gap-1.5" aria-label={`${product.colors.length} colours`}>
            {product.colors.slice(0, MAX_SWATCHES).map((c) => (
              <li
                key={c.name}
                title={c.name}
                className="size-3 rounded-full ring-1 ring-ink/15"
                style={{ background: c.hex }}
              />
            ))}
            {product.colors.length > MAX_SWATCHES && (
              <li className="text-[11px] text-muted">+{product.colors.length - MAX_SWATCHES}</li>
            )}
          </ul>
        )}
      </Link>
      <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3" />
    </article>
  );
}

export function ProductGrid({ products, preloadFirst = 0 }: { products: Product[]; preloadFirst?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} preload={i < preloadFirst} />
        </li>
      ))}
    </ul>
  );
}
