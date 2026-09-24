"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecommenderInput } from "@/lib/sizing";

/** The shopper's saved measurements, reused across every product page. */
type FitState = {
  profile?: RecommenderInput;
  save: (profile: RecommenderInput) => void;
  reset: () => void;
};

export const useFit = create<FitState>()(
  persist(
    (set) => ({
      profile: undefined,
      save: (profile) => set({ profile }),
      reset: () => set({ profile: undefined }),
    }),
    { name: "loud-club-fit" },
  ),
);
