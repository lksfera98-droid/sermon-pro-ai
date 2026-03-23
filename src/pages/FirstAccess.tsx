import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, UserPlus, AlertCircle, Mail } from 'lucide-react';

const FirstAccess = () => {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSendReset = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) {
        toast.error(error.message || 'Erro ao enviar e-mail');
      } else {
        setResetSent(true);
        toast.success('Link enviado! Verifique seu e-mail.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          setAlreadyExists(true);
          // Automatically send reset email
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/redefinir-senha`,
          });
          if (!resetError) {
            setResetSent(true);
            toast.info('Você já tem uma conta! Enviamos um link para definir sua senha.');
          } else {
            toast.error('Você já tem uma conta. Use "Esqueci minha senha" no login.');
          }
        } else {
          toast.error(error.message || 'Erro ao criar conta');
        }
      } else {
        toast.success('Conta criada com sucesso! Você já pode acessar.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // User already exists - show reset flow
  if (alreadyExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border-border/50">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Você já tem uma conta!</h1>
            <p className="text-muted-foreground text-sm">
              O e-mail <strong>{email}</strong> já está cadastrado no sistema.
            </p>
          </div>

          {resetSent ? (
            <div className="space-y-4">
              <div className="bg-accent/50 border border-border rounded-xl p-4 text-center">
                <p className="text-sm text-foreground">
                  📧 Enviamos um link para <strong>{email}</strong> para você criar sua senha.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Ir para o login
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={handleSendReset} disabled={submitting}>
                Reenviar link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Clique abaixo para receber um link e definir sua senha.
              </p>
              <Button className="w-full" onClick={handleSendReset} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar link para criar senha'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                Já sei minha senha, ir para o login
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-y-auto">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border-border/50">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Primeiro Acesso</h1>
          <p className="text-muted-foreground text-sm">
            Crie sua conta para acessar o SermonPro
          </p>
        </div>

        <div className="bg-accent/50 border border-border rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">Importante:</p>
            <p>Use o <strong>mesmo e-mail que você usou na compra</strong> e crie uma senha de sua escolha.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Seu nome completo</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail usado na compra</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Deve ser o mesmo e-mail que você utilizou para comprar o produto.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Crie uma senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme sua senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Criando conta...' : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar minha conta
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Já tem conta? Faça login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default FirstAccess;
