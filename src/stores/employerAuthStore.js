import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmployerAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuth: false,

      setUser: (user) => set({ user, isAuth: true }),

      logout: () => {
        localStorage.removeItem('employer_jwt');
        localStorage.removeItem('employer-auth-storage');
        set({ user: null, isAuth: false });
      },
    }),
    {
      name: 'employer-auth-storage',
    }
  )
);
