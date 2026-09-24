"use client";

import { RotateCw, Scaling } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from "react";
import { DRESS_FORM, ROTATION_RANGE, WIDTH_RANGE, type GarmentAsset, type Placement } from "@/lib/try-on";

export type Backdrop =
  | { kind: "form" }
  | { kind: "photo"; src: string; label: string }
  | { kind: "camera" };

type Gesture = {
  mode: "move" | "scale" | "rotate";
  start: Placement;
  px: number;
  py: number;
  cx: number;
  cy: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function TryOnStage({
  backdrop,
  placement,
  onPlacement,
  garment,
  garmentLabel,
  videoRef,
  formRef,
  showHandles,
  onPhotoLoad,
  onManual,
  children,
}: {
  backdrop: Backdrop;
  placement: Placement;
  onPlacement: (p: Placement) => void;
  garment: GarmentAsset;
  garmentLabel: string;
  videoRef: Ref<HTMLVideoElement>;
  formRef: Ref<SVGSVGElement>;
  showHandles: boolean;
  /** Fires with the loaded photo element, so it can be run through pose detection. */
  onPhotoLoad: (img: HTMLImageElement) => void;
  /** The shopper moved the garment themselves — stop auto-fitting over them. */
  onManual: () => void;
  children?: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const latest = useRef({ placement, onPlacement, onManual });
  useEffect(() => {
    latest.current = { placement, onPlacement, onManual };
  });

  // Wheel to resize — attached manually so it can be non-passive and stop the page scrolling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { placement: p, onPlacement: set, onManual: manual } = latest.current;
      manual();
      set({ ...p, width: clamp(p.width * (e.deltaY < 0 ? 1.04 : 0.96), ...WIDTH_RANGE) });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const begin = (e: PointerEvent<HTMLElement>, mode: Gesture["mode"]) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onManual();
    gesture.current = {
      mode,
      start: placement,
      px: e.clientX,
      py: e.clientY,
      cx: rect.left + placement.x * rect.width,
      cy: rect.top + placement.y * rect.height,
    };
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!g || !rect) return;
    const { start } = g;
    if (g.mode === "move") {
      onPlacement({
        ...start,
        x: clamp(start.x + (e.clientX - g.px) / rect.width, 0, 1),
        y: clamp(start.y + (e.clientY - g.py) / rect.height, 0, 1),
      });
    } else if (g.mode === "scale") {
      const from = Math.hypot(g.px - g.cx, g.py - g.cy) || 1;
      const to = Math.hypot(e.clientX - g.cx, e.clientY - g.cy);
      onPlacement({ ...start, width: clamp((start.width * to) / from, ...WIDTH_RANGE) });
    } else {
      const angle = (x: number, y: number) => (Math.atan2(y - g.cy, x - g.cx) * 180) / Math.PI;
      const rotation = start.rotation + angle(e.clientX, e.clientY) - angle(g.px, g.py);
      onPlacement({ ...start, rotation: clamp(Math.round(rotation), ...ROTATION_RANGE) });
    }
  };

  const end = () => {
    gesture.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const p = placement;
    const next: Record<string, Placement> = {
      ArrowLeft: { ...p, x: clamp(p.x - step, 0, 1) },
      ArrowRight: { ...p, x: clamp(p.x + step, 0, 1) },
      ArrowUp: { ...p, y: clamp(p.y - step, 0, 1) },
      ArrowDown: { ...p, y: clamp(p.y + step, 0, 1) },
      "+": { ...p, width: clamp(p.width * 1.04, ...WIDTH_RANGE) },
      "=": { ...p, width: clamp(p.width * 1.04, ...WIDTH_RANGE) },
      "-": { ...p, width: clamp(p.width * 0.96, ...WIDTH_RANGE) },
      "[": { ...p, rotation: clamp(p.rotation - 2, ...ROTATION_RANGE) },
      "]": { ...p, rotation: clamp(p.rotation + 2, ...ROTATION_RANGE) },
    };
    if (next[e.key]) {
      e.preventDefault();
      onManual();
      onPlacement(next[e.key]);
    }
  };

  return (
    <div
      ref={stageRef}
      className="relative aspect-[3/4] w-full touch-none overflow-hidden rounded-3xl bg-concrete select-none"
    >
      {backdrop.kind === "form" && (
        <svg
          ref={formRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 300 400"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <rect width="300" height="400" fill="#ECEAE4" />
          <ellipse cx="150" cy="388" rx="46" ry="6" fill="#0E0E10" fillOpacity="0.12" />
          <rect x="146" y="350" width="8" height="36" rx="2" fill="#0E0E10" fillOpacity="0.55" />
          <path d={DRESS_FORM} fill="#D8D3C8" stroke="#0E0E10" strokeOpacity="0.14" />
          <path d="M150 90 L150 350" stroke="#0E0E10" strokeOpacity="0.08" strokeDasharray="2 4" />
          <ellipse cx="150" cy="88" rx="16" ry="4" fill="#C9C3B6" />
        </svg>
      )}
      {backdrop.kind === "photo" && (
        <Image
          src={backdrop.src}
          alt={backdrop.label}
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          className="object-cover"
          crossOrigin="anonymous"
          onLoad={(e) => onPhotoLoad(e.currentTarget)}
          priority
        />
      )}
      {backdrop.kind === "camera" && (
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full -scale-x-100 object-cover" />
      )}

      <div
        role="application"
        tabIndex={0}
        aria-label={`${garmentLabel}. Drag to move. Arrow keys move, plus and minus resize, square brackets rotate.`}
        onPointerDown={(e) => begin(e, "move")}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        className="group absolute cursor-grab outline-none active:cursor-grabbing"
        style={{
          left: `${placement.x * 100}%`,
          top: `${placement.y * 100}%`,
          width: `${placement.width * 100}%`,
          aspectRatio: `${garment.aspect}`,
          transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
          opacity: placement.opacity,
        }}
      >
        <Image
          src={garment.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 560px, 100vw"
          draggable={false}
          priority
          className="pointer-events-none object-contain drop-shadow-[0_14px_18px_rgba(14,14,16,0.3)]"
        />
        {showHandles && (
          <>
            <div className="pointer-events-none absolute -inset-2 rounded-xl border border-dashed border-ink/30 group-focus-visible:border-2 group-focus-visible:border-cobalt" />
            <button
              type="button"
              aria-label="Drag to rotate"
              tabIndex={-1}
              onPointerDown={(e) => begin(e, "rotate")}
              onPointerMove={move}
              onPointerUp={end}
              className="absolute -top-10 left-1/2 grid size-8 -translate-x-1/2 cursor-alias place-items-center rounded-full bg-ink text-lime shadow-lg"
            >
              <RotateCw className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Drag to resize"
              tabIndex={-1}
              onPointerDown={(e) => begin(e, "scale")}
              onPointerMove={move}
              onPointerUp={end}
              className="absolute -right-4 -bottom-4 grid size-8 cursor-nwse-resize place-items-center rounded-full bg-lime text-ink shadow-lg"
            >
              <Scaling className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {children}
    </div>
  );
}
