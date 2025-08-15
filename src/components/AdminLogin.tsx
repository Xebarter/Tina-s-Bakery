import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import bcrypt from 'bcryptjs';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@tinasbakery.com');
  const [password, setPassword] = useState('Admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Fetch admin by email
      const { data: admin, error: fetchError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (fetchError || !admin) {
        throw new Error('Invalid login credentials');
      }

      // Verify password using bcrypt
      const valid = bcrypt.compareSync(password, admin.password_hash);
      if (!valid) {
        throw new Error('Invalid login credentials');
      }

      // Login successful
      setSuccess('Successfully signed in! Redirecting...');
      
      // Store admin session info in localStorage
      localStorage.setItem('admin_email', admin.email);
      localStorage.setItem('admin_id', admin.id);
      localStorage.setItem('is_authenticated', 'true');
      localStorage.setItem('admin_name', admin.name || 'Admin');

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.svg"
                alt="Tina's Bakery Logo"
                className="h-16 w-16"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(40%) sepia(76%) saturate(485%) hue-rotate(356deg) brightness(95%) contrast(92%)',
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">Sign in to manage your bakery</p>
          </div>

          {error && (
            <div className="mb-6">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${error ? 'text-red-400' : 'text-amber-500'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border ${error
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500'
                      } rounded-md shadow-sm sm:text-sm`}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${error ? 'text-red-400' : 'text-amber-500'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border ${error
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 placeholder-gray-500 focus:ring-amber-500 focus:border-amber-500'
                      } rounded-md shadow-sm sm:text-sm`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${error ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading ? 'opacity-75 cursor-not-allowed' : ''
                  } transition-colors duration-200`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Processing...
                  </>
                ) : (
                  'Sign in to dashboard'
                )}
              </button>
            </div>

            <div className="text-center text-xs text-gray-500 mt-4">
              <p>Use default credentials if this is the first login</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
