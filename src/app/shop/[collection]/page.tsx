import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { COLLECTIONS } from "@/lib/catalog";
import { parseShopParams } from "@/lib/shop-params";

const findCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);

export async function generateMetadata({ params }: PageProps<"/shop/[collection]">): Promise<Metadata> {
  const meta = findCollection((await params).collection);
  return meta ? { title: `Shop ${meta.label.toLowerCase()}`, description: meta.blurb } : {};
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/shop/[collection]">) {
  const meta = findCollection((await params).collection);
  if (!meta) notFound();
  const query = parseShopParams(await searchParams);
  return <ShopView collection={meta.slug} query={query} />;
}
