import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";

export const HearGodSpeak = () => {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState<{
    verse: string;
    reference: string;
    message: string;
  } | null>(null);

  const handleHearGodSpeak = async () => {
    console.log('🔍 Verificando sessão...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Sessão inválida:', sessionError);
      
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        toast.error(language === 'pt' 
          ? 'Sessão expirada. Faça login novamente.' 
          : language === 'en'
          ? 'Session expired. Please login again.'
          : 'Sesión expirada. Inicie sesión nuevamente.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        return;
      }
    }
    
    console.log('🔍 Buscando mensagem de Deus...');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hear-god-speak', {
        body: { language }
      });

      console.log('📥 Resposta recebida:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        
        if (error.message?.includes('401') || error.message?.includes('not authenticated')) {
          toast.error(language === "pt" 
            ? "Sessão expirada. Redirecionando..." 
            : language === "en"
            ? "Session expired. Redirecting..."
            : "Sesión expirada. Redirigiendo...");
          setTimeout(() => {
            window.location.href = '/auth';
          }, 2000);
          return;
        }
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error(language === "pt" 
            ? "Você atingiu o limite de uso. Aguarde alguns minutos e tente novamente." 
            : language === "en"
            ? "Rate limit exceeded. Please wait a few minutes and try again."
            : "Límite de uso alcanzado. Espere unos minutos e intente nuevamente.");
        }
        
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error(language === "pt" 
            ? "Créditos esgotados. Por favor, adicione créditos ao seu workspace Lovable." 
            : language === "en"
            ? "Credits exhausted. Please add credits to your Lovable workspace."
            : "Créditos agotados. Por favor, agregue créditos a su workspace Lovable.");
        }
        
        throw error;
      }

      console.log('✅ Mensagem recebida com sucesso!');
      setResult(data);
      setShowDialog(true);
    } catch (error: any) {
      console.error('💥 Erro final:', error);
      toast.error(error.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-6 h-6" />
            {t('hearGodSpeak')}
          </CardTitle>
          <CardDescription>{t('hearGodSpeakDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleHearGodSpeak}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('hearGodSpeakLoading')}
              </>
            ) : (
              t('hearGodSpeakBtn')
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">💖 {t('hearGodSpeakTitle')}</DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg italic">"{result.verse}"</p>
                <p className="text-sm text-muted-foreground mt-2">— {result.reference}</p>
              </div>
              <DialogDescription className="text-base leading-relaxed">
                {result.message}
              </DialogDescription>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>
              {t('amen')} 🙏
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
