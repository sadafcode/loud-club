import type { Metadata } from "next";
import { TryOnStudio } from "@/components/try-on/try-on-studio";
import { getLooks, getTryOnProducts } from "@/lib/catalog";
import { garmentFor } from "@/lib/try-on";

export const metadata: Metadata = {
  title: "Virtual try-on",
  description: "Drop a piece onto your own photo or live camera before it drops into your bag. Nothing leaves your device.",
};

/** Front-facing lookbook shots where both shoulders are clearly visible. */
const SAMPLE_LOOKS = ["weekend-uniform", "concrete-hours"];

export default async function TryOnPage({ searchParams }: PageProps<"/try-on">) {
  const [{ product }, all, looks] = await Promise.all([searchParams, getTryOnProducts(), getLooks()]);
  const products = all.filter((p) => garmentFor(p));
  const samples = SAMPLE_LOOKS.map((slug) => looks.find((l) => l.slug === slug))
    .filter((l) => !!l)
    .map((l) => ({ id: l.image, label: `Model — ${l.title}` }));

  return (
    <TryOnStudio
      products={products}
      samples={samples}
      initialProductId={typeof product === "string" ? product : undefined}
    />
  );
}
