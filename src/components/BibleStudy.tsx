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
      toast.error(language === "pt" ? "Por favor, digite um versículo" : language === "en" ? "Please enter a verse" : "Por favor, ingrese un versículo");
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
          throw new Error(language === "pt" 
            ? "Você atingiu o limite de uso. Aguarde alguns minutos e tente novamente." 
            : language === "en"
            ? "Rate limit exceeded. Please wait a few minutes and try again."
            : "Límite de uso alcanzado. Espere unos minutos e intente nuevamente.");
        }
        
        if (error.message?.includes('402') || error.message?.includes('Payment')) {
          throw new Error(language === "pt" 
            ? "Créditos esgotados. Por favor, adicione créditos ao seu workspace Lovable." 
            : language === "en"
            ? "Credits exhausted. Please add credits to your Lovable workspace."
            : "Créditos agotados. Por favor, agregue créditos a su workspace Lovable.");
        }
        
        throw error;
      }

      if (!data || data.error) {
        console.error('❌ Erro nos dados:', data?.error);
        throw new Error(data?.error || (language === "pt" ? "Versículo não encontrado" : language === "en" ? "Verse not found" : "Versículo no encontrado"));
      }

      console.log('✅ Estudo gerado com sucesso!');
      setStudy(data);
      toast.success(language === "pt" ? "Estudo gerado!" : language === "en" ? "Study generated!" : "¡Estudio generado!");
    } catch (error: any) {
      console.error('💥 Erro final:', error);
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

  const formatStudyText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Detect headers with ** or ##
      if (line.match(/^\*\*.*\*\*/) || line.match(/^#+\s/)) {
        const cleanLine = line.replace(/^\*\*|\*\*$/g, '').replace(/^#+\s/, '');
        return (
          <h3 key={index} className="text-xl font-bold text-primary mt-6 mb-3">
            {cleanLine}
          </h3>
        );
      }
      // Regular text with bold formatting
      if (line.trim()) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const formattedLine = parts.map((part, i) => {
          if (part.match(/^\*\*.*\*\*$/)) {
            const boldText = part.replace(/^\*\*|\*\*$/g, '');
            return <strong key={i} className="font-bold">{boldText}</strong>;
          }
          return part;
        });
        
        return (
          <p key={index} className="mb-3 leading-relaxed">
            {formattedLine}
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
    toast.success(language === 'pt' ? 'Arquivo TXT baixado!' : language === 'en' ? 'TXT file downloaded!' : '¡Archivo TXT descargado!');
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
    toast.success(language === 'pt' ? 'PDF gerado com sucesso!' : language === 'en' ? 'PDF generated successfully!' : '¡PDF generado con éxito!');
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
                  {language === 'pt' ? 'Baixar PDF' : language === 'en' ? 'Download PDF' : 'Descargar PDF'}
                </Button>
                <Button
                  onClick={downloadTXT}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {language === 'pt' ? 'Baixar TXT' : language === 'en' ? 'Download TXT' : 'Descargar TXT'}
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
