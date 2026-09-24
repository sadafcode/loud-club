"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { findVariant, imageUrl } from "@/lib/catalog";
import { DELIVERY } from "@/lib/checkout";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrders } from "@/store/orders";

const STEPS = ["Placed", "Packed", "Shipped", "Delivered"];

export function OrderConfirmation({ orderId }: { orderId?: string }) {
  const hydrated = useHydrated();
  const order = useOrders((s) => s.orders.find((o) => o.id === orderId));

  if (!hydrated) return <div className="gutter min-h-[70vh]" aria-busy="true" />;

  if (!order) {
    return (
      <div className="gutter flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <h1 className="display text-6xl">Order not found.</h1>
        <p className="max-w-sm text-sm text-muted">
          Demo orders are stored in this browser only. If you placed it elsewhere, it won&apos;t show here.
        </p>
        <ButtonLink href="/shop" size="lg">
          Back to the shop
        </ButtonLink>
      </div>
    );
  }

  const subtotal = order.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discount = order.discount ?? 0;
  const tax = order.tax ?? 0;
  const total = subtotal - discount + order.shipping + tax;
  const firstName = order.customer?.name.split(" ")[0];
  const delivery = DELIVERY[order.delivery ?? "standard"];

  return (
    <div className="gutter pt-12 pb-24 md:pt-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="grid size-14 place-items-center rounded-full bg-lime">
            <Check className="size-6" strokeWidth={2} />
          </span>
          <p className="eyebrow mt-8 text-muted">Order {order.id} · {formatDate(order.placedAt)}</p>
          <h1 className="display mt-4 text-6xl md:text-8xl">
            Thank you{firstName ? <>, <em>{firstName}</em></> : null}.
          </h1>
          <p className="mt-6 max-w-lg text-muted">
            Your order is in. A confirmation is on its way to <span className="text-ink">{order.email}</span>, and
            we&apos;ll send tracking as soon as it ships — {delivery.eta.toLowerCase()} with {delivery.label.toLowerCase()} delivery.
          </p>

          <ol className="mt-10 grid grid-cols-4 gap-2">
            {STEPS.map((step, i) => (
              <li key={step}>
                <div className={cn("h-1 rounded-full", i === 0 ? "bg-cobalt" : "bg-stone")} />
                <p className={cn("eyebrow mt-3", i === 0 ? "text-ink" : "text-muted")}>{step}</p>
              </li>
            ))}
          </ol>

          {order.customer && (
            <dl className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
              <div>
                <dt className="eyebrow text-muted">Shipping to</dt>
                <dd className="mt-3 text-sm leading-relaxed">
                  {order.customer.name}
                  <br />
                  {order.customer.address}
                  <br />
                  {order.customer.city} {order.customer.postcode}
                  <br />
                  {order.customer.country}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-muted">Payment</dt>
                <dd className="mt-3 text-sm">Card ending {order.cardLast4}</dd>
              </div>
            </dl>
          )}

          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/shop" size="lg">
              Keep shopping
            </ButtonLink>
            <ButtonLink href="/lookbook" size="lg" variant="outline">
              Explore the lookbook
            </ButtonLink>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-concrete p-6 md:p-8">
            <h2 className="eyebrow">Summary</h2>
            <ul className="mt-6 space-y-4">
              {order.lines.map((l) => {
                const found = findVariant(l.sku);
                if (!found) return null;
                return (
                  <li key={l.sku} className="flex items-center gap-4">
                    <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-stone">
                      <Image src={imageUrl(found.product.images[0])} alt={found.product.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{found.product.name}</p>
                      <p className="text-xs text-muted">
                        {found.variant.color} · {found.variant.size === "OS" ? "One size" : found.variant.size} · Qty {l.quantity}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">{formatPrice(l.price * l.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-6 space-y-2.5 border-t border-ink/10 pt-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-cobalt">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="tabular-nums">{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax</dt>
                <dd className="tabular-nums">{formatPrice(tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
                <dt className="eyebrow">Paid</dt>
                <dd className="display text-4xl tabular-nums">{formatPrice(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
