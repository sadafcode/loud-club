import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LookGallery } from "@/components/lookbook/look-gallery";
import { LookPicker } from "@/components/product/look-picker";
import { allSlugs, getLook, getLooks, getProductsByIds, imageUrl, LOOK_AUDIENCE } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Look } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSlugs().looks.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/lookbook/[slug]">): Promise<Metadata> {
  const look = await getLook((await params).slug);
  if (!look) return {};
  return {
    title: `${look.title} — Lookbook`,
    description: look.story,
    openGraph: { images: [imageUrl(look.image)] },
  };
}

export default async function LookPage({ params }: PageProps<"/lookbook/[slug]">) {
  const look = await getLook((await params).slug);
  if (!look) notFound();

  const [looks, items] = await Promise.all([getLooks(), getProductsByIds(look.productIds)]);
  const at = looks.findIndex((l) => l.id === look.id);
  const prev = looks[(at - 1 + looks.length) % looks.length];
  const next = looks[(at + 1) % looks.length];
  const total = items.reduce((sum, p) => sum + p.price, 0);

  return (
    <>
      {/* Cover */}
      <section className="relative h-[calc(100svh-6.5rem)] min-h-[520px] overflow-hidden bg-ink text-paper">
        <Image src={imageUrl(look.image)} alt={look.title} fill preload sizes="100vw" className="object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />
        <div className="gutter relative flex h-full flex-col justify-between pt-6 pb-10 md:pb-14">
          <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-paper/70">
            <Link href="/lookbook" className="hover:text-lime">
              Lookbook
            </Link>
            <span aria-hidden>/</span>
            <span className="text-paper">{look.chapter}</span>
          </nav>
          <div>
            <p className="eyebrow text-lime">
              {look.chapter} · AW26 · For {LOOK_AUDIENCE[look.collection].toLowerCase()}
            </p>
            <h1 className="display mt-4 text-[clamp(4rem,13vw,12rem)]">{look.title}</h1>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="gutter grid gap-10 py-16 md:py-24 lg:grid-cols-12">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start border-t border-ink pt-5 text-sm lg:col-span-3">
          <Meta label="Chapter" value={`${String(at + 1).padStart(2, "0")} of ${String(looks.length).padStart(2, "0")}`} />
          <Meta label="Styled for" value={LOOK_AUDIENCE[look.collection]} />
          <Meta label="Pieces" value={String(items.length)} />
          <Meta label="Full look" value={formatPrice(total)} />
        </dl>
        <div className="lg:col-span-8 lg:col-start-5">
          <p className="display text-4xl leading-[1.08] md:text-6xl">
            <span className="text-cobalt">“</span>
            {look.story}
            <span className="text-cobalt">”</span>
          </p>
          <a href="#shop-the-look" className="eyebrow mt-8 inline-flex items-center gap-2 hover:text-cobalt">
            Shop all {items.length} pieces <ArrowRight className="size-3.5 rotate-90" />
          </a>
        </div>
      </section>

      {/* Photo story */}
      {look.gallery.length > 0 && (
        <section aria-label="Photo story" className="gutter pb-20 md:pb-28">
          <LookGallery title={look.title} images={look.gallery} />
        </section>
      )}

      {/* Shop the look */}
      <section id="shop-the-look" className="scroll-mt-16 bg-concrete py-16 md:py-24">
        <div className="gutter grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="eyebrow text-muted">Shop the look</p>
              <h2 className="display mt-3 text-5xl md:text-6xl">
                Everything in <em>{look.title}</em>.
              </h2>
              <p className="mt-4 max-w-sm text-sm text-muted">
                Choose a colour and size for each piece — we&apos;ve pre-filled sizes from your fit profile where we can —
                then add the whole look in one tap.
              </p>
            </div>
          </div>
          <LookPicker items={items} className="lg:col-span-8" />
        </div>
      </section>

      {/* Next / previous chapter */}
      <nav aria-label="More chapters" className="grid md:grid-cols-2">
        <ChapterLink look={prev} direction="prev" />
        <ChapterLink look={next} direction="next" />
      </nav>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-muted">{label}</dt>
      <dd className="mt-1 tabular-nums">{value}</dd>
    </div>
  );
}

function ChapterLink({ look, direction }: { look: Look; direction: "prev" | "next" }) {
  const Arrow = direction === "prev" ? ArrowLeft : ArrowRight;
  return (
    <Link
      href={`/lookbook/${look.slug}`}
      className="group relative flex aspect-[16/9] items-end overflow-hidden bg-ink p-6 text-paper md:aspect-[4/3] md:p-10"
    >
      <Image
        src={imageUrl(look.image)}
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover opacity-60 grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:opacity-80 group-hover:grayscale-0"
      />
      <div className={direction === "next" ? "relative ml-auto text-right" : "relative"}>
        <p className="eyebrow inline-flex items-center gap-2 text-lime">
          {direction === "prev" && <Arrow className="size-3.5" />}
          {direction === "prev" ? "Previous" : "Next"} · {look.chapter}
          {direction === "next" && <Arrow className="size-3.5" />}
        </p>
        <p className="display mt-2 text-4xl md:text-6xl">{look.title}</p>
      </div>
    </Link>
  );
}
