import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default function WishlistPage() {
  return <WishlistView />;
}
