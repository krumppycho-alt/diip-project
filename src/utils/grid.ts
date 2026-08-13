import type { Stage } from "../types";

export interface GridLabel {
  atM: number;
  text: string;
}

export interface GridLines {
  vLines: number[];
  hLines: number[];
  xLabels: GridLabel[];
  yLabels: GridLabel[];
}

export function buildGridLines(stage: Stage): GridLines {
  const halfW = stage.widthM / 2;
  const halfH = stage.heightM / 2;

  const vLines: number[] = [];
  for (let x = -Math.floor(halfW); x <= Math.floor(halfW); x++) vLines.push(x);

  const hLines: number[] = [];
  for (let y = -Math.floor(halfH); y <= Math.floor(halfH); y++) hLines.push(y);

  const xLabels: GridLabel[] = [];
  for (let n = 1; n <= Math.floor(halfW); n++) {
    xLabels.push({ atM: -n, text: `상수 ${n}` });
    xLabels.push({ atM: n, text: `하수 ${n}` });
  }

  const yLabels: GridLabel[] = [];
  for (let n = 1; n <= Math.floor(halfH); n++) {
    yLabels.push({ atM: n, text: `앞 ${n}` });
    yLabels.push({ atM: -n, text: `뒤 ${n}` });
  }

  return { vLines, hLines, xLabels, yLabels };
}
