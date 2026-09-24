import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BuyBox } from "@/components/product/buy-box";
import { CompleteTheLook } from "@/components/product/complete-the-look";
import { ProductGrid } from "@/components/product/product-card";
import { StyleZoom } from "@/components/product/style-zoom";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import {
  allSlugs,
  CATEGORY_LABELS,
  COLLECTIONS,
  getCompleteTheLook,
  getProduct,
  getRelated,
  imageUrl,
} from "@/lib/catalog";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { FIT_LABELS } from "@/lib/sizing";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSlugs().products.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.tagline} ${product.description}`,
    openGraph: { images: [imageUrl(product.images[0])] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const [related, completeTheLook] = await Promise.all([getRelated(product, 4), getCompleteTheLook(product)]);
  const collection = COLLECTIONS.find((c) => c.slug === product.collection)!;
  const off = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  return (
    <>
      <div className="gutter pt-6 md:pt-8">
        <nav aria-label="Breadcrumb" className="eyebrow flex flex-wrap items-center gap-2 text-muted">
          <Link href="/shop" className="hover:text-ink">
            Shop
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/shop/${collection.slug}`} className="hover:text-ink">
            {collection.label}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/shop/${collection.slug}?category=${product.category}`} className="hover:text-ink">
            {CATEGORY_LABELS[product.category]}
          </Link>
        </nav>
      </div>

      <div className="gutter grid gap-8 pt-6 pb-20 lg:grid-cols-12 lg:gap-12 lg:pb-28">
        {/* StyleZoom gallery: swipeable strip on mobile, editorial grid on desktop */}
        <div className="lg:col-span-7">
          <StyleZoom name={product.name} images={product.images} />
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-1.5">
              {product.isNew && <Badge tone="new">New in</Badge>}
              {off > 0 && <Badge tone="sale">−{off}%</Badge>}
              {product.tryOn && (
                <Link href={`/try-on?product=${product.id}`} className="rounded-full hover:opacity-80">
                  <Badge tone="cobalt">Try it on →</Badge>
                </Link>
              )}
            </div>
            <h1 className="display mt-4 text-5xl md:text-6xl">{product.name}</h1>
            <p className="mt-3 text-muted">{product.tagline}</p>
            <Price value={product.price} compareAt={product.compareAt} className="mt-5 text-xl" />
            <p className="mt-1 text-xs text-muted">Taxes calculated at checkout. Free shipping over {formatPrice(FREE_SHIPPING_THRESHOLD)}.</p>

            <div className="mt-8 border-t border-line pt-8">
              <BuyBox product={product} />
            </div>

            <div className="mt-10 divide-y divide-line border-y border-line">
              <Detail title="Description" open>
                <p>{product.description}</p>
              </Detail>
              <Detail title="Fit & materials">
                <p>{FIT_LABELS[product.fit]}.</p>
                <p className="mt-2">{product.materials}</p>
              </Detail>
              <Detail title="Care">
                <ul className="list-inside list-disc space-y-1">
                  {product.care.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </Detail>
              <Detail title="Delivery & returns">
                <p>
                  Free standard delivery on orders over {formatPrice(FREE_SHIPPING_THRESHOLD)}, express next-day available at
                  checkout.
                </p>
                <p className="mt-2">
                  Free 30-day returns and exchanges through our{" "}
                  <Link href="/returns" className="underline underline-offset-4 hover:text-cobalt">
                    returns portal
                  </Link>
                  .
                </p>
              </Detail>
            </div>
          </div>
        </div>
      </div>

      {completeTheLook.look && completeTheLook.items.length > 0 && (
        <CompleteTheLook look={completeTheLook.look} items={completeTheLook.items} />
      )}

      <section className="gutter py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="display text-4xl md:text-6xl">You may also like</h2>
          <Link href={`/shop/${collection.slug}`} className="eyebrow hidden hover:text-cobalt sm:block">
            More {collection.label.toLowerCase()} →
          </Link>
        </div>
        <ProductGrid products={related} />
      </section>
    </>
  );
}

function Detail({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <Plus className="size-4 transition-transform duration-300 group-open:rotate-45" strokeWidth={1.5} />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}
