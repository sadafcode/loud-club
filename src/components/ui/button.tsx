import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "accent" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-cobalt",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  accent: "bg-lime text-ink hover:bg-ink hover:text-lime",
  ghost: "text-ink hover:bg-ink/5",
  inverse: "bg-paper text-ink hover:bg-lime",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide whitespace-nowrap",
    "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Styling = { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & Styling) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & Styling) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
