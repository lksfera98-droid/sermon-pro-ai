import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Languages, 
  BookOpen, 
  Book, 
  Smartphone, 
  Apple,
  Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import preacherLogo from "@/assets/preacher-logo.png";

type View = "dashboard" | "new-sermon" | "translator" | "my-sermons" | "verse-search" | "public-gallery";

interface MainMenuProps {
  onNavigate: (view: View) => void;
}

export const MainMenu = ({ onNavigate }: MainMenuProps) => {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
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

  const menuItems = [
    { id: "new-sermon" as View, label: t('createSermon'), icon: FileText, emoji: "📝" },
    { id: "my-sermons" as View, label: t('mySermons'), icon: BookOpen, emoji: "📚" },
    { id: "public-gallery" as View, label: t('sermonsGallery'), icon: Globe, emoji: "🌍" },
    { id: "verse-search" as View, label: t('verseSearch'), icon: Languages, emoji: "📖" },
    { id: "translator" as View, label: t('bibleTranslator'), icon: Languages, emoji: "🔤" },
  ];

  const languages = [
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background">
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
          
          {/* Choose Language Prompt */}
          <p className="text-sm font-semibold text-primary">
            {t('chooseLanguage')}
          </p>
          
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
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="flex-1 font-semibold text-base">
                    {item.emoji} {item.label}
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
