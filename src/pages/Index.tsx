import { useState } from "react";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Sparkles } from "lucide-react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);

  const handleGenerate = async (data: { tema: string; versiculo: string; tempo: number }) => {
    setIsLoading(true);
    setSermon(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('generate-sermon', {
        body: data
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      setSermon(result.sermao);
      toast.success("Sermão gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar sermão:', error);
      toast.error("Erro ao gerar sermão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary">SermonPro</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Crie Sermões Poderosos em
            <span className="text-primary"> Minutos</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            SermonPro é seu assistente inteligente para criar esboços bíblicos completos, 
            estruturados e prontos para pregação.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
      </section>

      {/* Result Section */}
      {sermon && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <SermonDisplay content={sermon} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 mt-20 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p className="text-sm">
            SermonPro - Criando sermões fiéis às Escrituras com tecnologia de ponta
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
