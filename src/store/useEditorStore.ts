import { create } from "zustand";
import type { Dancer, Formation, Role, Stage } from "../types";

const PALETTE = [
  "#4f8cff",
  "#ff6b6b",
  "#51cf66",
  "#ffd43b",
  "#cc5de8",
  "#22d3ee",
  "#ff922b",
  "#f06595",
];

function makeDefaultDancers(): { dancers: Dancer[]; formation: Formation } {
  const cols = [-3, -1, 1, 3];
  const rows = [1, -1];
  const dancers: Dancer[] = [];
  const positions: Formation["positions"] = [];

  let i = 0;
  for (const y of rows) {
    for (const x of cols) {
      const id = crypto.randomUUID();
      dancers.push({
        id,
        label: String(i + 1),
        role: "dancer",
        color: PALETTE[i % PALETTE.length],
      });
      positions.push({ dancerId: id, x, y });
      i++;
    }
  }

  return { dancers, formation: { positions } };
}

interface EditorState {
  stage: Stage;
  dancers: Dancer[];
  formations: Formation[];
  selectedDancerId: string | null;
  addDancer: () => void;
  removeDancer: (id: string) => void;
  setDancerRole: (id: string, role: Role) => void;
  setPosition: (dancerId: string, x: number, y: number) => void;
  selectDancer: (id: string | null) => void;
}

const { dancers: initialDancers, formation: initialFormation } = makeDefaultDancers();

export const useEditorStore = create<EditorState>((set) => ({
  stage: { widthM: 12, heightM: 8 },
  dancers: initialDancers,
  formations: [initialFormation],
  selectedDancerId: null,

  addDancer: () =>
    set((state) => {
      const id = crypto.randomUUID();
      const dancer: Dancer = {
        id,
        label: String(state.dancers.length + 1),
        role: "dancer",
        color: PALETTE[state.dancers.length % PALETTE.length],
      };
      const [formation, ...rest] = state.formations;
      return {
        dancers: [...state.dancers, dancer],
        formations: [
          { positions: [...formation.positions, { dancerId: id, x: 0, y: 0 }] },
          ...rest,
        ],
        selectedDancerId: id,
      };
    }),

  removeDancer: (id) =>
    set((state) => {
      const [formation, ...rest] = state.formations;
      return {
        dancers: state.dancers.filter((d) => d.id !== id),
        formations: [
          { positions: formation.positions.filter((p) => p.dancerId !== id) },
          ...rest,
        ],
        selectedDancerId: state.selectedDancerId === id ? null : state.selectedDancerId,
      };
    }),

  setDancerRole: (id, role) =>
    set((state) => ({
      dancers: state.dancers.map((d) => (d.id === id ? { ...d, role } : d)),
    })),

  setPosition: (dancerId, x, y) =>
    set((state) => {
      const [formation, ...rest] = state.formations;
      return {
        formations: [
          {
            positions: formation.positions.map((p) =>
              p.dancerId === dancerId ? { ...p, x, y } : p
            ),
          },
          ...rest,
        ],
      };
    }),

  selectDancer: (id) => set({ selectedDancerId: id }),
}));
