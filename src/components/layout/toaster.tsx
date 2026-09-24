"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useUI } from "@/store/ui";

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink p-4 text-paper shadow-xl",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                t.tone === "alert" ? "bg-signal" : t.tone === "success" ? "bg-lime" : "bg-cobalt",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs text-paper/70">{t.body}</p>}
              {t.href && (
                <Link href={t.href} onClick={() => dismiss(t.id)} className="mt-2 inline-block text-xs text-lime underline underline-offset-4">
                  View
                </Link>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 rounded-full p-1 text-paper/60 hover:text-paper">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
