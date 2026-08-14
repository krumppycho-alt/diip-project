import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { computeStageTransform, meterToPixel } from "../utils/coords";
import { buildGridLines } from "../utils/grid";
import {
  DEFAULT_VIEW,
  clampZoom,
  invertView,
  twoPointerGeometry,
  viewTransformString,
} from "../utils/viewTransform";
import type { ViewTransform } from "../utils/viewTransform";
import { Dot } from "./Dot";

const RULER_MARGIN_M = 1.0;
const TICK_LEN_M = 0.25;
const LABEL_GAP_M = 0.2;

const TAP_MOVE_EPS_PX = 6;
const GESTURE_TAP_MAX_MS = 300;
const GESTURE_TAP_ZOOM_EPS = 0.05;
const GESTURE_TAP_ROT_EPS_DEG = 4;
const GESTURE_TAP_PAN_EPS_PX = 12;
const DOUBLE_TAP_WINDOW_MS = 400;

function isDotTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest("[data-dot]");
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<ViewTransform>(DEFAULT_VIEW);

  const bgPointers = useRef(new Map<number, { x: number; y: number }>());
  const singleTap = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(
    null
  );
  const gesture = useRef<{
    startTime: number;
    dist0: number;
    angle0: number;
    mid0: { x: number; y: number };
    viewAtStart: ViewTransform;
  } | null>(null);
  const lastTapTime = useRef(0);

  const stage = useEditorStore((s) => s.stage);
  const dancers = useEditorStore((s) => s.dancers);
  const positions = useEditorStore((s) => s.formations[0].positions);
  const selectedDancerId = useEditorStore((s) => s.selectedDancerId);
  const selectDancer = useEditorStore((s) => s.selectDancer);
  const setPosition = useEditorStore((s) => s.setPosition);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitStage = {
    widthM: stage.widthM + RULER_MARGIN_M * 2,
    heightM: stage.heightM + RULER_MARGIN_M * 2,
  };
  const transform = computeStageTransform(size.width, size.height, fitStage);
  const pivot = { x: transform.originX, y: transform.originY };
  const grid = buildGridLines(stage);
  const halfW = stage.widthM / 2;
  const halfH = stage.heightM / 2;
  const stageTopLeft = meterToPixel(-halfW, halfH, transform);
  const stageBottomRight = meterToPixel(halfW, -halfH, transform);

  const toLocal = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  const clientToMeter = (clientX: number, clientY: number) => {
    const local = toLocal(clientX, clientY);
    const base = invertView(local.x, local.y, view, pivot);
    return {
      x: (base.x - transform.originX) / transform.scale,
      y: (transform.originY - base.y) / transform.scale,
    };
  };

  const handleBgPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isDotTarget(e.target)) return;
    if (bgPointers.current.size >= 2) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    bgPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (bgPointers.current.size === 1) {
      singleTap.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false };
    } else if (bgPointers.current.size === 2) {
      singleTap.current = null;
      const [a, b] = [...bgPointers.current.values()];
      const g = twoPointerGeometry(a, b);
      gesture.current = {
        startTime: performance.now(),
        dist0: g.dist,
        angle0: g.angleDeg,
        mid0: g.mid,
        viewAtStart: view,
      };
    }
  };

  const handleBgPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!bgPointers.current.has(e.pointerId)) return;
    bgPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (bgPointers.current.size === 1) {
      const tap = singleTap.current;
      if (tap && tap.id === e.pointerId) {
        const dist = Math.hypot(e.clientX - tap.startX, e.clientY - tap.startY);
        if (dist > TAP_MOVE_EPS_PX) tap.moved = true;
      }
      return;
    }

    if (bgPointers.current.size === 2 && gesture.current) {
      const [a, b] = [...bgPointers.current.values()];
      const g = twoPointerGeometry(a, b);
      const start = gesture.current;
      setView({
        zoom: clampZoom(start.viewAtStart.zoom * (g.dist / start.dist0)),
        rotationDeg: start.viewAtStart.rotationDeg + (g.angleDeg - start.angle0),
        panX: start.viewAtStart.panX + (g.mid.x - start.mid0.x),
        panY: start.viewAtStart.panY + (g.mid.y - start.mid0.y),
      });
    }
  };

  const handleBgPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!bgPointers.current.has(e.pointerId)) return;
    const wasSize = bgPointers.current.size;
    bgPointers.current.delete(e.pointerId);

    if (wasSize === 1) {
      const tap = singleTap.current;
      if (tap && tap.id === e.pointerId && !tap.moved) {
        selectDancer(null);
      }
      singleTap.current = null;
    } else if (wasSize === 2) {
      const start = gesture.current;
      if (start) {
        const duration = performance.now() - start.startTime;
        const zoomDelta = Math.abs(view.zoom / start.viewAtStart.zoom - 1);
        const rotDelta = Math.abs(view.rotationDeg - start.viewAtStart.rotationDeg);
        const panDelta = Math.hypot(
          view.panX - start.viewAtStart.panX,
          view.panY - start.viewAtStart.panY
        );
        const isTap =
          duration < GESTURE_TAP_MAX_MS &&
          zoomDelta < GESTURE_TAP_ZOOM_EPS &&
          rotDelta < GESTURE_TAP_ROT_EPS_DEG &&
          panDelta < GESTURE_TAP_PAN_EPS_PX;
        if (isTap) {
          const now = performance.now();
          if (now - lastTapTime.current < DOUBLE_TAP_WINDOW_MS) {
            setView(DEFAULT_VIEW);
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
          }
        }
      }
      gesture.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-area"
      onPointerDown={handleBgPointerDown}
      onPointerMove={handleBgPointerMove}
      onPointerUp={handleBgPointerUp}
      onPointerCancel={handleBgPointerUp}
    >
      <svg width={size.width} height={size.height}>
        {size.width > 0 && (
          <g transform={viewTransformString(view, pivot)}>
            <rect
              x={stageTopLeft.x}
              y={stageTopLeft.y}
              width={stageBottomRight.x - stageTopLeft.x}
              height={stageBottomRight.y - stageTopLeft.y}
              style={{ fill: "var(--color-surface-alt)" }}
            />
            {grid.vLines.map((x) => {
              const a = meterToPixel(x, -halfH, transform);
              const b = meterToPixel(x, halfH, transform);
              return (
                <line
                  key={`v${x}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  style={{ stroke: "var(--color-grid)" }}
                  strokeWidth={x === 0 ? 2 : 1}
                  pointerEvents="none"
                />
              );
            })}
            {grid.hLines.map((y) => {
              const a = meterToPixel(-halfW, y, transform);
              const b = meterToPixel(halfW, y, transform);
              return (
                <line
                  key={`h${y}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  style={{ stroke: "var(--color-grid)" }}
                  strokeWidth={y === 0 ? 2 : 1}
                  pointerEvents="none"
                />
              );
            })}

            {/* top ruler: 좌우(상수/하수) */}
            {(() => {
              const base = meterToPixel(-halfW, halfH + TICK_LEN_M, transform);
              const end = meterToPixel(halfW, halfH + TICK_LEN_M, transform);
              return (
                <line
                  x1={base.x}
                  y1={base.y}
                  x2={end.x}
                  y2={end.y}
                  style={{ stroke: "var(--color-grid)" }}
                  strokeWidth={1}
                  pointerEvents="none"
                />
              );
            })()}
            {grid.vLines.map((x) => {
              const tickA = meterToPixel(x, halfH, transform);
              const tickB = meterToPixel(x, halfH + TICK_LEN_M, transform);
              const label = meterToPixel(x, halfH + TICK_LEN_M + LABEL_GAP_M, transform);
              return (
                <g key={`vt${x}`} pointerEvents="none">
                  <line
                    x1={tickA.x}
                    y1={tickA.y}
                    x2={tickB.x}
                    y2={tickB.y}
                    style={{ stroke: "var(--color-text-dim)" }}
                    strokeWidth={1}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    style={{ fill: "var(--color-text-dim)" }}
                  >
                    {x === 0 ? "C" : Math.abs(x)}
                  </text>
                </g>
              );
            })}

            {/* left ruler: 앞뒤 */}
            {(() => {
              const base = meterToPixel(-halfW - TICK_LEN_M, -halfH, transform);
              const end = meterToPixel(-halfW - TICK_LEN_M, halfH, transform);
              return (
                <line
                  x1={base.x}
                  y1={base.y}
                  x2={end.x}
                  y2={end.y}
                  style={{ stroke: "var(--color-grid)" }}
                  strokeWidth={1}
                  pointerEvents="none"
                />
              );
            })()}
            {grid.hLines.map((y) => {
              const tickA = meterToPixel(-halfW, y, transform);
              const tickB = meterToPixel(-halfW - TICK_LEN_M, y, transform);
              const label = meterToPixel(-halfW - TICK_LEN_M - LABEL_GAP_M, y, transform);
              return (
                <g key={`ht${y}`} pointerEvents="none">
                  <line
                    x1={tickA.x}
                    y1={tickA.y}
                    x2={tickB.x}
                    y2={tickB.y}
                    style={{ stroke: "var(--color-text-dim)" }}
                    strokeWidth={1}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    style={{ fill: "var(--color-text-dim)" }}
                  >
                    {y === 0 ? "C" : Math.abs(y)}
                  </text>
                </g>
              );
            })}

            {dancers.map((dancer) => {
              const pos = positions.find((p) => p.dancerId === dancer.id);
              if (!pos) return null;
              return (
                <Dot
                  key={dancer.id}
                  dancer={dancer}
                  xM={pos.x}
                  yM={pos.y}
                  transform={transform}
                  isSelected={dancer.id === selectedDancerId}
                  clientToMeter={clientToMeter}
                  onSelect={selectDancer}
                  onMove={setPosition}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
