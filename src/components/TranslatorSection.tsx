import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export const TranslatorSection = () => {
  const { t, language } = useLanguage();
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState<{
    hebrew?: string;
    greek?: string;
    aramaic?: string;
    etymology?: string;
    history?: string;
  } | null>(null);

  const handleTranslate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!word.trim()) return;

    setIsLoading(true);
    setTranslation(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-word', {
        body: { 
          word: word.trim(),
          language: localStorage.getItem('language') || 'pt'
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setTranslation(data);
      toast.success(language === 'pt' ? "Tradução concluída!" : language === 'en' ? "Translation completed!" : "¡Traducción completada!");
    } catch (error) {
      console.error('Erro ao traduzir palavra:', error);
      toast.error(language === 'pt' ? "Erro ao traduzir" : language === 'en' ? "Translation error" : "Error al traducir");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Translation Form */}
      <Card className="p-4 md:p-6">
        <form onSubmit={handleTranslate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-sm md:text-base font-semibold">
              {t('wordOrName')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="word"
                placeholder="Ex: Amor, Jesus, Fé..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="h-10 md:h-12 text-base"
              />
              <Button
                type="submit"
                disabled={isLoading || !word.trim()}
                className="px-6 md:px-8 h-10 md:h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="hidden md:inline">
                      {language === 'pt' ? 'Traduzindo...' : language === 'en' ? 'Translating...' : 'Traduciendo...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Languages className="mr-2 h-5 w-5" />
                    <span className="hidden md:inline">{t('translate')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Translation Results */}
      {translation && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl md:text-2xl font-bold text-primary">{t('translationResult')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {translation.hebrew && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-primary mb-3">{t('hebrew')}</h3>
                <p className="text-xl md:text-2xl font-semibold text-foreground">{translation.hebrew}</p>
              </Card>
            )}
            
            {translation.greek && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-primary mb-3">{t('greek')}</h3>
                <p className="text-xl md:text-2xl font-semibold text-foreground">{translation.greek}</p>
              </Card>
            )}
            
            {translation.aramaic && (
              <Card className="p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-primary mb-3">{t('aramaic')}</h3>
                <p className="text-xl md:text-2xl font-semibold text-foreground">{translation.aramaic}</p>
              </Card>
            )}
          </div>

          {translation.etymology && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-primary mb-3">{t('etymology')}</h3>
              <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {translation.etymology}
              </p>
            </Card>
          )}

          {translation.history && (
            <Card className="p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-primary mb-3">{t('wordHistory')}</h3>
              <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
                {translation.history}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
