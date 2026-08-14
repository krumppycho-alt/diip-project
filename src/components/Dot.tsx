import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Dancer, StageTransform } from "../types";
import { meterToPixel } from "../utils/coords";

const RADIUS = 20;
const DRAG_THRESHOLD_PX = 5;

interface DotProps {
  dancer: Dancer;
  xM: number;
  yM: number;
  transform: StageTransform;
  isSelected: boolean;
  clientToMeter: (clientX: number, clientY: number) => { x: number; y: number };
  onSelect: (id: string) => void;
  onMove: (id: string, xM: number, yM: number) => void;
}

export function Dot({
  dancer,
  xM,
  yM,
  transform,
  isSelected,
  clientToMeter,
  onSelect,
  onMove,
}: DotProps) {
  const [dragMeters, setDragMeters] = useState<{ x: number; y: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; dragging: boolean } | null>(
    null
  );

  const handlePointerDown = (e: ReactPointerEvent<SVGCircleElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore: pointer capture is best-effort
    }
    dragState.current = { startX: e.clientX, startY: e.clientY, dragging: false };
  };

  const handlePointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    const state = dragState.current;
    if (!state) return;
    if (!state.dragging) {
      const dist = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
    }
    setDragMeters(clientToMeter(e.clientX, e.clientY));
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGCircleElement>) => {
    const state = dragState.current;
    dragState.current = null;
    if (state?.dragging) {
      const meters = clientToMeter(e.clientX, e.clientY);
      onMove(dancer.id, meters.x, meters.y);
      setDragMeters(null);
    } else {
      onSelect(dancer.id);
    }
  };

  const activeM = dragMeters ?? { x: xM, y: yM };
  const pixel = meterToPixel(activeM.x, activeM.y, transform);

  return (
    <g>
      <circle
        data-dot="true"
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
