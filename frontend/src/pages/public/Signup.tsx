import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user.types';
import { motion } from 'framer-motion';
import { Brain, ChevronRight, Phone, Mail, User, Lock, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import MBButton from '@/components/common/Button';

const Signup = () => {
  const [step, setStep] = useState<'details' | 'phone'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('elderly');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !name || !email || !password) return;
    setStep('phone');
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      await signup(name, email, password, role, phoneNumber);
      navigate(role === 'elderly' ? '/elderly/dashboard' : '/caregiver/dashboard');
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-2xl p-8 w-full max-w-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
            <Brain className="text-white" size={28} />
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MindBridge
          </span>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Join MindBridge and start your journey with us
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step === 'details' 
                ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 rounded ${
              step === 'phone' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          </div>
          <div className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              step === 'phone' 
                ? 'bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-900' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 'details' && (
          <>
            {/* Role Selection - Sign Up Specific */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                I want to sign up as
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['elderly', 'caregiver'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      role === r 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-sm font-medium capitalize mb-1 ${
                        role === r 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {r}
                      </div>
                      <div className={`text-xs ${
                        role === r 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        {r === 'elderly' ? 'Looking for care' : 'Providing care'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-label="Full name" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    aria-label="Email" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                    aria-label="Password" 
                    required 
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 8 characters with 1 number and 1 letter
                </p>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer group mt-4">
                <div className="relative mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    className="sr-only" 
                    required 
                  />
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all ${
                    agreed 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-400 group-hover:border-blue-500'
                  }`}>
                    {agreed && <CheckCircle className="text-white" size={12} />}
                  </div>
                </div>
                <span>
                  I agree to the <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Privacy Policy</Link>
                </span>
              </label>

              <MBButton 
                type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30" 
                disabled={!agreed || !name || !email || !password}
              >
                Continue to Phone Verification
                <ArrowRight className="inline ml-2" size={18} />
              </MBButton>
            </form>
          </>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            {/* Account Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-xl border border-blue-200 dark:border-gray-600">
              <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                Account Summary
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">{email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={14} className="text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400 capitalize">Signing up as: <span className="font-medium text-gray-700 dark:text-gray-300">{role}</span></span>
                </div>
              </div>
            </div>

            {/* Phone Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number for Verification
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="tel" 
                  placeholder="+1 234 567 8900" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                  aria-label="Phone number"
                  pattern="^\+\d{1,15}$"
                  required 
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <CheckCircle size={12} className="text-green-500" />
                Include country code (e.g., +1 for US, +44 for UK)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <MBButton 
                type="button" 
                onClick={() => setStep('details')} 
                variant="outline"
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium"
              >
                Back
              </MBButton>
              <MBButton 
                type="submit" 
                disabled={!phoneNumber || loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Complete Sign Up'
                )}
              </MBButton>
            </div>

            {/* Security Note */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
              🔒 Your information is encrypted and secure
            </p>
          </form>
        )}

        {/* Sign In Link */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Already have an account?
            </span>
          </div>
        </div>

        <p className="text-center text-sm mt-4">
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1 transition-colors">
            Sign in to your account
            <ChevronRight size={16} />
          </Link>
        </p>

        {/* Trust Badge */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            By signing up, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
