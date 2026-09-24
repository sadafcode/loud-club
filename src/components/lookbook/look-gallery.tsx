"use client";

import { Expand } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ZoomLightbox, type GalleryImage } from "@/components/gallery/zoom-lightbox";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/** Staggered editorial layout, repeating every three frames. */
const FRAMES = [
  { tile: "md:col-span-7", ratio: "aspect-[4/5]", sizes: "(min-width: 768px) 55vw, 100vw" },
  { tile: "md:col-span-5 md:mt-40", ratio: "aspect-[3/4]", sizes: "(min-width: 768px) 40vw, 100vw" },
  { tile: "md:col-span-8 md:col-start-3", ratio: "aspect-[4/3]", sizes: "(min-width: 768px) 64vw, 100vw" },
];

/** A chapter's photo story; every frame opens in the StyleZoom viewer. */
export function LookGallery({ title, images }: { title: string; images: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const gallery: GalleryImage[] = images.map((id, i) => ({ id, alt: `${title}, frame ${i + 1}` }));

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-12 md:gap-6">
        {gallery.map((img, i) => {
          const frame = FRAMES[i % FRAMES.length];
          return (
            <li key={img.id} className={frame.tile}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setOpen(true);
                }}
                aria-label={`Open frame ${i + 1} of ${gallery.length} in the zoom viewer`}
                className={cn("group relative block w-full cursor-zoom-in overflow-hidden bg-stone", frame.ratio)}
              >
                <Image
                  src={imageUrl(img.id)}
                  alt={img.alt}
                  fill
                  sizes={frame.sizes}
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                />
                <span className="eyebrow pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-2 text-ink backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <Expand className="size-3.5" />
                  <span className="hidden md:inline">StyleZoom</span>
                </span>
              </button>
              <p className="eyebrow mt-3 text-muted">
                Fig. {String(i + 1).padStart(2, "0")}
              </p>
            </li>
          );
        })}
      </ul>

      <ZoomLightbox
        images={gallery}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onClose={() => setOpen(false)}
        title={title}
      />
    </>
  );
}
