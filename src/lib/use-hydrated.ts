"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the hydration render, true afterwards. Gate anything
 * read from persisted stores (cart count, wishlist) on this to avoid
 * hydration mismatches.
 */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
