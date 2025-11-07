import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Trash2, User, ArrowLeft, Eye } from "lucide-react";
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
  delete_token: string | null;
}

export const PrayerRequestsGallery = () => {
  const { language, t } = useLanguage();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PrayerRequest | null>(null);

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
  }, []);

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

  if (viewingRequest) {
    // Check if user can delete (either is owner or has delete token for anonymous)
    const canDelete = currentUserId && currentUserId === viewingRequest.user_id;
    const deleteTokens = JSON.parse(localStorage.getItem('prayer_delete_tokens') || '{}');
    const hasDeleteToken = viewingRequest.is_anonymous && deleteTokens[viewingRequest.id] === viewingRequest.delete_token;
    const showDeleteButton = canDelete || hasDeleteToken;
    
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setViewingRequest(null)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToList')}
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-xl">
                  {viewingRequest.is_anonymous
                    ? t('anonymous')
                    : viewingRequest.author_name}
                </CardTitle>
              </div>
              {showDeleteButton && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      {t('delete')}
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
                       <AlertDialogAction onClick={() => {
                        handleDelete(viewingRequest.id);
                        // Remove token from localStorage if it was an anonymous request
                        if (viewingRequest.is_anonymous) {
                          const tokens = JSON.parse(localStorage.getItem('prayer_delete_tokens') || '{}');
                          delete tokens[viewingRequest.id];
                          localStorage.setItem('prayer_delete_tokens', JSON.stringify(tokens));
                        }
                        setViewingRequest(null);
                       }}>
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <CardDescription>
              {new Date(viewingRequest.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base whitespace-pre-wrap leading-relaxed">
              {viewingRequest.request_text}
            </p>
            {viewingRequest.image_url && (
              <img
                src={viewingRequest.image_url}
                alt="Prayer request"
                className="w-full rounded-lg object-cover"
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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
      {requests.map((request) => {
        const isOwner = currentUserId && currentUserId === request.user_id;
        
        return (
          <Card 
            key={request.id} 
            className="relative cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setViewingRequest(request)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {request.is_anonymous
                      ? t('anonymous')
                      : request.author_name}
                  </CardTitle>
                </div>
              </div>
              <CardDescription className="text-xs">
                {new Date(request.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                {request.request_text}
              </p>
              {request.image_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden">
                  <img
                    src={request.image_url}
                    alt="Prayer request"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 text-primary text-sm font-semibold pt-2">
                <Eye className="h-4 w-4" />
                <span>{t('clickToView')}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
