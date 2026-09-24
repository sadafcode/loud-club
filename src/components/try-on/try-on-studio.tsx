"use client";

import { Camera, Download, Image as ImageIcon, Loader2, Magnet, ShieldCheck, Upload, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { saveLook } from "@/components/try-on/save-look";
import { TryOnStage, type Backdrop } from "@/components/try-on/try-on-stage";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { imageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { detectImage, preloadPose, videoDetector, type Shoulders } from "@/lib/pose";
import { recommendSize } from "@/lib/sizing";
import {
  DRESS_FORM_SHOULDERS,
  ROTATION_RANGE,
  WIDTH_RANGE,
  fitPlacement,
  garmentFor,
  isFacingCamera,
  shouldersToStage,
  smooth,
  type GarmentAsset,
  type Placement,
} from "@/lib/try-on";
import type { Product } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";
import { useCart } from "@/store/cart";
import { useFit } from "@/store/fit";
import { useStockStore } from "@/store/stock";
import { useUI } from "@/store/ui";

export type SamplePhoto = { id: string; label: string };

type CameraState = { status: "idle" | "starting" | "live" } | { status: "error"; message: string };

/** What the auto-fit is doing, shown under the stage. */
type FitStatus = "form" | "loading" | "fitted" | "none" | "error" | "manual" | "tracking" | "searching";

const FIT_MESSAGES: Record<FitStatus, string> = {
  form: "Fitted to the dress form. Try a model, your photo or your camera.",
  loading: "Finding shoulders… the first run downloads the body-tracking model (about 10 MB).",
  fitted: "Fitted to the shoulders. Drag to fine-tune.",
  none: "Couldn't find front-facing shoulders here — drag it into place, or try another photo.",
  error: "Body tracking isn't available on this device — place it by hand.",
  manual: "Placed by hand.",
  tracking: "Tracking you live — move around.",
  searching: "Face the camera and step back so both shoulders are in frame.",
};

export function TryOnStudio({
  products,
  samples,
  initialProductId,
}: {
  products: Product[];
  samples: SamplePhoto[];
  initialProductId?: string;
}) {
  const hydrated = useHydrated();
  const [product, setProduct] = useState(() => products.find((p) => p.id === initialProductId) ?? products[0]);
  const garment = garmentFor(product)!;
  const [colorName, setColorName] = useState(garment.color);
  const [size, setSize] = useState<string>();
  const [placement, setPlacement] = useState<Placement>(() => fitPlacement(DRESS_FORM_SHOULDERS, garment));
  const [backdrop, setBackdrop] = useState<Backdrop>({ kind: "form" });
  const [camera, setCamera] = useState<CameraState>({ status: "idle" });
  const [fit, setFit] = useState<FitStatus>("form");
  /** Shoulders found on the current still backdrop, as stage fractions. */
  const [body, setBody] = useState<Shoulders | null>(DRESS_FORM_SHOULDERS);
  const [follow, setFollow] = useState(true);
  const [showHandles, setShowHandles] = useState(true);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<SVGSVGElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadUrl = useRef<string>(undefined);
  const photoToken = useRef<string>(undefined);
  const liveGarment = useRef<GarmentAsset>(garment);
  useEffect(() => {
    liveGarment.current = garment;
  });

  const overrides = useStockStore((s) => s.overrides);
  const add = useCart((s) => s.add);
  const open = useUI((s) => s.open);
  const toast = useUI((s) => s.toast);
  const profile = useFit((s) => s.profile);

  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];
  const yourSize = hydrated && profile ? recommendSize(product, profile)?.size : undefined;
  const variantFor = (s: string) => product.variants.find((v) => v.color === color.name && v.size === s);
  const stockFor = (s: string) => {
    const v = variantFor(s);
    return v ? (overrides[v.sku] ?? v.stock) : 0;
  };

  const cameraLive = backdrop.kind === "camera" && camera.status === "live";

  // Live camera: start the stream while the camera backdrop is showing, stop it when it isn't.
  const cameraOn = backdrop.kind === "camera";
  useEffect(() => {
    if (!cameraOn) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamera({ status: "live" });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setCamera({
          status: "error",
          message:
            err.name === "NotAllowedError"
              ? "Camera access was blocked. Allow it in your browser, or upload a photo instead."
              : "No camera available. Upload a photo instead.",
        });
        setBackdrop({ kind: "form" });
        setBody(DRESS_FORM_SHOULDERS);
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOn]);

  // Live tracking: pin the garment to the shoulders every frame, smoothed.
  useEffect(() => {
    if (!cameraLive || !follow) return;
    let frame = 0;
    let cancelled = false;
    videoDetector()
      .then((detect) => {
        const loop = () => {
          if (cancelled) return;
          const video = videoRef.current;
          if (video) {
            const found = detect(video, performance.now());
            const shoulders = found && shouldersToStage(found, video.videoWidth, video.videoHeight, true);
            if (shoulders && isFacingCamera(shoulders)) {
              const target = fitPlacement(shoulders, liveGarment.current);
              setPlacement((p) => smooth(p, { ...target, opacity: p.opacity }, 0.35));
              setFit("tracking");
            } else if (found !== undefined) {
              setFit("searching");
            }
          }
          frame = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => !cancelled && setFit("error"));
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [cameraLive, follow]);

  useEffect(() => () => void (uploadUrl.current && URL.revokeObjectURL(uploadUrl.current)), []);

  const fitTo = (shoulders: Shoulders | null, asset: GarmentAsset) => {
    if (shoulders) setPlacement((p) => fitPlacement(shoulders, asset, p.opacity));
  };

  const pickProduct = (p: Product) => {
    const asset = garmentFor(p)!;
    setProduct(p);
    setColorName(asset.color);
    setSize(undefined);
    if (backdrop.kind !== "camera") fitTo(body, asset);
  };

  const showForm = () => {
    setBackdrop({ kind: "form" });
    setBody(DRESS_FORM_SHOULDERS);
    setFit("form");
    fitTo(DRESS_FORM_SHOULDERS, garment);
  };

  const showPhoto = (src: string, label: string) => {
    preloadPose();
    photoToken.current = src;
    setBody(null);
    setFit("loading");
    setBackdrop({ kind: "photo", src, label });
  };

  const onPhotoLoad = async (img: HTMLImageElement) => {
    const token = photoToken.current;
    setFit("loading");
    try {
      const found = await detectImage(img);
      if (photoToken.current !== token) return;
      const shoulders = found && shouldersToStage(found, img.naturalWidth, img.naturalHeight);
      if (!shoulders || !isFacingCamera(shoulders)) {
        // Park it mid-frame rather than wherever the last photo left it.
        setPlacement((p) => fitPlacement(DRESS_FORM_SHOULDERS, liveGarment.current, p.opacity));
        setFit("none");
        return;
      }
      setBody(shoulders);
      fitTo(shoulders, liveGarment.current);
      setFit("fitted");
    } catch {
      if (photoToken.current === token) setFit("error");
    }
  };

  const startCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera({ status: "error", message: "This browser can't open the camera here. Upload a photo instead." });
      return;
    }
    preloadPose();
    photoToken.current = undefined;
    setBody(null);
    setFollow(true);
    setFit("loading");
    setCamera({ status: "starting" });
    setBackdrop({ kind: "camera" });
  };

  const snapshot = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setCamera({ status: "idle" });
    showPhoto(canvas.toDataURL("image/jpeg", 0.9), "Your snapshot");
  };

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "That's not an image", body: "Try a JPG or PNG photo.", tone: "alert" });
      return;
    }
    if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current);
    uploadUrl.current = URL.createObjectURL(file);
    showPhoto(uploadUrl.current, "Your photo");
  };

  const onManual = () => {
    if (backdrop.kind === "camera") setFollow(false);
    setFit("manual");
  };

  const snapToBody = () => {
    if (backdrop.kind === "camera") {
      setFollow(true);
      return;
    }
    fitTo(body, garment);
    setFit(backdrop.kind === "form" ? "form" : "fitted");
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const blob = await saveLook({ backdrop, form: formRef.current, video: videoRef.current, garment, placement });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loud-club-${product.slug}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "Look saved", body: "Check your downloads.", tone: "success" });
    } catch {
      toast({ title: "Couldn't save that look", body: "Try again, or switch backdrop.", tone: "alert" });
    } finally {
      setSaving(false);
    }
  };

  const onAdd = () => {
    const variant = size ? variantFor(size) : undefined;
    if (!variant) {
      toast({ title: "Choose a size first", tone: "alert" });
      return;
    }
    const result = add(variant.sku);
    if (result.ok) open("cart");
    else if (result.reason === "limit")
      toast({ title: `Only ${result.available} available`, body: "They're all in your bag already.", tone: "alert" });
    else toast({ title: "Just sold out", body: `${product.name} in ${color.name}, ${size}.`, tone: "alert" });
  };

  const isSample = (src: string) => samples.some((s) => imageUrl(s.id) === src);
  const canSnap = backdrop.kind === "camera" ? !follow : !!body && fit === "manual";

  return (
    <div className="gutter pt-10 pb-24 md:pt-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-ink pb-6">
        <div>
          <p className="eyebrow text-muted">Virtual try-on</p>
          <h1 className="display mt-3 text-6xl md:text-8xl">
            Try it <em>on.</em>
          </h1>
        </div>
        <p className="flex max-w-xs items-start gap-2 text-xs text-muted">
          <ShieldCheck className="mt-px size-4 shrink-0 text-cobalt" strokeWidth={1.5} />
          Body tracking runs in your browser. Your photo and camera never leave this device.
        </p>
      </header>

      <div className="grid gap-10 pt-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="mx-auto w-full max-w-[560px] lg:sticky lg:top-24">
            <TryOnStage
              backdrop={backdrop}
              placement={placement}
              onPlacement={setPlacement}
              garment={garment}
              garmentLabel={`${product.name} in ${garment.color}`}
              videoRef={videoRef}
              formRef={formRef}
              showHandles={showHandles && !(cameraLive && follow)}
              onPhotoLoad={onPhotoLoad}
              onManual={onManual}
            >
              {backdrop.kind === "camera" && camera.status !== "live" && (
                <div className="absolute inset-0 grid place-items-center bg-ink/80 text-paper">
                  <p className="flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" /> Opening camera…
                  </p>
                </div>
              )}
              {cameraLive && (
                <button
                  type="button"
                  onClick={snapshot}
                  className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-paper px-5 py-3 text-sm shadow-lg hover:bg-lime"
                >
                  <Camera className="size-4" strokeWidth={1.5} /> Take photo
                </button>
              )}
            </TryOnStage>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex min-h-9 items-center gap-2 text-xs text-muted" aria-live="polite">
                {fit === "loading" && <Loader2 className="size-3.5 shrink-0 animate-spin text-cobalt" />}
                {fit === "tracking" && <span className="size-2 shrink-0 animate-pulse rounded-full bg-lime ring-2 ring-ink" />}
                {FIT_MESSAGES[fit]}
                {canSnap && (
                  <button type="button" onClick={snapToBody} className="inline-flex items-center gap-1 text-ink underline underline-offset-4 hover:text-cobalt">
                    <Magnet className="size-3.5" /> {backdrop.kind === "camera" ? "Follow me again" : "Snap to body"}
                  </button>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowHandles((v) => !v)} aria-pressed={!showHandles}>
                  {showHandles ? "Hide handles" : "Show handles"}
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  Save look
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 lg:col-span-5">
          <Panel index="01" title="Pick a piece">
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Garment">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={p.id === product.id}
                  onClick={() => pickProduct(p)}
                  className="group text-left"
                >
                  <div
                    className={cn(
                      "relative aspect-[4/5] overflow-hidden rounded-2xl bg-concrete ring-offset-2 ring-offset-paper transition",
                      p.id === product.id ? "ring-2 ring-ink" : "group-hover:ring-1 group-hover:ring-ink/30",
                    )}
                  >
                    <Image src={garmentFor(p)!.src} alt="" fill sizes="140px" className="object-contain p-3" />
                  </div>
                  <p className="mt-2 truncate text-xs">{p.name}</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel index="02" title="Choose a backdrop">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <BackdropButton active={backdrop.kind === "form"} onClick={showForm} icon={<User className="size-4" strokeWidth={1.5} />}>
                Dress form
              </BackdropButton>
              <BackdropButton
                active={backdrop.kind === "photo" && isSample(backdrop.src)}
                onClick={() => showPhoto(imageUrl(samples[0].id), samples[0].label)}
                icon={<ImageIcon className="size-4" strokeWidth={1.5} />}
              >
                Model
              </BackdropButton>
              <BackdropButton
                active={backdrop.kind === "photo" && !isSample(backdrop.src)}
                onClick={() => fileRef.current?.click()}
                icon={<Upload className="size-4" strokeWidth={1.5} />}
              >
                Your photo
              </BackdropButton>
              <BackdropButton active={backdrop.kind === "camera"} onClick={startCamera} icon={<Camera className="size-4" strokeWidth={1.5} />}>
                Live camera
              </BackdropButton>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="sr-only" tabIndex={-1} aria-hidden="true" />
            {camera.status === "error" && (
              <p className="mt-3 rounded-2xl bg-signal/10 px-4 py-3 text-sm text-signal" role="alert">
                {camera.message}
              </p>
            )}
            {backdrop.kind === "photo" && isSample(backdrop.src) && (
              <div className="mt-3 flex gap-2">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => showPhoto(imageUrl(s.id), s.label)}
                    aria-label={s.label}
                    aria-pressed={backdrop.src === imageUrl(s.id)}
                    className={cn(
                      "relative aspect-[3/4] w-14 overflow-hidden rounded-xl bg-stone ring-offset-2 ring-offset-paper",
                      backdrop.src === imageUrl(s.id) && "ring-2 ring-ink",
                    )}
                  >
                    <Image src={imageUrl(s.id)} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              For the best fit, use a front-facing photo with both shoulders visible.
            </p>
          </Panel>

          <Panel index="03" title="Fine-tune">
            <div className="space-y-5">
              <Slider
                label="Size"
                value={Math.round(placement.width * 100)}
                min={WIDTH_RANGE[0] * 100}
                max={WIDTH_RANGE[1] * 100}
                display={`${Math.round(placement.width * 100)}%`}
                onChange={(v) => {
                  onManual();
                  setPlacement((p) => ({ ...p, width: v / 100 }));
                }}
              />
              <Slider
                label="Rotate"
                value={Math.round(placement.rotation)}
                min={ROTATION_RANGE[0]}
                max={ROTATION_RANGE[1]}
                display={`${Math.round(placement.rotation)}°`}
                onChange={(v) => {
                  onManual();
                  setPlacement((p) => ({ ...p, rotation: v }));
                }}
              />
              <Slider
                label="Opacity"
                value={Math.round(placement.opacity * 100)}
                min={40}
                max={100}
                display={`${Math.round(placement.opacity * 100)}%`}
                onChange={(v) => setPlacement((p) => ({ ...p, opacity: v / 100 }))}
              />
            </div>
          </Panel>

          <Panel index="04" title="Make it yours">
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/product/${product.slug}`} className="text-lg hover:text-cobalt">
                  {product.name}
                </Link>
                <p className="text-xs text-muted">{product.tagline}</p>
              </div>
              <Price value={product.price} compareAt={product.compareAt} className="shrink-0" />
            </div>

            <p className="eyebrow mt-6 text-muted">
              Colour — <span className="text-ink">{color.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={c.name === color.name}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColorName(c.name)}
                  className={cn(
                    "size-9 rounded-full border-2 p-0.5 transition-colors",
                    c.name === color.name ? "border-ink" : "border-transparent hover:border-ink/30",
                  )}
                >
                  <span className="block size-full rounded-full border border-ink/10" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
            {color.name !== garment.color && (
              <p className="mt-2 text-xs text-muted">The try-on shows {garment.color}; you&apos;re buying {color.name}.</p>
            )}

            <p className="eyebrow mt-6 text-muted">
              Size{yourSize && <> — <span className="text-cobalt">your size is {yourSize}</span></>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const left = hydrated ? stockFor(s) : 1;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={left === 0}
                    aria-pressed={size === s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "relative h-11 min-w-14 rounded-full border px-4 text-sm transition-colors",
                      size === s ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink",
                      left === 0 && "text-muted line-through decoration-1",
                    )}
                  >
                    {s === "OS" ? "One size" : s}
                    {s === yourSize && left > 0 && (
                      <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-cobalt ring-2 ring-paper" />
                    )}
                  </button>
                );
              })}
            </div>
            {!profile && hydrated && (
              <p className="mt-3 text-xs text-muted">
                Not sure? The size guide on the{" "}
                <Link href={`/product/${product.slug}`} className="underline underline-offset-4 hover:text-cobalt">
                  product page
                </Link>{" "}
                can recommend one.
              </p>
            )}

            <Button size="lg" className="mt-6 w-full" onClick={onAdd}>
              Add to bag
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 border-b border-line pb-3">
        <span className="eyebrow text-cobalt">{index}</span>
        <span className="display text-3xl">{title}</span>
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BackdropButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs transition-colors",
        active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs">
        <span className="eyebrow text-muted">{label}</span>
        <span className="tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-cobalt"
      />
    </label>
  );
}
