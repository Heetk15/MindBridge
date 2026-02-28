import { create } from 'zustand';
import { authService } from '@/services/authService';
import type { User, UserRole } from '@/types/user.types';

// Hydrate user from localStorage on startup
const savedUser = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
})();
const savedToken = localStorage.getItem('authToken');

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  phoneLogin: (phoneNumber: string, token: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole, phoneNumber?: string) => Promise<void>;
  setDebugUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: savedUser,
  token: savedToken,
  isAuthenticated: !!(savedToken && savedUser),

  phoneLogin: async (phoneNumber, token, role) => {
    try {
      const user: User = {
        id: phoneNumber.replace(/\D/g, ''),
        phoneNumber,
        role,
        name: `User ${phoneNumber.slice(-4)}`,
      };
      set({ user, token, isAuthenticated: true });
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Phone login failed:', error);
      throw error;
    }
  },

  login: async (_email, _password, role) => {
    // TODO: Implement email/password login with backend
    console.log('Email/password login not yet implemented');
  },

  signup: async (name, email, password, role, phoneNumber) => {
    try {
      const response = await authService.signup(name, email, password, role, phoneNumber);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        set({ 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
          },
          token,
          isAuthenticated: true,
        });
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  setDebugUser: (user, token) => {
    set({ user, token, isAuthenticated: true });
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
}));
