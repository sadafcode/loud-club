"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, PackageOpen, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { ReturnCard, ReturnQr, ReturnTracker } from "@/components/returns/return-tracker";
import { ReturnLinePicker, type LinePick } from "@/components/returns/return-line-picker";
import { Button, ButtonLink } from "@/components/ui/button";
import { findVariant, imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { DEMO_EMAIL, RETURN_WINDOW_DAYS, getDemoOrders } from "@/lib/data/orders";
import { formatDate, formatPrice } from "@/lib/format";
import {
  REASONS,
  RETURN_METHODS,
  eligibility,
  normaliseOrderId,
  returnedQuantities,
  sizeLabel,
  unitRefund,
} from "@/lib/returns";
import type { Order, ReturnLine, ReturnMethod, ReturnRequest } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrders } from "@/store/orders";
import { useReturns } from "@/store/returns";
import { getStock, useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";

type Stage = "lookup" | "select" | "review" | "done";

const STAGES: { key: Exclude<Stage, "done">; label: string }[] = [
  { key: "lookup", label: "Find order" },
  { key: "select", label: "Choose items" },
  { key: "review", label: "Confirm" },
];

export function ReturnsPortal({ initialOrderId }: { initialOrderId?: string }) {
  const hydrated = useHydrated();
  const placed = useOrders((s) => s.orders);
  const returns = useReturns((s) => s.returns);
  const submit = useReturns((s) => s.submit);
  const reserve = useStockStore((s) => s.reserve);
  const toast = useUI((s) => s.toast);

  const [stage, setStage] = useState<Stage>("lookup");
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [email, setEmail] = useState("");
  const [lookupError, setLookupError] = useState<string>();
  const [order, setOrder] = useState<Order>();
  const [picks, setPicks] = useState<Record<string, LinePick>>({});
  const [method, setMethod] = useState<ReturnMethod>("drop-off");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [createdId, setCreatedId] = useState<string>();

  const created = returns.find((r) => r.id === createdId);

  if (!hydrated) return <div className="gutter min-h-[70vh]" aria-busy="true" />;

  const findOrder = (e: FormEvent) => {
    e.preventDefault();
    const id = normaliseOrderId(orderId);
    const match = [...placed, ...getDemoOrders()].find(
      (o) => o.id === id && o.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match) {
      setLookupError("We couldn't find an order with that number and email. Check both and try again.");
      return;
    }
    setLookupError(undefined);
    setOrder(match);
    setPicks({});
    setStage("select");
  };

  const fillDemo = () => {
    setOrderId("LC-10482");
    setEmail(DEMO_EMAIL);
    setLookupError(undefined);
  };

  const startOver = () => {
    setStage("lookup");
    setOrder(undefined);
    setPicks({});
    setCreatedId(undefined);
    setSubmitError(undefined);
  };

  const selected = order ? order.lines.filter((l) => picks[l.sku]) : [];
  const incomplete = selected.some((l) => {
    const p = picks[l.sku];
    return !p.reason || (p.resolution === "exchange" && !p.exchangeSku);
  });
  const refund = order
    ? selected.reduce((sum, l) => {
        const p = picks[l.sku];
        return p.resolution === "refund" ? sum + unitRefund(order, l) * p.quantity : sum;
      }, 0)
    : 0;

  const onSubmit = async () => {
    if (!order) return;
    setSubmitting(true);
    setSubmitError(undefined);
    await new Promise((r) => setTimeout(r, 1100));

    // Hold the replacement stock for exchanges — all or nothing.
    const exchanges = selected
      .map((l) => picks[l.sku])
      .filter((p): p is LinePick & { exchangeSku: string } => p.resolution === "exchange" && !!p.exchangeSku);
    if (exchanges.some((p) => getStock(p.exchangeSku) < p.quantity)) {
      setSubmitting(false);
      setSubmitError("A size you picked for an exchange just sold out. Choose another and try again.");
      setStage("select");
      return;
    }
    for (const p of exchanges) reserve(p.exchangeSku, p.quantity);

    const lines: ReturnLine[] = selected.map((l) => {
      const p = picks[l.sku];
      return {
        sku: l.sku,
        productId: l.productId,
        quantity: p.quantity,
        reason: p.reason!,
        resolution: p.resolution,
        exchangeSku: p.resolution === "exchange" ? p.exchangeSku : undefined,
      };
    });
    const request = submit({ orderId: order.id, email: order.email, method, lines, refund });
    setCreatedId(request.id);
    setSubmitting(false);
    setStage("done");
    toast({ title: `Return ${request.id} created`, body: "Your QR code is ready.", tone: "success" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (stage === "done" && created) return <ReturnConfirmation request={created} onStartOver={startOver} />;

  const stageIndex = STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="gutter pt-10 pb-24 md:pt-14">
      <header className="grid gap-6 border-b border-ink pb-6 md:grid-cols-2 md:items-end">
        <div>
          <p className="eyebrow text-muted">Returns &amp; exchanges</p>
          <h1 className="display mt-3 text-6xl md:text-8xl">
            Not quite <em>right?</em>
          </h1>
        </div>
        <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
          {STAGES.map((s, i) => (
            <li key={s.key} aria-current={i === stageIndex ? "step" : undefined}>
              <div className={cn("h-1 rounded-full", i <= stageIndex ? "bg-cobalt" : "bg-stone")} />
              <p className={cn("eyebrow mt-3", i <= stageIndex ? "text-ink" : "text-muted")}>
                0{i + 1} {s.label}
              </p>
            </li>
          ))}
        </ol>
      </header>

      {stage === "lookup" && (
        <div className="grid gap-12 pt-10 lg:grid-cols-12">
          <form onSubmit={findOrder} noValidate className="space-y-6 lg:col-span-6">
            <p className="max-w-md text-muted">
              Free returns and exchanges within {RETURN_WINDOW_DAYS} days of delivery. Enter your order number and the
              email you used at checkout.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="eyebrow mb-2 block text-muted">Order number</span>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="LC-10482"
                  className="h-12 w-full rounded-xl border border-line bg-transparent px-4 text-sm uppercase outline-none placeholder:text-muted/60 focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="eyebrow mb-2 block text-muted">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-line bg-transparent px-4 text-sm outline-none placeholder:text-muted/60 focus:border-ink"
                />
              </label>
            </div>
            {lookupError && (
              <p className="rounded-2xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">
                {lookupError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={!orderId.trim() || !email.trim()}>
                Find my order <ArrowRight className="size-4" />
              </Button>
              <button
                type="button"
                onClick={fillDemo}
                className="inline-flex items-center gap-2 rounded-full bg-lime px-5 text-sm text-ink hover:bg-ink hover:text-lime"
              >
                <Sparkles className="size-4" strokeWidth={1.5} />
                Use a demo order
              </button>
            </div>
            <p className="text-xs text-muted">
              Demo orders LC-10482, LC-10517, LC-10533 and LC-09871 all use {DEMO_EMAIL}. Orders you place at checkout
              work too.
            </p>
          </form>

          <aside className="lg:col-span-5 lg:col-start-8">
            <ul className="divide-y divide-line border-y border-line">
              {[
                ["01", "Pick what's going back", "Refund it, or swap for another size or colour — we'll suggest one."],
                ["02", "Get a QR code", "No printer. Show it at a drop-off point, or book a courier pickup."],
                ["03", "Track it here", "Refunds land within 3 working days of us receiving your parcel."],
              ].map(([n, title, body]) => (
                <li key={n} className="flex gap-5 py-5">
                  <span className="eyebrow pt-1 text-cobalt">{n}</span>
                  <div>
                    <p className="display text-2xl">{title}</p>
                    <p className="mt-1 text-sm text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {returns.length > 0 && (
            <section className="lg:col-span-12">
              <h2 className="display border-b border-line pb-4 text-4xl">Your returns</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {returns.map((r) => (
                  <ReturnCard key={r.id} request={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {stage !== "lookup" && order && (
        <OrderHeader order={order} onChange={startOver} />
      )}

      {stage === "select" && order && (
        <SelectStage
          order={order}
          picks={picks}
          setPicks={setPicks}
          error={submitError}
          canContinue={selected.length > 0 && !incomplete}
          refund={refund}
          onContinue={() => {
            setSubmitError(undefined);
            setStage("review");
          }}
        />
      )}

      {stage === "review" && order && (
        <div className="grid gap-12 pt-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <fieldset>
              <legend className="display text-3xl md:text-4xl">How&apos;s it getting back to us?</legend>
              <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Return method">
                {(Object.keys(RETURN_METHODS) as ReturnMethod[]).map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-2xl border p-5 transition-colors",
                      method === key ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                    )}
                  >
                    <input
                      type="radio"
                      name="method"
                      checked={method === key}
                      onChange={() => setMethod(key)}
                      className="sr-only"
                    />
                    <span className="flex items-baseline justify-between text-sm font-medium">
                      {RETURN_METHODS[key].label}
                      <span className={cn("text-xs", method === key ? "text-lime" : "text-muted")}>Free</span>
                    </span>
                    <span className={cn("text-xs", method === key ? "text-paper/70" : "text-muted")}>
                      {RETURN_METHODS[key].detail}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-3 border-t border-line pt-8">
              <Button variant="outline" size="lg" onClick={() => setStage("select")} disabled={submitting}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button size="lg" onClick={onSubmit} disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating your return…
                  </>
                ) : (
                  <>
                    Submit return <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-3xl bg-concrete p-6 md:p-8">
              <h2 className="eyebrow">Summary</h2>
              <ul className="mt-6 space-y-4">
                {selected.map((l) => {
                  const p = picks[l.sku];
                  const found = findVariant(l.sku);
                  const swap = p.exchangeSku ? findVariant(p.exchangeSku)?.variant : undefined;
                  if (!found) return null;
                  return (
                    <li key={l.sku} className="flex items-center gap-4">
                      <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-stone">
                        <Image src={imageUrl(found.product.images[0])} alt={found.product.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {found.product.name} {p.quantity > 1 && <span className="text-muted">× {p.quantity}</span>}
                        </p>
                        <p className="text-xs text-muted">{REASONS[p.reason!]}</p>
                        <p className="text-xs">
                          {swap ? (
                            <>
                              Exchange: {sizeLabel(found.variant.size)} → <span className="text-cobalt">{swap.color}, {sizeLabel(swap.size)}</span>
                            </>
                          ) : (
                            "Refund"
                          )}
                        </p>
                      </div>
                      {p.resolution === "refund" && (
                        <span className="text-sm tabular-nums">{formatPrice(unitRefund(order, l) * p.quantity)}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <dl className="mt-6 space-y-2.5 border-t border-ink/10 pt-6 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Return shipping</dt>
                  <dd>Free</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
                  <dt className="eyebrow">Refund</dt>
                  <dd className="display text-4xl tabular-nums">{formatPrice(refund)}</dd>
                </div>
              </dl>
              {(order.discount ?? 0) > 0 && (
                <p className="mt-3 text-xs text-muted">Your order discount is shared across items, so refunds reflect what you paid.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function OrderHeader({ order, onChange }: { order: Order; onChange: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
      <p className="text-sm">
        <span className="eyebrow mr-3 text-muted">Order</span>
        {order.id} · placed {formatDate(order.placedAt)}
        {order.deliveredAt && <> · delivered {formatDate(order.deliveredAt)}</>}
      </p>
      <button type="button" onClick={onChange} className="text-xs underline underline-offset-4 hover:text-cobalt">
        Look up a different order
      </button>
    </div>
  );
}

function SelectStage({
  order,
  picks,
  setPicks,
  error,
  canContinue,
  refund,
  onContinue,
}: {
  order: Order;
  picks: Record<string, LinePick>;
  setPicks: (update: (p: Record<string, LinePick>) => Record<string, LinePick>) => void;
  error?: string;
  canContinue: boolean;
  refund: number;
  onContinue: () => void;
}) {
  const returns = useReturns((s) => s.returns);
  const status = eligibility(order);

  if (!status.ok) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <PackageOpen className="size-10 text-muted" strokeWidth={1} />
        <h2 className="display text-5xl">
          {status.reason === "expired" ? "This order is outside the return window." : "This order hasn't arrived yet."}
        </h2>
        <p className="max-w-md text-muted">
          {status.reason === "expired"
            ? `Returns close ${RETURN_WINDOW_DAYS} days after delivery — this one closed on ${formatDate(status.deadline!.toISOString())}. If something's faulty, our team can still help.`
            : "You can start a return as soon as it's delivered. We'll email you tracking in the meantime."}
        </p>
        <ButtonLink href="/shop" variant="outline" size="lg">
          Back to the shop
        </ButtonLink>
      </div>
    );
  }

  const returned = returnedQuantities(order.id, returns);
  const count = Object.values(picks).reduce((n, p) => n + p.quantity, 0);

  return (
    <div className="grid gap-12 pt-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display text-3xl md:text-4xl">What&apos;s going back?</h2>
          <p className={cn("eyebrow", status.daysLeft <= 7 ? "text-signal" : "text-muted")}>
            {status.daysLeft} {status.daysLeft === 1 ? "day" : "days"} left · until {formatDate(status.deadline.toISOString())}
          </p>
        </div>
        <ul className="mt-6 space-y-4">
          {order.lines.map((l) => (
            <ReturnLinePicker
              key={l.sku}
              line={l}
              remaining={Math.max(0, l.quantity - (returned[l.sku] ?? 0))}
              unitRefund={unitRefund(order, l)}
              pick={picks[l.sku]}
              onChange={(pick) =>
                setPicks((prev) => {
                  const next = { ...prev };
                  if (pick) next[l.sku] = pick;
                  else delete next[l.sku];
                  return next;
                })
              }
            />
          ))}
        </ul>
      </div>

      <aside className="lg:col-span-4">
        <div className="space-y-5 rounded-3xl border border-line p-6 lg:sticky lg:top-24">
          <h2 className="eyebrow">Your return</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items</dt>
              <dd className="tabular-nums">{count}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Return shipping</dt>
              <dd>Free</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="eyebrow">Refund</dt>
              <dd className="display text-4xl tabular-nums">{formatPrice(refund)}</dd>
            </div>
          </dl>
          {error && (
            <p className="rounded-2xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">
              {error}
            </p>
          )}
          <Button size="lg" className="w-full" disabled={!canContinue} onClick={onContinue}>
            Continue <ArrowRight className="size-4" />
          </Button>
          {!canContinue && count > 0 && (
            <p className="text-center text-xs text-muted">Add a reason for each item, and a size for exchanges.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ReturnConfirmation({ request, onStartOver }: { request: ReturnRequest; onStartOver: () => void }) {
  const exchanges = request.lines.filter((l) => l.resolution === "exchange");
  const method = RETURN_METHODS[request.method];

  return (
    <div className="gutter pt-12 pb-24 md:pt-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="grid size-14 place-items-center rounded-full bg-lime">
            <Check className="size-6" strokeWidth={2} />
          </span>
          <p className="eyebrow mt-8 text-muted">
            Return {request.id} · Order {request.orderId}
          </p>
          <h1 className="display mt-4 text-6xl md:text-8xl">
            Sorted. <em>Send it back.</em>
          </h1>
          <p className="mt-6 max-w-lg text-muted">
            We&apos;ve emailed the details to <span className="text-ink">{request.email}</span>.{" "}
            {request.method === "pickup"
              ? "A courier will collect it from your door on the next working day — just have it packed."
              : "Pack your pieces, then show the QR code at any drop-off point within 14 days."}
          </p>

          <div className="mt-10">
            <ReturnTracker request={request} />
          </div>

          <dl className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
            <div>
              <dt className="eyebrow text-muted">Refund</dt>
              <dd className="mt-3 text-sm">
                {request.refund > 0
                  ? `${formatPrice(request.refund)} to your original card, within 3 working days of us receiving it.`
                  : "Nothing to refund — exchanges only."}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-muted">Exchanges</dt>
              <dd className="mt-3 text-sm">
                {exchanges.length > 0
                  ? exchanges.map((l) => {
                      const found = findVariant(l.exchangeSku!);
                      return (
                        <span key={l.sku} className="block">
                          {found?.product.name} — {found?.variant.color}, {sizeLabel(found?.variant.size ?? "")}
                        </span>
                      );
                    })
                  : "None"}
                {exchanges.length > 0 && (
                  <span className="mt-1 block text-xs text-muted">Held for you and shipped as soon as your parcel is scanned.</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-12 flex flex-wrap gap-3">
            <Button size="lg" onClick={onStartOver}>
              Back to returns
            </Button>
            <ButtonLink href="/shop" size="lg" variant="outline">
              Keep shopping
            </ButtonLink>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-ink p-6 text-paper md:p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">{method.label}</h2>
              <p className="eyebrow text-lime">Free</p>
            </div>
            <div className="mx-auto mt-8 w-full max-w-64 overflow-hidden rounded-2xl">
              <ReturnQr value={request.id} className="block w-full" />
            </div>
            <p className="display mt-6 text-center text-4xl tracking-wide">{request.id}</p>
            <p className="mt-3 text-center text-xs text-paper/60">{method.detail}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
