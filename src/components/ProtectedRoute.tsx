import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading, checkAccess } = useAccessCheck();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (user) {
      checkAccess().then(() => setChecked(true));
    }
  }, [user, checkAccess]);

  if (authLoading || (user && !checked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess) return <Navigate to="/acesso-bloqueado" replace />;

  return <>{children}</>;
};
