import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'contributor';

interface User {
  username: string;
  name: string;
  isAuthenticated: boolean;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  login: (username: string, password: string, name: string, role?: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: () => boolean;
  getCurrentUser: () => User | null;
  isAdmin: () => boolean;
  isContributor: () => boolean;
}

// Simple password check (in production, this should be server-side)
const ADMIN_PASSWORD = 'theoria2024'; // Change this to your desired password
const CONTRIBUTOR_PASSWORD = 'contributor2024'; // Password for contributors

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      login: (username: string, password: string, name: string, role?: UserRole) => {
        if (!username.trim() || !name.trim()) {
          return false;
        }

        let userRole: UserRole = 'contributor';
        let isValid = false;

        // Admin: only when admin mode is selected AND admin password is correct
        if (role === 'admin' && password === ADMIN_PASSWORD) {
          userRole = 'admin';
          isValid = true;
        }
        // Contributor: only when contributor mode is selected AND contributor password is correct
        else if (role === 'contributor' && password === CONTRIBUTOR_PASSWORD) {
          userRole = 'contributor';
          isValid = true;
        }

        if (isValid) {
          const user: User = {
            username: username.trim(),
            name: name.trim(),
            isAuthenticated: true,
            role: userRole,
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
      isAdmin: () => {
        return get().user?.role === 'admin';
      },
      isContributor: () => {
        return get().user?.role === 'contributor';
      },
    }),
    {
      name: 'theoria-auth-storage',
    }
  )
);
