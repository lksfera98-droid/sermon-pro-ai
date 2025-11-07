import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Languages, 
  BookOpen, 
  Book, 
  Smartphone, 
  Apple,
  Globe,
  Heart,
  Sparkles,
  GraduationCap,
  Ear,
  BookHeart,
  Search,
  RefreshCw
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
}

export const MainMenu = ({ onNavigate }: MainMenuProps) => {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();
  const { language, setLanguage, t } = useLanguage();

  const handleAndroidInstall = async () => {
    const installed = await installPWA();
    if (installed) {
      toast.success("App instalado com sucesso! 🎉");
    } else if (!isInstallable) {
      toast.info("App já está instalado ou não pode ser instalado neste dispositivo");
    }
  };

  const isIOS = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  const isInStandaloneMode = () => {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator as any).standalone === true;
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    
    // Mostrar mensagem de início
    toast.info(
      language === 'pt' 
        ? '🔄 Estamos atualizando o app...' 
        : language === 'es'
        ? '🔄 Estamos actualizando la app...'
        : '🔄 Updating the app...'
    );
    
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

      toast.success(
        language === 'pt' 
          ? '✅ App atualizado com sucesso!' 
          : language === 'es'
          ? '✅ ¡App actualizada con éxito!'
          : '✅ App updated successfully!'
      );

      // Recarregar a página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating app:', error);
      toast.error(
        language === 'pt' 
          ? 'Erro ao atualizar. Tente novamente.' 
          : language === 'es'
          ? 'Error al actualizar. Intente de nuevo.'
          : 'Error updating. Please try again.'
      );
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { 
      id: "hear-god-speak" as View, 
      label: language === 'pt' ? 'Ouvir Deus Falar Comigo' : language === 'es' ? 'Escuchar a Dios Hablarme' : 'Hear God Speak to Me', 
      icon: Ear,
      color: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400"
    },
    { 
      id: "daily-devotional" as View, 
      label: language === 'pt' ? 'Gerar Meu Devocional Diário' : language === 'es' ? 'Generar Mi Devocional Diario' : 'Generate My Daily Devotional', 
      icon: BookHeart,
      color: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400"
    },
    { 
      id: "bible-study" as View, 
      label: language === 'pt' ? 'Esmiuçar um versiculo' : language === 'es' ? 'Hacer un Estudio Bíblico' : 'Make a Bible Study', 
      icon: GraduationCap,
      color: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    { 
      id: "new-sermon" as View, 
      label: language === 'pt' ? 'Crie seu novo sermão' : language === 'es' ? 'Crea tu nuevo sermón' : 'Create your new sermon', 
      icon: FileText,
      color: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
      id: "my-sermons" as View, 
      label: language === 'pt' ? 'Seus Sermões Criados' : language === 'es' ? 'Tus Sermones Creados' : 'Your Created Sermons', 
      icon: BookOpen,
      color: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    { 
      id: "public-gallery" as View, 
      label: language === 'pt' ? 'Sermões criados pelos irmãos' : language === 'es' ? 'Sermones creados por los hermanos' : 'Sermons created by brothers', 
      icon: Sparkles,
      color: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    { 
      id: "verse-search" as View, 
      label: language === 'pt' ? 'Pesquisar Versículos' : language === 'es' ? 'Buscar Versículos' : 'Search Verses', 
      icon: Search,
      color: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    { 
      id: "translator" as View, 
      label: language === 'pt' ? 'Tradutor Bíblico' : language === 'es' ? 'Traductor Bíblico' : 'Biblical Translator', 
      icon: Languages,
      color: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    { 
      id: "prayer-requests" as View, 
      label: language === 'pt' ? 'Fazer um Pedido de Oração' : language === 'es' ? 'Hacer una Petición de Oración' : 'Make a Prayer Request', 
      icon: Heart,
      color: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400"
    },
    { 
      id: "prayer-gallery" as View, 
      label: language === 'pt' ? 'Pedidos de Oração Feitos' : language === 'es' ? 'Peticiones de Oración Hechas' : 'Prayer Requests Made', 
      icon: Globe,
      color: "bg-pink-100 dark:bg-pink-900/30",
      iconColor: "text-pink-600 dark:text-pink-400"
    }
  ];

  const languages = [
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-8 p-4 pb-32 md:pb-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Logo and Language Selector */}
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
          
          {/* Choose Language Prompt in 3 languages */}
          <div className="space-y-1 text-left">
            <p className="text-sm font-semibold text-foreground">🇧🇷 Selecione seu idioma abaixo</p>
            <p className="text-sm font-semibold text-foreground">🇺🇸 Select your language below</p>
            <p className="text-sm font-semibold text-foreground">🇪🇸 Seleccione su idioma a continuación</p>
          </div>
          
          {/* Language Selector */}
          <Button
            onClick={() => setShowLanguageMenu(true)}
            variant="outline"
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
          </Button>
        </div>

        {/* Main Menu Buttons */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
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

        {/* Botão de Atualização - só aparece quando instalado */}
        {true && (
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
                  {language === 'pt' ? 'Atualizando...' : language === 'es' ? 'Actualizando...' : 'Updating...'}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  {language === 'pt' ? '🔄 Buscar Atualizações' : language === 'es' ? '🔄 Buscar Actualizaciones' : '🔄 Check for Updates'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageMenu} onOpenChange={setShowLanguageMenu}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('selectLanguage')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setShowLanguageMenu(false);
                  toast.success(`${lang.flag} ${lang.name}`);
                }}
                variant={language === lang.code ? "default" : "outline"}
                className="w-full h-14 text-lg justify-start"
              >
                <span className="text-2xl mr-3">{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
                  {language === 'pt' ? 'Abra este site no navegador' : language === 'en' ? 'Open this site in' : 'Abre este sitio en'} <strong>Safari</strong> 📱
                </li>
                <li className="leading-relaxed">
                  {language === 'pt' ? 'Toque no botão de' : language === 'en' ? 'Tap the' : 'Toca el botón de'} <strong>{language === 'pt' ? 'Compartilhar' : language === 'en' ? 'Share' : 'Compartir'}</strong> 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    □↑
                  </span>
                </li>
                <li className="leading-relaxed">
                  {language === 'pt' ? 'Toque em' : language === 'en' ? 'Tap' : 'Toca'} 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ {language === 'pt' ? 'Adicionar à Tela de Início' : language === 'en' ? 'Add to Home Screen' : 'Añadir a Pantalla de Inicio'}
                  </span>
                </li>
                <li className="leading-relaxed">
                  {language === 'pt' ? 'Toque em' : language === 'en' ? 'Tap' : 'Toca'} <strong>"{language === 'pt' ? 'Adicionar' : language === 'en' ? 'Add' : 'Añadir'}"</strong> ✅
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
                  {language === 'pt' ? 'Abra este site no' : language === 'en' ? 'Open this site in' : 'Abre este sitio en'} <strong>Chrome</strong> 🔵
                </li>
                <li className="leading-relaxed">
                  {language === 'pt' ? 'Toque no botão de' : language === 'en' ? 'Tap the' : 'Toca el botón de'} <strong>Menu</strong> 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    ⋮
                  </span>
                </li>
                <li className="leading-relaxed">
                  {language === 'pt' ? 'Toque em' : language === 'en' ? 'Tap' : 'Toca'}
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ {language === 'pt' ? 'Adicionar à tela inicial' : language === 'en' ? 'Add to Home screen' : 'Añadir a pantalla de inicio'}
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
