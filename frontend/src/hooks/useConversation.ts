import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConversationState {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  clearConversation: () => void;
}

/**
 * Global conversation state hook
 * Manages active conversation ID with localStorage persistence
 */
export const useConversation = create<ConversationState>()(
  persist(
    (set) => ({
      conversationId: null,
      setConversationId: (id) => set({ conversationId: id }),
      clearConversation: () => set({ conversationId: null }),
    }),
    {
      name: 'writemind-conversation', // localStorage key
    }
  )
);
