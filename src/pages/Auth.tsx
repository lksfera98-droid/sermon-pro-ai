import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Info, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import preacherLogo from '@/assets/preacher-logo.png';

type AuthView = 'login' | 'signup' | 'forgot-password';

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
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
    const { error, accessGranted } = await signIn(email, password);
    setIsSubmitting(false);
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      } else {
        toast.error(error.message || 'Erro ao fazer login');
      }
      return;
    }

    if (accessGranted) {
      console.log('redirecting to app');
      navigate('/', { replace: true });
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
      console.error('Erro ao criar usuário no auth:', error.message);
    } else {
      console.log('Usuário criado no auth com sucesso');
      console.log('Linha criada automaticamente em public.app_users via trigger');
      toast.success('Cadastro criado com sucesso! Seu acesso será liberado após a confirmação do pagamento. 🎉');
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
    <div className="h-[100svh] bg-background overflow-y-auto overscroll-contain touch-pan-y">
      <div className="min-h-[100svh] flex flex-col items-center justify-start py-8 px-4">
        <div className="w-full max-w-md space-y-5">
          {/* Logo */}
          <div className="text-center space-y-2">
            <img
              src={preacherLogo}
              alt="ProSermon"
              className="w-24 h-24 object-contain mx-auto rounded-lg"
            />
            <h1 className="text-2xl font-bold text-primary">ProSermon</h1>
          </div>

          {/* Prominent Signup CTA for returning users */}
          {view === 'login' && (
            <Card className="p-5 border-2 border-primary bg-primary/5 shadow-md">
              <div className="flex gap-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0 h-fit">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-base text-foreground">
                    🎉 Tudo novo por aqui?
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Se você já comprou o acesso anteriormente, basta criar seu cadastro usando o <strong className="text-primary">mesmo email utilizado na compra</strong> e definir sua senha. Depois disso, você poderá entrar normalmente!
                  </p>
                  <Button
                    onClick={() => { resetForm(); setView('signup'); }}
                    className="w-full h-12 text-base font-bold mt-2 gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    Criar Meu Cadastro Agora
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Login Form */}
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

                <Button type="submit" variant="outline" className="w-full h-12 text-base font-semibold border-2 gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Entrar
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { resetForm(); setView('forgot-password'); }}
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </Card>
          )}

          {/* Signup Form */}
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

                  <Button type="submit" className="w-full h-14 text-lg font-bold gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5" />
                        Criar Minha Conta
                      </>
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
            </>
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

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
