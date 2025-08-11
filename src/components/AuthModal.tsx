import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Customer } from '../types';
import { supabase } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Customer | null) => void;
  initialMode?: 'login' | 'register' | 'phone-login' | 'phone-register' | 'forgot-password';
}

type LoginFormData = {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
};

type RegisterFormData = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showOtpField, setShowOtpField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Get authentication methods from context
  const appContext = useApp();
  
  // Initialize form data
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });
  
  // Handle input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Mode switching functions
  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');
  const switchToPhoneLogin = () => setMode('phone-login');
  const switchToPhoneRegister = () => setMode('phone-register');
  const switchToForgotPassword = () => setMode('forgot-password');
  
  // Handle form submissions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email || '',
        password: loginData.password
      });
      
      if (error) throw error;
      if (data?.user) {
        onSuccess(data.user as unknown as Customer);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone
          }
        }
      });
      
      if (error) throw error;
      
      setSuccess('Registration successful! Please check your email to verify your account.');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.phone) {
      setError('Phone number is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (appContext.sendOtp) {
        await appContext.sendOtp(loginData.phone);
        setShowOtpField(true);
        setSuccess('OTP sent to your phone number');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.phone) {
      setError('Phone number is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (appContext.sendOtp) {
        await appContext.sendOtp(registerData.phone);
        setShowOtpField(true);
        setSuccess('OTP sent to your phone number');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    const phone = mode === 'phone-login' ? loginData.phone : registerData.phone;
    if (!phone) {
      setError('Phone number not found');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (appContext.verifyOtp) {
        const { user, error } = await appContext.verifyOtp(phone, otp);
        
        if (error) throw error;
        
        if (mode === 'phone-register' && appContext.registerWithPhone) {
          await appContext.registerWithPhone(phone, registerData.password, registerData.fullName);
          setSuccess('Registration successful! You can now log in.');
          setMode('phone-login');
        } else if (mode === 'phone-login' && appContext.loginWithPhone) {
          await appContext.loginWithPhone(phone, loginData.password);
          onSuccess(user as unknown as Customer);
          onClose();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    const phone = mode === 'phone-login' ? loginData.phone : registerData.phone;
    if (!phone) {
      setError('Phone number not found');
      return;
    }
    
    try {
      if (appContext.sendOtp) {
        await appContext.sendOtp(phone);
        setCountdown(60); // 60 seconds cooldown
        setSuccess('New OTP sent to your phone number');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    }
  };

interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  shippingAddress: ShippingAddress;
}

interface LoginFormData {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode?: 'login' | 'register' | 'phone-login' | 'phone-register' | 'verify-otp';
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'phone-login' | 'phone-register' | 'verify-otp' | 'forgot-password'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showOtpField, setShowOtpField] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const { 
    loginWithPhone = async () => { throw new Error('loginWithPhone not implemented') }, 
    registerWithPhone = async () => { throw new Error('registerWithPhone not implemented') }, 
    sendOtp = async () => { throw new Error('sendOtp not implemented') }, 
    verifyOtp = async () => { throw new Error('verifyOtp not implemented') }, 
    authError = null, 
    clearAuthError = () => {}, 
    authLoading = false 
  } = useApp() as any; // Temporary type assertion

  // Form states
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    phone: '',
    password: '',
    rememberMe: false,
  });

  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    shippingAddress: {
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Uganda',
    },
  });
  
  // Mode switching functions
  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');
  const switchToPhoneLogin = () => setMode('phone-login');
  const switchToPhoneRegister = () => setMode('phone-register');
  const switchToForgotPassword = () => setMode('forgot-password');
  
  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const phone = loginForm.phone || registerForm.phone;
      if (!phone) {
        throw new Error('Phone number not found');
      }
      
      await verifyOtp(phone, otp);
      setSuccess('Phone verified successfully!');
      
      // Close modal after successful verification
      setTimeout(() => {
        onSuccess(null);
        onClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle phone registration
  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { phone, password, fullName } = registerForm;
    if (!phone || !password || !fullName) {
      setError('All fields are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await registerWithPhone(phone, password, fullName);
      setShowOtpField(true);
      startOtpCountdown();
      setSuccess('Registration successful! Please verify your phone number.');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start OTP countdown
  const startOtpCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle OTP resend
  const handleResendOtp = async (phone: string) => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
      setError('');
      await sendOtp(phone);
      startOtpCountdown();
      setSuccess('OTP has been resent to your phone');
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };



  // Clear errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      clearAuthError?.();
    }
  }, [isOpen, clearAuthError]);

  // Handle countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const startOtpCountdown = () => {
    setCountdown(60); // 60 seconds countdown
  };

  const handleResendOtp = async (phone: string) => {
    if (countdown > 0) return;
    
    try {
      setIsLoading(true);
      setError('');
      await sendOtp(phone);
      startOtpCountdown();
      setSuccess('OTP has been resent to your phone');
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startOtpCountdown = () => {
    setCountdown(60); // 60 seconds countdown
  };

  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasNumber && hasSpecial;
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = loginForm.phone || '';
    if (!phone || !loginForm.password) {
      setError('Phone and password are required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      await loginWithPhone(phone, loginForm.password);
      onSuccess(null); // The actual user will be set by the auth listener
      onClose();
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { phone, password, fullName } = registerForm;
    if (!phone || !password || !fullName) {
      setError('All fields are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await registerWithPhone(phone, password, fullName);
      setShowOtpField(true);
      startOtpCountdown();
      setSuccess('Registration successful! Please verify your phone number.');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }

    try {
      setIsLoading(true);
      setError('');
      
      await registerWithPhone(phone, password, fullName);
      setShowOtpField(true);
      startOtpCountdown();
      setSuccess('Registration successful! Please verify your phone number.');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const phone = loginForm.phone || registerForm.phone;
      if (!phone) {
        throw new Error('Phone number not found');
      }
      
      await verifyOtp(phone, otp);
      setSuccess('Phone verified successfully!');
      
      // Close modal after successful verification
      setTimeout(() => {
        onSuccess(null);
        onClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }

    try {
      setIsLoading(true);
      setError('');
      
      const phone = loginForm.phone || registerForm.phone;
      if (!phone) {
        throw new Error('Phone number not found');
      }
      
      await verifyOtp(phone, otp);
      setSuccess('Phone verified successfully!');
      setTimeout(() => {
        onSuccess(null); // The actual user will be set by the auth listener
        onClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching between login/register modes
  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');
  const switchToPhoneLogin = () => setMode('phone-login');
  const switchToPhoneRegister = () => setMode('phone-register');
  const switchToForgotPassword = () => setMode('forgot-password');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await authService.login(loginForm);
      setSuccess('Login successful!');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!registerForm.password || !validatePassword(registerForm.password)) {
      setError('Password must be at least 8 characters with numbers and special characters');
      setIsLoading(false);
      return;
    }

    try {
      const { user, needsVerification } = await authService.register(registerForm);
      
      if (needsVerification) {
        setSuccess('Registration successful! Please check your email to verify your account.');
        setMode('login');
      } else {
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(forgotPasswordEmail);
      setSuccess('Password reset email sent! Check your inbox.');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="+256 700 000 000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Must be 8+ characters with numbers and special characters
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Shipping Address</h4>
                
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={registerForm.shippingAddress.addressLine1}
                      onChange={(e) => setRegisterForm(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, addressLine1: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Address Line 1"
                      required
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={registerForm.shippingAddress.addressLine2}
                      onChange={(e) => setRegisterForm(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, addressLine2: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Address Line 2 (Optional)"
                    />
                  </div>
                      value={registerForm.shippingAddress.state}
                      onChange={(e) => setRegisterForm(prev => ({
                        ...prev,
                        shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="State/Region"
                      required
                    />
                  </div>
                  
                  <input
                    type="text"
                    value={registerForm.shippingAddress.postalCode}
                    onChange={(e) => setRegisterForm(prev => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, postalCode: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Postal Code"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            {mode === 'login' && (
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot-password' && (
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}