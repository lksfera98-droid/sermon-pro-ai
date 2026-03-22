import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Home, Trash2, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";


type View = "dashboard" | "new-sermon" | "translator" | "my-sermons" | "verse-search" | "public-gallery" | "prayer-requests" | "prayer-gallery" | "hear-god-speak" | "bible-study" | "daily-devotional";

const Index = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [sermon, setSermon] = useState<string | null>(null);
  const [currentSermonTitle, setCurrentSermonTitle] = useState<string>("");
  const [currentSermonData, setCurrentSermonData] = useState<{ tema: string; versiculo: string; language: string } | null>(null);
  const [savedToGallery, setSavedToGallery] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [recentSermons, setRecentSermons] = useState<Array<{ title: string; date: string; content: string }>>([]);
  const [viewingSermon, setViewingSermon] = useState<{title: string; content: string} | null>(null);
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleDeleteSermon = (index: number) => {
    const newSermons = recentSermons.filter((_, i) => i !== index);
    setRecentSermons(newSermons);
    toast.success(t('deleteSermon'));
  };

  const handleSaveToPublicGallery = async () => {
    if (!sermon || !currentSermonData) {
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
          verse: currentSermonData.versiculo,
          language: 'pt',
          user_id: null
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
    setIsLoading(true);
    setSermon(null);
    setSavedToGallery(false);
    setCurrentSermonData(data);
    
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-sermon', {
        body: {
          tema: data.tema,
          versiculo: data.versiculo,
          tempo: data.tempo,
          language: 'pt'
        }
      });

      if (functionError) throw functionError;

      const sermonContent = functionData?.sermon ?? functionData?.sermao;
      if (!sermonContent) {
        throw new Error('Falha ao gerar o conteúdo do sermão. Tente novamente.');
      }
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
          language: 'pt',
          user_id: null
        });

      if (insertError) {
        console.error('Error auto-saving to gallery:', insertError);
      } else {
        setSavedToGallery(true);
      }

      // Add to recent sermons
      const newSermon = {
        title: data.tema,
        date: new Date().toLocaleDateString('pt-BR'),
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
    <div className="h-[100svh] bg-background overflow-hidden">
      {isLoading && <LoadingProgress />}
      
      <div className="h-[100svh] flex flex-col">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain pb-[88px] md:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          {currentView === 'dashboard' && <MainMenu onNavigate={setCurrentView} onSignOut={async () => { await signOut(); navigate('/auth'); }} />}
          
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
                onClick={() => {
                  setViewingSermon(null);
                  setCurrentView('dashboard');
                }}
                className="mb-6 gap-2"
              >
                <Home className="h-4 w-4" />
                {t('home')}
              </Button>
              
              {viewingSermon ? (
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setViewingSermon(null)}
                    className="mb-4 gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t('backToList')}
                  </Button>
                  <SermonDisplay 
                    content={viewingSermon.content} 
                    title={viewingSermon.title}
                  />
                </div>
              ) : (
                <>
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
                            <div 
                              className="flex-1 cursor-pointer" 
                              onClick={() => setViewingSermon({title: sermon.title, content: sermon.content})}
                            >
                              <h3 className="text-xl font-semibold mb-2">{sermon.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{sermon.date}</p>
                              <div className="prose prose-sm max-w-none line-clamp-3">
                                {sermon.content ? sermon.content.substring(0, 200) : ''}...
                              </div>
                              <p className="text-sm text-primary mt-2 font-semibold">{t('clickToView')}</p>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSermon(index);
                              }}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
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
            </div>
          )}

          {currentView === 'prayer-gallery' && (
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
              <h1 className="text-3xl font-bold mb-6 text-center">
                🙏 Pedidos de Oração Feitos
              </h1>
              <PrayerRequestsGallery />
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
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-card/98 backdrop-blur-xl border-t border-primary/20 shadow-lg md:hidden z-[9999]"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            bottom: '-24px'
          }}
        >
          <div className="flex justify-center gap-2 p-2.5 max-w-md mx-auto select-none">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setCurrentView('dashboard');
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex flex-col gap-1.5 h-auto py-1.5 rounded-none touch-manipulation px-12"
            >
              <Home className="h-5 w-5" />
              <span className="text-[12px] font-bold">Início</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Index;