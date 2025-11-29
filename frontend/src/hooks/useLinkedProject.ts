import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LinkedProjectState {
  linkedProjectId: string | null;
  linkProject: (projectId: string) => void;
  unlinkProject: () => void;
}

/**
 * Zustand store for managing linked project state.
 * Persists to localStorage so the link survives page refreshes.
 */
export const useLinkedProject = create<LinkedProjectState>()(
  persist(
    (set) => ({
      linkedProjectId: null,
      linkProject: (projectId: string) => set({ linkedProjectId: projectId }),
      unlinkProject: () => set({ linkedProjectId: null }),
    }),
    {
      name: 'writemind-linked-project',
    }
  )
);
