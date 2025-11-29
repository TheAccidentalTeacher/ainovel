import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SectionKey = 'contexts' | 'projects' | 'conversations';

interface CollapsedSectionsState {
  contexts: boolean;
  projects: boolean;
  conversations: boolean;
  toggleSection: (section: SectionKey) => void;
}

export const useCollapsedSections = create<CollapsedSectionsState>()(
  persist(
    (set) => ({
      contexts: false,
      projects: false,
      conversations: false,
      toggleSection: (section: SectionKey) =>
        set((state) => ({
          ...state,
          [section]: !state[section],
        })),
    }),
    {
      name: 'writemind-collapsed-sections',
    }
  )
);
