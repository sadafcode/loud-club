import { CATEGORY_LABELS, COLLECTIONS } from "@/lib/catalog";
import { editorial, looks } from "@/lib/data/looks";
import { products } from "@/lib/data/products";
import type { Category, Collection } from "@/lib/types";

export type NavCollection = {
  slug: Collection;
  label: string;
  blurb: string;
  categories: { slug: Category; label: string }[];
  feature: { title: string; href: string; image: string };
};

const FEATURES: Record<Collection, string> = {
  girls: "soft-power",
  boys: "after-office",
  unisex: "weekend-uniform",
};

export const NAV_COLLECTIONS: NavCollection[] = COLLECTIONS.map((c) => {
  const categories = [...new Set(products.filter((p) => p.collection === c.slug).map((p) => p.category))];
  const look = looks.find((l) => l.id === FEATURES[c.slug])!;
  return {
    ...c,
    categories: categories.map((slug) => ({ slug, label: CATEGORY_LABELS[slug] })),
    feature: { title: look.title, href: `/lookbook/${look.slug}`, image: look.image },
  };
});

export const NAV_LINKS = [
  { href: "/lookbook", label: "Lookbook" },
  { href: "/try-on", label: "Try-On" },
];

export const FOOTER_LINKS = [
  {
    title: "Shop",
    links: [
      { href: "/shop/girls", label: "Girls" },
      { href: "/shop/boys", label: "Boys" },
      { href: "/shop/unisex", label: "Unisex" },
      { href: "/shop?sort=newest", label: "New arrivals" },
      { href: "/shop?sale=1", label: "Sale" },
    ],
  },
  {
    title: "Explore",
    links: [
      { href: "/lookbook", label: "Lookbook" },
      { href: "/try-on", label: "Virtual try-on" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/returns", label: "Returns & exchanges" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/cart", label: "Your bag" },
      { href: "mailto:care@loudclub.shop", label: "Contact care" },
    ],
  },
];

export const POPULAR_SEARCHES = ["Denim", "Merino", "Outerwear", "Oversized", "Leather", "Summer"];

export { editorial };
