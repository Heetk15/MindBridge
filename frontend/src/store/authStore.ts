import { create } from 'zustand';
import type { User, UserRole } from '@/types/user.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  phoneLogin: (phoneNumber: string, token: string, role: UserRole) => void;
  login: (email: string, password: string, role: UserRole) => void;
  signup: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const mockUsers: Record<string, User> = {
  elderly: {
    id: '1',
    name: 'Margaret Johnson',
    email: 'margaret@example.com',
    phoneNumber: '+919876543210',
    role: 'elderly',
    age: 78,
    emergencyContacts: [
      { name: 'Sarah Johnson', relationship: 'Daughter', phone: '+1 555-0123' },
      { name: 'Dr. Robert Smith', relationship: 'Doctor', phone: '+1 555-0456' },
    ],
    medicalHistory: ['Type 2 Diabetes', 'Mild Cognitive Impairment', 'Hypertension'],
    medications: ['Metformin 500mg', 'Donepezil 10mg', 'Lisinopril 20mg'],
  },
  caregiver: {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phoneNumber: '+919876543211',
    role: 'caregiver',
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  phoneLogin: (phoneNumber, token, role) => {
    const user: User = {
      ...mockUsers[role],
      phoneNumber,
      id: phoneNumber.replace(/\D/g, ''),
    };
    set({ user, token, isAuthenticated: true });
    // Store in localStorage for persistence
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  login: (_email, _password, role) => {
    const user = mockUsers[role];
    set({ user, isAuthenticated: true });
  },
  signup: (name, email, _password, role) => {
    const user: User = { id: '3', name, email, role };
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
}));
