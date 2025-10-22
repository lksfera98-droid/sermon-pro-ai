import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const TranslatorSection = () => {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState<{
    hebrew?: string;
    greek?: string;
    aramaic?: string;
    etymology?: string;
    history?: string;
  } | null>(null);

  const handleTranslate = async () => {
    if (!word.trim()) return;

    setIsLoading(true);
    setTranslation(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-word', {
        body: { word: word.trim() }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setTranslation(data);
      toast.success("Tradução obtida com sucesso!");
    } catch (error) {
      console.error('Erro ao traduzir palavra:', error);
      toast.error("Erro ao traduzir palavra. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Tradutor Bíblico</h1>
        <p className="text-muted-foreground">
          Traduza palavras para Hebraico, Grego e Aramaico
        </p>
      </div>

      {/* Translation Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="word" className="text-lg font-semibold">
              Palavra ou Nome
            </Label>
            <div className="flex gap-2">
              <Input
                id="word"
                placeholder="Ex: Amor, Jesus, Fé..."
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
                className="text-lg py-6"
              />
              <Button
                onClick={handleTranslate}
                disabled={isLoading || !word.trim()}
                className="px-8"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Languages className="mr-2 h-5 w-5" />
                    Traduzir
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Translation Results */}
      {translation && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-2xl font-bold text-primary">Resultado da Tradução</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {translation.hebrew && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-primary mb-3">Hebraico</h3>
                <p className="text-2xl font-semibold text-foreground">{translation.hebrew}</p>
              </Card>
            )}
            
            {translation.greek && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-primary mb-3">Grego</h3>
                <p className="text-2xl font-semibold text-foreground">{translation.greek}</p>
              </Card>
            )}
            
            {translation.aramaic && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-primary mb-3">Aramaico</h3>
                <p className="text-2xl font-semibold text-foreground">{translation.aramaic}</p>
              </Card>
            )}
          </div>

          {translation.etymology && (
            <Card className="p-6">
              <h3 className="text-xl font-bold text-primary mb-3">Etimologia</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {translation.etymology}
              </p>
            </Card>
          )}

          {translation.history && (
            <Card className="p-6">
              <h3 className="text-xl font-bold text-primary mb-3">História da Palavra</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {translation.history}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
