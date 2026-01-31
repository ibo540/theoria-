import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  name: string;
  isAuthenticated: boolean;
}

interface AuthState {
  user: User | null;
  login: (username: string, password: string, name: string) => boolean;
  logout: () => void;
  isAuthenticated: () => boolean;
  getCurrentUser: () => User | null;
}

// Simple password check (in production, this should be server-side)
const ADMIN_PASSWORD = 'theoria2024'; // Change this to your desired password

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (username: string, password: string, name: string) => {
        // Simple authentication (in production, verify against a database)
        if (password === ADMIN_PASSWORD && username.trim() && name.trim()) {
          const user: User = {
            username: username.trim(),
            name: name.trim(),
            isAuthenticated: true,
          };
          set({ user });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null });
      },
      isAuthenticated: () => {
        return get().user?.isAuthenticated === true;
      },
      getCurrentUser: () => {
        return get().user;
      },
    }),
    {
      name: 'theoria-auth-storage',
    }
  )
);
