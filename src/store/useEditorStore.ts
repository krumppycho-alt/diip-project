import { create } from "zustand";

interface EditorState {}

export const useEditorStore = create<EditorState>(() => ({}));
