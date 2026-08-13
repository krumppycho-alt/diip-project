import { useEditorStore } from "../store/useEditorStore";
import type { Role } from "../types";

export function SidePanel() {
  const dancers = useEditorStore((s) => s.dancers);
  const selectedDancerId = useEditorStore((s) => s.selectedDancerId);
  const addDancer = useEditorStore((s) => s.addDancer);
  const removeDancer = useEditorStore((s) => s.removeDancer);
  const setDancerRole = useEditorStore((s) => s.setDancerRole);

  const selected = dancers.find((d) => d.id === selectedDancerId) ?? null;

  const setRole = (role: Role) => {
    if (selected) setDancerRole(selected.id, role);
  };

  return (
    <div className={`side-panel${selected ? " side-panel--expanded" : ""}`}>
      <button className="panel-add-btn" onClick={addDancer} aria-label="도트 추가">
        +
      </button>

      {selected && (
        <div className="panel-detail">
          <div className="panel-row">
            <span className="panel-swatch" style={{ background: selected.color }} />
            <span>라벨 {selected.label}</span>
          </div>

          <div className="panel-row role-toggle">
            <button
              className={selected.role === "dancer" ? "active" : ""}
              onClick={() => setRole("dancer")}
            >
              dancer
            </button>
            <button
              className={selected.role === "artist" ? "active" : ""}
              onClick={() => setRole("artist")}
            >
              artist
            </button>
          </div>

          <button className="panel-delete-btn" onClick={() => removeDancer(selected.id)}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
