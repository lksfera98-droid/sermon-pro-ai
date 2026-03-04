import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Sparkles, Download, FileText } from "lucide-react";
import { LoadingProgress } from "@/components/LoadingProgress";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";

export const BibleStudy = () => {
  const [verseReference, setVerseReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [study, setStudy] = useState<{
    reference: string;
    study: string;
  } | null>(null);
  const { language, t } = useLanguage();

  const handleGenerateStudy = async () => {
    if (!verseReference.trim()) {
      toast.error("Por favor, digite um versículo");
      return;
    }

    setIsLoading(true);
    setStudy(null);

    try {
      console.log('📡 Chamando edge function bible-study...');
      
      const { data, error } = await supabase.functions.invoke('bible-study', {
        body: { verseReference: verseReference.trim(), language }
      });

      console.log('📥 Resposta recebida:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error("Você atingiu o limite de uso. Aguarde alguns minutos e tente novamente.");
        }
        
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error("Créditos esgotados. Por favor, adicione créditos ao seu workspace Lovable.");
        }
        
        throw error;
      }

      if (!data || data.error) {
        console.error('❌ Erro nos dados:', data?.error);
        throw new Error(data?.error || "Versículo não encontrado");
      }

      console.log('✅ Estudo gerado com sucesso!');
      setStudy(data);
      toast.success("Estudo gerado!");
    } catch (error: any) {
      console.error('💥 Erro final:', error);
      toast.error(error.message || "Erro ao gerar estudo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerateStudy();
    }
  };

  const cleanText = (text: string) => {
    return text
      .replace(/<[^>]*class="[^"]*"[^>]*>/gi, '')
      .replace(/<\/?\w+[^>]*>/gi, '')
      .replace(/\*{1,3}/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`/g, '')
      .replace(/_{2,}/g, '')
      .replace(/~{2,}/g, '');
  };

  const formatStudyText = (text: string) => {
    return text.split('\n').map((line, index) => {
      const cleanLine = cleanText(line);
      
      // Section headers (lines ending with : or short uppercase lines)
      if ((cleanLine.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ\d][^:]*:$/) && cleanLine.length < 100) ||
          (cleanLine === cleanLine.toUpperCase() && cleanLine.trim().length > 3 && cleanLine.length < 100)) {
        return (
          <h3 key={index} className="text-xl font-bold text-primary mt-6 mb-3">
            {cleanLine}
          </h3>
        );
      }
      // Numbered points
      if (cleanLine.match(/^\d+\.\s/)) {
        return (
          <div key={index} className="my-3 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="font-semibold leading-relaxed">{cleanLine}</p>
          </div>
        );
      }
      if (cleanLine.trim()) {
        return (
          <p key={index} className="mb-3 leading-relaxed">
            {cleanLine}
          </p>
        );
      }
      return <br key={index} />;
    });
  };

  const downloadTXT = () => {
    if (!study) return;
    
    const content = `${study.reference}\n\n${study.study}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudo-biblico-${study.reference.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Arquivo TXT baixado!');
  };

  const downloadPDF = () => {
    if (!study) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const titleLines = doc.splitTextToSize(study.reference, maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 10 + 10;

    // Content
    doc.setFontSize(11);
    const lines = study.study.split('\n');
    
    lines.forEach((line) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Check if it's a header
      if (line.match(/^\*\*.*\*\*/) || line.match(/^#+\s/)) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(13);
        const cleanLine = line.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s/, '');
        const headerLines = doc.splitTextToSize(cleanLine, maxWidth);
        doc.text(headerLines, margin, yPosition);
        yPosition += headerLines.length * 7 + 5;
        doc.setFontSize(11);
      } else if (line.trim()) {
        doc.setFont(undefined, 'normal');
        const textLines = doc.splitTextToSize(line, maxWidth);
        doc.text(textLines, margin, yPosition);
        yPosition += textLines.length * 6 + 3;
      } else {
        yPosition += 5;
      }
    });

    doc.save(`estudo-biblico-${study.reference.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {isLoading && <LoadingProgress message="Gerando estudo bíblico..." />}
      
      <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              📖 Estudo Bíblico Profundo
            </h2>
            <p className="text-sm text-muted-foreground">
              Digite a referência do versículo (ex: João 3:16)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verse-reference" className="text-base font-semibold">
              Referência do Versículo
            </Label>
            <Input
              id="verse-reference"
              type="text"
              placeholder="Ex: João 3:16, Salmos 23:1, Gênesis 1:1"
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
            {language === "pt" ? "Gerar Estudo Completo" : "Gerar Estudo Completo"}
          </Button>
        </div>
      </Card>

      {study && (
        <Card className="p-6 md:p-8 bg-gradient-to-br from-card to-card/80 border-2 border-primary/20">
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-border">
              <h3 className="text-xl md:text-2xl font-bold text-primary mb-4">
                📖 {study.reference}
              </h3>
              
              {/* Download buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={downloadPDF}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {language === 'pt' ? 'Baixar PDF' : 'Baixar PDF'}
                </Button>
                <Button
                  onClick={downloadTXT}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {language === 'pt' ? 'Baixar TXT' : 'Baixar TXT'}
                </Button>
              </div>
            </div>

            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div className="text-foreground/90">
                {formatStudyText(study.study)}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
