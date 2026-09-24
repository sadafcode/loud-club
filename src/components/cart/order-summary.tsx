"use client";

import { Tag, X } from "lucide-react";
import { useState } from "react";
import { findPromo, PROMOS, type orderTotals } from "@/lib/checkout";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";

type Totals = ReturnType<typeof orderTotals>;

export function TotalsTable({ totals, shippingLabel = "Shipping" }: { totals: Totals; shippingLabel?: string }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
      {totals.discount > 0 && (
        <Row label={`Discount (${totals.promo?.code})`} value={`−${formatPrice(totals.discount)}`} className="text-cobalt" />
      )}
      <Row label={shippingLabel} value={totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)} />
      <Row label="Estimated tax" value={formatPrice(totals.tax)} />
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <dt className="eyebrow">Total</dt>
        <dd className="display text-4xl tabular-nums">{formatPrice(totals.total)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className={className ? undefined : "text-muted"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

export function PromoField() {
  const promo = useCart((s) => s.promo);
  const setPromo = useCart((s) => s.setPromo);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const applied = findPromo(promo);

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-concrete px-4 py-3 text-sm">
        <span className="flex items-center gap-2">
          <Tag className="size-4 text-cobalt" strokeWidth={1.5} />
          <span>
            <strong className="font-medium">{applied.code}</strong> — {applied.label}
          </span>
        </span>
        <button onClick={() => setPromo(undefined)} aria-label="Remove promo code" className="rounded-full p-1 text-muted hover:text-ink">
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const found = findPromo(code);
        if (!found) return setError("That code isn't valid.");
        setPromo(found.code);
        setCode("");
        setError(undefined);
      }}
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(undefined);
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          aria-invalid={!!error}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-transparent px-4 text-sm uppercase outline-none placeholder:normal-case focus:border-ink"
        />
        <button type="submit" disabled={!code.trim()} className="h-11 rounded-full border border-ink px-5 text-sm hover:bg-ink hover:text-paper disabled:opacity-40">
          Apply
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {error ? (
          <span className="text-signal">{error}</span>
        ) : (
          <>
            Demo codes:{" "}
            {Object.keys(PROMOS).map((c, i) => (
              <span key={c}>
                {i > 0 && ", "}
                <button type="button" onClick={() => setCode(c)} className="underline underline-offset-2 hover:text-ink">
                  {c}
                </button>
              </span>
            ))}
          </>
        )}
      </p>
    </form>
  );
}
