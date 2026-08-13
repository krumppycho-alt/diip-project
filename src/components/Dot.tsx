import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Dancer, StageTransform } from "../types";
import { meterToPixel, pixelToMeter } from "../utils/coords";

const RADIUS = 20;
const DRAG_THRESHOLD_PX = 5;

interface DotProps {
  dancer: Dancer;
  xM: number;
  yM: number;
  transform: StageTransform;
  isSelected: boolean;
  toLocal: (clientX: number, clientY: number) => { x: number; y: number };
  onSelect: (id: string) => void;
  onMove: (id: string, xM: number, yM: number) => void;
}

export function Dot({
  dancer,
  xM,
  yM,
  transform,
  isSelected,
  toLocal,
  onSelect,
  onMove,
}: DotProps) {
  const [dragPixel, setDragPixel] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; dragging: boolean } | null>(
    null
  );

  const handlePointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const local = toLocal(e.clientX, e.clientY);
    dragState.current = { startX: local.x, startY: local.y, dragging: false };
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    const state = dragState.current;
    if (!state) return;
    const local = toLocal(e.clientX, e.clientY);
    if (!state.dragging) {
      const dist = Math.hypot(local.x - state.startX, local.y - state.startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
    }
    setDragPixel(local);
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGCircleElement>) => {
    const state = dragState.current;
    dragState.current = null;
    if (state?.dragging) {
      const local = toLocal(e.clientX, e.clientY);
      const meters = pixelToMeter(local.x, local.y, transform);
      onMove(dancer.id, meters.x, meters.y);
      setDragPixel(null);
    } else {
      onSelect(dancer.id);
    }
  };

  const pixel = dragPixel ?? meterToPixel(xM, yM, transform);

  return (
    <g>
      <circle
        cx={pixel.x}
        cy={pixel.y}
        r={RADIUS}
        fill={dancer.color}
        stroke={dancer.role === "artist" ? "#ffffff" : isSelected ? "#ffffff" : "none"}
        strokeWidth={dancer.role === "artist" ? 4 : isSelected ? 2 : 0}
        style={{ touchAction: "none", cursor: "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <text
        x={pixel.x}
        y={pixel.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fill="#121212"
        pointerEvents="none"
      >
        {dancer.label}
      </text>
    </g>
  );
}
