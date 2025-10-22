import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search } from "lucide-react";

export const VerseSearchSection = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const handleSearch = async () => {
    if (!word.trim()) {
      toast.error(language === 'pt' ? 'Digite uma palavra' : language === 'en' ? 'Enter a word' : 'Escribe una palabra');
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-verses', {
        body: { word: word.trim(), language }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data.verses);
      toast.success(t('search') + "!");
    } catch (error) {
      console.error('Erro ao pesquisar versículos:', error);
      toast.error("Erro ao pesquisar versículos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('searchWord')}
            </label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={language === 'pt' ? 'amor, fé, esperança...' : language === 'en' ? 'love, faith, hope...' : 'amor, fe, esperanza...'}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full gap-2"
          >
            <Search className="h-4 w-4" />
            {isLoading ? t('searching') : t('search')}
          </Button>
        </div>
      </Card>

      {results && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl md:text-2xl font-bold text-primary">{t('verseResults')}</h2>
          <Card className="p-6 bg-card shadow-lg">
            <div className="space-y-4 text-sm md:text-base whitespace-pre-wrap">
              {results}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
