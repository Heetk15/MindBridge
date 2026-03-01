import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';
import { Brain, Phone, Shield, Heart, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `http://${window.location.hostname}:5004/api/v1`;

const Login = () => {
  const navigate = useNavigate();
  const { phoneLogin, setDebugUser } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [role, setRole] = useState<UserRole>('elderly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!/^\+\d{1,15}$/.test(phoneNumber)) {
      setError('Phone number must be in E.164 format (e.g., +919876543210)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        phoneNumber: phoneNumber.trim(),
      });

      if (response.data.success) {
        setSuccessMessage('OTP sent successfully');
        setStep('otp');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to send security code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!/^\d{6}$/.test(otpCode)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phoneNumber: phoneNumber.trim(),
        code: otpCode.trim(),
      });

      if (response.data.success) {
        phoneLogin(phoneNumber, response.data.data.token, role);
        navigate(
          role === 'elderly'
            ? '/elderly/dashboard'
            : '/caregiver/dashboard'
        );
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Verification failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSkip = (skipRole: UserRole) => {
    const mockUser = {
      id: `dev_${skipRole}`,
      name: `Dev ${skipRole}`,
      email: `dev@mindbridge.dev`,
      phoneNumber: '+919999999999',
      role: skipRole,
    };

    setDebugUser(mockUser, 'dev-token');
    navigate(`/${skipRole}/dashboard`);
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* LEFT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 lg:px-16 bg-white">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">MindBridge</h1>
              <p className="text-sm text-gray-500">AI Dementia Companion</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Secure Login
          </h2>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(['elderly', 'caregiver'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                disabled={step === 'otp'}
                className={`p-4 rounded-xl border-2 font-medium capitalize transition ${
                  role === r
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {r === 'elderly' ? (
                  <Heart className="mx-auto mb-1" size={20} />
                ) : (
                  <Shield className="mx-auto mb-1" size={20} />
                )}
                {r}
              </button>
            ))}
          </div>

          {/* PHONE STEP */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-5">

              <div>
                <label className="text-sm text-gray-700">Phone Number</label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="tel"
                    placeholder="+919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? 'Sending...' : <><span>Send OTP</span><ChevronRight size={18} /></>}
              </button>
            </form>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">

              <div>
                <label className="text-sm text-gray-700">Enter 6-digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full text-center text-2xl tracking-widest py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-blue-600 text-sm"
              >
                Back
              </button>
            </form>
          )}

          {/* DEV BUTTONS */}
          <div className="mt-10 border-t pt-6">
            <p className="text-xs text-gray-400 text-center mb-3">
              Developer Access
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDevSkip('elderly')}
                className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg"
              >
                Elderly
              </button>
              <button
                onClick={() => handleDevSkip('caregiver')}
                className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg"
              >
                Caregiver
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-16">

        <div className="text-white text-center max-w-lg">
          <img
            src="/image.png"
            alt="Elderly using technology"
            className="rounded-2xl shadow-2xl mb-8"
          />

          <h3 className="text-3xl font-bold mb-4">
            Compassion Meets Intelligence
          </h3>
          <p className="text-blue-100">
            Secure, passwordless access to AI-powered dementia support —
            built with care, built with trust.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Login;
