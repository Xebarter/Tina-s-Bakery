import React, { useState } from 'react';
import { X, Phone, User, Loader } from 'lucide-react';
import { phoneAuthService, PhoneLoginData } from '../services/phoneAuthService';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export function PhoneAuthModal({ isOpen, onClose, onSuccess }: PhoneAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<PhoneLoginData>({
    phone: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const user = await phoneAuthService.loginOrRegister(formData);
      setSuccess('Account access granted!');
      onSuccess(user);
      onClose();
      
      // Reset form
      setFormData({ phone: '', name: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to access account');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits, spaces, dashes, parentheses, and plus sign
    const cleaned = value.replace(/[^\d\s\-\(\)\+]/g, '');
    setFormData(prev => ({ ...prev, phone: cleaned }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Account Access
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0700 123 456"
                  required
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Enter your Uganda phone number
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Your name"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.phone.trim()}
              className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </div>
              ) : (
                'Access Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-amber-800 text-sm">
                <strong>Simple Access:</strong> Enter your phone number to create an account or access an existing one. 
                No passwords or verification required!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}