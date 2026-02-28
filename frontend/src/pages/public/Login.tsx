import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const Login = () => {
  const navigate = useNavigate();
  const { phoneLogin } = useAuthStore();
  
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
        setSuccess('OTP sent successfully! Check your SMS.');
        setStep('otp');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Failed to send security code. Please try again.'
          : 'Network error. Please try again.'
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

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit code');
      return;
    }

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
        setSuccessMessage('Login successful! Redirecting...');
        
        // Store auth data and user info
        phoneLogin(phoneNumber, response.data.data.token, role);
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
          navigate(role === 'elderly' ? '/elderly/dashboard' : '/caregiver/dashboard');
        }, 1000);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || 'Verification failed. Please try again.'
          : 'Network error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to phone entry
  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setError('');
    setSuccessMessage('');
  };

  const setSuccess = (msg: string) => {
    setSuccessMessage(msg);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-12"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Lock className="text-primary-600" size={40} />
            <span className="text-4xl font-bold text-gray-900">MindBridge</span>
          </div>
          <p className="text-lg text-gray-600">Secure Passwordless Login</p>
        </div>

        {/* Role Selection */}
        <div className="flex gap-2 mb-8">
          {(['elderly', 'caregiver'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              disabled={isLoading || step === 'otp'}
              className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all ${
                role === r
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">Your Phone Number</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:bg-gray-100"
                disabled={isLoading}
                aria-label="Phone number"
              />
              <p className="text-sm text-gray-600 mt-2">Enter in E.164 format (e.g., +919876543210)</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-100 border-2 border-red-300 rounded-lg"
              >
                <p className="text-lg text-red-700 font-semibold">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? '⏳ Sending...' : '📱 Send Security Code'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-lg text-blue-900">
                ✓ Security code sent to <span className="font-bold">{phoneNumber}</span>
              </p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">Enter 6-Digit Code</label>
              <input
                type="text"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="w-full px-6 py-4 text-4xl text-center font-bold tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:bg-gray-100"
                disabled={isLoading}
                aria-label="OTP code"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-100 border-2 border-red-300 rounded-lg"
              >
                <p className="text-lg text-red-700 font-semibold">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? '⏳ Verifying...' : '✓ Verify & Login'}
            </button>

            <button
              type="button"
              onClick={handleBackToPhone}
              disabled={isLoading}
              className="w-full py-4 text-lg font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Back to Phone Number
            </button>
          </form>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-green-100 border-2 border-green-300 rounded-lg"
          >
            <p className="text-lg text-green-700 font-semibold text-center">{successMessage}</p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-lg">🔒 Your security is our priority. No passwords needed.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
