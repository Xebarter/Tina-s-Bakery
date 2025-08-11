import { useState } from 'react';
import { authService } from '../services/authService';

interface PhoneAuthFormProps {
  onSuccess: () => void;
  onModeChange: () => void;
}

export function PhoneAuthForm({ onSuccess, onModeChange }: PhoneAuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }

      // Format phone number if needed (add country code)
      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
      
      await authService.sendOtp(formattedPhone);
      setMode('verify');
      setMessage('OTP sent to your phone number');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!otp) {
        throw new Error('Please enter the OTP');
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
      const { session } = await authService.verifyOtp({
        phone: formattedPhone,
        token: otp,
      });

      if (session) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!phone || !password) {
        throw new Error('Phone and password are required');
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
      await authService.loginWithPhone({
        phone: formattedPhone,
        password,
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!phone || !password || !fullName) {
        throw new Error('All fields are required');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/[!@#$%^&*]/.test(password)) {
        throw new Error('Password must contain at least one special character');
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+256${phone.replace(/^0/, '')}`;
      
      await authService.registerWithPhone({
        phone: formattedPhone,
        password,
        fullName,
      });
      
      setMessage('Registration successful! Please verify your phone number.');
      await authService.sendOtp(formattedPhone);
      setMode('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'login' 
            ? 'Sign in with Phone' 
            : mode === 'register' 
              ? 'Create an Account' 
              : 'Verify Phone Number'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {mode === 'verify' 
            ? 'Enter the OTP sent to your phone' 
            : 'Enter your phone number to continue'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          {message}
        </div>
      )}

      {mode === 'verify' ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      ) : mode === 'login' ? (
        <form onSubmit={handlePhoneLogin} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">+256</span>
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="712345678"
                className="pl-12 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Create an account
            </button>
            <span className="mx-2 text-gray-400">or</span>
            <button
              type="button"
              onClick={onModeChange}
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Use email instead
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePhoneRegister} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">+256</span>
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="712345678"
                className="pl-12 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 8 characters with one special character (!@#$%^&*)
            </p>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
          <div className="text-center text-sm">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Sign in
            </button>
            <div className="mt-2">
              <button
                type="button"
                onClick={onModeChange}
                className="font-medium text-amber-600 hover:text-amber-500"
              >
                Use email instead
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
