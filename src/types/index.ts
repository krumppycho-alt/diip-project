export type Role = "dancer" | "artist";

export interface Dancer {
  id: string;
  label: string;
  role: Role;
  color: string;
}

export interface Position {
  dancerId: string;
  x: number;
  y: number;
}

export interface Formation {
  positions: Position[];
}

export interface Stage {
  widthM: number;
  heightM: number;
}

export interface StageTransform {
  scale: number;
  originX: number;
  originY: number;
}
