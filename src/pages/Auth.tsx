import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Session, User } from '@supabase/supabase-js';
import sermonLogo from "@/assets/sermon-logo.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    if (savedRemember && savedPassword) {
      setPassword(savedPassword);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Preselect signup via URL (?mode=signup, ?signup=1, ?signup, #signup)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = location.hash?.replace('#', '');
    if (
      params.get('mode') === 'signup' ||
      params.get('signup') === '1' ||
      params.has('signup') ||
      hash === 'signup' ||
      hash === 'cadastro' ||
      hash === 'cadastrar'
    ) {
      setIsLogin(false);
    }
  }, [location]);

  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
    if (checked) {
      if (email) localStorage.setItem('rememberedEmail', email);
      if (password) localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('rememberMe');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === 'pt' ? "Preencha todos os campos" : language === 'en' ? "Fill in all fields" : "Rellena todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error(language === 'pt' ? "Este email já está cadastrado" : language === 'en' ? "This email is already registered" : "Este correo ya está registrado");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(language === 'pt' ? "Cadastro realizado com sucesso!" : language === 'en' ? "Registration successful!" : "¡Registro exitoso!");
        setEmail("");
        setPassword("");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(language === 'pt' ? "Preencha todos os campos" : language === 'en' ? "Fill in all fields" : "Rellena todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error(language === 'pt' ? "Email ou senha incorretos" : language === 'en' ? "Incorrect email or password" : "Correo o contraseña incorrectos");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(language === 'pt' ? "Login realizado com sucesso!" : language === 'en' ? "Login successful!" : "¡Inicio de sesión exitoso!");
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl max-h-[90svh] overflow-y-auto">
        <div className="text-center mb-8">
          <img src={sermonLogo} alt="Sermon Logo" className="w-32 h-32 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary mb-2">
            {language === 'pt' ? 'Gerador de Sermões' : language === 'en' ? 'Sermon Generator' : 'Generador de Sermones'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? (language === 'pt' ? 'Entre com sua conta' : language === 'en' ? 'Sign in to your account' : 'Inicia sesión en tu cuenta')
              : (language === 'pt' ? 'Crie sua conta' : language === 'en' ? 'Create your account' : 'Crea tu cuenta')
            }
          </p>
        </div>

        <div className="mb-6">
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{language === 'pt' ? 'Entrar' : language === 'en' ? 'Sign In' : 'Iniciar Sesión'}</TabsTrigger>
              <TabsTrigger value="signup">{language === 'pt' ? 'Cadastrar' : language === 'en' ? 'Sign Up' : 'Registrarse'}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Language Selector */}
        <div className="mb-6">
          <div className="mb-3 space-y-1">
            <p className="text-sm text-foreground">🇧🇷 Selecione seu idioma abaixo</p>
            <p className="text-sm text-foreground">🇺🇸 Select your language below</p>
            <p className="text-sm text-foreground">🇪🇸 Seleccione su idioma a continuación</p>
          </div>
          <Label className="mb-2 block">
            {language === 'pt' ? 'Idioma' : language === 'en' ? 'Language' : 'Idioma'}
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">🇧🇷 Português</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {isLogin 
                ? "Email"
                : (language === 'pt' ? 'Crie a conta com seu melhor email' : language === 'en' ? 'Create account with your best email' : 'Crea la cuenta con tu mejor correo')
              }
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isLogin 
                ? (language === 'pt' ? 'Senha' : language === 'en' ? 'Password' : 'Contraseña')
                : (language === 'pt' ? 'Crie uma senha' : language === 'en' ? 'Create a password' : 'Crea una contraseña')
              }
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
          </div>

          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={handleRememberMe}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm cursor-pointer"
              >
                {language === 'pt' ? 'Lembrar email e senha' : language === 'en' ? 'Remember email and password' : 'Recordar correo y contraseña'}
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === 'pt' ? 'Carregando...' : language === 'en' ? 'Loading...' : 'Cargando...'}
              </>
            ) : isLogin ? (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {language === 'pt' ? 'Entrar' : language === 'en' ? 'Sign In' : 'Iniciar Sesión'}
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {language === 'pt' ? 'Cadastrar' : language === 'en' ? 'Sign Up' : 'Registrarse'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsLogin(!isLogin);
              if (!rememberMe) {
                setEmail("");
                setPassword("");
              }
            }}
            className="w-full"
            disabled={isLoading}
          >
            {isLogin 
              ? (language === 'pt' ? 'Não tem uma conta? Cadastre-se' : language === 'en' ? "Don't have an account? Sign up" : '¿No tienes cuenta? Regístrate')
              : (language === 'pt' ? 'Já tem uma conta? Entre' : language === 'en' ? 'Already have an account? Sign in' : '¿Ya tienes cuenta? Inicia sesión')
            }
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;