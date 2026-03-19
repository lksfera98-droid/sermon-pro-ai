import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldX, RefreshCw, LogOut, Crown, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import preacherLogo from '@/assets/preacher-logo.png';

const AccessBlocked = () => {
  const { user, signOut } = useAuth();
  const { hasAccess, loading, checkAccess } = useAccessCheck();
  const navigate = useNavigate();
  const [isRechecking, setIsRechecking] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;
    checkAccess(user.email ?? undefined).then((granted) => {
      if (active && granted) {
        console.log('redirecting from /acesso-bloqueado');
        navigate('/', { replace: true });
      }
    });

    return () => { active = false; };
  }, [user, checkAccess, navigate]);

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
    const granted = await checkAccess(user.email ?? undefined);
    if (granted) {
      toast.success('Acesso liberado! Redirecionando...');
      navigate('/', { replace: true });
    } else {
      toast.error('Acesso ainda não encontrado. Verifique se usou o mesmo email da compra.');
    }
    setIsRechecking(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="h-[100svh] overflow-y-auto overscroll-contain bg-background" style={{ touchAction: 'pan-y' }}>
      <div className="min-h-[100svh] flex flex-col items-center justify-start px-4 py-8 pb-16">
        <div className="w-full max-w-lg text-center space-y-4 mb-8">
          <img src={preacherLogo} alt="Logo" className="h-14 w-auto mx-auto" />
          <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Seu acesso ainda não está ativo</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              O app é exclusivo para usuários com plano pago. Se você já comprou, certifique-se de usar o <strong>mesmo email da compra</strong>.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            Email atual: <span className="font-medium text-foreground">{user.email}</span>
          </div>

          <Button onClick={handleRecheck} disabled={isRechecking} variant="outline" className="w-full max-w-xs h-11 text-sm font-semibold mx-auto">
            {isRechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Já comprei, verificar novamente
          </Button>
        </div>

        <div className="w-full max-w-lg space-y-5">
          <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10">
            <p className="text-sm font-semibold text-foreground text-center">
              Sem acesso ativo, o app permanece bloqueado. Escolha um plano abaixo para desbloquear agora.
            </p>
          </Card>

          <Card className="p-5 space-y-4 border-border/60 bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-foreground/70" />
              </div>
              <h3 className="text-base font-bold text-foreground">Acesso por mais 1 mês</h3>
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Todos os recursos por 30 dias
              </li>
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Acesso imediato após pagamento
              </li>
            </ul>
            <Button className="w-full h-11 text-sm font-semibold" variant="secondary" asChild>
              <a href="https://pay.sermonpro.online/checkout/200528830:1" target="_blank" rel="noopener noreferrer">
                Liberar por 1 mês
              </a>
            </Button>
          </Card>

          <div className="relative">
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 blur-sm animate-pulse" style={{ animationDuration: '3s' }} />
            <Card className="relative p-5 space-y-4 border-primary/50 bg-card ring-1 ring-primary/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground shadow-lg">
                  <Crown className="h-3 w-3" /> MELHOR ESCOLHA
                </span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">Acesso vitalício</h3>
              </div>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Acesso permanente e ilimitado
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Sem mensalidade, sem renovação
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> Todas as atualizações futuras
                </li>
              </ul>
              <Button className="w-full h-12 text-sm font-bold shadow-lg" asChild>
                <a href="https://pay.sermonpro.online/checkout/200533562:1" target="_blank" rel="noopener noreferrer">
                  Quero acesso para sempre
                </a>
              </Button>
            </Card>
          </div>

          <Button onClick={handleLogout} variant="ghost" className="w-full text-sm text-muted-foreground">
            <LogOut className="h-4 w-4" /> Voltar para o login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessBlocked;
