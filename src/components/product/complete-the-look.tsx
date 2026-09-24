import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { imageUrl } from "@/lib/catalog";
import type { Look, Product } from "@/lib/types";
import { LookPicker } from "./look-picker";

/** Shop the rest of the outfit from the lookbook chapter this product appears in. */
export function CompleteTheLook({ look, items }: { look: Look; items: Product[] }) {
  return (
    <section className="bg-concrete py-16 md:py-24">
      <div className="gutter grid gap-10 lg:grid-cols-12 lg:gap-12">
        <Link href={`/lookbook/${look.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-stone lg:col-span-5">
          <Image
            src={imageUrl(look.image)}
            alt={look.title}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink/70 to-transparent p-6 text-paper">
            <div>
              <p className="eyebrow text-lime">{look.chapter}</p>
              <p className="display mt-1 text-4xl">{look.title}</p>
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-paper text-ink transition-colors group-hover:bg-lime">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </Link>

        <div className="flex flex-col lg:col-span-7">
          <p className="eyebrow text-muted">Complete the look</p>
          <h2 className="display mt-3 text-5xl md:text-6xl">Wear it like the lookbook.</h2>
          <p className="mt-4 max-w-md text-sm text-muted">{look.story}</p>

          <LookPicker items={items} className="mt-8" />
        </div>
      </div>
    </section>
  );
}
