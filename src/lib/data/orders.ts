import type { Order } from "@/lib/types";

/**
 * Demo orders for the returns portal. Look up any of them with the email
 * `demo@loudclub.shop`. Dates are relative to "now" so the 30-day return
 * window stays open whenever the demo runs.
 */
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

export const DEMO_EMAIL = "demo@loudclub.shop";

export const RETURN_WINDOW_DAYS = 30;

export function getDemoOrders(): Order[] {
  return [
    {
      id: "LC-10482",
      email: DEMO_EMAIL,
      placedAt: daysAgo(9),
      deliveredAt: daysAgo(5),
      status: "delivered",
      shipping: 0,
      lines: [
        { sku: "copper-bomber-copper-m", productId: "copper-bomber", quantity: 1, price: 228 },
        { sku: "essential-heavyweight-tee-optic-white-m", productId: "essential-heavyweight-tee", quantity: 2, price: 58 },
        { sku: "pleated-chino-khaki-32", productId: "pleated-chino", quantity: 1, price: 138 },
      ],
    },
    {
      id: "LC-10517",
      email: DEMO_EMAIL,
      placedAt: daysAgo(6),
      deliveredAt: daysAgo(2),
      status: "delivered",
      shipping: 0,
      lines: [
        { sku: "signal-knit-sweater-signal-s", productId: "signal-knit-sweater", quantity: 1, price: 148 },
        { sku: "floral-wrap-dress-bone-s", productId: "floral-wrap-dress", quantity: 1, price: 188 },
      ],
    },
    {
      id: "LC-10533",
      email: DEMO_EMAIL,
      placedAt: daysAgo(2),
      status: "shipped",
      shipping: 12,
      lines: [{ sku: "raw-straight-denim-raw-indigo-30", productId: "raw-straight-denim", quantity: 1, price: 168 }],
    },
    {
      id: "LC-09871",
      email: DEMO_EMAIL,
      placedAt: daysAgo(48),
      deliveredAt: daysAgo(44),
      status: "delivered",
      shipping: 0,
      lines: [{ sku: "camel-wrap-coat-camel-m", productId: "camel-wrap-coat", quantity: 1, price: 420 }],
    },
  ];
}
