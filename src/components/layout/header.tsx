"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { NAV_COLLECTIONS, NAV_LINKS } from "@/lib/nav";
import type { Collection } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";
import { Logo } from "./logo";

export function Header() {
  const [active, setActive] = useState<Collection | null>(null);
  const pathname = usePathname();
  const open = useUI((s) => s.open);
  const hydrated = useHydrated();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlist((s) => s.productIds.length);

  // Close the mega-menu whenever navigation happens.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setActive(null);
  }

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const current = NAV_COLLECTIONS.find((c) => c.slug === active);

  return (
    <header className="sticky top-0 z-40" onMouseLeave={() => setActive(null)}>
      <div className={cn("border-b border-line backdrop-blur-md transition-colors", active ? "bg-paper" : "bg-paper/85")}>
        <div className="gutter grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <nav aria-label="Primary" className="flex items-center gap-1">
            <button
              className="-ml-2 rounded-full p-2 hover:bg-ink/5 lg:hidden"
              onClick={() => open("menu")}
              aria-label="Open menu"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </button>
            <ul className="hidden items-center gap-1 lg:flex">
              {NAV_COLLECTIONS.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop/${c.slug}`}
                    onMouseEnter={() => setActive(c.slug)}
                    onFocus={() => setActive(c.slug)}
                    aria-expanded={active === c.slug}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm transition-colors",
                      active === c.slug || pathname.startsWith(`/shop/${c.slug}`) ? "bg-ink text-paper" : "hover:bg-ink/5",
                    )}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
              <li aria-hidden className="mx-2 h-4 w-px bg-line" />
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onMouseEnter={() => setActive(null)}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm transition-colors hover:bg-ink/5",
                      pathname.startsWith(l.href) && "underline decoration-lime decoration-2 underline-offset-8",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Logo className="text-[1.9rem] md:text-[2.1rem]" />

          <div className="flex items-center justify-end gap-0.5">
            <button onClick={() => open("search")} aria-label="Search" className="rounded-full p-2.5 hover:bg-ink/5">
              <Search className="size-5" strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" aria-label={`Wishlist${hydrated && wishCount ? `, ${wishCount} items` : ""}`} className="relative hidden rounded-full p-2.5 hover:bg-ink/5 sm:block">
              <Heart className="size-5" strokeWidth={1.5} />
              {hydrated && wishCount > 0 && <Count value={wishCount} />}
            </Link>
            <button onClick={() => open("cart")} aria-label={`Bag${hydrated && cartCount ? `, ${cartCount} items` : ""}`} className="relative rounded-full p-2.5 hover:bg-ink/5">
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              {hydrated && cartCount > 0 && <Count value={cartCount} accent />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            key="mega"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full hidden border-b border-line bg-paper shadow-[0_24px_48px_-24px_rgb(14_14_16/0.25)] lg:block"
          >
            <div className="gutter grid grid-cols-12 gap-8 py-10">
              <div className="col-span-4">
                <p className="eyebrow text-muted">{current.label} collection</p>
                <p className="display mt-4 text-5xl">{current.blurb}</p>
                <Link href={`/shop/${current.slug}`} className="mt-8 inline-flex items-center gap-1.5 text-sm underline decoration-lime decoration-2 underline-offset-4">
                  Shop all {current.label.toLowerCase()} <ArrowUpRight className="size-4" />
                </Link>
              </div>
              <ul className="col-span-3 col-start-6 space-y-2.5">
                <li className="eyebrow pb-2 text-muted">Categories</li>
                {current.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={`/shop/${current.slug}?category=${cat.slug}`} className="group inline-flex items-center gap-2 text-lg hover:text-cobalt">
                      {cat.label}
                      <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={current.feature.href} className="group relative col-span-3 col-start-10 aspect-[4/5] overflow-hidden bg-stone">
                <Image
                  src={imageUrl(current.feature.image)}
                  alt={`${current.feature.title} lookbook`}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-5 text-paper">
                  <p className="eyebrow text-lime">Lookbook</p>
                  <p className="display mt-1 text-3xl">{current.feature.title}</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Count({ value, accent }: { value: number; accent?: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium leading-4 tabular-nums",
        accent ? "bg-lime text-ink" : "bg-ink text-paper",
      )}
    >
      {value}
    </span>
  );
}
