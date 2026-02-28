import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, login, signup, logout, phoneLogin, token, setDebugUser } = useAuthStore();
  return { user, isAuthenticated, login, signup, logout, phoneLogin, token, setDebugUser };
};
