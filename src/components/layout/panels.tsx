"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUI } from "@/store/ui";
import { CartDrawer } from "./cart-drawer";
import { MobileMenu } from "./mobile-menu";
import { SearchOverlay } from "./search-overlay";
import { Toaster } from "./toaster";

/** Global overlays. Any open panel closes when the route changes. */
export function Panels() {
  const pathname = usePathname();
  const close = useUI((s) => s.close);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    close();
  }

  return (
    <>
      <CartDrawer />
      <SearchOverlay />
      <MobileMenu />
      <Toaster />
    </>
  );
}
