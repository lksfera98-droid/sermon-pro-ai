import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Smartphone, Apple, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

interface DashboardProps {
  recentSermons: Array<{ title: string; date: string; content: string }>;
  onNewSermon: () => void;
  onViewSermon: (content: string) => void;
}

export const Dashboard = ({ recentSermons, onNewSermon, onViewSermon }: DashboardProps) => {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();

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

  return (
    <div className="space-y-6 md:space-y-8 max-w-full">
      {/* Mensagem de Saudação */}
      <div className="text-center py-6 md:py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
          ✝️ Bem-vindo ao SermonPro! 🙏
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Seu assistente completo para criação de sermões bíblicos
        </p>
      </div>

      {/* PWA Installation Buttons */}
      {!isInStandaloneMode() && (
        <div className="space-y-3">
          <h2 className="text-lg md:text-xl font-semibold text-center mb-4">
            📱 Instale o App no seu Celular
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Android Install Button */}
            {isInstallable && (
              <Button
                onClick={handleAndroidInstall}
                className="w-full h-14 md:h-16 text-base md:text-lg bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Smartphone className="mr-2 h-6 w-6" />
                📲 Instalar no Android
              </Button>
            )}

            {/* iOS Install Button */}
            {isIOS() && (
              <Button
                onClick={() => setShowIOSInstructions(true)}
                className="w-full h-14 md:h-16 text-base md:text-lg bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Apple className="mr-2 h-6 w-6" />
                🍎 Instalar no iPhone
              </Button>
            )}
            
            {/* Show iOS button for non-iOS devices too */}
            {!isIOS() && (
              <Button
                onClick={() => setShowIOSInstructions(true)}
                className="w-full h-14 md:h-16 text-base md:text-lg bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Apple className="mr-2 h-6 w-6" />
                🍎 Como Instalar no iPhone
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold mb-4 text-center">
          🚀 Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <Card 
            className="p-4 md:p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
            onClick={onNewSermon}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-base md:text-lg">📝 Criar Novo Sermão</h3>
              <p className="text-sm text-muted-foreground">
                Crie um sermão inspirador para sua próxima pregação
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Sermons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">📚 Sermões Recentes</h2>
        </div>
        
        {recentSermons.length === 0 ? (
          <Card className="p-6 md:p-8">
            <div className="text-center text-muted-foreground">
              <Clock className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm md:text-base">Nenhum sermão criado ainda</p>
              <p className="text-xs md:text-sm mt-1">Crie seu primeiro sermão para começar! ✨</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {recentSermons.slice(0, 5).map((sermon, index) => (
              <Card 
                key={index} 
                className="p-3 md:p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                onClick={() => onViewSermon(sermon.content)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm md:text-base text-foreground">{sermon.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {sermon.date}
                    </p>
                  </div>
                  <FileText className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              🍎 Como Instalar no iPhone/iPad
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-sm md:text-base">
            {/* Safari Instructions */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                🧭 Usando Safari
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
                  (ícone de quadrado com seta para cima) na parte inferior da tela
                </li>
                <li className="leading-relaxed">
                  Role para baixo e toque em 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ Adicionar à Tela de Início
                  </span>
                </li>
                <li className="leading-relaxed">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito ✅
                </li>
                <li className="leading-relaxed">
                  Pronto! 🎉 O ícone do SermonPro aparecerá na sua tela inicial
                </li>
              </ol>
            </div>

            {/* Chrome Instructions */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                🌐 Usando Google Chrome
              </h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="leading-relaxed">
                  Abra este site no navegador <strong>Chrome</strong> 🔵
                </li>
                <li className="leading-relaxed">
                  Toque no botão de <strong>Menu</strong> 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    ⋮
                  </span> 
                  (três pontos) no canto superior direito
                </li>
                <li className="leading-relaxed">
                  Toque em 
                  <span className="inline-block mx-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-semibold">
                    ➕ Adicionar à tela inicial
                  </span>
                </li>
                <li className="leading-relaxed">
                  Toque em <strong>"Adicionar"</strong> ✅
                </li>
                <li className="leading-relaxed">
                  Pronto! 🎉 O app estará disponível na sua tela inicial
                </li>
              </ol>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ Importante:
              </p>
              <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-300">
                Certifique-se de usar o Safari ou Chrome. Outros navegadores podem não suportar esta funcionalidade no iOS.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
