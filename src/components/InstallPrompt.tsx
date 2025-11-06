import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Não mostrar se já foi dispensado ou se está instalado
  if (!showPrompt || window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  const dismissedBefore = localStorage.getItem('installPromptDismissed');
  if (dismissedBefore) return null;

  return (
    <Card className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-2xl border-2 border-primary/20 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            {language === 'pt' && '📱 Instalar App'}
            {language === 'en' && '📱 Install App'}
            {language === 'es' && '📱 Instalar App'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {language === 'pt' && 'Instale o SermonPro no seu dispositivo para acesso rápido e uso offline!'}
            {language === 'en' && 'Install SermonPro on your device for quick access and offline use!'}
            {language === 'es' && '¡Instala SermonPro en tu dispositivo para acceso rápido y uso sin conexión!'}
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {language === 'pt' && 'Instalar'}
              {language === 'en' && 'Install'}
              {language === 'es' && 'Instalar'}
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm">
              {language === 'pt' && 'Agora não'}
              {language === 'en' && 'Not now'}
              {language === 'es' && 'Ahora no'}
            </Button>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};