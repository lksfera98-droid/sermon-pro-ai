import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainMenu } from "@/components/MainMenu";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { TranslatorSection } from "@/components/TranslatorSection";
import { VerseSearchSection } from "@/components/VerseSearchSection";
import { PublicSermonsGallery } from "@/components/PublicSermonsGallery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Session, User } from '@supabase/supabase-js';

type View = "dashboard" | "new-sermon" | "translator" | "my-sermons" | "verse-search" | "public-gallery";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentSermonTitle, setCurrentSermonTitle] = useState<string>("");
  const [currentSermonData, setCurrentSermonData] = useState<{ tema: string; versiculo: string; language: string } | null>(null);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load sermons from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sermons');
    if (saved) {
      setRecentSermons(JSON.parse(saved));
    }
  }, []);

  // Save sermons to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sermons', JSON.stringify(recentSermons));
  }, [recentSermons]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSermon = (index: number) => {
    setRecentSermons(prev => prev.filter((_, i) => i !== index));
    toast.success(t('deleteSermon') + "!");
  };

  const handleSaveToPublicGallery = async () => {
    if (!sermon || !currentSermonData || !user) return;

    try {
      const { error } = await supabase
        .from('public_sermons')
        .insert({
          title: currentSermonTitle,
          content: sermon,
          language: currentSermonData.language,
          theme: currentSermonData.tema,
          verse: currentSermonData.versiculo || null,
          user_id: user.id
        });

      if (error) throw error;

      toast.success(
        language === "pt" ? "Sermão salvo na galeria pública!" :
        language === "en" ? "Sermon saved to public gallery!" :
        "¡Sermón guardado en la galería pública!"
      );
    } catch (error) {
      console.error('Error saving to public gallery:', error);
      toast.error(
        language === "pt" ? "Erro ao salvar na galeria" :
        language === "en" ? "Error saving to gallery" :
        "Error al guardar en la galería"
      );
    }
  };

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
      setCurrentSermonData(data);
      
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

  return (
    <div className="min-h-screen bg-background">
      {currentView === "dashboard" && (
        <>
          <div className="p-4 flex justify-end">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
          <MainMenu onNavigate={setCurrentView} />
        </>
      )}
      
      {currentView === "new-sermon" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t('createSermon')}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{t('fillDataBelow')}</p>
              </div>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
            </div>
            
            <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
            
            {sermon && (
              <div className="mt-6 md:mt-8 space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveToPublicGallery}
                    variant="outline"
                    className="gap-2"
                  >
                    {t('saveToGallery')}
                  </Button>
                </div>
                <SermonDisplay content={sermon} title={currentSermonTitle} />
              </div>
            )}
          </div>
        </div>
      )}
      
      {currentView === "my-sermons" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('mySermons')}</h1>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">{t('home')}</span>
              </Button>
            </div>
            
            {recentSermons.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">{t('noSavedSermons')}</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentSermons.map((sermon, index) => (
                  <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => {
                        setSermon(sermon.content);
                        setCurrentSermonTitle(sermon.title);
                        setCurrentView("new-sermon");
                      }}>
                        <h3 className="font-semibold text-lg mb-1">{sermon.title}</h3>
                        <p className="text-sm text-muted-foreground">{sermon.date}</p>
                        <p className="text-sm mt-2 line-clamp-2">{sermon.content.substring(0, 150)}...</p>
                      </div>
                      <Button
                        onClick={() => handleDeleteSermon(index)}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('deleteSermon')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentView === "verse-search" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('verseSearch')}</h1>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">{t('home')}</span>
              </Button>
            </div>
            <VerseSearchSection />
          </div>
        </div>
      )}
      
      {currentView === "translator" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('bibleTranslator')}</h1>
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">{t('home')}</span>
              </Button>
            </div>
            <TranslatorSection />
          </div>
        </div>
      )}

      {currentView === "public-gallery" && (
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs">{t('home')}</span>
              </Button>
            </div>
            <PublicSermonsGallery />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
