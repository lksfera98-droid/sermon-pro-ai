import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface PrayerRequest {
  id: string;
  created_at: string;
  language: string;
  request_text: string;
  author_name: string | null;
  is_anonymous: boolean;
  image_url: string | null;
  user_id: string | null;
}

export const PrayerRequestsGallery = () => {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
    getCurrentUser();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('prayer_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prayer_requests',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [language]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading prayer requests:', error);
      toast({
        title: t('error'),
        description: t('tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('requestDeleted'),
      });
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      toast({
        title: t('error'),
        description: t('tryAgain'),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {t('noPrayerRequests')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => (
        <Card key={request.id} className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg">
                  {request.is_anonymous
                    ? t('anonymous')
                    : request.author_name}
                </CardTitle>
              </div>
              {currentUserId && currentUserId === request.user_id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('confirmDelete')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('confirmDeleteRequest')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t('cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(request.id)}>
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              {new Date(request.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">{request.request_text}</p>
            {request.image_url && (
              <img
                src={request.image_url}
                alt="Prayer request"
                className="w-full rounded-lg object-cover max-h-64"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
