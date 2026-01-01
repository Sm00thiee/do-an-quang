import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmployerAuthStore = create(
  persist(
    (set) => ({
      current: {},
      isAuth: false,
      
      setUser: (user) => set({ current: user, isAuth: true }),
      
      logout: () => set({ current: {}, isAuth: false }),
    }),
    {
      name: 'employer-auth-storage',
    }
  )
);
