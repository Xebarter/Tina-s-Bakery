import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check for authentication in localStorage
    const checkAuth = () => {
      try {
        const authStatus = localStorage.getItem('is_authenticated') === 'true';
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (in case of logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'is_authenticated') {
        setIsAuthenticated(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
