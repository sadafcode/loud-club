"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { useDialog } from "@/lib/use-dialog";
import { useHydrated } from "@/lib/use-hydrated";

export type GalleryImage = { id: string; alt: string };

const MIN = 1;
const MAX = 4;
const TAP_ZOOM = 2.5;
const STEP = 0.75;
const SWIPE = 60;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * StyleZoom viewer: full-screen gallery with click/tap to zoom, wheel and
 * pinch zoom around the pointer, drag to pan, swipe and arrow keys to page.
 */
export function ZoomLightbox({
  images,
  index,
  onIndexChange,
  open,
  onClose,
  title,
}: {
  images: GalleryImage[];
  index: number;
  onIndexChange: (index: number) => void;
  open: boolean;
  onClose: () => void;
  title: string;
}) {
  const hydrated = useHydrated();
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageHandle>(null);
  const [scale, setScale] = useState(1);

  useDialog(open, onClose, dialogRef);

  const count = images.length;
  const go = useCallback(
    (delta: number) => count > 1 && onIndexChange((index + delta + count) % count),
    [count, index, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") stageRef.current?.zoomBy(STEP);
      else if (e.key === "-") stageRef.current?.zoomBy(-STEP);
      else if (e.key === "0") stageRef.current?.reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (!hydrated) return null;
  const image = images[index];

  return createPortal(
    <AnimatePresence>
      {open && image && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — image viewer`}
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex flex-col bg-ink text-paper outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <header className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="eyebrow text-lime">StyleZoom</p>
              <p className="truncate text-sm text-paper/80">{title}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="mr-2 hidden items-center gap-1 rounded-full border border-paper/15 p-1 sm:flex">
                <IconButton label="Zoom out" onClick={() => stageRef.current?.zoomBy(-STEP)} disabled={scale <= MIN}>
                  <Minus className="size-4" />
                </IconButton>
                <span className="eyebrow w-12 text-center tabular-nums" aria-live="polite">
                  {scale.toFixed(1)}×
                </span>
                <IconButton label="Zoom in" onClick={() => stageRef.current?.zoomBy(STEP)} disabled={scale >= MAX}>
                  <Plus className="size-4" />
                </IconButton>
                <IconButton label="Reset zoom" onClick={() => stageRef.current?.reset()} disabled={scale === MIN}>
                  <RotateCcw className="size-4" />
                </IconButton>
              </div>
              <span className="eyebrow mr-2 tabular-nums text-paper/60">
                {pad(index + 1)} / {pad(count)}
              </span>
              <IconButton label="Close viewer" onClick={onClose} className="bg-paper text-ink hover:bg-lime">
                <X className="size-5" />
              </IconButton>
            </div>
          </header>

          <div className="relative min-h-0 flex-1">
            {/* Keyed by image so zoom and pan reset when paging. */}
            <ZoomStage
              key={image.id}
              ref={stageRef}
              image={image}
              onScaleChange={setScale}
              onSwipe={go}
            />
            {count > 1 && (
              <>
                <IconButton
                  label="Previous image"
                  onClick={() => go(-1)}
                  className="absolute left-3 top-1/2 hidden -translate-y-1/2 bg-paper/10 backdrop-blur hover:bg-paper hover:text-ink md:grid"
                >
                  <ChevronLeft className="size-5" />
                </IconButton>
                <IconButton
                  label="Next image"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 hidden -translate-y-1/2 bg-paper/10 backdrop-blur hover:bg-paper hover:text-ink md:grid"
                >
                  <ChevronRight className="size-5" />
                </IconButton>
              </>
            )}
          </div>

          <footer className="flex flex-col items-center gap-3 px-4 pt-3 pb-4">
            {count > 1 && (
              <ul className="flex max-w-full gap-2 overflow-x-auto [scrollbar-width:none]">
                {images.map((img, i) => (
                  <li key={img.id} className="shrink-0">
                    <button
                      onClick={() => onIndexChange(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === index}
                      className={cn(
                        "relative block aspect-[4/5] w-12 overflow-hidden bg-paper/10 transition md:w-14",
                        i === index ? "ring-2 ring-lime" : "opacity-50 hover:opacity-100",
                      )}
                    >
                      <Image src={imageUrl(img.id)} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="eyebrow text-center text-paper/40">
              <span className="hidden md:inline">Click or scroll to zoom · drag to pan{count > 1 && " · ← → to browse"}</span>
              <span className="md:hidden">Tap or pinch to zoom · drag to pan{count > 1 && " · swipe to browse"}</span>
            </p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

type StageHandle = { zoomBy: (delta: number) => void; reset: () => void };
type View = { s: number; x: number; y: number };

type Gesture =
  | { kind: "pan"; startX: number; startY: number; origin: View; moved: number; at: number }
  | { kind: "pinch"; dist: number; origin: View; mid: { x: number; y: number } };

function ZoomStage({
  ref,
  image,
  onScaleChange,
  onSwipe,
}: {
  ref: Ref<StageHandle>;
  image: GalleryImage;
  onScaleChange: (scale: number) => void;
  onSwipe: (delta: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  // The first zoom swaps in a sharper render of the photo.
  const [hires, setHires] = useState(false);
  const aspect = useRef(4 / 5);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);

  /** Keep the zoomed photo covering the stage — no panning into empty space. */
  const bound = useCallback((v: View): View => {
    const el = stageRef.current;
    if (!el) return v;
    const { width: W, height: H } = el.getBoundingClientRect();
    const w = Math.min(W, H * aspect.current);
    const h = Math.min(H, W / aspect.current);
    const maxX = Math.max(0, (v.s * w - W) / 2);
    const maxY = Math.max(0, (v.s * h - H) / 2);
    return { s: v.s, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
  }, []);

  /** Point relative to the stage centre. */
  const local = useCallback((clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
  }, []);

  /** Zoom to `s` while keeping the stage point `p` fixed under the pointer. */
  const zoomAt = useCallback(
    (from: View, s: number, p = { x: 0, y: 0 }) => {
      const next = clamp(s, MIN, MAX);
      const k = next / from.s;
      return bound({ s: next, x: p.x - (p.x - from.x) * k, y: p.y - (p.y - from.y) * k });
    },
    [bound],
  );

  if (view.s > 1.2 && !hires) setHires(true);

  useEffect(() => onScaleChange(view.s), [view.s, onScaleChange]);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (delta) => setView((v) => zoomAt(v, v.s + delta)),
      reset: () => setView({ s: 1, x: 0, y: 0 }),
    }),
    [zoomAt],
  );

  // React registers wheel listeners as passive, so preventDefault needs a native one.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e.clientX, e.clientY);
      setView((v) => zoomAt(v, v.s * Math.exp(-e.deltaY * 0.0025), p));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [local, zoomAt]);

  useEffect(() => {
    const onResize = () => setView((v) => bound(v));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bound]);

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      gesture.current = {
        kind: "pinch",
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        origin: view,
        mid: local((a.x + b.x) / 2, (a.y + b.y) / 2),
      };
    } else if (pts.length === 1) {
      gesture.current = { kind: "pan", startX: pts[0].x, startY: pts[0].y, origin: view, moved: 0, at: Date.now() };
    }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    startGesture();
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / g.dist;
      setView(zoomAt(g.origin, g.origin.s * ratio, g.mid));
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    if (g.origin.s > 1) setView(bound({ s: g.origin.s, x: g.origin.x + dx, y: g.origin.y + dy }));
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;

    if (g?.kind === "pan" && pointers.current.size === 0) {
      const dx = e.clientX - g.startX;
      const isTap = g.moved < 6 && Date.now() - g.at < 350;
      if (isTap && e.type === "pointerup") {
        // Tap toggles between fit and a close-up centred where you tapped.
        setView((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : zoomAt(v, TAP_ZOOM, local(e.clientX, e.clientY))));
      } else if (g.origin.s === 1 && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - g.startY)) {
        onSwipe(dx < 0 ? 1 : -1);
      }
    }

    if (pointers.current.size === 0) {
      gesture.current = null;
      setDragging(false);
    } else {
      // Lifting one finger of a pinch hands over to a pan with the other.
      startGesture();
    }
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "absolute inset-0 touch-none select-none overflow-hidden",
        view.s > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
            transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Same render as the thumbnail, so it's already cached and fills the gap while the full photo loads. */}
          <Image
            src={imageUrl(image.id)}
            alt=""
            fill
            sizes="56px"
            draggable={false}
            className="pointer-events-none object-contain blur-md"
          />
          <Image
            src={imageUrl(image.id)}
            alt={image.alt}
            fill
            quality={90}
            sizes="100vw"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth) aspect.current = img.naturalWidth / img.naturalHeight;
            }}
            className="pointer-events-none object-contain"
          />
          {hires && (
            <Image
              src={imageUrl(image.id)}
              alt=""
              fill
              quality={90}
              sizes="250vw"
              draggable={false}
              className="pointer-events-none object-contain opacity-0 transition-opacity duration-300"
              onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function IconButton({
  label,
  className,
  ...props
}: { label: string } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid size-10 place-items-center rounded-full transition-colors hover:bg-paper/10 disabled:pointer-events-none disabled:opacity-30",
        className,
      )}
      {...props}
    />
  );
}
