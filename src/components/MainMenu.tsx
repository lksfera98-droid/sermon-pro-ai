import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Languages, 
  BookOpen, 
  Smartphone, 
  Apple,
  Globe,
  Heart,
  Sparkles,
  GraduationCap,
  Ear,
  BookHeart,
  Search,
  RefreshCw,
  LogOut
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import preacherLogo from "@/assets/preacher-logo.png";

type View = "dashboard" | "new-sermon" | "translator" | "my-sermons" | "verse-search" | "public-gallery" | "prayer-requests" | "prayer-gallery" | "hear-god-speak" | "bible-study" | "daily-devotional";

interface MainMenuProps {
  onNavigate: (view: View) => void;
  onSignOut?: () => void;
}

export const MainMenu = ({ onNavigate }: MainMenuProps) => {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();
  const { t } = useLanguage();

  const handleAndroidInstall = async () => {
    // Se já está em modo standalone, o app já está instalado
    if (isInStandaloneMode()) {
      toast.success("Você já está usando o app instalado! 🎉");
      return;
    }
    
    // Se o deferredPrompt existe, tentar instalar
    if (isInstallable) {
      const installed = await installPWA();
      if (installed) {
        toast.success("App instalado com sucesso! 🎉");
      }
    } else {
      // Se não tem o prompt, mostrar instruções manuais
      toast.info(
        "Para instalar: toque nos 3 pontinhos (⋮) do navegador e selecione 'Adicionar à tela inicial'",
        { duration: 6000 }
      );
    }
  };

  const isInStandaloneMode = () => {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator as any).standalone === true;
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    
    toast.info('🔄 Estamos atualizando o app...');
    
    try {
      // Limpar todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Forçar atualização do service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
          await registration.unregister();
        }
      }

      toast.success('✅ App atualizado com sucesso!');

      // Recarregar a página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error('Erro ao atualizar. Tente novamente.');
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { 
      id: "prayer-requests" as View, 
      label: 'Fazer um Pedido de Oração', 
      icon: Heart,
      color: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400"
    },
    { 
      id: "prayer-gallery" as View, 
      label: 'Pedidos de Oração Feitos', 
      icon: Globe,
      color: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400"
    },
    { 
      id: "hear-god-speak" as View, 
      label: 'Ouvir Deus Falar Comigo', 
      icon: Ear,
      color: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400"
    },
    { 
      id: "daily-devotional" as View, 
      label: 'Gerar Meu Devocional Diário', 
      icon: BookHeart,
      color: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400"
    },
    { 
      id: "bible-study" as View, 
      label: 'Esmiuçar um versiculo', 
      icon: GraduationCap,
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    { 
      id: "translator" as View, 
      label: 'Significado de Nomes Bíblicos', 
      icon: Languages,
      color: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    { 
      id: "new-sermon" as View, 
      label: 'Crie seu novo sermão', 
      icon: FileText,
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
      id: "my-sermons" as View, 
      label: 'Seus Sermões Criados', 
      icon: BookOpen,
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    { 
      id: "public-gallery" as View, 
      label: 'Sermões criados pelos irmãos', 
      icon: Sparkles,
      color: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    { 
      id: "verse-search" as View, 
      label: 'Pesquisar Versículos', 
      icon: Search,
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-12 p-4 pb-32 md:pb-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          {/* Logo Image */}
          <div className="flex justify-center mb-4">
            <img 
              src={preacherLogo} 
              alt="App do Pregador" 
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            {t('welcome')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('welcomeSubtitle')}
          </p>
        </div>

        {/* Main Menu Buttons */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
                onClick={() => onNavigate(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.color}`}>
                    <Icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <span className="flex-1 font-semibold text-base">
                    {item.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* PWA Installation Buttons */}
        {!isInStandaloneMode() && (
          <div className="space-y-3 pt-4 border-t">
            <h2 className="text-base font-semibold text-center">
              📱 {t('installApp')}
            </h2>
            
            <div className="space-y-3">
              <Button
                onClick={handleAndroidInstall}
                className="w-full h-14 text-base bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                📲 {t('installAndroid')}
              </Button>

              <Button
                onClick={() => setShowIOSInstructions(true)}
                className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                <Apple className="mr-2 h-5 w-5" />
                🍎 {t('installIPhone')}
              </Button>
            </div>
          </div>
        )}

        {/* Botão de Atualização */}
        <div className="pt-4 border-t mb-6">
          <Button
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="w-full h-14 text-base bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/30 font-semibold shadow-lg"
            variant="outline"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                🔄 Buscar Atualizações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              🍎 {t('installIPhone')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-sm md:text-base">
            {/* Safari Instructions */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                🧭 Safari
              </h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="leading-relaxed">
                  Abra este site no navegador <strong>Safari</strong> 📱
                </li>
                <li className="leading-relaxed">
                  Toque no botão de <strong>Compartilhar</strong> 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    □↑
                  </span>
                </li>
                <li className="leading-relaxed">
                  Toque em 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ Adicionar à Tela de Início
                  </span>
                </li>
                <li className="leading-relaxed">
                  Toque em <strong>"Adicionar"</strong> ✅
                </li>
              </ol>
            </div>

            {/* Chrome Instructions */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                🌐 Google Chrome
              </h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="leading-relaxed">
                  Abra este site no <strong>Chrome</strong> 🔵
                </li>
                <li className="leading-relaxed">
                  Toque no botão de <strong>Menu</strong> 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    ⋮
                  </span>
                </li>
                <li className="leading-relaxed">
                  Toque em
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ Adicionar à tela inicial
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};