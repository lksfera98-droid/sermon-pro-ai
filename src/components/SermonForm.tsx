import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface SermonFormProps {
  onGenerate: (data: { tema: string; versiculo: string; tempo: number }) => void;
  isLoading: boolean;
}

export const SermonForm = ({ onGenerate, isLoading }: SermonFormProps) => {
  const [tema, setTema] = useState("");
  const [versiculo, setVersiculo] = useState("");
  const [tempo, setTempo] = useState([30]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) return;
    onGenerate({ tema, versiculo, tempo: tempo[0] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <Label htmlFor="tema" className="text-lg font-semibold">
          Tema do Sermão *
        </Label>
        <Input
          id="tema"
          placeholder="Ex: Fé em tempos difíceis"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          required
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="versiculo" className="text-lg font-semibold">
          Versículo Base (opcional)
        </Label>
        <Input
          id="versiculo"
          placeholder="Ex: Hebreus 11:1"
          value={versiculo}
          onChange={(e) => setVersiculo(e.target.value)}
          className="text-lg py-6"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-semibold">
            Tempo de Pregação
          </Label>
          <span className="text-2xl font-bold text-primary">
            {tempo[0]} min
          </span>
        </div>
        <Slider
          value={tempo}
          onValueChange={setTempo}
          min={10}
          max={60}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>10 min</span>
          <span>60 min</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !tema.trim()}
        className="w-full py-6 text-lg font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Gerando Sermão...
          </>
        ) : (
          "Gerar Sermão"
        )}
      </Button>
    </form>
  );
};
