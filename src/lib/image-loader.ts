"use client";

import type { ImageLoaderProps } from "next/image";

/**
 * Unsplash resizes on its CDN, so hand it the width/quality directly instead of
 * round-tripping through the Next image optimizer. Local files pass through.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}
