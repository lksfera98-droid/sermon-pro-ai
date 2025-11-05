import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Sparkles } from "lucide-react";
import { LoadingProgress } from "@/components/LoadingProgress";
import { useLanguage } from "@/contexts/LanguageContext";

export const BibleStudy = () => {
  const [verseReference, setVerseReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [study, setStudy] = useState<{
    verse: string;
    reference: string;
    study: string;
  } | null>(null);
  const { language, t } = useLanguage();

  const handleGenerateStudy = async () => {
    if (!verseReference.trim()) {
      toast.error(language === "pt" ? "Por favor, digite um versículo" : language === "en" ? "Please enter a verse" : "Por favor, ingrese un versículo");
      return;
    }

    setIsLoading(true);
    setStudy(null);

    try {
      const { data, error } = await supabase.functions.invoke('bible-study', {
        body: { verseReference: verseReference.trim(), language }
      });

      if (error) throw error;

      if (!data || data.error) {
        throw new Error(data?.error || (language === "pt" ? "Versículo não encontrado" : language === "en" ? "Verse not found" : "Versículo no encontrado"));
      }

      setStudy(data);
      toast.success(language === "pt" ? "Estudo gerado!" : language === "en" ? "Study generated!" : "¡Estudio generado!");
    } catch (error: any) {
      console.error('Error generating Bible study:', error);
      toast.error(error.message || (language === "pt" ? "Erro ao gerar estudo" : language === "en" ? "Error generating study" : "Error al generar estudio"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerateStudy();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {isLoading && <LoadingProgress message={language === "pt" ? "Gerando estudo bíblico..." : language === "en" ? "Generating Bible study..." : "Generando estudio bíblico..."} />}
      
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === "pt" ? "📖 Estudo Bíblico Profundo" : language === "en" ? "📖 Deep Bible Study" : "📖 Estudio Bíblico Profundo"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === "pt" 
                ? "Digite a referência do versículo (ex: João 3:16)" 
                : language === "en" 
                ? "Enter the verse reference (e.g., John 3:16)" 
                : "Ingrese la referencia del versículo (ej: Juan 3:16)"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verse-reference" className="text-base font-semibold">
              {language === "pt" ? "Referência do Versículo" : language === "en" ? "Verse Reference" : "Referencia del Versículo"}
            </Label>
            <Input
              id="verse-reference"
              type="text"
              placeholder={language === "pt" ? "Ex: João 3:16, Salmos 23:1, Gênesis 1:1" : language === "en" ? "E.g., John 3:16, Psalm 23:1, Genesis 1:1" : "Ej: Juan 3:16, Salmos 23:1, Génesis 1:1"}
              value={verseReference}
              onChange={(e) => setVerseReference(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base h-12"
            />
          </div>

          <Button
            onClick={handleGenerateStudy}
            disabled={isLoading || !verseReference.trim()}
            className="w-full h-14 text-lg font-semibold gap-2"
            size="lg"
          >
            <Sparkles className="h-5 w-5" />
            {language === "pt" ? "Gerar Estudo Completo" : language === "en" ? "Generate Complete Study" : "Generar Estudio Completo"}
          </Button>
        </div>
      </Card>

      {study && (
        <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-border">
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">
                {study.reference}
              </h3>
              <p className="text-base md:text-lg italic text-foreground/90 leading-relaxed">
                "{study.verse}"
              </p>
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {study.study}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
