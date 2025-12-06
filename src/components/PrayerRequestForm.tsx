import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera, X, Check } from "lucide-react";

interface PrayerRequestFormProps {
  onSuccess?: () => void;
}

export const PrayerRequestForm = ({ onSuccess }: PrayerRequestFormProps) => {
  const { language, t } = useLanguage();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [requestText, setRequestText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestText.trim()) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (!isAnonymous && !authorName.trim()) {
      toast({
        title: t('error'),
        description: t('fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting prayer request submission...');

    try {
      let imageUrl = null;

      // Upload image if provided
      if (image) {
        console.log('Uploading image...');
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('prayer-images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('prayer-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Get current user if logged in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
      }
      
      console.log('Current user:', user?.id);

      // Generate delete token for anonymous requests
      const deleteToken = isAnonymous ? crypto.randomUUID() : null;

      // Insert prayer request
      console.log('Inserting prayer request...');
      const { data: newRequest, error: insertError } = await supabase
        .from('prayer_requests')
        .insert({
          language,
          request_text: requestText,
          author_name: isAnonymous ? null : authorName,
          is_anonymous: isAnonymous,
          image_url: imageUrl,
          user_id: user?.id || null,
          delete_token: deleteToken,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Store delete token locally for anonymous requests
      if (isAnonymous && deleteToken && newRequest) {
        const existingTokens = JSON.parse(localStorage.getItem('prayer_delete_tokens') || '{}');
        existingTokens[newRequest.id] = deleteToken;
        localStorage.setItem('prayer_delete_tokens', JSON.stringify(existingTokens));
      }

      console.log('Prayer request inserted successfully');

      toast({
        title: t('success'),
        description: t('prayerRequestSent'),
      });

      // Reset form
      setRequestText("");
      setAuthorName("");
      setImage(null);
      setIsAnonymous(false);
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error submitting prayer request:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: t('error'),
        description: error.message || t('tryAgain'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('newPrayerRequest')}</CardTitle>
        <CardDescription>
          {t('sharePrayerRequest')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous">
              {t('sendAnonymously')}
            </Label>
          </div>

          {!isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('yourName')}
              </Label>
              <Input
                id="name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={t('enterYourName')}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="request">
              {t('prayerRequest')} *
            </Label>
            <Textarea
              id="request"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={t('writeYourRequest')}
              className="min-h-[120px]"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('image')} ({t('optional')})</Label>
            
            {!image ? (
              <label 
                htmlFor="image" 
                className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t('tapToAddPhoto')}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('selectFromGallery')}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/70 max-w-[250px]">
                    {t('photoWillBeVisible')}
                  </p>
                </div>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative border rounded-lg overflow-hidden bg-muted/20">
                <img 
                  src={URL.createObjectURL(image)} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('photoSelected')}</span>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setImage(null)}
                      disabled={isSubmitting}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('removePhoto')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {t('sendRequest')}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
