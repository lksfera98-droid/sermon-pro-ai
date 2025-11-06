import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainMenu } from "@/components/MainMenu";
import { SermonForm } from "@/components/SermonForm";
import { SermonDisplay } from "@/components/SermonDisplay";
import { TranslatorSection } from "@/components/TranslatorSection";
import { VerseSearchSection } from "@/components/VerseSearchSection";
import { PublicSermonsGallery } from "@/components/PublicSermonsGallery";
import { PrayerRequestForm } from "@/components/PrayerRequestForm";
import { PrayerRequestsGallery } from "@/components/PrayerRequestsGallery";
import { HearGodSpeak } from "@/components/HearGodSpeak";
import { BibleStudy } from "@/components/BibleStudy";
import DailyDevotional from "@/components/DailyDevotional";
import { LoadingProgress } from "@/components/LoadingProgress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Trash2, LogOut, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Session, User } from '@supabase/supabase-js';

type View = "dashboard" | "new-sermon" | "translator" | "my-sermons" | "verse-search" | "public-gallery" | "prayer-requests" | "hear-god-speak" | "bible-study" | "daily-devotional";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentSermonTitle, setCurrentSermonTitle] = useState<string>("");
  const [currentSermonData, setCurrentSermonData] = useState<{ tema: string; versiculo: string; language: string } | null>(null);
  const [savedToGallery, setSavedToGallery] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Auth state and session management
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

    // Cleanup subscription
    return () => subscription?.unsubscribe();
  }, [navigate]);

  // Load saved sermons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSermons");
    if (saved) {
      setRecentSermons(JSON.parse(saved));
    }
  }, []);

  // Save sermons to localStorage whenever it changes
  useEffect(() => {
    if (recentSermons.length > 0) {
      localStorage.setItem("recentSermons", JSON.stringify(recentSermons));
    }
  }, [recentSermons]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteSermon = (index: number) => {
    const newSermons = recentSermons.filter((_, i) => i !== index);
    setRecentSermons(newSermons);
    toast.success(t('deleteSermon'));
  };

  const handleSaveToPublicGallery = async () => {
    if (!sermon || !currentSermonData || !user) {
      toast.error(t('error'));
      return;
    }

    try {
      const { error } = await supabase
        .from('public_sermons')
        .insert({
          title: currentSermonTitle,
          content: sermon,
          theme: currentSermonData.tema,
          base_verse: currentSermonData.versiculo,
          language: currentSermonData.language,
          user_id: user.id
        });

      if (error) throw error;

      setSavedToGallery(true);
      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error saving sermon to gallery:', error);
      toast.error(error.message || t('tryAgain'));
    }
  };

  const handleGenerate = async (data: {
    tema: string;
    versiculo: string;
    tempo: number;
    language: string;
  }) => {
    if (!user) {
      toast.error(t('error'));
      return;
    }

    setIsLoading(true);
    setSermon(null);
    setSavedToGallery(false);
    setCurrentSermonData({ ...data, language });
    
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-sermon', {
        body: {
          tema: data.tema,
          versiculo: data.versiculo,
          tempo: data.tempo,
          language: data.language
        }
      });

      if (functionError) throw functionError;

      const sermonContent = functionData.sermon;
      setSermon(sermonContent);
      setCurrentSermonTitle(data.tema);

      // Auto-save to public gallery
      const { error: insertError } = await supabase
        .from('public_sermons')
        .insert({
          title: data.tema,
          content: sermonContent,
          theme: data.tema,
          verse: data.versiculo,
          language: language,
          user_id: user.id
        });

      if (insertError) {
        console.error('Error auto-saving to gallery:', insertError);
      } else {
        setSavedToGallery(true);
      }

      // Add to recent sermons
      const newSermon = {
        title: data.tema,
        date: new Date().toLocaleDateString(language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'),
        content: sermonContent,
      };
      setRecentSermons((prev) => [newSermon, ...prev].slice(0, 10));

      toast.success(t('success'));
    } catch (error: any) {
      console.error('Error generating sermon:', error);
      toast.error(error.message || t('tryAgain'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingProgress />}
      
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {currentView === 'dashboard' && <MainMenu onNavigate={setCurrentView} />}
          
          {currentView === 'new-sermon' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              
              <SermonForm onGenerate={handleGenerate} isLoading={isLoading} />
              
              {sermon && (
                <div className="mt-8 space-y-4">
                  {!savedToGallery && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleSaveToPublicGallery}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        <Check className="h-5 w-5" />
                        {t('saveToGallery')}
                      </Button>
                    </div>
                  )}
                  <SermonDisplay 
                    content={sermon} 
                    title={currentSermonTitle}
                  />
                </div>
              )}
            </div>
          )}

          {currentView === 'my-sermons' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              
              <h1 className="text-3xl font-bold mb-8 text-center">{t('mySermons')}</h1>
              
              {recentSermons.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground text-lg">{t('noSavedSermons')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recentSermons.map((sermon, index) => (
                    <Card key={index} className="p-6 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{sermon.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{sermon.date}</p>
                          <div className="prose prose-sm max-w-none line-clamp-3">
                            {sermon.content.substring(0, 200)}...
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteSermon(index)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === 'verse-search' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <VerseSearchSection />
            </div>
          )}

          {currentView === 'translator' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <TranslatorSection />
            </div>
          )}

          {currentView === 'public-gallery' && (
            <div className="container max-w-6xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <PublicSermonsGallery />
            </div>
          )}

          {currentView === 'prayer-requests' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <PrayerRequestForm />
              <div className="mt-8">
                <PrayerRequestsGallery />
              </div>
            </div>
          )}

          {currentView === 'hear-god-speak' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <HearGodSpeak />
            </div>
          )}

          {currentView === 'daily-devotional' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <DailyDevotional />
            </div>
          )}

          {currentView === 'bible-study' && (
            <div className="container max-w-4xl mx-auto p-4">
              <Button
                variant="ghost" 
                size="lg" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              <BibleStudy />
            </div>
          )}
        </div>

        {/* Bottom Navigation - Mobile Only - FIXED */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-xl border-t-2 border-primary/30 shadow-2xl md:hidden z-[100]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.75rem)' }}>
          <div className="grid grid-cols-2 gap-3 p-4 max-w-md mx-auto">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setCurrentView('dashboard')}
              className="flex flex-col gap-1.5 h-auto py-4 rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-bold">
                {language === 'pt' ? 'Início' : language === 'es' ? 'Inicio' : 'Home'}
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogout}
              className="flex flex-col gap-1.5 h-auto py-4 rounded-2xl shadow-md hover:shadow-lg transition-all border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-xs font-bold">
                {language === 'pt' ? 'Sair' : language === 'es' ? 'Salir' : 'Logout'}
              </span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Index;
