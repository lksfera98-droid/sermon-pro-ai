import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SermonDisplayProps {
  content: string;
  title?: string;
}

export const SermonDisplay = ({ content, title }: SermonDisplayProps) => {
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

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'sermao'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Sermão baixado com sucesso!");
  };

  // Format sermon content with bold and colored highlights
  const formatSermon = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Title lines (all caps or ending with :)
        if (line.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ\s]+:?$/) && line.length < 100) {
          return (
            <h2 key={index} className="text-2xl font-bold text-primary mt-6 mb-3">
              {line}
            </h2>
          );
        }
        
        // Section headers (starting with ### or **)
        if (line.startsWith('###') || line.startsWith('**')) {
          const cleanLine = line.replace(/^###\s*/, '').replace(/\*\*/g, '');
          return (
            <h3 key={index} className="text-xl font-bold text-foreground mt-4 mb-2">
              {cleanLine}
            </h3>
          );
        }
        
        // Numbered points (1., 2., etc)
        if (line.match(/^\d+\./)) {
          return (
            <p key={index} className="font-semibold text-primary my-3">
              {line}
            </p>
          );
        }
        
        // Sub-points (starting with - or •)
        if (line.match(/^\s*[-•]/)) {
          return (
            <p key={index} className="ml-6 my-2 text-foreground">
              {line}
            </p>
          );
        }
        
        // Regular paragraphs
        if (line.trim()) {
          // Highlight words in quotes or between **
          const highlightedLine = line.replace(
            /"([^"]+)"|"([^"]+)"|'([^']+)'|\*\*([^*]+)\*\*/g,
            '<strong class="text-primary font-bold">$1$2$3$4</strong>'
          );
          
          return (
            <p 
              key={index} 
              className="my-2 text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedLine }}
            />
          );
        }
        
        return <br key={index} />;
      });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Seu Sermão</h2>
        <div className="flex gap-2">
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
                Copiar
              </>
            )}
          </Button>
          <Button
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Sermão
          </Button>
        </div>
      </div>

      <Card className="p-8 bg-card shadow-lg">
        <div className="space-y-1">
          {formatSermon(content)}
        </div>
      </Card>
    </div>
  );
};
