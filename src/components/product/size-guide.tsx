"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Ruler } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  cmToIn,
  FIT_LABELS,
  getSizeChart,
  recommendSize,
  type FitPreference,
  type RecommenderInput,
} from "@/lib/sizing";
import type { Product } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useFit } from "@/store/fit";
import { Sheet } from "@/components/ui/sheet";

const PREFERENCES: { value: FitPreference; label: string }[] = [
  { value: "closer", label: "Closer" },
  { value: "true", label: "True to size" },
  { value: "looser", label: "Looser" },
];

const DEFAULT_INPUT: RecommenderInput = { heightCm: 172, weightKg: 66, preference: "true" };

const HOW_TO_MEASURE: Record<string, string> = {
  Chest: "Around the fullest part of your chest, under the arms.",
  Waist: "Around your natural waistline, where you bend.",
  Hip: "Around the fullest part of your hips.",
  "Foot length": "Heel to longest toe, standing, wearing socks.",
};

const feetInches = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
};

export function SizeGuide({
  product,
  open,
  onClose,
  onSelect,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSelect: (size: string) => void;
}) {
  const chart = getSizeChart(product);
  const canRecommend = product.sizeSystem === "alpha" || product.sizeSystem === "waist";
  const [tab, setTab] = useState<"fit" | "chart">(canRecommend ? "fit" : "chart");
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  const hydrated = useHydrated();
  const saved = useFit((s) => s.profile);
  const save = useFit((s) => s.save);
  const [draft, setDraft] = useState<RecommenderInput>();
  const input = draft ?? (hydrated ? saved : undefined) ?? DEFAULT_INPUT;
  const rec = canRecommend ? recommendSize(product, input) : null;
  const update = (patch: Partial<RecommenderInput>) => setDraft({ ...input, ...patch });

  if (!chart) return null;

  return (
    <Sheet open={open} onClose={onClose} label="Size guide" title="Size guide" className="max-w-lg">
      <div className="border-b border-line px-6 pt-5">
        <p className="display text-3xl">{product.name}</p>
        <p className="mt-1 text-xs text-muted">{FIT_LABELS[product.fit]}</p>
        {canRecommend && (
          <div role="tablist" className="mt-5 flex gap-6">
            {(["fit", "chart"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-sm transition-colors",
                  tab === t ? "border-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t === "fit" ? "Find my size" : "Size chart"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === "fit" && rec ? (
          <div className="space-y-7">
            <Slider
              label="Height"
              value={input.heightCm}
              min={148}
              max={202}
              display={`${input.heightCm} cm · ${feetInches(input.heightCm)}`}
              onChange={(heightCm) => update({ heightCm })}
            />
            <Slider
              label="Weight"
              value={input.weightKg}
              min={40}
              max={125}
              display={`${input.weightKg} kg · ${Math.round(input.weightKg * 2.2046)} lb`}
              onChange={(weightKg) => update({ weightKg })}
            />
            <fieldset>
              <legend className="eyebrow text-muted">How do you like it to fit?</legend>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-concrete p-1">
                {PREFERENCES.map((p) => (
                  <button
                    key={p.value}
                    aria-pressed={input.preference === p.value}
                    onClick={() => update({ preference: p.value })}
                    className={cn(
                      "rounded-full py-2 text-sm transition-colors",
                      input.preference === p.value ? "bg-ink text-paper" : "hover:bg-ink/5",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="rounded-3xl bg-ink p-6 text-paper" aria-live="polite">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-lime">We recommend</p>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={rec.size}
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -16, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="display mt-2 text-7xl"
                    >
                      {rec.size}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="w-32 text-right">
                  <p className="eyebrow text-paper/60">Confidence</p>
                  <p className="mt-2 text-2xl tabular-nums">{rec.confidence}%</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper/15">
                    <motion.div
                      className="h-full rounded-full bg-lime"
                      animate={{ width: `${rec.confidence}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-paper/80">{rec.summary}</p>
              {rec.alternative && (
                <p className="mt-2 text-sm text-paper/60">
                  Between sizes — {rec.alternative.reason.toLowerCase()}: <span className="text-paper">{rec.alternative.size}</span>
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="accent"
                  onClick={() => {
                    save(input);
                    onSelect(rec.size);
                    onClose();
                  }}
                >
                  Select {rec.size}
                </Button>
                {rec.alternative && (
                  <Button
                    variant="ghost"
                    className="text-paper hover:bg-paper/10"
                    onClick={() => {
                      save(input);
                      onSelect(rec.alternative!.size);
                      onClose();
                    }}
                  >
                    Select {rec.alternative.size}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted">
              Your measurements stay in this browser and are reused on every product.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-muted">Body measurements</p>
              <div className="flex rounded-full bg-concrete p-0.5 text-xs">
                {(["cm", "in"] as const).map((u) => (
                  <button
                    key={u}
                    aria-pressed={unit === u}
                    onClick={() => setUnit(u)}
                    className={cn("rounded-full px-3 py-1", unit === u && "bg-ink text-paper")}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="eyebrow py-3 font-normal">Size</th>
                  {chart.columns.map((c) => (
                    <th key={c} className="eyebrow py-3 text-right font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chart.rows.map((row) => {
                  const mine = hydrated && saved && rec?.size === row.size;
                  return (
                    <tr key={row.size} className={cn("border-b border-line", mine && "bg-lime/40")}>
                      <td className="py-3 font-medium">
                        {row.size}
                        {mine && <span className="eyebrow ml-2 !text-[9px]">Your fit</span>}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="py-3 text-right">
                          {unit === "cm" ? v : cmToIn(v)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted">{chart.note}</p>
            <div className="rounded-2xl border border-line p-5">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Ruler className="size-4" strokeWidth={1.5} /> How to measure
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                {chart.columns
                  .filter((c) => HOW_TO_MEASURE[c])
                  .map((c) => (
                    <div key={c}>
                      <dt className="inline font-medium">{c}: </dt>
                      <dd className="inline text-muted">{HOW_TO_MEASURE[c]}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  onChange: (value: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="eyebrow text-muted">{label}</span>
        <span className="text-sm tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full accent-ink"
        style={{ background: `linear-gradient(to right, var(--ink) ${pct}%, var(--stone) ${pct}%)` }}
      />
    </label>
  );
}
