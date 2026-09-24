"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@/lib/types";

/** Orders placed through the demo checkout, kept in this browser only. */
type OrdersState = {
  orders: Order[];
  place: (order: Omit<Order, "id" | "placedAt" | "status">) => Order;
};

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      place: (input) => {
        const order: Order = {
          ...input,
          id: `LC-${Math.floor(20000 + Math.random() * 79999)}`,
          placedAt: new Date().toISOString(),
          status: "processing",
        };
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },
    }),
    { name: "loud-club-orders" },
  ),
);
