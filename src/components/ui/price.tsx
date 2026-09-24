import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";

export function Price({ value, compareAt, className }: { value: number; compareAt?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span className={compareAt ? "text-signal" : undefined}>{formatPrice(value)}</span>
      {compareAt && (
        <span className="text-muted line-through decoration-1">
          <span className="sr-only">Was </span>
          {formatPrice(compareAt)}
        </span>
      )}
    </span>
  );
}
