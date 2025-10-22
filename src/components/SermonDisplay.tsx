import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";

interface SermonDisplayProps {
  content: string;
  title?: string;
}

export const SermonDisplay = ({ content, title }: SermonDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar");
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
    toast.success(t('download') + " ✅");
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    
    // Add title
    doc.setFontSize(18);
    const titleText = title || t('yourSermon');
    doc.text(titleText, margin, 20);
    
    // Add content
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, maxWidth);
    doc.text(lines, margin, 35);
    
    // Save PDF
    doc.save(`${title || "sermon"}.pdf`);
    toast.success(t('downloadPDF') + " ✅");
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-primary">{t('yourSermon')}</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{t('copyAction')}</span>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="gap-2 flex-1 md:flex-initial h-10 md:h-9"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="hidden md:inline">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden md:inline">{t('copy')}</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{t('downloadPDFAction')}</span>
            <Button
              onClick={handleDownloadPDF}
              className="gap-2 flex-1 md:flex-initial h-10 md:h-9 bg-red-600 hover:bg-red-700"
              size="sm"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">{t('downloadPDF')}</span>
            </Button>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground">{t('downloadAction')}</span>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2 flex-1 md:flex-initial h-10 md:h-9"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">{t('download')}</span>
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 md:p-8 bg-card shadow-lg">
        <div className="space-y-1 text-sm md:text-base">
          {formatSermon(content)}
        </div>
      </Card>
    </div>
  );
};
