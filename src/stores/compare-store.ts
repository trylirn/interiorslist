import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompareItem = {
  place_id: string;
  slug: string;
  name: string;
  city: string;
  specialists?: string | null;
  branch_label?: string | null;
  services?: string[] | null;
};

type CompareState = {
  items: CompareItem[];
  toggle: (item: CompareItem) => void;
  remove: (place_id: string) => void;
  clear: () => void;
  isIn: (place_id: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const existing = get().items.find((i) => i.place_id === item.place_id);
        if (existing) {
          set({ items: get().items.filter((i) => i.place_id !== item.place_id) });
        } else if (get().items.length < 3) {
          set({ items: [...get().items, item] });
        }
      },
      remove: (place_id) => set({ items: get().items.filter((i) => i.place_id !== place_id) }),
      clear: () => set({ items: [] }),
      isIn: (place_id) => get().items.some((i) => i.place_id === place_id),
    }),
    { name: "interiors-list-compare" },
  ),
);
