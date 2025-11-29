import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InfoPanelState {
  width: number;
  setWidth: (width: number) => void;
}

export const useInfoPanel = create<InfoPanelState>()(
  persist(
    (set) => ({
      width: 380, // Default width
      setWidth: (width: number) => set({ width }),
    }),
    {
      name: 'writemind-info-panel',
    }
  )
);
