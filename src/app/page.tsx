import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { COLLECTIONS, getLooks, imageUrl } from "@/lib/catalog";
import { editorial } from "@/lib/data/looks";

const PROMISES = [
  { title: "Size recommender", body: "Height, weight, fit preference. We'll tell you your size — and how sure we are." },
  { title: "Live stock", body: "See exactly what's left in your colour and size, updated as it sells." },
  { title: "Virtual try-on", body: "Drop a piece onto your own photo before it drops into your bag." },
  { title: "30-day returns", body: "Free returns and one-tap exchanges from our returns portal." },
];

export default async function Home() {
  const looks = await getLooks();

  return (
    <>
      {/* Hero */}
      <section className="gutter grid gap-10 pt-10 pb-16 md:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <div className="flex flex-col justify-end lg:col-span-5 lg:pb-8">
          <p className="eyebrow text-muted">Autumn / Winter 26 — Chapter 07</p>
          <h1 className="display mt-6 text-[clamp(3.5rem,8vw,7.5rem)]">
            Dressed for the <em className="relative isolate whitespace-nowrap">
              loudest
              <span aria-hidden className="absolute inset-x-0 bottom-[0.08em] -z-10 h-[0.28em] bg-lime" />
            </em>{" "}
            room.
          </h1>
          <p className="mt-6 max-w-md text-base text-muted">
            Considered staples and statement pieces for girls, boys and everyone in between. Made to be worn hard and kept long.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/lookbook/winter-edit" size="lg">
              Shop the Winter Edit
            </ButtonLink>
            <ButtonLink href="/shop" size="lg" variant="outline">
              New arrivals
            </ButtonLink>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative ml-auto aspect-[4/5] w-full overflow-hidden bg-stone sm:w-[82%]">
            <Image
              src={imageUrl(editorial.hero)}
              alt="Model in a dark jacket and camel trousers against a circular window"
              fill
              preload
              sizes="(min-width: 1024px) 48vw, (min-width: 640px) 82vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-8 left-0 hidden aspect-[3/4] w-[36%] overflow-hidden border-8 border-paper bg-stone sm:block">
            <Image
              src={imageUrl(editorial.heroAlt)}
              alt="Model in a red tee and black leather jacket"
              fill
              sizes="25vw"
              className="object-cover"
            />
          </div>
          <span className="absolute right-4 top-4 grid size-24 rotate-12 place-items-center rounded-full bg-lime text-center text-ink md:size-28">
            <span className="eyebrow leading-tight">
              New
              <br />
              drop
            </span>
          </span>
        </div>
      </section>

      {/* Collections */}
      <section className="gutter pb-20 md:pb-28">
        <div className="flex items-end justify-between border-t border-ink pt-6">
          <h2 className="display text-4xl md:text-6xl">Shop by collection</h2>
          <Link href="/shop" className="eyebrow hidden items-center gap-1 hover:text-cobalt sm:inline-flex">
            View everything <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {COLLECTIONS.map((c, i) => (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-stone md:aspect-[2/3]">
                <Image
                  src={imageUrl(editorial[c.slug])}
                  alt={`${c.label} collection`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-paper">
                  <div>
                    <p className="eyebrow text-lime">0{i + 1}</p>
                    <p className="display mt-2 text-6xl">{c.label}</p>
                    <p className="mt-2 max-w-xs text-sm text-paper/80">{c.blurb}</p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-ink transition-colors group-hover:bg-lime">
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Lookbook teaser */}
      <section className="bg-ink py-20 text-paper md:py-28">
        <div className="gutter flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-lime">The Lookbook</p>
            <h2 className="display mt-4 max-w-2xl text-5xl md:text-7xl">
              Seven chapters. <em>Every piece</em> shoppable.
            </h2>
          </div>
          <ButtonLink href="/lookbook" variant="inverse">
            Read the lookbook
          </ButtonLink>
        </div>
        <ul className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:px-8 xl:px-12">
          {looks.map((look) => (
            <li key={look.id} className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[26vw]">
              <Link href={`/lookbook/${look.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-paper/10">
                  <Image
                    src={imageUrl(look.image)}
                    alt={look.title}
                    fill
                    sizes="(min-width: 1024px) 26vw, (min-width: 640px) 42vw, 72vw"
                    className="object-cover grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  />
                </div>
                <p className="eyebrow mt-4 text-paper/50">{look.chapter}</p>
                <p className="display mt-1 text-3xl group-hover:text-lime">{look.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Promises */}
      <section className="gutter py-20 md:py-28">
        <ul className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p, i) => (
            <li key={p.title} className="bg-paper p-8">
              <p className="eyebrow text-cobalt">0{i + 1}</p>
              <p className="display mt-6 text-3xl">{p.title}</p>
              <p className="mt-3 text-sm text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
