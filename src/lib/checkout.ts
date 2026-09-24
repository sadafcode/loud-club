import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD } from "@/lib/format";

/** Mock promo codes — shown in the UI as hints so the demo is discoverable. */
export const PROMOS: Record<string, { label: string; percent: number }> = {
  LOUD10: { label: "10% off your first order", percent: 10 },
  CLUB20: { label: "20% off — club members", percent: 20 },
};

export function findPromo(code: string | undefined) {
  if (!code) return undefined;
  const key = code.trim().toUpperCase();
  const promo = PROMOS[key];
  return promo ? { code: key, ...promo } : undefined;
}

export type DeliveryMethod = "standard" | "express";

export const DELIVERY: Record<DeliveryMethod, { label: string; eta: string; price: (subtotal: number) => number }> = {
  standard: {
    label: "Standard",
    eta: "3–5 working days",
    price: (subtotal) => (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING),
  },
  express: {
    label: "Express",
    eta: "Next working day",
    price: () => 24,
  },
};

export const TAX_RATE = 0.08;

export function orderTotals(subtotal: number, { promo, delivery = "standard" }: { promo?: string; delivery?: DeliveryMethod }) {
  const applied = findPromo(promo);
  const discount = applied ? Math.round((subtotal * applied.percent) / 100) : 0;
  const shipping = subtotal === 0 ? 0 : DELIVERY[delivery].price(subtotal);
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  return { subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax, promo: applied };
}
