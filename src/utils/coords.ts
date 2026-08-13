import type { Stage, StageTransform } from "../types";

export function computeStageTransform(
  containerW: number,
  containerH: number,
  stage: Stage
): StageTransform {
  const scale = Math.min(containerW / stage.widthM, containerH / stage.heightM);
  return { scale, originX: containerW / 2, originY: containerH / 2 };
}

export function meterToPixel(xM: number, yM: number, t: StageTransform) {
  return {
    x: t.originX + xM * t.scale,
    y: t.originY - yM * t.scale,
  };
}

export function pixelToMeter(px: number, py: number, t: StageTransform) {
  return {
    x: (px - t.originX) / t.scale,
    y: (t.originY - py) / t.scale,
  };
}
