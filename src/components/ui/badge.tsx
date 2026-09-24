import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "default" | "new" | "sale" | "low" | "sold-out" | "cobalt";

const TONES: Record<Tone, string> = {
  default: "bg-paper text-ink",
  new: "bg-lime text-ink",
  sale: "bg-signal text-white",
  low: "bg-ink text-lime",
  "sold-out": "bg-stone text-muted",
  cobalt: "bg-cobalt text-white",
};

export function Badge({ tone = "default", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("eyebrow inline-flex items-center gap-1 rounded-full px-2.5 py-1 !text-[10px] leading-none", TONES[tone], className)}>
      {children}
    </span>
  );
}
