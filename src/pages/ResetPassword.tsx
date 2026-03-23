import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, KeyRound, Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;
      setReady(true);
      setChecking(false);
    };

    const markBlocked = () => {
      if (!mounted) return;
      setReady(false);
      setChecking(false);
    };

    const clearSensitiveUrlParams = () => {
      window.history.replaceState({}, document.title, '/redefinir-senha');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        markReady();
      }
    });

    const resolveRecoverySession = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));

        const type = queryParams.get('type') || hashParams.get('type');
        const code = queryParams.get('code');
        const tokenHash = queryParams.get('token_hash');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            clearSensitiveUrlParams();
            markReady();
            return;
          }
        }

        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (!error) {
            clearSensitiveUrlParams();
            markReady();
            return;
          }
        }

        // Hash-based flow fallback (access_token in URL hash)
        if (hashParams.get('access_token') && type === 'recovery') {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          clearSensitiveUrlParams();
          markReady();
          return;
        }

        markBlocked();
      } catch {
        markBlocked();
      }
    };

    resolveRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message || 'Erro ao redefinir senha');
        return;
      }

      toast.success('Senha redefinida com sucesso!');
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground text-sm">Validando seu link de redefinição...</p>
        </Card>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Link expirado ou inválido</h1>
          <p className="text-muted-foreground text-sm">
            O link de redefinição pode ter expirado. Solicite um novo link na tela de login.
          </p>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Voltar ao login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border-border/50">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Criar Nova Senha</h1>
          <p className="text-muted-foreground text-sm">Digite sua nova senha e confirme para acessar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
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
            <Label htmlFor="confirmPassword">Repita a nova senha</Label>
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
            {submitting ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
