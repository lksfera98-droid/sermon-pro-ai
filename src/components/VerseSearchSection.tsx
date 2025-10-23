import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Verse {
  reference: string;
  text: string;
  explanation: string;
}

export const VerseSearchSection = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [openVerses, setOpenVerses] = useState<Set<number>>(new Set());
  const { language, t } = useLanguage();

  const parseVerses = (text: string): Verse[] => {
    const parsed: Verse[] = [];
    
    // Split by double newlines to get blocks
    const blocks = text.split(/\n\n+/).filter(block => block.trim());
    
    for (const block of blocks) {
      let reference = '';
      let verseText = '';
      let explanation = '';
      
      // Try to extract reference (look for patterns like **[Book 1:1]** or just Book 1:1)
      const refMatch = block.match(/\*\*\[([^\]]+)\]\*\*|^\d+\.\s*\*\*([^*]+)\*\*|^([A-Za-zÀ-ÿ\s]+\d+:\d+[^"\n]*)/m);
      if (refMatch) {
        reference = (refMatch[1] || refMatch[2] || refMatch[3] || '').trim();
      }
      
      // Extract verse text (text in quotes or after >)
      const verseMatch = block.match(/[">]\s*[""]?([^"""\n]+)[""]?/);
      if (verseMatch) {
        verseText = verseMatch[1].trim();
      }
      
      // Extract explanation
      const explMatch = block.match(/\*(?:Explicação|Explanation|Explicación):\*?\s*(.+)/s);
      if (explMatch) {
        explanation = explMatch[1].trim();
      }
      
      // If we have at least a reference and text, add to results
      if (reference && verseText) {
        parsed.push({ reference, text: verseText, explanation });
      } else if (block.trim() && block.length > 20) {
        // Fallback: treat entire block as a verse with some basic parsing
        const lines = block.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          parsed.push({
            reference: lines[0].replace(/[*#]/g, '').trim(),
            text: lines.slice(1).join(' ').replace(/[*"]/g, '').trim(),
            explanation: ''
          });
        }
      }
    }
    
    return parsed;
  };

  const handleSearch = async () => {
    if (!word.trim()) {
      toast.error(language === 'pt' ? 'Digite uma palavra' : language === 'en' ? 'Enter a word' : 'Escribe una palabra');
      return;
    }

    setIsLoading(true);
    setVerses([]);
    setOpenVerses(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('search-verses', {
        body: { word: word.trim(), language }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const parsedVerses = parseVerses(data.verses);
      setVerses(parsedVerses);
      toast.success(t('search') + "!");
    } catch (error) {
      console.error('Erro ao pesquisar versículos:', error);
      toast.error("Erro ao pesquisar versículos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVerse = (index: number) => {
    const newOpenVerses = new Set(openVerses);
    if (newOpenVerses.has(index)) {
      newOpenVerses.delete(index);
    } else {
      newOpenVerses.add(index);
    }
    setOpenVerses(newOpenVerses);
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

      {verses.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-xl md:text-2xl font-bold text-primary">{t('verseResults')}</h2>
          <div className="space-y-3">
            {verses.map((verse, index) => (
              <Collapsible
                key={index}
                open={openVerses.has(index)}
                onOpenChange={() => toggleVerse(index)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto hover:bg-accent"
                    >
                      <span className="text-left font-bold text-primary">
                        {verse.reference}
                      </span>
                      {openVerses.has(index) ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-sm md:text-base italic text-foreground leading-relaxed">
                        "{verse.text}"
                      </p>
                      {verse.explanation && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs md:text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">
                              {language === 'pt' ? 'Explicação: ' : language === 'en' ? 'Explanation: ' : 'Explicación: '}
                            </span>
                            {verse.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
