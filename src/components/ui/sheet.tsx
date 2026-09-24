"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Side = "right" | "left" | "top";

const PANEL: Record<Side, string> = {
  right: "inset-y-0 right-0 w-full max-w-md",
  left: "inset-y-0 left-0 w-full max-w-sm",
  top: "inset-x-0 top-0 max-h-[90vh]",
};

const OFFSCREEN: Record<Side, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  top: { y: "-100%" },
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Modal side panel: overlay, Esc/overlay to close, scroll lock, focus restore. */
export function Sheet({
  open,
  onClose,
  side = "right",
  label,
  title,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: Side;
  label: string;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={cn("absolute flex flex-col bg-paper shadow-2xl outline-none", PANEL[side], className)}
            initial={OFFSCREEN[side]}
            animate={{ x: 0, y: 0 }}
            exit={OFFSCREEN[side]}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {title !== undefined && (
              <div className="flex items-center justify-between border-b border-line px-6 py-5">
                <div className="eyebrow">{title}</div>
                <button onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 hover:bg-ink/5">
                  <X className="size-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
