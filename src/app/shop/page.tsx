import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
import { parseShopParams } from "@/lib/shop-params";

export const metadata: Metadata = {
  title: "Shop everything",
  description: "Every loud club piece — girls, boys and unisex. Filter by size, colour and price.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const query = parseShopParams(await searchParams);
  return <ShopView query={query} />;
}
