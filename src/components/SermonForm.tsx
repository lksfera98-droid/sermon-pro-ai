import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface SermonFormProps {
  onGenerate: (data: { tema: string; versiculo: string; tempo: number }) => void;
  isLoading: boolean;
}

export const SermonForm = ({ onGenerate, isLoading }: SermonFormProps) => {
  const [tema, setTema] = useState("");
  const [versiculo, setVersiculo] = useState("");
  const [tempo, setTempo] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    onGenerate({ tema, versiculo, tempo });
  };

  return (
    <Card className="p-4 md:p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="tema" className="text-sm md:text-base">Tema do Sermão *</Label>
          <Input
            id="tema"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: O Amor de Deus"
            required
            className="h-10 md:h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="versiculo" className="text-sm md:text-base">Versículo Base (Opcional)</Label>
          <Input
            id="versiculo"
            value={versiculo}
            onChange={(e) => setVersiculo(e.target.value)}
            placeholder="Ex: João 3:16"
            className="h-10 md:h-11 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempo" className="text-sm md:text-base">
            Tempo do Sermão: {tempo}+ minutos
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
            Arraste para ajustar a duração desejada (quanto mais tempo, mais detalhado será o sermão)
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
              Gerando Sermão...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Gerar Sermão
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
