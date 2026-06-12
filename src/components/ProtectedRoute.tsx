import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingProgress } from '@/components/LoadingProgress';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingProgress />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};
