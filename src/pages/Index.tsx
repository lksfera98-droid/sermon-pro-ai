import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { TranslatorSection } from "@/components/TranslatorSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, BookOpen, Book, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type View = "dashboard" | "new-sermon" | "translator" | "bible-studies" | "dictionaries" | "study-bibles";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentSermonTitle, setCurrentSermonTitle] = useState<string>("");
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load sermons from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sermons');
    if (saved) {
      setRecentSermons(JSON.parse(saved));
    }
  }, []);

  // Save sermons to localStorage whenever they change
  useEffect(() => {
    if (recentSermons.length > 0) {
      localStorage.setItem('sermons', JSON.stringify(recentSermons));
    }
  }, [recentSermons]);

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
      setCurrentSermonTitle(title);
      const newSermon = {
        title,
        date: new Date().toLocaleDateString('pt-BR'),
        content: result.sermao
      };
      setRecentSermons(prev => [newSermon, ...prev]);
      
      toast.success("Sermão gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar sermão:', error);
      toast.error("Erro ao gerar sermão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const ResourceCard = ({ title, description, icon: Icon, url }: { title: string; description: string; icon: any; url: string }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="p-3 bg-accent rounded-lg w-fit">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <Button className="w-full gap-2">
            Acessar Recursos
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <main className="flex-1 md:ml-64 w-full">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-30 flex items-center px-4">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg"
          >
            {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="ml-3 text-lg font-bold text-primary">SermonPro</h1>
        </div>

        <div className="p-4 md:p-8 pt-16 md:pt-8">
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
            <div className="space-y-6 md:space-y-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Criar Novo Sermão</h1>
                <p className="text-sm md:text-base text-muted-foreground">Preencha os dados abaixo para gerar seu sermão</p>
              </div>
              
              <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
              
              {sermon && (
                <div className="mt-6 md:mt-8">
                  <SermonDisplay content={sermon} title={currentSermonTitle} />
                </div>
              )}
            </div>
          )}
          
          {currentView === "translator" && <TranslatorSection />}
          
          {currentView === "bible-studies" && (
            <div className="space-y-6 md:space-y-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Estudos Bíblicos</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Acesse uma coleção completa de estudos bíblicos para enriquecer suas pregações
                </p>
              </div>
              <ResourceCard
                title="Estudos Bíblicos"
                description="Acesse uma coleção completa de estudos bíblicos para enriquecer suas pregações"
                icon={BookOpen}
                url="https://drive.google.com/drive/folders/1flw4GiezzOKyj_mk4jwZ7KUopT2w4xSs?usp=drive_link"
              />
            </div>
          )}
          
          {currentView === "dictionaries" && (
            <div className="space-y-6 md:space-y-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dicionários Bíblicos</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Consulte dicionários bíblicos para aprofundar seu conhecimento teológico
                </p>
              </div>
              <ResourceCard
                title="Dicionários Bíblicos"
                description="Consulte dicionários bíblicos para aprofundar seu conhecimento teológico"
                icon={Book}
                url="https://drive.google.com/drive/folders/1yQeQCGOoySz7Qerxn5Msj0YTJnir1kQC?usp=drive_link"
              />
            </div>
          )}
          
          {currentView === "study-bibles" && (
            <div className="space-y-6 md:space-y-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Bíblias de Estudo</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Baixe diferentes versões de Bíblias de estudo para suas pesquisas
                </p>
              </div>
              <ResourceCard
                title="Bíblias de Estudo"
                description="Baixe diferentes versões de Bíblias de estudo para suas pesquisas"
                icon={Book}
                url="https://drive.google.com/drive/folders/1s4N47PQQz3Z335Kb7vLDgrmo5Udpj5-C?usp=drive_link"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
