"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RETURN_STEPS } from "@/lib/returns";
import type { ReturnRequest } from "@/lib/types";

/** Return requests raised through the portal, kept in this browser only. */
type ReturnsState = {
  returns: ReturnRequest[];
  submit: (input: Omit<ReturnRequest, "id" | "createdAt" | "status">) => ReturnRequest;
  /** Demo only — moves a return to its next tracking step. */
  advance: (id: string) => void;
};

export const useReturns = create<ReturnsState>()(
  persist(
    (set) => ({
      returns: [],
      submit: (input) => {
        const request: ReturnRequest = {
          ...input,
          id: `RT-${Math.floor(10000 + Math.random() * 89999)}`,
          createdAt: new Date().toISOString(),
          status: "requested",
        };
        set((s) => ({ returns: [request, ...s.returns] }));
        return request;
      },
      advance: (id) =>
        set((s) => ({
          returns: s.returns.map((r) => {
            if (r.id !== id) return r;
            const i = RETURN_STEPS.findIndex((step) => step.status === r.status);
            return { ...r, status: RETURN_STEPS[Math.min(i + 1, RETURN_STEPS.length - 1)].status };
          }),
        })),
    }),
    { name: "loud-club-returns" },
  ),
);
