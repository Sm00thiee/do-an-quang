import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      current: {},
      isAuth: false,
      
      setUser: (user) => set({ current: user, isAuth: true }),
      
      logout: () => set({ current: {}, isAuth: false }),
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
