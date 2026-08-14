export interface ViewTransform {
  panX: number;
  panY: number;
  zoom: number;
  rotationDeg: number;
}

export const DEFAULT_VIEW: ViewTransform = { panX: 0, panY: 0, zoom: 1, rotationDeg: 0 };

export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 4;

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** SVG transform string: rotate/scale around `pivot`, then pan. */
export function viewTransformString(view: ViewTransform, pivot: { x: number; y: number }) {
  return (
    `translate(${view.panX},${view.panY}) ` +
    `translate(${pivot.x},${pivot.y}) rotate(${view.rotationDeg}) scale(${view.zoom}) ` +
    `translate(${-pivot.x},${-pivot.y})`
  );
}

/** Inverse of viewTransformString: screen-space point -> base (pre-view) pixel point. */
export function invertView(
  screenX: number,
  screenY: number,
  view: ViewTransform,
  pivot: { x: number; y: number }
) {
  const ux = screenX - view.panX - pivot.x;
  const uy = screenY - view.panY - pivot.y;
  const rad = (view.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = ux * cos + uy * sin;
  const ry = -ux * sin + uy * cos;
  return { x: pivot.x + rx / view.zoom, y: pivot.y + ry / view.zoom };
}

export interface TwoPointerGeometry {
  dist: number;
  angleDeg: number;
  mid: { x: number; y: number };
}

export function twoPointerGeometry(
  a: { x: number; y: number },
  b: { x: number; y: number }
): TwoPointerGeometry {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    dist: Math.hypot(dx, dy),
    angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
    mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}
