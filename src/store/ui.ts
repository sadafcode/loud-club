"use client";

import { create } from "zustand";

export type Toast = {
  id: number;
  title: string;
  body?: string;
  href?: string;
  tone?: "default" | "success" | "alert";
};

type Panel = "cart" | "search" | "menu" | null;

type UIState = {
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useUI = create<UIState>()((set) => ({
  panel: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  toasts: [],
  toast: (toast) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
