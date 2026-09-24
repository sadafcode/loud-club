import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="loud club — home" className={cn("display inline-flex items-baseline gap-[0.18em] leading-none", className)}>
      <span>loud</span>
      <span className="relative italic">
        club
        <span aria-hidden className="absolute -right-[0.32em] top-[0.08em] size-[0.2em] rounded-full bg-lime ring-1 ring-ink/10" />
      </span>
    </Link>
  );
}
