import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/types';

interface AuthState {
  profile: UserProfile | null;
  loading: boolean;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      loading: true,
      setProfile: (profile) => set({ profile, loading: false }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ profile: null, loading: false }),
    }),
    {
      name: 'pejuangasn-auth-session',
    }
  )
);
