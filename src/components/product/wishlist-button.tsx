"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { useUI } from "@/store/ui";
import { useWishlist } from "@/store/wishlist";

export function WishlistButton({
  productId,
  name,
  className,
  variant = "overlay",
}: {
  productId: string;
  name: string;
  className?: string;
  variant?: "overlay" | "outline";
}) {
  const hydrated = useHydrated();
  const saved = useWishlist((s) => s.productIds.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const toast = useUI((s) => s.toast);
  const active = hydrated && saved;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
        if (!saved) toast({ title: "Saved to wishlist", body: name, href: "/wishlist" });
      }}
      className={cn(
        "grid place-items-center rounded-full transition-colors",
        variant === "overlay"
          ? "size-9 bg-paper/90 backdrop-blur hover:bg-paper"
          : "size-14 shrink-0 border border-line hover:border-ink",
        className,
      )}
    >
      <Heart
        className={cn("size-4.5 transition-transform", active && "scale-110 fill-signal text-signal")}
        strokeWidth={1.5}
      />
    </button>
  );
}
