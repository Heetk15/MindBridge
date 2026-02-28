import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user.types';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
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
      // Call signup with phone number included
      await signup(name, email, password, role, phoneNumber);
      navigate(role === 'elderly' ? '/elderly/dashboard' : '/caregiver/dashboard');
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-elevated p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Brain className="text-primary" size={32} />
          <span className="font-display font-bold text-2xl text-foreground">MindBridge</span>
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground text-center mb-6">
          {step === 'details' ? 'Create Account' : 'Add Phone Number'}
        </h1>

        {step === 'details' && (
          <>
            <div className="flex gap-2 mb-6">
              {(['elderly', 'caregiver'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all ${
                    role === r ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Full name" required />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Email" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Password" required />
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" required />
                I agree to the Terms of Service and Privacy Policy
              </label>
              <MBButton type="submit" className="w-full" disabled={!agreed || !name || !email || !password}>Continue</MBButton>
            </form>
          </>
        )}

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="bg-secondary/50 p-3 rounded-xl mb-4">
              <p className="text-sm text-muted-foreground">📝 Account Details:</p>
              <p className="font-medium text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <p className="text-sm text-muted-foreground capitalize">Role: {role}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number (E.164 Format)
              </label>
              <input 
                type="tel" 
                placeholder="+919876543210" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                aria-label="Phone number"
                pattern="^\+\d{1,15}$"
                required 
              />
              <p className="text-xs text-muted-foreground mt-2">Format example: +919876543210</p>
            </div>

            <div className="flex gap-2">
              <MBButton 
                type="button" 
                onClick={() => setStep('details')} 
                variant="outline"
                className="flex-1"
              >
                Back
              </MBButton>
              <MBButton 
                type="submit" 
                disabled={!phoneNumber || loading}
                className="flex-1"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </MBButton>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Log In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
