import { RETURN_WINDOW_DAYS } from "@/lib/data/orders";
import type { Order, OrderLine, Product, ReturnMethod, ReturnReason, ReturnRequest, ReturnStatus } from "@/lib/types";

export const REASONS: Record<ReturnReason, string> = {
  "too-small": "Too small",
  "too-large": "Too large",
  "not-as-pictured": "Not as pictured",
  "changed-mind": "Changed my mind",
  defective: "Faulty or damaged",
};

export const RETURN_METHODS: Record<ReturnMethod, { label: string; detail: string }> = {
  "drop-off": { label: "Drop-off point", detail: "Show a QR code at any partner store or locker. No printer needed." },
  pickup: { label: "Courier pickup", detail: "We collect from your door on the next working day." },
};

export const RETURN_STEPS: { status: ReturnStatus; label: string; detail: string }[] = [
  { status: "requested", label: "Requested", detail: "We've got your return." },
  { status: "label-sent", label: "Label ready", detail: "Your QR code and instructions are in your inbox." },
  { status: "in-transit", label: "On its way", detail: "Your parcel is heading back to us." },
  { status: "received", label: "Received", detail: "Our team is checking your pieces." },
  { status: "completed", label: "Completed", detail: "Refund issued or exchange dispatched." },
];

const DAY = 24 * 60 * 60 * 1000;

export const normaliseOrderId = (value: string) => {
  const v = value.trim().toUpperCase().replace(/^#/, "");
  return /^\d+$/.test(v) ? `LC-${v}` : v;
};

/** The last day a delivered order can be sent back, or undefined if it hasn't arrived. */
export function returnDeadline(order: Order) {
  if (order.status !== "delivered" || !order.deliveredAt) return undefined;
  return new Date(new Date(order.deliveredAt).getTime() + RETURN_WINDOW_DAYS * DAY);
}

export type Eligibility =
  | { ok: true; deadline: Date; daysLeft: number }
  | { ok: false; reason: "not-delivered" | "expired"; deadline?: Date };

export function eligibility(order: Order, now = Date.now()): Eligibility {
  const deadline = returnDeadline(order);
  if (!deadline) return { ok: false, reason: "not-delivered" };
  const daysLeft = Math.ceil((deadline.getTime() - now) / DAY);
  return daysLeft > 0 ? { ok: true, deadline, daysLeft } : { ok: false, reason: "expired", deadline };
}

/** Units of each SKU in an order that are already covered by a return. */
export function returnedQuantities(orderId: string, returns: ReturnRequest[]) {
  const counts: Record<string, number> = {};
  for (const r of returns) {
    if (r.orderId !== orderId) continue;
    for (const l of r.lines) counts[l.sku] = (counts[l.sku] ?? 0) + l.quantity;
  }
  return counts;
}

/** What one unit of a line refunds, with any order-level discount shared out pro rata. */
export function unitRefund(order: Order, line: OrderLine) {
  const subtotal = order.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const share = subtotal > 0 ? (order.discount ?? 0) / subtotal : 0;
  return Math.round(line.price * (1 - share));
}

/** Size to suggest for an exchange, based on why it's coming back. */
export function suggestedSize(product: Product, size: string, reason: ReturnReason) {
  const i = product.sizes.indexOf(size);
  if (i < 0) return size;
  if (reason === "too-small") return product.sizes[Math.min(i + 1, product.sizes.length - 1)];
  if (reason === "too-large") return product.sizes[Math.max(i - 1, 0)];
  return size;
}

export const sizeLabel = (size: string) => (size === "OS" ? "One size" : size);
