import { create } from 'zustand';

export interface VibeItem {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  addaId?: string | null;
  adda?: {
    id: string;
    name: string;
  } | null;
  mood: string;
  customNote?: string | null;
  expiresAt: string;
}

interface VibeState {
  vibes: VibeItem[];
  setVibes: (vibes: VibeItem[]) => void;
  addOrUpdateVibe: (vibe: VibeItem) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  vibes: [],
  setVibes: (vibes) => set({ vibes }),
  addOrUpdateVibe: (vibe) =>
    set((state) => ({
      vibes: [vibe, ...state.vibes.filter((v) => v.id !== vibe.id && v.userId !== vibe.userId)],
    })),
}));

