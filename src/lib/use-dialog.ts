"use client";

import { useEffect, type RefObject } from "react";

/**
 * Shared modal behaviour: scroll lock, Esc to close, focus the dialog on open
 * and hand focus back to whatever opened it on close.
 */
export function useDialog(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose, ref]);
}
