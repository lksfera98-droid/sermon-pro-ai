import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

const FirstAccess = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

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
      const response = await supabase.functions.invoke('set-password', {
        body: { email: email.trim(), password, full_name: fullName.trim() },
      });

      if (response.error) {
        const errBody = response.error;
        // Edge function may return non-2xx which supabase client treats as error
        // Try to parse the error context
        const errMsg = typeof errBody === 'object' && errBody?.context?.body 
          ? JSON.parse(errBody.context.body)?.error 
          : null;
        
        if (errMsg === 'not_a_buyer') {
          toast.error('Este e-mail não foi encontrado como comprador. Verifique se usou o e-mail correto da compra.', { duration: 6000 });
          return;
        }
        
        toast.error('Erro ao processar. Tente novamente.');
        return;
      }

      const data = response.data;

      if (data?.error === 'not_a_buyer') {
        toast.error('Este e-mail não foi encontrado como comprador. Verifique se usou o e-mail correto da compra.', { duration: 6000 });
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Success - auto login
      const { error: loginError } = await signIn(email.trim(), password);
      if (loginError) {
        // If auto-login fails, show success and redirect to login
        setSuccess(true);
        toast.success('Senha definida com sucesso!');
      } else {
        toast.success('Senha definida! Bem-vindo ao SermonPro!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border-border/50">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Senha criada!</h1>
            <p className="text-muted-foreground text-sm">
              Agora você pode fazer login com seu e-mail e senha.
            </p>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Ir para o login
            </Button>
          </div>
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
            Configure sua senha para acessar o SermonPro
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
            {submitting ? 'Configurando...' : (
              <>
                <UserPlus className="w-4 h-4" />
                Criar minha senha e acessar
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Já tem senha? Faça login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default FirstAccess;
