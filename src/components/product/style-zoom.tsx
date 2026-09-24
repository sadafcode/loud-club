"use client";

import { Expand } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { ZoomLightbox, type GalleryImage } from "@/components/gallery/zoom-lightbox";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/**
 * Product gallery: a swipeable strip on mobile, an editorial grid on desktop.
 * Hovering a photo with a mouse magnifies it under the cursor; clicking opens
 * the full-screen StyleZoom viewer.
 */
export function StyleZoom({ name, images }: { name: string; images: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const gallery: GalleryImage[] = images.map((id, i) => ({ id, alt: i === 0 ? name : `${name}, view ${i + 1}` }));

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  return (
    <>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:px-0">
        {gallery.map((img, i) => (
          <li
            key={img.id}
            className={cn(
              "shrink-0 snap-start lg:w-auto",
              gallery.length === 1 ? "w-full" : "w-[86%]",
              // The hero runs full width only when that leaves an even 2-up grid below it.
              i === 0 && gallery.length % 2 === 1 && "lg:col-span-2",
            )}
          >
            <ZoomTile
              image={img}
              hero={i === 0}
              wide={i === 0 && gallery.length % 2 === 1}
              label={`Open ${img.alt} in the zoom viewer (${i + 1} of ${gallery.length})`}
              onOpen={() => show(i)}
            />
          </li>
        ))}
      </ul>

      <ZoomLightbox
        images={gallery}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onClose={() => setOpen(false)}
        title={name}
      />
    </>
  );
}

const LENS_SCALE = 2.2;

function ZoomTile({
  image,
  hero,
  wide,
  label,
  onOpen,
}: {
  image: GalleryImage;
  hero: boolean;
  wide: boolean;
  label: string;
  onOpen: () => void;
}) {
  const lensRef = useRef<HTMLDivElement>(null);
  // The magnified layer only loads once someone actually hovers.
  const [lens, setLens] = useState(false);

  const track = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    if (!lens) setLens(true);
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    lensRef.current?.style.setProperty("transform-origin", `${x}% ${y}%`);
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={track}
      onPointerMove={track}
      aria-label={label}
      className={cn(
        "group relative block w-full cursor-zoom-in overflow-hidden bg-stone",
        wide ? "aspect-[4/5]" : "aspect-[3/4]",
      )}
    >
      <Image
        src={imageUrl(image.id)}
        alt={image.alt}
        fill
        preload={hero}
        sizes={wide ? "(min-width: 1024px) 55vw, 86vw" : "(min-width: 1024px) 28vw, 86vw"}
        className="object-cover"
      />
      {lens && (
        <div
          ref={lensRef}
          aria-hidden
          className="absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block"
          style={{ transform: `scale(${LENS_SCALE})` }}
        >
          <Image
            src={imageUrl(image.id)}
            alt=""
            fill
            quality={90}
            sizes={wide ? "120vw" : "62vw"}
            className="object-cover"
          />
        </div>
      )}
      <span className="eyebrow pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-2 text-ink backdrop-blur transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
        <Expand className="size-3.5" />
        <span className="hidden lg:inline">StyleZoom</span>
      </span>
    </button>
  );
}
