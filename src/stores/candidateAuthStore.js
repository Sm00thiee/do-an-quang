import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCandidateAuthStore = create(
  persist(
    (set) => ({
      current: {},
      isAuth: false,
      
      setCurrentCandidate: (user) => set({ current: user, isAuth: true }),
      
      logout: () => {
        set({ current: {}, isAuth: false });
        localStorage.removeItem('candidate-auth-storage');
      },
    }),
    {
      name: 'candidate-auth-storage',
    }
  )
);
