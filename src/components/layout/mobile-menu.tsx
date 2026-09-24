"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { Sheet } from "@/components/ui/sheet";
import { NAV_COLLECTIONS, NAV_LINKS } from "@/lib/nav";
import { useUI } from "@/store/ui";

export function MobileMenu() {
  const isOpen = useUI((s) => s.panel === "menu");
  const close = useUI((s) => s.close);
  const onClose = useCallback(() => close(), [close]);

  return (
    <Sheet open={isOpen} onClose={onClose} side="left" label="Menu" title="Menu">
      <nav className="flex-1 overflow-y-auto px-6 py-6">
        <ul className="space-y-6">
          {NAV_COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop/${c.slug}`} onClick={onClose} className="display text-5xl">
                {c.label}
              </Link>
              <ul className="mt-3 flex flex-wrap gap-2">
                {c.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/shop/${c.slug}?category=${cat.slug}`}
                      onClick={onClose}
                      className="block rounded-full border border-line px-3 py-1.5 text-xs"
                    >
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <ul className="mt-10 space-y-3 border-t border-line pt-6">
          {[...NAV_LINKS, { href: "/wishlist", label: "Wishlist" }, { href: "/returns", label: "Returns & exchanges" }].map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={onClose} className="flex items-center justify-between text-lg">
                {l.label} <ArrowUpRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Sheet>
  );
}
