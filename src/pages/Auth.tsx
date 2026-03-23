import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, LogIn, KeyRound, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || 'E-mail ou senha incorretos');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Digite seu e-mail');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) {
        toast.error(error.message || 'Erro ao enviar e-mail');
      } else {
        setResetSent(true);
        toast.success('Link de redefinição enviado para seu e-mail!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Sermon<span className="text-primary">Pro</span> AI
          </h1>
          <p className="text-xs text-muted-foreground">A ferramenta definitiva para pregadores e líderes</p>
        </div>
        {/* DESTAQUE - PRIMEIRO ACESSO */}
        <Card className="p-6 border-2 border-primary bg-primary/5 shadow-xl">
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">🆕 Primeira vez aqui?</h2>
            <p className="text-sm text-muted-foreground">
              Se você <strong>já comprou</strong> mas ainda <strong>não criou sua senha</strong>, clique abaixo para configurar seu acesso.
            </p>
            <Button asChild className="w-full text-base font-semibold py-5" size="lg">
              <Link to="/primeiro-acesso">
                <UserPlus className="w-5 h-5 mr-2" />
                Criar minha conta agora
              </Link>
            </Button>
          </div>
        </Card>

        {/* LOGIN */}
        <Card className="p-8 space-y-6 shadow-lg border-border/50">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">Já tem conta? Entre aqui</h2>
            <p className="text-muted-foreground text-sm">
              {forgotMode
                ? 'Digite seu e-mail para receber o link de redefinição'
                : 'Coloque seu e-mail e sua senha para acessar'}
            </p>
          </div>

          {forgotMode ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-foreground">
                  📧 Enviamos um link para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Enviando...' : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Enviar link de redefinição
                    </>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" type="button" onClick={() => setForgotMode(false)}>
                  Voltar ao login
                </Button>
              </form>
            )
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Entrando...' : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
