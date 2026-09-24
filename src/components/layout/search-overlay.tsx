"use client";

import { ArrowRight, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Price } from "@/components/ui/price";
import { CATEGORY_LABELS, imageUrl } from "@/lib/catalog";
import { products } from "@/lib/data/products";
import { POPULAR_SEARCHES } from "@/lib/nav";
import { useUI } from "@/store/ui";

export function SearchOverlay() {
  const isOpen = useUI((s) => s.panel === "search");
  const close = useUI((s) => s.close);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const onClose = useCallback(() => {
    close();
    setQuery("");
  }, [close]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) =>
        [p.name, p.tagline, p.category, CATEGORY_LABELS[p.category], ...p.tags, ...p.colors.map((c) => c.name)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [query]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <Sheet open={isOpen} onClose={onClose} side="top" label="Search">
      <div className="gutter py-6 md:py-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="flex items-center gap-4 border-b border-ink pb-4"
        >
          <Search className="size-6 shrink-0" strokeWidth={1.25} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coats, denim, merino…"
            aria-label="Search products"
            className="display w-full bg-transparent text-4xl outline-none focus-visible:outline-none placeholder:text-muted/60 md:text-6xl"
          />
          <button type="button" onClick={onClose} className="eyebrow shrink-0 text-muted hover:text-ink">
            Esc
          </button>
        </form>

        {query.trim().length < 2 ? (
          <div className="mt-8">
            <p className="eyebrow text-muted">Popular searches</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button key={term} onClick={() => setQuery(term)} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="mt-8 text-muted">Nothing for &ldquo;{query}&rdquo;. Try a colour, fabric or category.</p>
        ) : (
          <div className="mt-8">
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone">
                      <Image src={imageUrl(p.images[0])} alt={p.name} fill sizes="(min-width: 1024px) 16vw, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <p className="mt-2 text-sm">{p.name}</p>
                    <Price value={p.price} compareAt={p.compareAt} className="text-sm text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <button onClick={() => submit(query)} className="mt-6 inline-flex items-center gap-2 text-sm underline decoration-lime decoration-2 underline-offset-4">
              See all results for &ldquo;{query.trim()}&rdquo; <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
