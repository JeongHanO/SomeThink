import { create } from "zustand";

const useSelectedObjectStore = create((set) => ({
    selectedNode: null,
    selectedEdge: null,
    setSelectedNode: (node) => set({ selectedNode: node }),
    setSelectedEdge: (edge) => set({ selectedEdge: edge }),
}));

export default useSelectedObjectStore;
