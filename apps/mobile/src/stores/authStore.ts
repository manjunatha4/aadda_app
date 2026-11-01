import { create } from 'zustand';
import { storage } from '../services/storage';
import { api } from '../services/api';
import i18n from '../i18n';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  district?: string | null;
  language: 'kn' | 'en';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initAuth: () => Promise<void>;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateLanguage: (lang: 'kn' | 'en') => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (token) {
        set({ accessToken: token });
        const user = await api.get('/auth/me');
        if (user) {
          set({ user, isAuthenticated: true });
          if (user.language) {
            i18n.changeLanguage(user.language);
          }
        }
      }
    } catch {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    if (user.language) {
      i18n.changeLanguage(user.language);
    }
    set({ user, accessToken, isAuthenticated: true });
  },

  updateLanguage: async (lang: 'kn' | 'en') => {
    i18n.changeLanguage(lang);
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, language: lang } });
      await api.patch('/users/profile', { language: lang }).catch(() => {});
    }
  },

  updateProfile: async (profile: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...profile };
      set({ user: updatedUser });
      await storage.setItem('aadda_client_current_user', JSON.stringify(updatedUser)).catch(() => {});
      await api.patch('/users/profile', profile).catch(() => {});
    }
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    } finally {
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
}));

