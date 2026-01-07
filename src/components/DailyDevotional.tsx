import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Sparkles, Calendar, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";


const DailyDevotional = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [devotional, setDevotional] = useState<string>("");
  const [savedDevotionals, setSavedDevotionals] = useState<any[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { language, t } = useLanguage();

  useEffect(() => {
    loadSavedDevotionals();
  }, []);

  const loadSavedDevotionals = async () => {
    try {
      const { data, error } = await supabase
        .from('devotionals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedDevotionals(data || []);
    } catch (error: any) {
      console.error('Error loading devotionals:', error);
    }
  };

  const handleGenerate = async () => {
    console.log('🔍 Gerando devocional...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-devotional', {
        body: { language }
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

      if (data?.content) {
        console.log('✅ Devocional gerado com sucesso!');
        setDevotional(data.content);
        await loadSavedDevotionals();
        toast({
          title: t('success'),
          description: language === 'pt' ? 'Devocional gerado com sucesso!' : 
                      language === 'es' ? '¡Devocional generado con éxito!' : 
                      'Devotional generated successfully!',
        });
      }
    } catch (error: any) {
      console.error('💥 Erro final:', error);
      toast({
        title: t('error'),
        description: error.message || (language === 'pt' ? 'Erro ao gerar devocional' : language === 'en' ? 'Error generating devotional' : 'Error al generar devocional'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDevotionalText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers with **
      if (line.match(/^\*\*.*\*\*$/)) {
        const title = line.replace(/^\*\*|\*\*$/g, '');
        return (
          <h3 key={index} className="text-xl font-bold mb-3 mt-6 text-primary">
            {title}
          </h3>
        );
      }
      // Headers with #
      if (line.startsWith('# ')) {
        return (
          <h3 key={index} className="text-xl font-bold mb-3 mt-6 text-primary">
            {line.replace('# ', '')}
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
          <p key={index} className="mb-3 leading-relaxed text-foreground/90">
            {formattedLine}
          </p>
        );
      }
      return null;
    });
  };

  const downloadTXT = () => {
    const element = document.createElement("a");
    const file = new Blob([devotional], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `devocional_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    const lines = doc.splitTextToSize(devotional, maxWidth);
    doc.setFontSize(12);
    doc.text(lines, margin, margin);
    doc.save(`devocional_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('devotionals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Se o devocional deletado era o que estava sendo exibido, limpar
      const deletedDev = savedDevotionals.find(d => d.id === id);
      if (deletedDev && devotional === deletedDev.content) {
        setDevotional("");
        setViewingId(null);
      }

      await loadSavedDevotionals();
      
      toast({
        title: t('success'),
        description: language === 'pt' ? 'Devocional excluído!' : 
                    language === 'es' ? '¡Devocional eliminado!' : 
                    'Devotional deleted!',
      });
    } catch (error: any) {
      console.error('Error deleting devotional:', error);
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8 mb-6 bg-card/95 backdrop-blur-sm border-2 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {language === 'pt' ? 'Devocional Diário' : 
                 language === 'es' ? 'Devocional Diario' : 
                 'Daily Devotional'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'pt' ? 'Alimento espiritual para sua alma' : 
                 language === 'es' ? 'Alimento espiritual para tu alma' : 
                 'Spiritual food for your soul'}
              </p>
            </div>
          </div>

          {devotional && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewingId(null);
                setDevotional("");
              }}
              className="mb-4 w-fit"
            >
              {language === 'pt' ? '← Voltar' : language === 'es' ? '← Volver' : '← Back'}
            </Button>
          )}

          {!devotional && !isLoading && (
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full mb-6 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {language === 'pt' ? 'Gerar Meu Devocional' : 
               language === 'es' ? 'Generar Mi Devocional' : 
               'Generate My Devotional'}
            </Button>
          )}

          {isLoading && (
            <div className="w-full mb-6 h-14 flex items-center justify-center rounded-xl border-2 border-primary/20 bg-primary/5 text-primary font-semibold">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {language === 'pt' ? 'Gerando...' : language === 'es' ? 'Generando...' : 'Generating...'}
            </div>
          )}

          {devotional && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={downloadPDF}
                  variant="outline"
                  className="flex-1 min-w-[140px] border-2 hover:bg-primary/5"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Baixar PDF' : 
                   language === 'es' ? 'Descargar PDF' : 
                   'Download PDF'}
                </Button>
                <Button
                  onClick={downloadTXT}
                  variant="outline"
                  className="flex-1 min-w-[140px] border-2 hover:bg-primary/5"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Baixar TXT' : 
                   language === 'es' ? 'Descargar TXT' : 
                   'Download TXT'}
                </Button>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 md:p-8 border border-border/50">
                <div className="prose prose-lg max-w-none">
                  {formatDevotionalText(devotional)}
                </div>
              </div>
            </div>
          )}
        </Card>

        {!devotional && savedDevotionals.length > 0 && (
          <Card className="p-6 md:p-8 bg-card/95 backdrop-blur-sm border-2 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-foreground">
              {language === 'pt' ? 'Devocionais Salvos' : 
               language === 'es' ? 'Devocionales Guardados' : 
               'Saved Devotionals'}
            </h3>
            <div className="space-y-3">
              {savedDevotionals.map((dev) => (
                <div
                  key={dev.id}
                  className="w-full p-4 rounded-lg border-2 border-border/50 hover:border-primary/50 transition-all duration-200"
                >
                  <button
                    onClick={() => { setViewingId(dev.id); setDevotional(dev.content); }}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(dev.created_at).toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')}
                    </div>
                    <p className="mt-1 text-foreground/70 line-clamp-2">
                      {dev.content.substring(0, 100)}...
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(dev.id)}
                    className="mt-2 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'pt' ? 'Excluir' : language === 'es' ? 'Eliminar' : 'Delete'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyDevotional;