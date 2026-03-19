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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;
    
    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };
    
    // Add title if provided
    if (title) {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19); // Brown color
      doc.text(title, margin, yPosition);
      yPosition += 15;
    }
    
    // Process content line by line
    const lines = content.split('\n');
    
    lines.forEach((line) => {
      addNewPageIfNeeded(15);
      
      // Main title (ALL CAPS)
      if (line === line.toUpperCase() && line.trim() && !line.startsWith('*')) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 69, 19); // Brown color
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          addNewPageIfNeeded(10);
          doc.text(wrappedLine, margin, yPosition);
          yPosition += 10;
        });
        yPosition += 5;
      }
      // Section headers (starts with uppercase and ends with :)
      else if (line.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ][^:]*:$/)) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 69, 19); // Brown color
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          addNewPageIfNeeded(9);
          doc.text(wrappedLine, margin, yPosition);
          yPosition += 9;
        });
        yPosition += 3;
      }
      // Numbered points or highlighted text
      else if (line.match(/^\d+\./) || line.includes('**')) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        const cleanLine = line.replace(/\*\*/g, '');
        const wrappedLines = doc.splitTextToSize(cleanLine, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          addNewPageIfNeeded(8);
          doc.text(wrappedLine, margin, yPosition);
          yPosition += 8;
        });
      }
      // Regular text
      else if (line.trim()) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          addNewPageIfNeeded(7);
          doc.text(wrappedLine, margin, yPosition);
          yPosition += 7;
        });
      }
      // Empty line
      else {
        yPosition += 5;
      }
    });
    
    // Save the PDF
    doc.save(`${title || 'sermon'}.pdf`);
    toast.success(t('downloadPDF') + " ✅");
  };

  // Format sermon content with styled sections (no dangerouslySetInnerHTML)
  const formatSermon = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Clean any residual formatting aggressively
        const cleanLine = line
          .replace(/\*{1,3}/g, '')
          .replace(/#{1,6}\s?/g, '')
          .replace(/<[^>]+>/g, '')
          .replace(/`{1,3}/g, '')
          .replace(/_{2,}/g, '')
          .replace(/~{2,}/g, '')
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .replace(/\[|\]/g, '');

        // Main title (all uppercase)
        if (cleanLine === cleanLine.toUpperCase() && cleanLine.trim() && cleanLine.length > 5 && cleanLine.length < 100) {
          return (
            <h2 key={index} className="text-2xl md:text-3xl font-extrabold text-primary mt-8 mb-4 border-b-2 border-primary/30 pb-2">
              {cleanLine}
            </h2>
          );
        }
        
        // Section headers (ending with :)
        if (cleanLine.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕ][^:]*:$/) && cleanLine.length < 100) {
          return (
            <h3 key={index} className="text-xl md:text-2xl font-bold text-primary mt-6 mb-3 bg-primary/5 p-3 rounded-lg">
              {cleanLine}
            </h3>
          );
        }
        
        // Numbered points (1., 2., etc)
        if (cleanLine.match(/^\d+\.\s/)) {
          return (
            <div key={index} className="my-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
              <p className="font-semibold text-base md:text-lg text-foreground leading-relaxed">
                {cleanLine}
              </p>
            </div>
          );
        }
        
        // Sub-points (starting with - or •)
        if (cleanLine.match(/^\s*[-•]/)) {
          return (
            <p key={index} className="ml-6 my-2 text-foreground leading-relaxed">
              {cleanLine}
            </p>
          );
        }
        
        // Regular paragraphs
        if (cleanLine.trim()) {
          return (
            <p key={index} className="my-3 text-foreground leading-relaxed text-base">
              {cleanLine}
            </p>
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
