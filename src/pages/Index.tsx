import { useState, useEffect } from "react";
import { MainMenu } from "@/components/MainMenu";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { TranslatorSection } from "@/components/TranslatorSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, BookOpen, Book, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type View = "dashboard" | "new-sermon" | "translator" | "bible-studies" | "dictionaries" | "study-bibles";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentSermonTitle, setCurrentSermonTitle] = useState<string>("");
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);
  const { t } = useLanguage();

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

  const handleGenerate = async (data: { tema: string; versiculo: string; tempo: number; language: string }) => {
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
      const title = data.tema || t('createSermon');
      setCurrentSermonTitle(title);
      const newSermon = {
        title,
        date: new Date().toLocaleDateString('pt-BR'),
        content: result.sermao
      };
      setRecentSermons(prev => [newSermon, ...prev]);
      
      toast.success(t('generateSermon') + "!");
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
            {t('accessResources')}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {currentView === "dashboard" && (
        <MainMenu onNavigate={setCurrentView} />
      )}
      
      {currentView === "new-sermon" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('createSermon')}</h1>
                <p className="text-sm md:text-base text-muted-foreground">Preencha os dados abaixo para gerar seu sermão</p>
              </div>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">{t('home')}</span>
              </Button>
            </div>
            
            <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
            
            {sermon && (
              <div className="mt-6 md:mt-8">
                <SermonDisplay content={sermon} title={currentSermonTitle} />
              </div>
            )}
          </div>
        </div>
      )}
      
      {currentView === "translator" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('bibleTranslator')}</h1>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">{t('home')}</span>
              </Button>
            </div>
            <TranslatorSection />
          </div>
        </div>
      )}
      
      {currentView === "bible-studies" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('bibleStudies')}</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {t('bibleStudiesDesc')}
                </p>
              </div>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2 ml-4"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">{t('home')}</span>
              </Button>
            </div>
            <ResourceCard
              title={t('bibleStudies')}
              description={t('bibleStudiesDesc')}
              icon={BookOpen}
              url="https://drive.google.com/drive/folders/1flw4GiezzOKyj_mk4jwZ7KUopT2w4xSs?usp=drive_link"
            />
          </div>
        </div>
      )}
      
      {currentView === "dictionaries" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('bibleDictionaries')}</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {t('dictionariesDesc')}
                </p>
              </div>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2 ml-4"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">{t('home')}</span>
              </Button>
            </div>
            <ResourceCard
              title={t('bibleDictionaries')}
              description={t('dictionariesDesc')}
              icon={Book}
              url="https://drive.google.com/drive/folders/1yQeQCGOoySz7Qerxn5Msj0YTJnir1kQC?usp=drive_link"
            />
          </div>
        </div>
      )}
      
      {currentView === "study-bibles" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('studyBibles')}</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  {t('studyBiblesDesc')}
                </p>
              </div>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2 ml-4"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">{t('home')}</span>
              </Button>
            </div>
            <ResourceCard
              title={t('studyBibles')}
              description={t('studyBiblesDesc')}
              icon={Book}
              url="https://drive.google.com/drive/folders/1s4N47PQQz3Z335Kb7vLDgrmo5Udpj5-C?usp=drive_link"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
