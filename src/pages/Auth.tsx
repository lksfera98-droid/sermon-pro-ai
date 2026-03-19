import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAccessCheck } from '@/hooks/useAccessCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Info, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import preacherLogo from '@/assets/preacher-logo.png';

type AuthView = 'login' | 'signup';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { checkAccess } = useAccessCheck();
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingAccess, setIsValidatingAccess] = useState(false);

  useEffect(() => {
    let active = true;

    const validateExistingSession = async () => {
      if (!user || isSubmitting) return;

      setIsValidatingAccess(true);
      const granted = await checkAccess(user.email ?? undefined);

      if (!active) return;

      setIsValidatingAccess(false);
      navigate(granted ? '/' : '/acesso-bloqueado', { replace: true });
    };

    validateExistingSession();

    return () => {
      active = false;
    };
  }, [user, isSubmitting, checkAccess, navigate]);

  if (loading || isValidatingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Preencha todos os campos'); return; }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);

    if (error) {
      setIsSubmitting(false);
      toast.error(error.message?.includes('Invalid login credentials') ? 'Email ou senha incorretos.' : (error.message || 'Erro ao fazer login'));
      return;
    }

    setIsValidatingAccess(true);
    const granted = await checkAccess(email);
    setIsValidatingAccess(false);
    setIsSubmitting(false);

    if (granted) {
      navigate('/', { replace: true });
    } else {
      navigate('/acesso-bloqueado', { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) { toast.error('Preencha todos os campos'); return; }
    if (password.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return; }

    setIsSubmitting(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setIsSubmitting(false);
      toast.error(error.message?.includes('already registered') ? 'Este email já está cadastrado. Tente fazer login.' : (error.message || 'Erro ao criar conta'));
      return;
    }

    const { error: loginErr } = await signIn(email, password);
    if (loginErr) {
      setIsSubmitting(false);
      toast.error(loginErr.message || 'Erro ao fazer login após cadastro');
      return;
    }

    setIsValidatingAccess(true);
    const granted = await checkAccess(email);
    setIsValidatingAccess(false);
    setIsSubmitting(false);

    if (granted) {
      navigate('/', { replace: true });
    } else {
      navigate('/acesso-bloqueado', { replace: true });
    }
  };

  const resetForm = () => { setEmail(''); setPassword(''); setFullName(''); setShowPassword(false); };

  return (
    <div className="h-[100svh] bg-background overflow-y-auto overscroll-contain touch-pan-y">
      <div className="min-h-[100svh] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <img src={preacherLogo} alt="ProSermon" className="w-24 h-24 object-contain mx-auto rounded-lg" />
            <h1 className="text-2xl font-bold text-primary">ProSermon</h1>
          </div>

          {view === 'login' && (
            <Card className="p-5 border-2 border-primary bg-primary/5 shadow-md">
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0 h-fit">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-base text-foreground">🎉 Tudo novo por aqui?</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Se você já comprou o acesso, basta criar seu cadastro usando o <strong className="text-primary">mesmo email da compra</strong> e definir sua senha.
                  </p>
                  <Button onClick={() => { resetForm(); setView('signup'); }} className="w-full h-12 text-base font-bold mt-2 gap-2">
                    <UserPlus className="h-5 w-5" /> Criar Meu Cadastro Agora
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {view === 'login' && (
            <Card className="p-6 shadow-lg">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-foreground">Já tenho conta</h2>
                  <p className="text-sm text-muted-foreground">Faça login para acessar o app</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" variant="outline" className="w-full h-12 text-base font-semibold border-2 gap-2" disabled={isSubmitting || isValidatingAccess}>
                  {(isSubmitting || isValidatingAccess)
                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Entrando...</>
                    : <><LogIn className="h-5 w-5" />Entrar</>}
                </Button>
              </form>
            </Card>
          )}

          {view === 'signup' && (
            <>
              <Card className="p-4 border-2 border-primary bg-primary/5">
                <div className="flex gap-2 items-center">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm text-foreground font-medium">
                    Use o <strong className="text-primary">mesmo email da compra</strong> para liberar seu acesso.
                  </p>
                </div>
              </Card>
              <Card className="p-6 shadow-lg">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-bold text-foreground">Criar Cadastro</h2>
                    <p className="text-sm text-muted-foreground">Preencha seus dados abaixo</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" minLength={6} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold gap-2" disabled={isSubmitting || isValidatingAccess}>
                    {(isSubmitting || isValidatingAccess)
                      ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Criando conta...</>
                      : <><UserPlus className="h-5 w-5" />Criar Minha Conta</>}
                  </Button>
                </form>
                <div className="mt-6 pt-4 border-t text-center">
                  <button type="button" onClick={() => { resetForm(); setView('login'); }} className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                    <ArrowLeft className="h-3 w-3" /> Já tenho conta, fazer login
                  </button>
                </div>
              </Card>
            </>
          )}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
