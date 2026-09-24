import type { Point, Shoulders } from "@/lib/pose";
import type { Product } from "@/lib/types";

/**
 * Virtual try-on data. Each try-on product has a background-free cut-out of
 * its product photo in /public/try-on, plus where the garment's shoulder
 * seams sit in that image, so it can be pinned to a detected body.
 */

export type GarmentAsset = {
  src: string;
  /** Width ÷ height of the image. */
  aspect: number;
  /** Shoulder seam points, as fractions of the image, left then right as they appear. */
  shoulders: [[number, number], [number, number]];
  /** The colourway in the photo. */
  color: string;
};

const GARMENTS: Record<string, GarmentAsset> = {
  "essential-heavyweight-tee": {
    src: "/try-on/essential-heavyweight-tee.webp",
    aspect: 527 / 698,
    shoulders: [[0.1, 0.11], [0.9, 0.11]],
    color: "Optic White",
  },
  "noir-mark-tee": {
    src: "/try-on/noir-mark-tee.webp",
    aspect: 762 / 1000,
    shoulders: [[0.11, 0.1], [0.89, 0.1]],
    color: "Ink",
  },
  "cloud-crew-sweatshirt": {
    src: "/try-on/cloud-crew-sweatshirt.webp",
    aspect: 863 / 770,
    shoulders: [[0.15, 0.14], [0.73, 0.13]],
    color: "Optic White",
  },
  "copper-bomber": {
    src: "/try-on/copper-bomber.webp",
    aspect: 839 / 1000,
    shoulders: [[0.16, 0.11], [0.81, 0.1]],
    color: "Copper",
  },
  "selvedge-denim-jacket": {
    src: "/try-on/selvedge-denim-jacket.webp",
    aspect: 900 / 963,
    shoulders: [[0.23, 0.17], [0.82, 0.16]],
    color: "Raw Indigo",
  },
  "chambray-dot-shirt": {
    src: "/try-on/chambray-dot-shirt.webp",
    aspect: 900 / 708,
    shoulders: [[0.22, 0.13], [0.77, 0.13]],
    color: "Chambray",
  },
};

export function garmentFor(product: Product): GarmentAsset | undefined {
  return GARMENTS[product.id];
}

/** Where a garment sits on the stage: centre as a fraction of it, width as a fraction of its width. */
export type Placement = { x: number; y: number; width: number; rotation: number; opacity: number };

export const WIDTH_RANGE = [0.15, 2.5] as const;
export const ROTATION_RANGE = [-45, 45] as const;

/** Stage is 3:4 — fitting maths runs in these units so x and y share a scale. */
const STAGE = { w: 300, h: 400 };

/** Garment shoulder seams sit a little outside and above the shoulder joints pose detection returns. */
const SPAN = 1.18;
const LIFT = 0.1;

const clamp = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v));

/** Place a garment so its shoulder seams line up with body shoulders (given as stage fractions). */
export function fitPlacement(body: Shoulders, garment: GarmentAsset, opacity = 1): Placement {
  const L = { x: body[0].x * STAGE.w, y: body[0].y * STAGE.h };
  const R = { x: body[1].x * STAGE.w, y: body[1].y * STAGE.h };
  const span = Math.hypot(R.x - L.x, R.y - L.y);
  const bodyAngle = Math.atan2(R.y - L.y, R.x - L.x);

  const [[glx, gly], [grx, gry]] = garment.shoulders;
  // Garment shoulder vector in units of its own rendered width.
  const vx = grx - glx;
  const vy = (gry - gly) / garment.aspect;
  const width = (span * SPAN) / Math.hypot(vx, vy);
  const height = width / garment.aspect;
  const angle = bodyAngle - Math.atan2(vy, vx);

  // Offset of the garment's shoulder midpoint from its centre, rotated with it.
  const dx = ((glx + grx) / 2 - 0.5) * width;
  const dy = ((gly + gry) / 2 - 0.5) * height;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Target: midpoint between the joints, lifted perpendicular to the shoulder line.
  const lift = span * LIFT;
  const tx = (L.x + R.x) / 2 + Math.sin(bodyAngle) * lift;
  const ty = (L.y + R.y) / 2 - Math.cos(bodyAngle) * lift;

  return {
    x: (tx - (dx * cos - dy * sin)) / STAGE.w,
    y: (ty - (dx * sin + dy * cos)) / STAGE.h,
    width: clamp(width / STAGE.w, WIDTH_RANGE),
    rotation: clamp(Math.round((angle * 180) / Math.PI), ROTATION_RANGE),
    opacity,
  };
}

/** Map an image-normalised point onto the 3:4 stage, given the image is drawn with `object-fit: cover`. */
function coverToStage(p: Point, imageW: number, imageH: number, mirror: boolean): Point {
  const scale = Math.max(STAGE.w / imageW, STAGE.h / imageH);
  const w = imageW * scale;
  const h = imageH * scale;
  const x = mirror ? 1 - p.x : p.x;
  return { x: ((STAGE.w - w) / 2 + x * w) / STAGE.w, y: ((STAGE.h - h) / 2 + p.y * h) / STAGE.h };
}

export function shouldersToStage(s: Shoulders, imageW: number, imageH: number, mirror = false): Shoulders {
  const a = coverToStage(s[0], imageW, imageH, mirror);
  const b = coverToStage(s[1], imageW, imageH, mirror);
  return a.x < b.x ? [a, b] : [b, a];
}

/** Shoulders that are too close together mean a side-on pose the flat garment can't follow. */
export function isFacingCamera(body: Shoulders) {
  const span = Math.hypot((body[1].x - body[0].x) * STAGE.w, (body[1].y - body[0].y) * STAGE.h);
  return span / STAGE.w > 0.07;
}

/** Blend towards a new placement — keeps live tracking from jittering. */
export function smooth(from: Placement, to: Placement, t: number): Placement {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    x: lerp(from.x, to.x),
    y: lerp(from.y, to.y),
    width: lerp(from.width, to.width),
    rotation: lerp(from.rotation, to.rotation),
    opacity: to.opacity,
  };
}

type Pt = [x: number, y: number, c?: [number, number]];

/**
 * Closed, left-right symmetric path from its right half, which runs from the
 * centre-top to the centre-bottom. `c` is the control point of the curve arriving at a point.
 */
function symmetricPath(right: Pt[], axis: number) {
  const m = (x: number) => 2 * axis - x;
  const seg = ([x, y, c]: Pt) => (c ? `Q${c[0]} ${c[1]} ${x} ${y}` : `L${x} ${y}`);
  let d = `M${right[0][0]} ${right[0][1]}`;
  for (let i = 1; i < right.length; i++) d += seg(right[i]);
  for (let i = right.length - 1; i > 0; i--) {
    const [x, y] = right[i - 1];
    const c = right[i][2];
    d += c ? `Q${m(c[0])} ${c[1]} ${m(x)} ${y}` : `L${m(x)} ${y}`;
  }
  return `${d}Z`;
}

/** Dress-form silhouette used as the default backdrop, in a 300 × 400 box. */
export const DRESS_FORM = symmetricPath(
  [
    [150, 87],
    [166, 90, [160, 87]],
    [166, 118],
    [198, 146, [186, 126]],
    [196, 178, [204, 160]],
    [192, 204],
    [178, 266, [196, 236]],
    [188, 322, [194, 292]],
    [182, 346],
    [150, 352, [166, 352]],
  ],
  150,
);

/** The dress form's "shoulder joints", as stage fractions — the same shape pose detection returns. */
export const DRESS_FORM_SHOULDERS: Shoulders = [
  { x: 106 / 300, y: 147 / 400 },
  { x: 194 / 300, y: 147 / 400 },
];
