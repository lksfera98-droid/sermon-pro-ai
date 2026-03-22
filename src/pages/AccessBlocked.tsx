import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldX, LogOut } from 'lucide-react';

const AccessBlocked = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Sua assinatura não foi identificada. Para acessar o app, assine um dos nossos planos.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <a
              href="https://pay.sermonpro.online/checkout/200528830:1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Assinar Agora — Plano Mensal
            </a>
          </Button>
          <Button asChild variant="secondary" className="w-full" size="lg">
            <a
              href="https://pay.sermonpro.online/checkout/200533562:1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Assinar Agora — Plano Vitalício ⭐
            </a>
          </Button>
        </div>
        <Button variant="ghost" className="w-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </Card>
    </div>
  );
};

export default AccessBlocked;
