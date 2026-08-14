import type { Stage } from "../types";

export interface GridLines {
  vLines: number[];
  hLines: number[];
}

export function buildGridLines(stage: Stage): GridLines {
  const halfW = stage.widthM / 2;
  const halfH = stage.heightM / 2;

  const vLines: number[] = [];
  for (let x = -Math.floor(halfW); x <= Math.floor(halfW); x++) vLines.push(x);

  const hLines: number[] = [];
  for (let y = -Math.floor(halfH); y <= Math.floor(halfH); y++) hLines.push(y);

  return { vLines, hLines };
}
