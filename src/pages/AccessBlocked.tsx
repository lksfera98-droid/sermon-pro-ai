import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { LoadingProgress } from '@/components/LoadingProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldX, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const AccessBlocked = () => {
  const { user, loading, signOut } = useAuth();
  const { hasAccess, loading: accessLoading, recheck } = useAccessCheck(user?.email);
  const navigate = useNavigate();
  const [rechecking, setRechecking] = useState(false);

  if (loading || accessLoading) return <LoadingProgress />;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasAccess) return <Navigate to="/" replace />;

  const handleRecheck = async () => {
    setRechecking(true);
    const result = await recheck();
    setRechecking(false);
    if (result) {
      navigate('/', { replace: true });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Seu acesso ainda não foi liberado. Adquira o produto para ter acesso completo ao app.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full" size="lg" asChild>
            <a
              href="https://pay.hotmart.com/SEU_LINK_AQUI"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Comprar Agora
            </a>
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleRecheck}
            disabled={rechecking}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${rechecking ? 'animate-spin' : ''}`} />
            {rechecking ? 'Verificando...' : 'Já paguei, verificar acesso'}
          </Button>

          <Button variant="ghost" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Logado como: {user.email}
        </p>
      </Card>
    </div>
  );
};

export default AccessBlocked;
