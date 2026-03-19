import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldX, RefreshCw, ShoppingCart, LogOut } from 'lucide-react';
import preacherLogo from '@/assets/preacher-logo.png';

const AccessBlocked = () => {
  const { user, signOut } = useAuth();
  const { hasAccess, loading, recheckAccess } = useAccessCheck();
  const [isRechecking, setIsRechecking] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  if (hasAccess) return <Navigate to="/" replace />;

  const handleRecheck = async () => {
    setIsRechecking(true);
    await recheckAccess();
    setIsRechecking(false);
  };

  return (
    <div className="min-h-[100svh] overflow-y-auto bg-background">
      <div className="min-h-[100svh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 space-y-8 text-center border-destructive/30 bg-card shadow-2xl">
          <div className="space-y-4">
            <img src={preacherLogo} alt="Logo" className="h-16 w-auto mx-auto" />
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              Acesso não encontrado
            </h1>
            <p className="text-lg font-medium text-foreground/80">
              Não encontramos um acesso ativo para este email.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Se você já comprou o aplicativo, verifique se criou sua conta com o mesmo email usado na compra. Caso ainda não tenha comprado, adquira seu acesso para continuar.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              Email atual: <span className="font-medium text-foreground">{user.email}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleRecheck}
              disabled={isRechecking}
              className="w-full h-12 text-base font-semibold"
              variant="default"
            >
              {isRechecking ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              Já comprei, verificar novamente
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <a href="#" target="_blank" rel="noopener noreferrer">
                <ShoppingCart className="h-5 w-5" />
                Comprar acesso
              </a>
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccessBlocked;
