"use client";

import imageLoader from "@/lib/image-loader";
import type { GarmentAsset, Placement } from "@/lib/try-on";
import type { Backdrop } from "@/components/try-on/try-on-stage";

const W = 900;
const H = 1200;

function loadImage(src: string, cors: boolean) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

async function svgImage(svg: SVGSVGElement) {
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
  try {
    return await loadImage(url, false);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draw a source so it fills the canvas like `object-fit: cover`. */
function drawCover(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sw: number, sh: number, mirror = false) {
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  if (mirror) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
  ctx.restore();
}

/** Composite the backdrop and garment into a PNG, exactly as placed on the stage. */
export async function saveLook({
  backdrop,
  form,
  video,
  garment,
  placement,
}: {
  backdrop: Backdrop;
  form: SVGSVGElement | null;
  video: HTMLVideoElement | null;
  garment: GarmentAsset;
  placement: Placement;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ECEAE4";
  ctx.fillRect(0, 0, W, H);

  if (backdrop.kind === "form" && form) {
    ctx.drawImage(await svgImage(form), 0, 0, W, H);
  } else if (backdrop.kind === "photo") {
    const remote = backdrop.src.startsWith("http");
    const src = remote ? imageLoader({ src: backdrop.src, width: 1200, quality: 90 }) : backdrop.src;
    const img = await loadImage(src, remote);
    drawCover(ctx, img, img.naturalWidth, img.naturalHeight);
  } else if (backdrop.kind === "camera" && video?.videoWidth) {
    drawCover(ctx, video, video.videoWidth, video.videoHeight, true);
  }

  const gw = placement.width * W;
  const gh = gw / garment.aspect;
  const garmentImage = await loadImage(garment.src, false);
  ctx.save();
  ctx.translate(placement.x * W, placement.y * H);
  ctx.rotate((placement.rotation * Math.PI) / 180);
  ctx.globalAlpha = placement.opacity;
  ctx.shadowColor = "rgba(14,14,16,0.28)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 24;
  ctx.drawImage(garmentImage, -gw / 2, -gh / 2, gw, gh);
  ctx.restore();

  ctx.fillStyle = "#0E0E10";
  ctx.fillRect(28, H - 72, 250, 44);
  ctx.fillStyle = "#C6F432";
  ctx.font = "italic 26px Georgia, serif";
  ctx.textBaseline = "middle";
  ctx.fillText("loud club · try-on", 44, H - 50);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))), "image/png"),
  );
}
