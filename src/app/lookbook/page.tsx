import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getLooks, getProductsByIds, imageUrl, LOOK_AUDIENCE } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Autumn / Winter 26 in seven chapters. Every piece in every look is shoppable.",
};

const MAX_THUMBS = 4;

export default async function LookbookPage() {
  const looks = await getLooks();
  const chapters = await Promise.all(
    looks.map(async (look) => {
      const items = await getProductsByIds(look.productIds);
      return { look, items, total: items.reduce((sum, p) => sum + p.price, 0) };
    }),
  );

  return (
    <>
      {/* Masthead */}
      <section className="gutter grid gap-12 pt-12 pb-16 md:pt-20 md:pb-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow text-muted">The Lookbook — Autumn / Winter 26</p>
          <h1 className="display mt-6 text-[clamp(3.5rem,9vw,8.5rem)]">
            Seven chapters. <em className="text-cobalt">Every piece</em> shoppable.
          </h1>
          <p className="mt-8 max-w-lg text-muted">
            Stories told in outfits, shot on the street and in the studio. Open any frame in StyleZoom to see the weave up
            close, then shop the whole look in your sizes at once.
          </p>
        </div>

        <nav aria-label="Chapters" className="self-end lg:col-span-4 lg:col-start-9">
          <p className="eyebrow border-b border-ink pb-3">Contents</p>
          <ol>
            {looks.map((look, i) => (
              <li key={look.id} className="border-b border-line">
                <a href={`#${look.slug}`} className="group flex items-baseline gap-4 py-3 hover:text-cobalt">
                  <span className="eyebrow w-6 text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display flex-1 text-2xl">{look.title}</span>
                  <span className="eyebrow text-muted">{LOOK_AUDIENCE[look.collection]}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      {/* Chapters */}
      <div className="border-t border-ink">
        {chapters.map(({ look, items, total }, i) => {
          const flip = i % 2 === 1;
          const inset = look.gallery[0];
          return (
            <section
              key={look.id}
              id={look.slug}
              aria-labelledby={`${look.slug}-title`}
              className="scroll-mt-20 border-b border-line py-16 md:py-24"
            >
              <div className="gutter grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
                <Link
                  href={`/lookbook/${look.slug}`}
                  className={cn("group relative block lg:col-span-7", flip && "lg:order-2 lg:col-start-6")}
                  tabIndex={-1}
                  aria-hidden
                >
                  <div className={cn("relative aspect-[4/5] overflow-hidden bg-stone sm:w-[84%]", flip && "sm:ml-auto")}>
                    <Image
                      src={imageUrl(look.image)}
                      alt=""
                      fill
                      preload={i === 0}
                      sizes="(min-width: 1024px) 48vw, (min-width: 640px) 84vw, 100vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  {inset && (
                    <div
                      className={cn(
                        "absolute -bottom-8 hidden aspect-[3/4] w-[34%] overflow-hidden border-8 border-paper bg-stone sm:block",
                        flip ? "left-0" : "right-0",
                      )}
                    >
                      <Image src={imageUrl(inset)} alt="" fill sizes="22vw" className="object-cover" />
                    </div>
                  )}
                </Link>

                <div className={cn("lg:col-span-5", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
                  <p className="display text-[clamp(5rem,12vw,10rem)] leading-none text-stone" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="eyebrow mt-4 text-muted">
                    {look.chapter} · For {LOOK_AUDIENCE[look.collection].toLowerCase()}
                  </p>
                  <h2 id={`${look.slug}-title`} className="display mt-3 text-5xl md:text-7xl">
                    <Link href={`/lookbook/${look.slug}`} className="hover:text-cobalt">
                      {look.title}
                    </Link>
                  </h2>
                  <p className="mt-5 max-w-md text-muted">{look.story}</p>

                  <ul className="mt-8 flex items-center gap-2" aria-label={`${items.length} pieces in this look`}>
                    {items.slice(0, MAX_THUMBS).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/product/${p.slug}`}
                          title={p.name}
                          className="relative block aspect-[4/5] w-14 overflow-hidden bg-stone ring-offset-2 ring-offset-paper transition hover:ring-2 hover:ring-ink"
                        >
                          <Image src={imageUrl(p.images[0])} alt={p.name} fill sizes="56px" className="object-cover" />
                        </Link>
                      </li>
                    ))}
                    {items.length > MAX_THUMBS && (
                      <li className="eyebrow pl-1 text-muted">+{items.length - MAX_THUMBS}</li>
                    )}
                  </ul>
                  <p className="mt-4 text-sm text-muted">
                    {items.length} pieces · full look <span className="text-ink tabular-nums">{formatPrice(total)}</span>
                  </p>

                  <ButtonLink href={`/lookbook/${look.slug}`} className="mt-8">
                    Read the chapter <ArrowUpRight className="size-4" />
                  </ButtonLink>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
