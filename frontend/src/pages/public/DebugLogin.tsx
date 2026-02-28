import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';

/**
 * Offline debug login — works WITHOUT the backend running.
 * Usage:
 *   /debug-login              → elderly dashboard
 *   /debug-login?role=caregiver → caregiver dashboard
 */
const DebugLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setDebugUser = useAuthStore((s) => s.setDebugUser);

  useEffect(() => {
    const role = (searchParams.get('role') || 'elderly') as UserRole;

    const mockUser = {
      id: `debug_${role}_001`,
      name: role === 'elderly' ? 'Debug Elderly' : 'Debug Caregiver',
      email: `debug.${role}@mindbridge.dev`,
      phoneNumber: '+919999999999',
      role,
    };

    const fakeToken = `debug-token-${role}-${Date.now()}`;

    // Persist into store + localStorage (no network call)
    setDebugUser(mockUser, fakeToken);

    console.log('✅ Debug login (offline):', mockUser);

    // Navigate to dashboard
    navigate(`/${role}/dashboard`, { replace: true });
  }, [searchParams, navigate, setDebugUser]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
};

export default DebugLogin;
