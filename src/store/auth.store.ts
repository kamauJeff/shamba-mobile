import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  county?: string;
  farmSize?: number;
  creditScore?: number;
  walletBalance?: number;
  memberSince?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  setToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => set({ token, isAuthenticated: true }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'shamba-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
