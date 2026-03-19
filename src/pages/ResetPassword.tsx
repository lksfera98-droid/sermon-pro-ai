import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import preacherLogo from '@/assets/preacher-logo.png';

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsValidLink(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'Erro ao redefinir senha');
    } else {
      toast.success('Senha redefinida com sucesso!');
      navigate('/');
    }
  };

  if (!isValidLink) {
    return (
      <div className="h-[100svh] bg-background overflow-y-auto overscroll-contain touch-pan-y">
        <div className="min-h-[100svh] w-full max-w-md mx-auto flex flex-col items-center justify-start py-10 px-4 text-center space-y-6">
          <img
            src={preacherLogo}
            alt="ProSermon"
            className="w-24 h-24 object-contain mx-auto rounded-lg"
          />
          <Card className="p-6 w-full">
            <h2 className="text-xl font-bold mb-3">Link Inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este link de recuperação é inválido ou já expirou. Solicite um novo link na tela de login.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full h-12">
              Ir para o Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100svh] bg-background overflow-y-auto overscroll-contain touch-pan-y">
      <div className="min-h-[100svh] w-full max-w-md mx-auto flex flex-col items-center justify-start py-10 px-4 space-y-6">
        <div className="text-center">
          <img
            src={preacherLogo}
            alt="ProSermon"
            className="w-24 h-24 object-contain mx-auto rounded-lg mb-3"
          />
          <h1 className="text-2xl font-bold text-primary">Nova Senha</h1>
        </div>

        <Card className="p-6 shadow-lg w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Defina sua nova senha abaixo.
            </p>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
