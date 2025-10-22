import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { ResourcesSection } from "@/components/ResourcesSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type View = "dashboard" | "new-sermon" | "resources";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);

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
      
      // Add to recent sermons
      const title = data.tema || "Novo Sermão";
      const newSermon = {
        title,
        date: new Date().toLocaleDateString('pt-BR'),
        content: result.sermao
      };
      setRecentSermons(prev => [newSermon, ...prev.slice(0, 9)]);
      
      toast.success("Sermão gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar sermão:', error);
      toast.error("Erro ao gerar sermão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 ml-64">
        <div className="p-8">
          {currentView === "dashboard" && (
            <Dashboard 
              recentSermons={recentSermons} 
              onNewSermon={() => setCurrentView("new-sermon")}
              onViewSermon={(content) => {
                setSermon(content);
                setCurrentView("new-sermon");
              }}
            />
          )}
          
          {currentView === "new-sermon" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Criar Novo Sermão</h1>
                <p className="text-muted-foreground">Preencha os dados abaixo para gerar seu sermão</p>
              </div>
              
              <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
              
              {sermon && (
                <div className="mt-8">
                  <SermonDisplay content={sermon} />
                </div>
              )}
            </div>
          )}
          
          {currentView === "resources" && <ResourcesSection />}
        </div>
      </main>
    </div>
  );
};

export default Index;
