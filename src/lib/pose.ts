"use client";

import type { PoseLandmarker } from "@mediapipe/tasks-vision";

/**
 * Body tracking for the try-on, via MediaPipe Pose Landmarker running
 * entirely in the browser (WASM + a 5.8 MB model, fetched on first use).
 * Frames are never sent anywhere.
 */

const VERSION = "1.0.1";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type Mode = "IMAGE" | "VIDEO";

let instance: Promise<PoseLandmarker> | undefined;
let mode: Mode = "VIDEO";

async function create() {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks(WASM);
  const options = (delegate: "GPU" | "CPU") => ({
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: mode,
    numPoses: 1,
  });
  try {
    return await PoseLandmarker.createFromOptions(files, options("GPU"));
  } catch {
    return await PoseLandmarker.createFromOptions(files, options("CPU"));
  }
}

async function landmarker(want: Mode) {
  instance ??= create().catch((err) => {
    instance = undefined;
    throw err;
  });
  const lm = await instance;
  if (mode !== want) {
    mode = want;
    await lm.setOptions({ runningMode: want });
  }
  return lm;
}

/** Start downloading the model ahead of time. */
export function preloadPose() {
  void landmarker(mode).catch(() => {});
}

export type Point = { x: number; y: number };

/** Shoulder joints in image-normalised coordinates, ordered left-to-right as they appear in the image. */
export type Shoulders = [Point, Point];

function toShoulders(landmarks: { x: number; y: number; visibility?: number }[] | undefined): Shoulders | null {
  const a = landmarks?.[11];
  const b = landmarks?.[12];
  if (!a || !b || (a.visibility ?? 1) < 0.5 || (b.visibility ?? 1) < 0.5) return null;
  return a.x < b.x ? [a, b] : [b, a];
}

export async function detectImage(image: HTMLImageElement): Promise<Shoulders | null> {
  const lm = await landmarker("IMAGE");
  return toShoulders(lm.detect(image).landmarks[0]);
}

export async function videoDetector() {
  const lm = await landmarker("VIDEO");
  let last = -1;
  return (video: HTMLVideoElement, now: number): Shoulders | null | undefined => {
    if (video.readyState < 2 || now <= last) return undefined;
    last = now;
    return toShoulders(lm.detectForVideo(video, now).landmarks[0]);
  };
}
