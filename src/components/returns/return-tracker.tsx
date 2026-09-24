"use client";

import { FastForward } from "lucide-react";
import Image from "next/image";
import { findVariant, imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { REASONS, RETURN_METHODS, RETURN_STEPS, sizeLabel } from "@/lib/returns";
import type { ReturnRequest } from "@/lib/types";
import { useReturns } from "@/store/returns";

/** Progress bar through the five return steps, with a demo control to move it along. */
export function ReturnTracker({ request, dark }: { request: ReturnRequest; dark?: boolean }) {
  const advance = useReturns((s) => s.advance);
  const current = RETURN_STEPS.findIndex((s) => s.status === request.status);
  const done = current === RETURN_STEPS.length - 1;

  return (
    <div>
      <ol className="grid grid-cols-5 gap-1.5">
        {RETURN_STEPS.map((step, i) => (
          <li key={step.status}>
            <div
              className={cn(
                "h-1 rounded-full transition-colors duration-500",
                i <= current ? (dark ? "bg-lime" : "bg-cobalt") : dark ? "bg-paper/15" : "bg-stone",
              )}
            />
            <p
              className={cn(
                "eyebrow mt-3 !text-[10px] leading-tight",
                i <= current ? (dark ? "text-paper" : "text-ink") : dark ? "text-paper/40" : "text-muted",
              )}
            >
              {step.label}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm", dark ? "text-paper/70" : "text-muted")} aria-live="polite">
          {RETURN_STEPS[current].detail}
        </p>
        {!done && (
          <button
            type="button"
            onClick={() => advance(request.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
              dark ? "bg-paper/10 text-paper hover:bg-lime hover:text-ink" : "bg-concrete hover:bg-ink hover:text-paper",
            )}
          >
            <FastForward className="size-3.5" strokeWidth={1.5} />
            Simulate next update
          </button>
        )}
      </div>
    </div>
  );
}

/** Compact card for a return in the "your returns" list. */
export function ReturnCard({ request }: { request: ReturnRequest }) {
  const exchanges = request.lines.filter((l) => l.resolution === "exchange").length;

  return (
    <article className="rounded-3xl border border-line p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="display text-3xl">{request.id}</h3>
        <p className="eyebrow text-muted">
          Order {request.orderId} · {formatDate(request.createdAt)}
        </p>
      </header>
      <ul className="mt-5 space-y-3">
        {request.lines.map((l) => {
          const found = findVariant(l.sku);
          if (!found) return null;
          const swap = l.exchangeSku ? findVariant(l.exchangeSku)?.variant : undefined;
          return (
            <li key={l.sku} className="flex items-center gap-3">
              <div className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden bg-stone">
                <Image src={imageUrl(found.product.images[0])} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate">
                  {found.product.name} {l.quantity > 1 && <span className="text-muted">× {l.quantity}</span>}
                </p>
                <p className="text-xs text-muted">
                  {REASONS[l.reason]} ·{" "}
                  {swap ? `Exchange for ${swap.color}, ${sizeLabel(swap.size)}` : "Refund"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        {RETURN_METHODS[request.method].label}
        {request.refund > 0 && <> · {formatPrice(request.refund)} refund</>}
        {exchanges > 0 && <> · {exchanges} {exchanges === 1 ? "exchange" : "exchanges"}</>}
      </p>
      <div className="mt-5">
        <ReturnTracker request={request} />
      </div>
    </article>
  );
}

/** Mock QR code — deterministic from the return id so it looks right but encodes nothing. */
export function ReturnQr({ value, className }: { value: string; className?: string }) {
  const N = 25;
  let h = 2166136261;
  const cells: boolean[] = [];
  for (let i = 0; i < N * N; i++) {
    h ^= value.charCodeAt(i % value.length) + i;
    h = Math.imul(h, 16777619);
    cells.push(((h >>> 0) & 7) < 4);
  }
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  const finders = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];

  return (
    <svg viewBox={`-2 -2 ${N + 4} ${N + 4}`} className={className} role="img" aria-label={`Return code ${value}`}>
      <rect x={-2} y={-2} width={N + 4} height={N + 4} fill="white" />
      {cells.map((on, i) => {
        const x = i % N;
        const y = Math.floor(i / N);
        return on && !inFinder(x, y) ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0e0e10" /> : null;
      })}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`} fill="#0e0e10">
          <path d={`M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z`} fillRule="evenodd" />
          <rect x={x + 2} y={y + 2} width={3} height={3} />
        </g>
      ))}
    </svg>
  );
}
