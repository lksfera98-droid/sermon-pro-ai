import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { LoadingProgress } from '@/components/LoadingProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, LogOut, RefreshCw, Crown, Zap, BookOpen, Sparkles, CheckCircle2, Star, Clock, Infinity } from 'lucide-react';
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

  const features = [
    { icon: BookOpen, text: 'Sermões gerados por IA de alta qualidade' },
    { icon: Sparkles, text: 'Devocionais diários personalizados' },
    { icon: Zap, text: 'Estudos bíblicos profundos e completos' },
    { icon: Star, text: 'Pesquisa inteligente de versículos' },
    { icon: ShieldCheck, text: 'Tradutor bíblico multilíngue' },
    { icon: Crown, text: 'Acesso ilimitado a todas as ferramentas' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Crown className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Desbloqueie o <span className="text-primary">SermonPro AI</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-sm mx-auto">
            Milhares de pastores e líderes já transformaram seus ministérios. Agora é a sua vez.
          </p>
        </div>

        {/* Features */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            O que você desbloqueia
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 6 meses */}
          <Card className="p-5 space-y-4 border-border/50 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">Acesso 6 Meses</h3>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-foreground">R$ 67</span>
              <span className="text-muted-foreground text-sm ml-1">/ 6 meses</span>
            </div>
            <p className="text-xs text-muted-foreground">Ideal para experimentar todo o poder da plataforma</p>
            <Button className="w-full" size="lg" asChild>
              <a
                href="https://pay.sermonpro.online/checkout/200533452:1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Começar Agora
              </a>
            </Button>
          </Card>

          {/* Vitalício */}
          <Card className="p-5 space-y-4 border-2 border-primary relative overflow-hidden shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Melhor Escolha
            </div>
            <div className="flex items-center gap-2">
              <Infinity className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground">Acesso Vitalício</h3>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-primary">R$ 97</span>
              <span className="text-muted-foreground text-sm ml-1">/ para sempre</span>
            </div>
            <p className="text-xs text-muted-foreground">Pague uma vez e use para sempre. Sem mensalidades.</p>
            <Button className="w-full bg-primary hover:bg-primary/90 shadow-lg" size="lg" asChild>
              <a
                href="https://pay.sermonpro.online/checkout/200533562:1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Crown className="mr-2 h-4 w-4" />
                Garantir Acesso Vitalício
              </a>
            </Button>
          </Card>
        </div>

        {/* Social proof */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            +1.000 líderes já usam o SermonPro AI no ministério
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleRecheck}
            disabled={rechecking}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${rechecking ? 'animate-spin' : ''}`} />
            {rechecking ? 'Verificando...' : 'Já paguei, verificar acesso'}
          </Button>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Logado como: {user.email}
        </p>
      </div>
    </div>
  );
};

export default AccessBlocked;
