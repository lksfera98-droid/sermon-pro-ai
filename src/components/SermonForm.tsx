import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SermonFormProps {
  onGenerate: (data: { tema: string; versiculo: string; tempo: number; language: string }) => void;
  isLoading: boolean;
}

export const SermonForm = ({ onGenerate, isLoading }: SermonFormProps) => {
  const [tema, setTema] = useState("");
  const [versiculo, setVersiculo] = useState("");
  const [tempo, setTempo] = useState(30);
  const { t, language } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    onGenerate({ tema, versiculo, tempo, language });
  };

  return (
    <Card className="p-4 md:p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tema" className="text-sm md:text-base">{t('sermonTheme')} *</Label>
          <Input
            id="tema"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder={language === 'pt' ? "Ex: O Amor de Deus" : language === 'en' ? "Ex: God's Love" : "Ej: El Amor de Dios"}
            required
            className="h-10 md:h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="versiculo" className="text-sm md:text-base">{t('baseVerse')}</Label>
          <Input
            id="versiculo"
            value={versiculo}
            onChange={(e) => setVersiculo(e.target.value)}
            placeholder={language === 'pt' ? "Ex: João 3:16" : language === 'en' ? "Ex: John 3:16" : "Ej: Juan 3:16"}
            className="h-10 md:h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempo" className="text-sm md:text-base">
            {t('sermonTime')}: {tempo}+ {language === 'pt' ? 'minutos' : language === 'en' ? 'minutes' : 'minutos'}
          </Label>
          <Slider
            id="tempo"
            min={10}
            max={120}
            step={5}
            value={[tempo]}
            onValueChange={(value) => setTempo(value[0])}
            className="w-full touch-none"
          />
          <p className="text-xs md:text-sm text-muted-foreground">
            {language === 'pt' 
              ? 'Arraste para ajustar a duração desejada (quanto mais tempo, mais detalhado será o sermão)' 
              : language === 'en' 
              ? 'Drag to adjust desired duration (more time = more detailed sermon)' 
              : 'Arrastra para ajustar la duración deseada (más tiempo = sermón más detallado)'}
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 md:h-14 text-base md:text-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {language === 'pt' ? 'Gerando sermão...' : language === 'en' ? 'Generating sermon...' : 'Generando sermón...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {t('generateSermon')}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
