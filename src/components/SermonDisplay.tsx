import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SermonDisplayProps {
  content: string;
}

export const SermonDisplay = ({ content }: SermonDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Sermão copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar o sermão");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Seu Sermão</h2>
        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar Sermão
            </>
          )}
        </Button>
      </div>

      <Card className="p-8 bg-card shadow-lg">
        <div className="prose prose-lg max-w-none whitespace-pre-wrap">
          {content}
        </div>
      </Card>
    </div>
  );
};
