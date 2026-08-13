import { Canvas } from "./components/Canvas";
import { TrackBar } from "./components/TrackBar";
import { SidePanel } from "./components/SidePanel";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <Canvas />
      <SidePanel />
      <TrackBar />
    </div>
  );
}
