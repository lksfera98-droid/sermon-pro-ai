import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldX, RefreshCw, LogOut } from 'lucide-react';

const AccessBlocked = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: accessLoading, recheck } = useAccessCheck(user?.email);
  const [rechecking, setRechecking] = useState(false);

  if (authLoading || accessLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasAccess) return <Navigate to="/" replace />;

  const handleRecheck = async () => {
    setRechecking(true);
    recheck();
    setTimeout(() => setRechecking(false), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border-border/50 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Bloqueado</h1>
          <p className="text-muted-foreground text-sm">
            Seu e-mail ainda não foi encontrado na lista de compradores. Se você já adquiriu o produto, clique abaixo para verificar novamente.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRecheck} className="w-full" disabled={rechecking}>
            <RefreshCw className={`w-4 h-4 ${rechecking ? 'animate-spin' : ''}`} />
            {rechecking ? 'Verificando...' : 'Já comprei, verificar novamente'}
          </Button>

          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Logado como: {user?.email}
        </p>
      </Card>
    </div>
  );
};

export default AccessBlocked;
