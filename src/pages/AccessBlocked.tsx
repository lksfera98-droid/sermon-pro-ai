import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { LoadingProgress } from '@/components/LoadingProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, LogOut, RefreshCw, Crown, Zap, BookOpen, Sparkles, CheckCircle2, Star, Clock, Infinity, MessageCircle, Award, Lock } from 'lucide-react';
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
    { icon: BookOpen, text: 'Sermões completos gerados por IA em segundos' },
    { icon: Sparkles, text: 'Devocionais diários personalizados para seu ministério' },
    { icon: Zap, text: 'Estudos bíblicos profundos e estruturados' },
    { icon: Star, text: 'Pesquisa inteligente de versículos por tema' },
    { icon: ShieldCheck, text: 'Tradutor bíblico em múltiplos idiomas' },
    { icon: Crown, text: 'Acesso ilimitado a todas as ferramentas — sem limites' },
  ];

  const testimonials = [
    {
      name: 'Pr. Carlos M.',
      role: 'Pastor há 15 anos',
      text: 'O SermonPro AI transformou minha preparação de sermões. O que levava 8 horas, agora faço em 30 minutos com qualidade superior.',
    },
    {
      name: 'Pra. Ana Silva',
      role: 'Líder de célula',
      text: 'Os devocionais diários me ajudam a alimentar minha vida espiritual e a preparar materiais para o grupo toda semana.',
    },
    {
      name: 'Ev. Marcos R.',
      role: 'Evangelista',
      text: 'Desde que comecei a usar, meus estudos bíblicos ganharam profundidade. Os membros da igreja notaram a diferença!',
    },
  ];

  return (
    <div className="h-[100svh] overflow-y-auto bg-background">
      <div className="min-h-full">
        
        {/* Hero Section */}
        <div className="relative px-4 pt-10 pb-8 text-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-lg mx-auto space-y-5">
            {/* Urgency badge */}
            <div className="inline-flex items-center gap-1.5 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
              <Lock className="h-3 w-3" />
              Acesso Exclusivo para Membros
            </div>
            
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Crown className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Prepare sermões <span className="text-primary">incríveis</span> em minutos, não em horas
            </h1>
            
            <p className="text-muted-foreground text-base leading-relaxed">
              Junte-se a <strong className="text-foreground">+1.000 pastores e líderes</strong> que já revolucionaram seus ministérios com inteligência artificial.
            </p>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="px-4 pb-8 max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-destructive/20 bg-destructive/5">
              <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">❌ Sem SermonPro</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• 6-10 horas por sermão</li>
                <li>• Pesquisa manual exaustiva</li>
                <li>• Devocionais repetitivos</li>
                <li>• Estudos sem profundidade</li>
              </ul>
            </Card>
            <Card className="p-4 border-primary/30 bg-primary/5">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">✅ Com SermonPro</p>
              <ul className="space-y-2 text-xs text-foreground font-medium">
                <li>• Sermão pronto em 2 min</li>
                <li>• IA faz a pesquisa por você</li>
                <li>• Devocionais únicos diários</li>
                <li>• Estudos profundos e ricos</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="px-4 pb-8 max-w-lg mx-auto">
          <Card className="p-5 border-border/50">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Tudo que você desbloqueia
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Plans */}
        <div className="px-4 pb-8 max-w-lg mx-auto space-y-4">
          <h2 className="text-center text-lg font-bold text-foreground">
            Escolha seu plano
          </h2>

          {/* Lifetime - Featured */}
          <Card className="p-6 space-y-4 border-2 border-primary relative overflow-hidden shadow-[0_0_40px_-5px_hsl(var(--primary)/0.4)]">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
              🔥 Mais Popular
            </div>
            <div className="flex items-center gap-2">
              <Infinity className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Acesso Vitalício</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-primary">R$ 97</span>
              <span className="text-muted-foreground text-sm">/ pagamento único</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pague <strong className="text-foreground">uma única vez</strong> e use para sempre. Sem mensalidades, sem surpresas. Acesso completo e ilimitado.
            </p>
            <Button className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg animate-pulse" size="lg" asChild>
              <a
                href="https://pay.sermonpro.online/checkout/209180362:1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Crown className="mr-2 h-5 w-5" />
                Garantir Acesso Vitalício
              </a>
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">🔒 Pagamento seguro • Acesso imediato</p>
          </Card>

          {/* 6 months */}
          <Card className="p-5 space-y-3 border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">Acesso por 6 Meses</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">R$ 67</span>
              <span className="text-muted-foreground text-sm">/ 6 meses</span>
            </div>
            <p className="text-xs text-muted-foreground">Ideal para experimentar o poder da plataforma</p>
            <Button className="w-full" variant="outline" size="lg" asChild>
              <a
                href="https://pay.sermonpro.online/checkout/209180349:1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Começar com 6 Meses
              </a>
            </Button>
          </Card>
        </div>

        {/* Testimonials */}
        <div className="px-4 pb-8 max-w-lg mx-auto space-y-4">
          <h3 className="text-center text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" />
            O que dizem nossos membros
          </h3>
          {testimonials.map((t, i) => (
            <Card key={i} className="p-4 border-border/30">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground italic leading-relaxed mb-3">"{t.text}"</p>
              <div>
                <p className="text-xs font-bold text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Social proof */}
        <div className="px-4 pb-6 max-w-lg mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-sm font-semibold text-foreground">
            Avaliação 4.9/5 — +1.000 ministérios transformados
          </p>
        </div>

        {/* Guarantee */}
        <div className="px-4 pb-8 max-w-lg mx-auto">
          <Card className="p-5 border-primary/20 bg-primary/5 text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto" />
            <h4 className="font-bold text-foreground">Satisfação Garantida</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se você não ficar satisfeito nos primeiros 7 dias, devolvemos 100% do seu investimento. Sem perguntas, sem burocracia.
            </p>
          </Card>
        </div>

        {/* Actions */}
        <div className="px-4 pb-8 max-w-lg mx-auto space-y-2">
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

        <p className="text-center text-[11px] text-muted-foreground pb-6">
          Logado como: {user.email}
        </p>
      </div>
    </div>
  );
};

export default AccessBlocked;
