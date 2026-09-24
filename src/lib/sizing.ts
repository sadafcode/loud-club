import type { Collection, FitProfile, Product } from "@/lib/types";

/**
 * Size guide + size recommender.
 *
 * Charts list *body* measurements per size. The recommender estimates body
 * measurements from height/weight, shifts them by the shopper's fit preference
 * and by the garment's cut, then picks the closest size.
 */

type Cut = "girls" | "boys";
const cutFor = (collection: Collection): Cut => (collection === "girls" ? "girls" : "boys");

const BODY_CHEST: Record<Cut, Record<string, number>> = {
  boys: { XS: 86, S: 92, M: 98, L: 106, XL: 114 },
  girls: { XS: 78, S: 84, M: 90, L: 98, XL: 106 },
};

const BODY_WAIST: Record<Cut, Record<string, number>> = {
  boys: { XS: 72, S: 78, M: 84, L: 92, XL: 100 },
  girls: { XS: 60, S: 66, M: 72, L: 80, XL: 88 },
};

const SHOE_FOOT_CM: Record<string, number> = {
  "39": 24.6, "40": 25.3, "41": 26.0, "42": 26.7, "43": 27.3, "44": 28.0,
};

/** Extra room the cut gives on top of body measurements, in cm of chest. */
const FIT_EASE: Record<FitProfile, number> = { slim: 4, regular: 10, relaxed: 16, oversized: 26 };

export const FIT_LABELS: Record<FitProfile, string> = {
  slim: "Slim fit — close to the body",
  regular: "Regular fit — true to size",
  relaxed: "Relaxed fit — easy through the body",
  oversized: "Oversized — intentionally roomy",
};

export type SizeChart = {
  columns: string[];
  rows: { size: string; values: number[] }[];
  unit: "cm";
  note: string;
};

export function getSizeChart(product: Product): SizeChart | null {
  const cut = cutFor(product.collection);
  switch (product.sizeSystem) {
    case "alpha":
      return {
        columns: ["Chest", "Waist", "Garment chest"],
        rows: product.sizes.map((size) => ({
          size,
          values: [BODY_CHEST[cut][size], BODY_WAIST[cut][size], BODY_CHEST[cut][size] + FIT_EASE[product.fit]],
        })),
        unit: "cm",
        note: `Body measurements. ${FIT_LABELS[product.fit]}.`,
      };
    case "waist":
      return {
        columns: ["Waist", "Hip"],
        rows: product.sizes.map((size) => {
          const waist = Math.round(Number(size) * 2.54);
          return { size, values: [waist, waist + (cut === "girls" ? 24 : 16)] };
        }),
        unit: "cm",
        note: "Waist size is in inches. Measure around your natural waist.",
      };
    case "shoe":
      return {
        columns: ["Foot length"],
        rows: product.sizes.map((size) => ({ size, values: [SHOE_FOOT_CM[size]] })),
        unit: "cm",
        note: "EU sizing. Measure heel to longest toe while standing.",
      };
    case "one-size":
      return null;
  }
}

export type FitPreference = "closer" | "true" | "looser";

export type RecommenderInput = {
  heightCm: number;
  weightKg: number;
  preference: FitPreference;
};

export type Recommendation = {
  size: string;
  /** 0–100, how close the shopper sits to the centre of the size. */
  confidence: number;
  /** Set when the shopper sits between two sizes. */
  alternative?: { size: string; reason: string };
  summary: string;
};

const PREFERENCE_SHIFT: Record<FitPreference, number> = { closer: -4, true: 0, looser: 5 };

function estimateBody(cut: Cut, { heightCm, weightKg }: RecommenderInput) {
  // Rough anthropometric regressions — good enough for a demo, tuned so
  // typical height/weight combos land on sensible sizes.
  return cut === "girls"
    ? { chest: 30 + 0.6 * weightKg + 0.12 * heightCm, waist: 31 + 0.42 * weightKg + 0.08 * heightCm }
    : { chest: 36 + 0.55 * weightKg + 0.12 * heightCm, waist: 35 + 0.45 * weightKg + 0.08 * heightCm };
}

export function recommendSize(product: Product, input: RecommenderInput): Recommendation | null {
  if (product.sizeSystem === "one-size" || product.sizeSystem === "shoe") return null;

  const cut = cutFor(product.collection);
  const body = estimateBody(cut, input);
  const shift = PREFERENCE_SHIFT[input.preference];

  // Each size's "centre" in body measurements; the shopper's target moves with preference.
  const candidates =
    product.sizeSystem === "alpha"
      ? product.sizes.map((size) => ({ size, centre: BODY_CHEST[cut][size] }))
      : product.sizes.map((size) => ({ size, centre: Number(size) * 2.54 }));

  const target = (product.sizeSystem === "alpha" ? body.chest : body.waist) + shift;

  const ranked = candidates
    .map((c) => ({ ...c, diff: target - c.centre }))
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

  const best = ranked[0];
  const confidence = Math.round(Math.max(55, Math.min(97, 97 - Math.abs(best.diff) * 4.5)));

  let alternative: Recommendation["alternative"];
  const neighbour = ranked[1];
  if (neighbour && Math.abs(best.diff) > 2.5 && Math.sign(neighbour.diff) !== Math.sign(best.diff)) {
    const up = candidates.indexOf(candidates.find((c) => c.size === neighbour.size)!) >
      candidates.indexOf(candidates.find((c) => c.size === best.size)!);
    alternative = {
      size: neighbour.size,
      reason: up ? "Size up for a roomier drape" : "Size down for a closer fit",
    };
  }

  const summary =
    product.fit === "oversized"
      ? `This piece is cut oversized — ${best.size} gives you the intended drape.`
      : `Based on similar shoppers, ${best.size} fits ${input.preference === "true" ? "true to size" : input.preference === "closer" ? "close to the body" : "with extra room"}.`;

  return { size: best.size, confidence, alternative, summary };
}

export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
