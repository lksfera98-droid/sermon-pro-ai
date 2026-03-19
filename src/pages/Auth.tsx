import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Info, ArrowLeft } from 'lucide-react';
import preacherLogo from '@/assets/preacher-logo.png';

type AuthView = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    setIsSubmitting(false);
    if (error) {
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado. Tente fazer login.');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
    } else {
      toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.');
      setView('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Digite seu email');
      return;
    }
    setIsSubmitting(true);
    const { error } = await resetPassword(email);
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setView('login');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <img
            src={preacherLogo}
            alt="ProSermon"
            className="w-28 h-28 object-contain mx-auto rounded-lg"
          />
          <h1 className="text-2xl font-bold text-primary">ProSermon</h1>
        </div>

        {/* Info Banner for returning users */}
        {(view === 'login' || view === 'signup') && (
          <Card className="p-4 border-2 border-accent/30 bg-accent/5">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  Tudo novo por aqui?
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Se você já comprou o acesso anteriormente, basta criar seu cadastro usando o <strong>mesmo email utilizado na compra</strong> e definir sua senha. Depois disso, você poderá entrar normalmente no aplicativo.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Login Form */}
        {view === 'login' && (
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-foreground">Entrar</h2>
                <p className="text-sm text-muted-foreground">Acesse sua conta</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setView('forgot-password'); }}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t text-center space-y-2">
              <p className="text-sm text-muted-foreground">Ainda não tem conta?</p>
              <Button
                variant="outline"
                className="w-full h-12 text-base font-semibold border-2 border-primary/30"
                onClick={() => { resetForm(); setView('signup'); }}
              >
                Criar Cadastro
              </Button>
              <p className="text-xs text-accent font-medium">
                Use o mesmo email da compra para liberar seu acesso.
              </p>
            </div>
          </Card>
        )}

        {/* Signup Form */}
        {view === 'signup' && (
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-foreground">Criar Cadastro</h2>
                <p className="text-sm text-accent font-medium">
                  Use o mesmo email da compra para liberar seu acesso.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Minha Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center">
              <button
                type="button"
                onClick={() => { resetForm(); setView('login'); }}
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Já tenho conta, fazer login
              </button>
            </div>
          </Card>
        )}

        {/* Forgot Password Form */}
        {view === 'forgot-password' && (
          <Card className="p-6 shadow-lg">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-foreground">Recuperar Senha</h2>
                <p className="text-sm text-muted-foreground">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center">
              <button
                type="button"
                onClick={() => { resetForm(); setView('login'); }}
                className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;
