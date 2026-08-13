import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { computeStageTransform, meterToPixel } from "../utils/coords";
import { buildGridLines } from "../utils/grid";
import { Dot } from "./Dot";

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const stage = useEditorStore((s) => s.stage);
  const dancers = useEditorStore((s) => s.dancers);
  const positions = useEditorStore((s) => s.formations[0].positions);
  const selectedDancerId = useEditorStore((s) => s.selectedDancerId);
  const selectDancer = useEditorStore((s) => s.selectDancer);
  const setPosition = useEditorStore((s) => s.setPosition);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const transform = computeStageTransform(size.width, size.height, stage);
  const grid = buildGridLines(stage);
  const halfW = stage.widthM / 2;
  const halfH = stage.heightM / 2;
  const stageTopLeft = meterToPixel(-halfW, halfH, transform);
  const stageBottomRight = meterToPixel(halfW, -halfH, transform);

  const toLocal = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  return (
    <div ref={containerRef} className="canvas-area">
      <svg ref={svgRef} width={size.width} height={size.height}>
        {size.width > 0 && (
          <>
            <rect
              x={stageTopLeft.x}
              y={stageTopLeft.y}
              width={stageBottomRight.x - stageTopLeft.x}
              height={stageBottomRight.y - stageTopLeft.y}
              style={{ fill: "var(--color-surface-alt)" }}
              onPointerDown={() => selectDancer(null)}
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
            {grid.xLabels.map((l) => {
              const p = meterToPixel(l.atM, 0, transform);
              return (
                <text
                  key={`xl${l.atM}`}
                  x={p.x}
                  y={p.y + 14}
                  textAnchor="middle"
                  fontSize={11}
                  style={{ fill: "var(--color-text-dim)" }}
                  pointerEvents="none"
                >
                  {l.text}
                </text>
              );
            })}
            {grid.yLabels.map((l) => {
              const p = meterToPixel(0, l.atM, transform);
              return (
                <text
                  key={`yl${l.atM}`}
                  x={p.x + 8}
                  y={p.y}
                  dominantBaseline="central"
                  fontSize={11}
                  style={{ fill: "var(--color-text-dim)" }}
                  pointerEvents="none"
                >
                  {l.text}
                </text>
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
                  toLocal={toLocal}
                  onSelect={selectDancer}
                  onMove={setPosition}
                />
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}
